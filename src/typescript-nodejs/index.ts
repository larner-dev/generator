import chalk from "chalk";
import { Actions } from "node-plop";
import { buildActions } from "../lib/buildActions";
import { ExtendedPlopGeneratorConfig } from "../lib/types";

const generatorName = "typescript-nodejs";

interface Dependency {
  name: string;
  version: string;
  source?: string;
}
//
const packageDependencies: Record<string, Dependency[]> = {
  default: [],
  koa_api: [
    { name: "koa", version: "2.14.1" },
    { name: "koa-object-router", version: "1.3.2" },
    { name: "dotenv", version: "16.0.3" },
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
  log_management: [
    { name: "pino", version: "8.10.0" },
    { name: "koa-pino-logger", version: "4.0.0" },
  ],
  log_management_logtail: [{ name: "@logtail/pino", version: "0.2.0" }],
  log_management_syslog: [{ name: "pino-syslog", version: "3.0.0" }],
  analytics_management: [{ name: "type-fest", version: "3.5.7" }],
  analytics_management_posthog: [{ name: "posthog-node", version: "2.5.3" }],
  db_knex: [{ name: "knex", version: "2.4.2" }],
  db_knex_orm: [{ name: "tiny-knex-orm", version: "1.0.0" }],
  db_knex_dialect_pg: [{ name: "pg", version: "8.9.0" }],
  db_knex_dialect_pg_native: [{ name: "pg-native", version: "3.0.1" }],
  db_knex_dialect_sqlite3: [{ name: "sqlite3", version: "5.1.4" }],
  db_knex_dialect_better_sqlite3: [
    { name: "better-sqlite3", version: "8.1.0" },
  ],
  db_knex_dialect_mysql: [{ name: "mysql", version: "2.18.1" }],
  db_knex_dialect_mysql2: [{ name: "mysql2", version: "3.1.2" }],
  db_knex_dialect_oracledb: [{ name: "oracledb", version: "5.5.0" }],
  db_knex_dialect_tedious: [{ name: "tedious", version: "15.1.3" }],
};
const packageDevDependencies: Record<string, Dependency[]> = {
  default: [
    { name: "@types/node", version: "18.11.18" },
    { name: "@typescript-eslint/eslint-plugin", version: "5.48.1" },
    { name: "@typescript-eslint/parser", version: "5.48.1" },
    { name: "concurrently", version: "7.6.0" },
    { name: "esbuild", version: "0.16.16" },
    { name: "eslint", version: "8.31.0" },
    { name: "eslint-config-prettier", version: "8.6.0" },
    { name: "prettier", version: "2.8.4" },
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
  log_management: [{ name: "@types/koa-pino-logger", version: "3.0.1" }],
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
          name: "Knex database connection",
          value: "db_knex",
        },
        {
          name: "Tiny knex ORM",
          value: "db_knex_orm",
        },
        {
          name: "Command Line Tool",
          value: "command_line_tool",
        },
        {
          name: "Log Management",
          value: "log_management",
        },
        {
          name: "Secrets Management",
          value: "secrets_management",
        },
        {
          name: "Analytics Management",
          value: "analytics_management",
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
      name: "db_knex_dialect",
      message: "Which knex database will you use?",
      choices: [
        { name: "pg", value: "pg" },
        { name: "pg-native", value: "pg-native" },
        { name: "sqlite3", value: "sqlite3" },
        { name: "better-sqlite3", value: "better-sqlite3" },
        { name: "mysql", value: "mysql" },
        { name: "mysql2", value: "mysql2" },
        { name: "oracledb", value: "oracledb" },
        { name: "tedious", value: "tedious" },
      ],
      when: (answers) =>
        answers.features.includes("db_knex") ||
        answers.features.includes("db_knex_orm"),
    },
    {
      type: "list",
      name: "log_management_type",
      message: "How would you like to manage logs?",
      choices: [
        {
          name: "Logtail",
          value: "logtail",
        },
        {
          name: "Syslog",
          value: "syslog",
        },
      ],
      when: (answers) => answers.features.includes("log_management"),
    },
    {
      type: "list",
      name: "analytics_management_type",
      message: "How would you like to manage anlytics?",
      choices: [
        {
          name: "Posthog",
          value: "posthog",
        },
      ],
      when: (answers) => answers.features.includes("analytics_management"),
    },
    {
      type: "list",
      name: "secrets_management_type",
      message: "How would you like to manage secrets?",
      choices: [
        {
          name: "Doppler",
          value: "doppler",
        },
        {
          name: "Environment Variables",
          value: "environment_variables",
        },
      ],
      when: (answers) =>
        answers.features.includes("secrets_management") ||
        answers.log_management_type === "logtail" ||
        answers.features.includes("analytics_management") ||
        answers.features.includes("db_knex") ||
        answers.features.includes("db_knex_orm"),
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
    if ("db_knex_orm" in data) {
      data.features.push("db_knex");
    }
    if ("db_knex_dialect" in data) {
      console.log(data.db_knex_dialect);
      data.features.push(
        "db_knex",
        `db_knex_dialect_${data.db_knex_dialect.replace("-", "_")}`
      );
    }
    if ("secrets_management_type" in data) {
      data.features.push(
        "secrets_management",
        `secrets_management_${data.secrets_management_type}`
      );
    }
    if ("analytics_management_type" in data) {
      data.features.push(
        "analytics_management",
        "secrets_management",
        `analytics_management_${data.analytics_management_type}`
      );
    }
    if ("log_management_type" in data) {
      data.features.push(
        "log_management",
        `log_management_${data.log_management_type}`
      );
      if (data.log_management_type === "logtail") {
        data.features.push("secrets_management");
      }
    }
    const dependencies = new Map<string, Dependency>(
      packageDependencies.default.map((d) => [
        d.name,
        { ...d, source: "default" },
      ])
    );
    const devDependencies = new Map<string, Dependency>();
    for (const feature of data.features) {
      if (feature in packageDependencies) {
        for (const f of packageDependencies[feature]) {
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
      if (feature in packageDevDependencies) {
        for (const f of packageDevDependencies[feature]) {
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
        base: `typescript-nodejs/features/${feature}/`,
        globOptions: { dot: true },
        stripExtensions: ["hbs"],
        force: true,
      });
    }
    return actions;
  }),
};
