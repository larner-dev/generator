import chalk from "chalk";
import { Actions } from "node-plop";
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
  koa_api: [
    { name: "koa", version: "2.14.1" },
    { name: "koa-object-router", version: "1.1.0" },
  ],
  koa_api_json_bodyparser: [{ name: "koa-bodyparser", version: "4.3.0" }],
  koa_api_cors: [{ name: "@koa/cors", version: "4.0.0" }],
  publishable: [
    { name: "@types/node", version: "18.11.18" },
    { name: "@typescript-eslint/eslint-plugin", version: "5.48.1" },
    { name: "@typescript-eslint/parser", version: "5.48.1" },
  ],
  command_line_tool: [
    { name: "chalk", version: "5.2.0" },
    { name: "commander", version: "9.5.0" },
  ],
  secrets_management: [{ name: "dotenv", version: "16.0.3" }],
  secrets_management_doppler: [{ name: "got", version: "12.5.3" }],
};
const featureDevDependencies: Record<string, Dependency[]> = {
  default: [
    { name: "@types/node", version: "18.11.18" },
    { name: "@typescript-eslint/eslint-plugin", version: "5.48.1" },
    { name: "@typescript-eslint/parser", version: "5.48.1" },
    { name: "concurrently", version: "7.6.0" },
    { name: "esbuild", version: "0.16.16" },
    { name: "eslint", version: "8.31.0" },
    { name: "eslint-config-prettier", version: "8.6.0" },
    { name: "typescript", version: "4.9.4" },
    { name: "vitest", version: "0.28.1" },
  ],
  koa_api: [
    { name: "nodemon", version: "2.0.20" },
    { name: "@swc/cli", version: "0.1.62" },
    { name: "@swc/core", version: "1.3.35" },
    { name: "chokidar", version: "3.5.3" },
    { name: "@types/koa", version: "2.13.5" },
  ],
  koa_api_json_bodyparser: [
    { name: "@types/koa-bodyparser", version: "4.3.10" },
  ],
  koa_api_cors: [{ name: "@types/koa__cors", version: "3.3.0" }],
};

export const typescriptNodejs: ExtendedPlopGeneratorConfig = {
  generatorName,
  description: "Nodejs, ESM, TypeScript, Vitest",
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
          value: "koa_api",
        },
        {
          name: "Command Line Tool",
          value: "command_line_tool",
        },
        {
          name: "Secrets Management",
          value: "secrets_management",
        },
      ],
    },
    {
      type: "checkbox",
      name: "api_middleware",
      message: "Which middleware will be used in your API?",
      choices: [
        {
          name: "JSON Body Parser",
          value: "json_bodyparser",
        },
        {
          name: "CORS",
          value: "cors",
        },
      ],
      when: (answers) => answers.features.includes("koa_api"),
    },
    {
      type: "list",
      name: "secrets_management_type",
      message: "How would you like to manage secrets?",
      choices: [
        {
          name: "Environment Variables",
          value: "environment_variables",
        },
        {
          name: "Doppler",
          value: "doppler",
        },
      ],
      when: (answers) => answers.features.includes("secrets_management"),
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
    if ("api_middleware" in data) {
      for (const middleware of data.api_middleware) {
        data.features.push(`koa_api_${middleware}`);
      }
    }
    if ("secrets_management_type" in data) {
      data.features.push(`secrets_management_${data.secrets_management_type}`);
    }
    console.log(data.features);
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
    const actions: Actions = [
      {
        type: "addMany",
        destination: data.destination,
        templateFiles: "**/*",
        base: "typescript-nodejs/templates",
        globOptions: { dot: true },
      },
    ];
    for (const feature of data.features) {
      actions.push({
        type: "addMany",
        destination: data.destination,
        templateFiles: "**/*",
        base: `typescript-nodejs/features/${feature}`,
        globOptions: { dot: true },
        stripExtensions: ["hbs"],
        force: true,
      });
    }
    return actions;
  }),
};
