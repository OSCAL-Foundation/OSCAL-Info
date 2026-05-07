// Public surface of the metaschema library. Wraps the underlying classes
// in the function API the Astro components and config already use.

import { MetaschemaLoader } from './loader.ts';
import { MetaschemaParser } from './parser.ts';
import { VersionRegistry } from './versions.ts';
import type { MetaschemaDefinition, ParsedMetaschema, ResolvedModel, ModelEntry } from './types.ts';

export type {
  ConstraintDef,
  DefinitionType,
  FieldDef,
  MetaschemaDefinition,
  ModelEntry,
  ModelItem,
  ParsedMetaschema,
  ResolvedModel,
} from './types.ts';

export async function getOscalVersions(): Promise<string[]> {
  const allVersions = await VersionRegistry.shared().getVersions();
  const supported: string[] = [];
  for (const version of allVersions) {
    const models = await MetaschemaLoader.shared().getModelsForVersion(version);
    if (models.length > 0) supported.push(version);
  }
  return supported;
}

export async function getLatestVersion(): Promise<string> {
  const versions = await getOscalVersions();
  if (versions.length === 0) {
    throw new Error('No supported OSCAL versions are available.');
  }
  return versions[versions.length - 1];
}

export function getModelsForVersion(version: string): Promise<ModelEntry[]> {
  return MetaschemaLoader.shared().getModelsForVersion(version);
}

export function parseMetaschemaXml(xml: string): ParsedMetaschema {
  return MetaschemaParser.parse(xml);
}

export function fetchMetaschema(version: string, filename: string): Promise<ParsedMetaschema> {
  return MetaschemaLoader.shared().fetchMetaschema(version, filename);
}

export function resolveModel(modelSlug: string, version: string): Promise<ResolvedModel> {
  return MetaschemaLoader.shared().resolveModel(modelSlug, version);
}

/**
 * Order definitions by first appearance via BFS from the root definition.
 * Definitions not reachable from the root are appended at the end.
 */
export function orderByAppearance(
  definitions: MetaschemaDefinition[],
  rootDef?: MetaschemaDefinition,
): MetaschemaDefinition[] {
  const defMap = new Map(definitions.map((d) => [d.name, d]));
  const ordered: MetaschemaDefinition[] = [];
  const seen = new Set<string>();
  const queue: string[] = [];

  if (rootDef) {
    queue.push(rootDef.name);
    seen.add(rootDef.name);
  }

  while (queue.length > 0) {
    const name = queue.shift()!;
    const def = defMap.get(name);
    if (def) {
      ordered.push(def);
      for (const item of def.modelItems) {
        const ref = item.ref || item.name;
        if (ref && !seen.has(ref) && defMap.has(ref)) {
          seen.add(ref);
          queue.push(ref);
        }
      }
    }
  }

  for (const def of definitions) {
    if (!seen.has(def.name)) {
      ordered.push(def);
    }
  }

  return ordered;
}
