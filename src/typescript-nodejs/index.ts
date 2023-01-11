import { join } from "path";
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
      message: "Package Destination (default: packages/package-name)",
    },
    {
      type: "checkbox",
      name: "features",
      message: "Any additional features of this project?",
      choices: [
        {
          name: "Publishable to npm or another registry",
          value: "publishable",
        },
        {
          name: "Publically available via npm or another registry",
          value: "public",
        },
      ],
    },
    {
      type: "confirm",
      name: "public",
      message: "Will this package be public?",
      default: false,
      when: (res) => res.publishable,
    },
  ],
  actions: buildActions(generatorName, (data) => [
    {
      type: "addMany",
      destination: data.destination,
      templateFiles: "**/*",
      base: "typescript-nodejs/templates",
      globOptions: { dot: true },
    },
    // We can't just include the .gitignore file in the templates directory because when publishing
    // to npm all .gitignore files are removed
    {
      type: "add",
      path: join(data.destination, ".gitignore"),
      templateFile: "typescript-nodejs/.gitignore.hbs",
    },
  ]),
};
