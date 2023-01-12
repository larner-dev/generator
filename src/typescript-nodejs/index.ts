import chalk from "chalk";
import { join } from "path";
import { buildActions } from "../lib/buildActions";
import { ExtendedPlopGeneratorConfig } from "../lib/types";

const generatorName = "typescript-nodejs";

interface Dependency {
  name: string;
  version: string;
  source?: string;
}

const featureDependencies: Record<string, Dependency[]> = {
  default: [],
  larner_dev_api: [{ name: "@larner.dev/api", version: "1.0.6" }],
  publishable: [
    { name: "@types/jest", version: "29.2.5" },
    { name: "@types/node", version: "18.11.18" },
    { name: "@typescript-eslint/eslint-plugin", version: "5.48.1" },
    { name: "@typescript-eslint/parser", version: "5.48.1" },
  ],
};
const featureDevDependencies: Record<string, Dependency[]> = {
  default: [
    { name: "@types/jest", version: "29.2.5" },
    { name: "@types/node", version: "18.11.18" },
    { name: "@typescript-eslint/eslint-plugin", version: "5.48.1" },
    { name: "@typescript-eslint/parser", version: "5.48.1" },
    { name: "esbuild", version: "0.16.16" },
    { name: "esbuild-jest", version: "0.5.0" },
    { name: "eslint", version: "8.31.0" },
    { name: "eslint-config-prettier", version: "8.6.0" },
    { name: "jest", version: "29.3.1" },
    { name: "typescript", version: "4.9.4" },
  ],
  larner_dev_api: [
    { name: "concurrently", version: "7.6.0" },
    { name: "nodemon", version: "2.0.20" },
  ],
};

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
        {
          name: "API with @larner.dev/api",
          value: "larner_dev_api",
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
  actions: buildActions(generatorName, (data) => {
    const dependencies = new Map<string, Dependency>(
      featureDependencies.default.map((d) => [
        d.name,
        { ...d, source: "default" },
      ])
    );
    const devDependencies = new Map<string, Dependency>();
    for (const feature of data.features) {
      if (feature in featureDependencies) {
        for (const f of featureDependencies[feature]) {
          const existing = dependencies.get(f.name);
          if (existing && existing.version !== f.version) {
            console.log(
              chalk.yellow(
                "Mismatching dependency versions for " +
                  chalk.yellowBright(f.name) +
                  ` from ${existing.source} (${existing.version}) and ${feature} (${f.version}).` +
                  `Using version ${chalk.yellowBright(
                    f.version
                  )}. Consider updating the generator to have consistent ` +
                  "versions."
              )
            );
          }
          dependencies.set(f.name, { ...f, source: feature });
        }
      }
    }
    for (const feature of ["default", ...data.features]) {
      if (feature in featureDevDependencies) {
        for (const f of featureDevDependencies[feature]) {
          let existing = dependencies.get(f.name);
          if (existing) {
            if (existing.version !== f.version) {
              console.log(
                chalk.yellow(
                  "Mismatching dependency versions for " +
                    chalk.yellowBright(f.name) +
                    ` from ${existing.source} (${existing.version}) and ${feature} (${f.version}).` +
                    `Using version ${chalk.yellowBright(
                      existing.version
                    )}. Consider updating the generator to have consistent ` +
                    "versions."
                )
              );
            }
          } else {
            existing = devDependencies.get(f.name);
            if (existing && existing.version !== f.version) {
              console.log(
                chalk.yellow(
                  "Mismatching dependency versions for " +
                    chalk.yellowBright(f.name) +
                    ` from ${existing.source} (${existing.version}) and ${feature} (${f.version}).` +
                    `Using version ${chalk.yellowBright(
                      f.version
                    )}. Consider updating the generator to have consistent ` +
                    "versions."
                )
              );
            }
            devDependencies.set(f.name, { ...f, source: feature });
          }
        }
      }
    }
    data.dependencies = [...dependencies.values()];
    data.dependencies.sort((a: Dependency, b: Dependency) =>
      a.name > b.name ? 1 : a.name < b.name ? -1 : 0
    );
    data.devDependencies = [...devDependencies.values()];
    data.devDependencies.sort((a: Dependency, b: Dependency) =>
      a.name > b.name ? 1 : a.name < b.name ? -1 : 0
    );
    const actions = [
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
    ];
    if (data.features.includes("publishable")) {
      actions.push({
        type: "add",
        path: join(data.destination, ".npmignore"),
        templateFile: "typescript-nodejs/features/publishable/.npmignore.hbs",
      });
    }
    if (data.features.includes("larner_dev_api")) {
      actions.push({
        type: "addMany",
        destination: data.destination,
        templateFiles: "**/*",
        base: "typescript-nodejs/features/larner_dev_api",
        globOptions: { dot: true },
        // @ts-ignore
        force: true,
      });
    }
    return actions;
  }),
};
