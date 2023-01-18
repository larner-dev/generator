import chalk from "chalk";
import { Command } from "commander";
import { log } from "../lib/log";

export const initCommand = (
  str: string,
  options: Record<string, unknown>,
  program: Command
) => {
  log(chalk.green("Init complete"));
};
