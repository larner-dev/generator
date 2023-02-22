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
  generatorName: string,
  path: string,
  options: Record<string, unknown>,
  program: Command,
  answerOverride?: Record<string, unknown>
) => {
  const plop = await nodePlop(resolve(__dirname, "./plopfile.js"));
  plop.setPlopfilePath(resolve(__dirname, "..", "src"));
  plop.setHelper("includes", function (array, value, options) {
    array = array instanceof Array ? array : [array];
    if (array.includes(value)) {
      // @ts-ignore
      return options.fn(this);
    }
  });
  plop.setHelper("includesAny", function (...args) {
    let array = args[0];
    const options = args[args.length - 1];
    const values = args.slice(1, args.length - 1);
    array = array instanceof Array ? array : [array];
    if (array.some((v: unknown) => values.includes(v))) {
      // @ts-ignore
      return options.fn(this);
    }
  });
  plop.setHelper("excludes", function (array, value, options) {
    array = array instanceof Array ? array : [array];
    if (!array.includes(value)) {
      // @ts-ignore
      return options.fn(this);
    }
  });
  let generator = null;
  try {
    generator = plop.getGenerator(generatorName);
    plop.getGeneratorList();
  } catch (error) {
    program.error(
      chalk.red(
        `Unknown generator ${chalk.white.bgRed.bold(generatorName)}\n\n`
      ) +
        `Your options are:\n\n${plop
          .getGeneratorList()
          .map((v) => `${v.name}: ${chalk.gray(v.description)}`)
          .join("\n")}`
    );
  }
  const answers = answerOverride || (await generator.runPrompts(["_", path]));
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
