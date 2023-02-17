#!/usr/bin/env node

import { program } from "commander";
import pkg from "../package.json";
import { newCommand } from "./commands/new";
import { upgradeCommand } from "./commands/upgrade";

program
  .name("generator")
  .description("CLI to generate monorepo package from predefined templates")
  .version(pkg.version);

program
  .command("new")
  .description("Generate a new package from a plop generator")
  .argument("<generator>", "Plop generator name")
  .argument(
    "[path]",
    "Path where the package should be created. Defaults to current directory.",
    "."
  )
  .option("-s, --silent", "Don't emit any output")
  .action((generator, path, options) => {
    newCommand(generator, path, options, program);
  });

program
  .command("upgrade")
  .description(
    "Upgrade an existing package with new options or an updated template."
  )
  .argument("<package_path>", "Path to the existing package")
  .action((str, options) => {
    upgradeCommand(str, options, program);
  });

program.showHelpAfterError();

await program.parseAsync();
