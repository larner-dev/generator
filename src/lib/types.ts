import { JSONPrimitive, JSONValue } from "@larner.dev/json-type";
import { PlopGeneratorConfig } from "plop";

export interface ExtendedPlopGeneratorConfig
  extends Partial<PlopGeneratorConfig> {
  generatorName: string;
}

export enum ConfigFileTypes {
  JSON = ".json",
}

export type JSONValueOrUndefined = JSONValue<JSONPrimitive | undefined>;
