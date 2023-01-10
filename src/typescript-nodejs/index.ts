import { resolve } from "path";
import { cwd } from "process";
import { buildActions } from "../lib/buildActions";

interface GeneratorData {
  name: string;
  destination: string;
}

export const typescriptNodejs = {
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
  actions: buildActions((data: GeneratorData) => {
    return [
      {
        type: "addMany",
        destination: data.destination,
        templateFiles: "**/*",
        base: "typescript-nodejs/templates",
      },
    ];
  }),
};
