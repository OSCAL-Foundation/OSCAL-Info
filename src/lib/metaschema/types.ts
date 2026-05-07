// Public types rendered into Astro components.

export type DefinitionType = 'assembly' | 'field' | 'flag';

export interface MetaschemaDefinition {
  name: string;
  formalName: string;
  description: string;
  remarks?: string;
  flags: FieldDef[];
  modelItems: ModelItem[];
  constraints: ConstraintDef[];
  isRoot?: boolean;
  rootName?: string;
  type: DefinitionType;
}

export interface FieldDef {
  name: string;
  formalName: string;
  description: string;
  asType?: string;
  required?: boolean;
  remarks?: string;
}

export interface ModelItem {
  ref?: string;
  name?: string;
  formalName?: string;
  description?: string;
  type: DefinitionType;
  minOccurs?: number;
  maxOccurs?: number | 'unbounded';
  groupAs?: string;
  inJson?: string;
  remarks?: string;
}

export interface ConstraintDef {
  type: string;
  id?: string;
  target?: string;
  description?: string;
  values?: { value: string; description: string }[];
}

export interface ParsedMetaschema {
  schemaName: string;
  schemaVersion: string;
  shortName: string;
  namespace: string;
  remarks?: string;
  imports: string[];
  definitions: MetaschemaDefinition[];
}

export interface ResolvedModel {
  name: string;
  displayName: string;
  version: string;
  definitions: MetaschemaDefinition[];
  rootDefinition?: MetaschemaDefinition;
}

export interface ModelEntry {
  slug: string;
  filename: string;
  displayName: string;
}
