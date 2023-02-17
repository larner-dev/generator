import { extname, join } from "path";
import { Command } from "commander";
import chalk from "chalk";
import { cwd } from "process";
import { copy, pathExists, remove } from "fs-extra";
import { readFile, writeFile } from "fs/promises";
import * as diff from "diff";
import { newCommand } from "./new";
import { getFiles } from "../lib/getFiles";
import inquirer from "inquirer";
import { getCurrentValueOrHash } from "../lib/getCurrentValueOrHash";
import { getLineBreakSequence } from "../lib/getLineBreakSequence";
import {
  applyChanges,
  configDiff,
  isConfigFile,
  parseConfig,
  stringifyConfig,
} from "../lib/configFileHelpers";

export const upgradeCommand = async (
  str: string,
  options: Record<string, unknown>,
  program: Command
) => {
  console.log("upgrade command");
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
  await newCommand(config.generatorName, tmpDir, { silent: true }, program, {
    ...config.answers,
    destination: tmpDir,
  });

  const oldHashDir = join(genDir, "hash");
  const newHashDir = join(tmpDir, ".generator", "hash");

  const oldHashes = new Map(
    await Promise.all(
      (
        await getFiles(oldHashDir)
      ).map(
        async (f): Promise<[string, string]> => [
          f.substring(oldHashDir.length + 1),
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
        return [
          f.substring(newHashDir.length + 1),
          (await readFile(f)).toString(),
        ];
      })
    )
  );

  const added = [];
  const removed = [];
  const updated = [];
  const conflicted = [];
  const warnings = [];

  const configEdits: { [key: string]: { current: string; after: string } } = {};

  for (const [key, val] of oldHashes) {
    if (!newHashes.has(key)) {
      const currentHash = await getCurrentValueOrHash(join(destination, key));
      if (currentHash === val) {
        // The file was removed, but has not been modified since it was originally created
        removed.push(key);
      } else if (currentHash !== "") {
        // The file was removed and was modified since it was originally created
        conflicted.push({
          action: "remove",
          path: key,
        });
      }
    } else if (val !== newHashes.get(key)) {
      const currentHash = await getCurrentValueOrHash(join(destination, key));
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
        const configType = isConfigFile(key);
        // First try to do some special handling for certain file types
        let beforeParsed;
        let afterParsed;
        let currentParsed;
        if (configType) {
          try {
            beforeParsed = parseConfig(
              await getCurrentValueOrHash(join(oldHashDir, key)),
              configType
            );
          } catch (error) {
            console.log(
              chalk.yellow(
                `Unable to parse config (before) ${key}: ${
                  (error as Record<string, unknown>).message
                }`
              )
            );
          }
          try {
            afterParsed = parseConfig(newHashes.get(key)!, configType);
          } catch (error) {
            console.log(
              chalk.yellow(
                `Unable to parse config (after) ${key}: ${
                  (error as Record<string, unknown>).message
                }`
              )
            );
          }
          try {
            currentParsed = parseConfig(currentHash, configType);
          } catch (error) {
            console.log(
              chalk.yellow(
                `Unable to parse config (current) ${key}: ${
                  (error as Record<string, unknown>).message
                }`
              )
            );
          }
        }
        if (configType && beforeParsed && afterParsed && currentParsed) {
          const changes = configDiff(beforeParsed, currentParsed, afterParsed);
          const { current, after } = applyChanges(currentParsed, changes);
          configEdits[key] = {
            current: stringifyConfig(current, configType),
            after: stringifyConfig(after, configType),
          };
          if (changes.some((c) => c.isConflict)) {
            conflicted.push({
              action: "update",
              path: key,
              current,
              new: val,
            });
          }
        } else {
          conflicted.push({
            action: "update",
            path: key,
            current: currentHash,
            new: val,
          });
        }
      }
    }
  }

  for (const [key, val] of newHashes) {
    if (!oldHashes.has(key)) {
      const currentHash = await getCurrentValueOrHash(join(destination, key));
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

  if (added.length) {
    console.log("The following files will be " + chalk.green("added") + ":");
    for (const add of added) {
      console.log(chalk.grey(add));
    }
    console.log("");
  }

  if (removed.length) {
    console.log("The following files will be " + chalk.red("removed") + ":");
    for (const remove of removed) {
      console.log(chalk.grey(remove));
    }
    console.log("");
  }

  if (updated.length) {
    console.log("The following files will be " + chalk.yellow("updated") + ":");
    for (const update of updated) {
      console.log(chalk.grey(update));
    }
    console.log("");
  }

  if (warnings.length) {
    for (const warning of warnings) {
      console.log(chalk.yellow(warning));
    }
    console.log("");
  }

  if (conflicted.length) {
    console.log(
      chalk.red(
        "After upgrading you will need to resolve a conflict in the following files:"
      )
    );
    for (const conflict of conflicted) {
      console.log(chalk.yellow(conflict.path));
    }
    console.log("");
  }

  if (
    !added.length &&
    !removed.length &&
    !updated.length &&
    !conflicted.length
  ) {
    console.log(chalk.green("You are already up to date!"));
    await remove(tmpDir);
    return;
  }

  const result = await inquirer.prompt([
    {
      type: "confirm",
      message:
        "Please review an message above and commit any unsaved changes to before continuing. \n" +
        "Are you ready to start the upgrade?",
      name: "confirm",
    },
  ]);

  if (!result.confirm) {
    console.log(chalk.yellow("Upgrade aborted"));
    await remove(tmpDir);
    return;
  }

  const promises = [
    ...added.map((a) => copy(join(tmpDir, a), join(destination, a))),
    ...updated.map(async (a) => copy(join(tmpDir, a), join(destination, a))),
    ...removed.map((a) =>
      remove(join(destination, a)).catch((error) =>
        console.log(`Skipping ${a} because it was already removed`)
      )
    ),
    ...conflicted.map(async ({ path }) => {
      const pathToCurrent = join(destination, path);
      const pathToNew = join(tmpDir, path);
      const currentString =
        path in configEdits
          ? configEdits[path].current
          : (
              await readFile(pathToCurrent).catch(() => Promise.resolve(""))
            ).toString();
      const newString =
        path in configEdits
          ? configEdits[path].after
          : (
              await readFile(pathToNew).catch(() => Promise.resolve(""))
            ).toString();
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
    }),
  ];

  try {
    await Promise.all(promises);
  } catch (error) {
    console.trace(error);
    throw error;
  }

  await remove(join(destination, ".generator", "hash"));
  await copy(
    join(tmpDir, ".generator", "hash"),
    join(destination, ".generator", "hash")
  );
  await remove(tmpDir);

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
