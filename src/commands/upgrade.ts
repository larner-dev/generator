import nodePlop from "node-plop";
import { dirname, join, resolve } from "path";
import { Command } from "commander";
import chalk from "chalk";
import { paramCase } from "change-case";
import { cwd } from "process";
import { copy, ensureDir, pathExists, remove } from "fs-extra";
import { readFile, writeFile } from "fs/promises";
import { newCommand } from "./new";
import { getFiles } from "../lib/getFiles";
import inquirer from "inquirer";
import { getHash } from "../lib/getHash";
import * as diff from "diff";
import { getLineBreakSequence } from "../lib/getLineBreakSequence";
import { fstat } from "fs";

export const upgradeCommand = async (
  str: string,
  options: Record<string, unknown>,
  program: Command
) => {
  const destination = join(cwd(), str);
  const genDir = join(destination, ".generator");
  if (!(await pathExists(destination))) {
    program.error(chalk.red(`There is no valid package at ${destination}`));
  }
  if (!(await pathExists(genDir))) {
    program.error(
      chalk.red(
        `The specified package was not created with this tool, so it cannot be upgraded: ${destination}`
      )
    );
  }

  const file = await readFile(join(genDir, "config.json"));
  const config = JSON.parse(file.toString());
  const tmpDir = join(genDir, "tmp");
  await remove(tmpDir);
  const results = await newCommand(
    config.generatorName,
    { silent: true },
    program,
    {
      ...config.answers,
      destination: tmpDir,
    }
  );

  const oldHashDir = join(genDir, "hash");
  const newHashDir = join(tmpDir, ".generator", "hash");

  const oldHashes = new Map(
    await Promise.all(
      (
        await getFiles(oldHashDir)
      ).map(
        async (f): Promise<[string, string]> => [
          f.substring(oldHashDir.length),
          (await readFile(f)).toString(),
        ]
      )
    )
  );

  const newHashes = new Map(
    await Promise.all(
      (
        await getFiles(newHashDir)
      ).map(async (f): Promise<[string, string]> => {
        return [f.substring(newHashDir.length), (await readFile(f)).toString()];
      })
    )
  );

  const added = [];
  const removed = [];
  const updated = [];
  const conflicted = [];
  const warnings = [];

  for (const [key, val] of oldHashes) {
    if (!newHashes.has(key)) {
      const currentHash = await getHash(join(destination, key));
      if (currentHash === val) {
        removed.push(key);
      } else if (currentHash !== "") {
        conflicted.push({
          action: "remove",
          path: key,
        });
      }
    } else if (val !== newHashes.get(key)) {
      const currentHash = await getHash(join(destination, key));
      // File is unchanged since the package was generated / last updated
      if (currentHash === val) {
        updated.push(key);
      }
      // File was changed since the package was generated / last updated but it was changed to
      // exactly match the current upgrade.
      else if (currentHash === newHashes.get(key)) {
        warnings.push(
          `It looks like ${key} was correctly changed before the upgrade, but you should confirm`
        );
      }
      // File was changed since the package was generated / last updated and it doesn't match the
      // new upgraded value so we have a conflict.
      else {
        conflicted.push({
          action: "update",
          path: key,
          current: currentHash,
          new: val,
        });
      }
    }
  }

  for (const [key, val] of newHashes) {
    if (!oldHashes.has(key)) {
      const currentHash = await getHash(join(destination, key));
      if (!currentHash) {
        added.push(key);
      } else if (currentHash !== "") {
        conflicted.push({
          action: "add",
          path: key,
          current: currentHash,
          new: val,
        });
      }
    }
  }

  for (const warning of warnings) {
    console.log(chalk.yellow(warning));
  }

  if (warnings.length) {
    console.log("");
  }

  for (const conflict of conflicted) {
    console.log(
      chalk.red("After upgrading you will need to resolve a conflict in ") +
        chalk.bgRed.whiteBright(conflict.path)
    );
  }

  if (conflicted.length) {
    console.log("");
  }

  const result = await inquirer.prompt([
    {
      type: "confirm",
      message:
        "Please review an messaged above and commit any unsaved changes to \n" +
        "this package before continuing. Are you ready to start the upgrade?",
      name: "confirm",
    },
  ]);

  if (!result.confirm) {
    console.log(chalk.yellow("Upgrade aborted"));
    return;
  }

  for (const { path } of conflicted) {
    const pathToCurrent = join(destination, path);
    const pathToNew = join(tmpDir, path);
    const currentString = (await readFile(pathToCurrent)).toString();
    const newString = (await readFile(pathToNew)).toString();
    const currentLines = currentString
      .split(/\r?\n/)
      .map((line, index) => ({ line, index }));
    const newLines = newString
      .split(/\r?\n/)
      .map((line, index) => ({ line, index }));
    const newline = getLineBreakSequence(currentString);
    const patch = diff.structuredPatch(
      "",
      "",
      currentString,
      newString,
      undefined,
      undefined,
      {
        context: 0,
      }
    );
    const unstructuredPath = diff.createPatch(
      "",
      currentString,
      newString,
      undefined,
      undefined
    );
    const groups = [];
    let lastIndex = 0;
    for (const hunk of patch.hunks) {
      const beforeGroup = currentLines.slice(lastIndex, hunk.oldStart - 1);
      const oldHunkLines = currentLines.slice(
        hunk.oldStart - 1,
        hunk.oldStart + hunk.oldLines - 1
      );
      const newHunkLines = newLines.slice(
        hunk.newStart - 1,
        hunk.newStart + hunk.newLines - 1
      );
      if (beforeGroup.length > 0) {
        groups.push(beforeGroup.map(({ line }) => line));
      }
      groups.push({
        old: oldHunkLines.map(({ line }) => line),
        new: newHunkLines.map(({ line }) => line),
      });
      lastIndex = hunk.oldStart + hunk.oldLines - 1;
    }
    const afterGroup = currentLines.slice(lastIndex);
    if (afterGroup.length > 0) {
      groups.push(afterGroup.map(({ line }) => line));
    }

    const mergeFileLines = [];
    for (const group of groups) {
      if (Array.isArray(group)) {
        mergeFileLines.push(...group);
      } else {
        mergeFileLines.push(
          "<<<<<<< CURRENT",
          ...group.old,
          "=======",
          ...group.new,
          ">>>>>>> UPGRADED"
        );
      }
    }
    await writeFile(pathToCurrent, mergeFileLines.join(newline));
  }

  if (conflicted.length) {
    console.log(
      chalk.yellow("Upgrade completed with the following conflicts:\n")
    );
    console.log(
      conflicted.map(({ path }) => join(destination, path)).join("\n")
    );
    console.log("\n");
  } else {
    console.log(chalk.green("Upgrade completed"));
  }
};
