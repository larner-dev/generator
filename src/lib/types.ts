import { PlopGeneratorConfig } from "plop";

export interface ExtendedPlopGeneratorConfig
  extends Partial<PlopGeneratorConfig> {
  generatorName: string;
}
