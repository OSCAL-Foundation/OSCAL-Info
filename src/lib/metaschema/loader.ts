// Fetch metaschema XML from GitHub, resolve external entities, parse, and
// recursively merge imports for a given OSCAL model.

import { MetaschemaParser } from './parser.ts';
import {
  type MetaschemaDefinition,
  type ModelEntry,
  type ParsedMetaschema,
  type ResolvedModel,
} from './types.ts';

const GITHUB_RAW_BASE = 'https://raw.githubusercontent.com/usnistgov/OSCAL';

/**
 * Loads OSCAL metaschema documents from GitHub, resolving DOCTYPE external
 * entities, parsing them, and recursively pulling in their imports. All
 * results are cached per process so building many pages stays cheap.
 */
export class MetaschemaLoader {
  private static instance: MetaschemaLoader | null = null;
  private readonly metaschemaCache = new Map<string, ParsedMetaschema>();
  private readonly entityCache = new Map<string, string>();

  static shared(): MetaschemaLoader {
    if (!MetaschemaLoader.instance) MetaschemaLoader.instance = new MetaschemaLoader();
    return MetaschemaLoader.instance;
  }

  async fetchMetaschema(version: string, filename: string): Promise<ParsedMetaschema> {
    const branch = version === 'develop' ? 'develop' : version;
    const key = `${branch}/${filename}`;
    const cached = this.metaschemaCache.get(key);
    if (cached) return cached;

    const url = `${GITHUB_RAW_BASE}/${branch}/src/metaschema/${filename}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
    }
    const rawXml = await response.text();
    const xml = await this.resolveExternalEntities(rawXml, url);
    const parsed = MetaschemaParser.parse(xml);
    this.metaschemaCache.set(key, parsed);
    return parsed;
  }

  async resolveModel(modelSlug: string, version: string): Promise<ResolvedModel> {
    const models = await this.getModelsForVersion(version);
    const model = models.find((m) => m.slug === modelSlug);
    if (!model) throw new Error(`Unknown model "${modelSlug}" for version ${version}`);

    const definitions = await this.collectAllImports(version, model.filename, new Set());

    // Deduplicate by name (first occurrence wins).
    const deduped = new Map<string, MetaschemaDefinition>();
    for (const def of definitions) {
      if (!deduped.has(def.name)) deduped.set(def.name, def);
    }

    const allDefs = Array.from(deduped.values());
    return {
      name: modelSlug,
      displayName: model.displayName,
      version,
      definitions: allDefs,
      rootDefinition: allDefs.find((d) => d.isRoot),
    };
  }

  /**
   * Dynamically discovers which top-level models exist for a given version
   * by parsing the imports in oscal_complete_metaschema.xml.
   */
  private readonly modelsCache = new Map<string, ModelEntry[]>();

  async getModelsForVersion(version: string): Promise<ModelEntry[]> {
    const cached = this.modelsCache.get(version);
    if (cached) return cached;

    let complete: ParsedMetaschema;
    try {
      complete = await this.fetchMetaschema(version, 'oscal_complete_metaschema.xml');
    } catch {
      console.warn(
        `Failed to load oscal_complete_metaschema.xml for version ${version}; no models available`,
      );
      this.modelsCache.set(version, []);
      return [];
    }

    const models: ModelEntry[] = [];

    for (const filename of complete.imports) {
      const parsed = await this.fetchMetaschema(version, filename);
      const rootDef = parsed.definitions.find((d) => d.isRoot);
      if (!rootDef) {
        console.warn(`Model ${filename} in version ${version} has no root definition; skipping`);
        continue;
      }
      const slug = rootDef.rootName;
      if (!slug) {
        console.warn(`Model ${filename} in version ${version} has no rootName; skipping`);
        continue;
      }
      models.push({
        slug,
        filename,
        displayName: parsed.schemaName,
      });
    }

    this.modelsCache.set(version, models);
    return models;
  }

  private async collectAllImports(
    version: string,
    filename: string,
    visited: Set<string>,
  ): Promise<MetaschemaDefinition[]> {
    if (visited.has(filename)) return [];
    visited.add(filename);

    const parsed = await this.fetchMetaschema(version, filename);
    let allDefs = [...parsed.definitions];
    for (const imp of parsed.imports) {
      allDefs = allDefs.concat(await this.collectAllImports(version, imp, visited));
    }
    return allDefs;
  }

  // Resolve <!DOCTYPE ...> external entities so fast-xml-parser can read the
  // document.
  private async resolveExternalEntities(xml: string, baseUrl: string): Promise<string> {
    const doctypeMatch = xml.match(/<!DOCTYPE[^[]*\[([\s\S]*?)\]\s*>/);
    if (!doctypeMatch) return xml;
    const decls = doctypeMatch[1];
    const entityRe = /<!ENTITY\s+([\w-]+)\s+SYSTEM\s+"([^"]+)"\s*>/g;
    const entities: { name: string; content: string }[] = [];
    let m: RegExpExecArray | null;
    while ((m = entityRe.exec(decls)) !== null) {
      const content = await this.fetchEntity(baseUrl, m[2]);
      entities.push({ name: m[1], content });
    }
    let out = xml.replace(doctypeMatch[0], '');
    for (const ent of entities) {
      out = out.split(`&${ent.name};`).join(ent.content);
    }
    return out;
  }

  private async fetchEntity(baseUrl: string, relPath: string): Promise<string> {
    const url = new URL(relPath, baseUrl).toString();
    const cached = this.entityCache.get(url);
    if (cached) return cached;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to fetch entity ${url}: ${res.statusText}`);
    const text = await res.text();
    this.entityCache.set(url, text);
    return text;
  }
}
