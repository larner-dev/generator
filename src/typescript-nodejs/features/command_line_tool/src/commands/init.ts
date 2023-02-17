import chalk from "chalk";
import { log } from "../lib/log";

export const initCommand = (str: string, options: Record<string, unknown>) => {
  log(chalk.green("Init complete"));
};
