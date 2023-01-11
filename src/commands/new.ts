import nodePlop from "node-plop";
import { dirname, resolve } from "path";
import { Command } from "commander";
import chalk from "chalk";
import { paramCase } from "change-case";
import { cwd } from "process";
import { ensureDir } from "fs-extra";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

export const newCommand = async (
  str: string,
  options: Record<string, unknown>,
  program: Command,
  answerOverride?: Record<string, unknown>
) => {
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
  const answers =
    answerOverride ||
    (await generator.runPrompts(["_", options.path as string]));
  let { destination } = answers;
  if (!answerOverride) {
    if (!destination) {
      destination = resolve("packages", paramCase(answers.name));
    }
    destination = resolve(cwd(), destination);
    await ensureDir(destination);
  }

  const result = await generator.runActions({ ...answers, destination });
  if (!options.silent) {
    for (const change of result.changes) {
      console.log(`${change.type}: ${change.path}`);
    }
    for (const failure of result.failures) {
      console.log(chalk.red(`${failure.type}: ${failure.error}`));
      console.log(chalk.grey(failure.path));
    }
  }
  return result;
};
