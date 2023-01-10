import { program } from "commander";
import chalk from "chalk";
import nodePlop from "node-plop";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";
import pkg from "../package.json";
import { paramCase } from "change-case";
import { cwd } from "process";
import { ensureDir } from "fs-extra";

const __dirname = dirname(fileURLToPath(import.meta.url));

program
  .name("gen")
  .description("CLI to generate monorepo package from predefined templates")
  .version(pkg.version);

program
  .command("new")
  .description("Generate a new package from a plop generator")
  .argument("<generator>", "Plop generator name")
  .option(
    "-p, --path <name>",
    "Path where the package should be created. Defaults to packages/<package_name>.",
    "packages/<project_name>"
  )
  .action(async (str, options) => {
    const plop = await nodePlop(resolve(__dirname, "./plopfile.js"));
    plop.setPlopfilePath(resolve(__dirname, "..", "src"));
    let generator = null;
    try {
      generator = plop.getGenerator(str);
      plop.getGeneratorList();
    } catch (error) {
      program.error(
        chalk.red(`Unknown generator ${chalk.white.bgRed.bold(str)}\n\n`) +
          `Your options are:\n\n${plop
            .getGeneratorList()
            .map((v) => `${v.name}: ${chalk.gray(v.description)}`)
            .join("\n")}`
      );
    }
    if (options.path === "packages/<project_name>") {
      options.path = "";
    }
    const bypassArr = ["_", options.path];
    const answers = await generator.runPrompts(bypassArr);
    let { destination } = answers;
    if (!destination) {
      destination = resolve("packages", paramCase(answers.name));
    }
    destination = resolve(dirname(cwd()), destination);
    await ensureDir(destination);

    const result = await generator.runActions({ ...answers, destination });
    for (const change of result.changes) {
      console.log(`${change.type}: ${change.path}`);
    }
    for (const failure of result.failures) {
      console.log(chalk.red(`${failure.type}: ${failure.error}`));
      console.log(chalk.grey(failure.path));
    }
  });

program
  .command("upgrade")
  .description(
    "Upgrade an existing package with new options or an updated template."
  )
  .argument("<package_path>", "Path to the existing package")
  .option(
    "-p, --path <name>",
    "Path where the package should be created. Defaults to packages/<project_name>.",
    "packages/<project_name>"
  )
  .action((str, options) => {
    program.error(chalk.red("Not implemented yet"));
  });

program.showHelpAfterError();

await program.parseAsync();
