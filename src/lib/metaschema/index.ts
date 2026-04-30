// Public surface of the metaschema library. Wraps the underlying classes
// in the function API the Astro components and config already use.

import { MetaschemaLoader } from './loader.ts';
import { MetaschemaParser } from './parser.ts';
import { VersionRegistry } from './versions.ts';
import type { ParsedMetaschema, ResolvedModel, ModelEntry } from './types.ts';

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
