#!/usr/bin/env node

import { program } from "commander";
import pkg from "../package.json";
import { initCommand } from "./commands/init";

program.name("foo").description("CLI for X").version(pkg.version);

program
  .command("init")
  .description("Initialize the thing")
  .argument("<name>", "Name of the thing")
  .option("-p, --path <name>", "Path where the thing should be created.")
  .action((str, options) => {
    initCommand(str, options, program);
  });

program.showHelpAfterError();

await program.parseAsync();
