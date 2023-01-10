import { buildActions } from "../lib/buildActions";
import { ExtendedPlopGeneratorConfig } from "../lib/types";

const generatorName = "typescript-nodejs";

export const typescriptNodejs: ExtendedPlopGeneratorConfig = {
  generatorName,
  description: "Nodejs, ESM, TypeScript, Jest",
  prompts: [
    {
      type: "input",
      name: "name",
      message: "Package Name",
    },
    {
      type: "input",
      name: "destination",
      message: `Package Destination (default: packages/package-name)`,
    },
  ],
  actions: buildActions(generatorName, (data) => [
    {
      type: "addMany",
      destination: data.destination,
      templateFiles: "**/*",
      base: "typescript-nodejs/templates",
    },
  ]),
  //   actions: buildActions(generatorName, (data: GeneratorData) => {
  //     return ;
  //   }),
};
