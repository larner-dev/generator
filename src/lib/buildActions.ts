import { dirname, relative, resolve } from "path";
import { cwd } from "process";
import { paramCase } from "change-case";
import { createHash } from "crypto";
import { readdir, readFile, writeFile } from "fs/promises";
import { ensureDir } from "fs-extra";
import { DynamicActionsFunction } from "node-plop";
import { ActionConfig, ActionType, CustomActionFunction } from "plop";

export interface GeneratorData {
  name: string;
  destination: string;
  originalDestination: string;
}

const getFiles = async (dir: string): Promise<string[]> => {
  const dirents = await readdir(dir, { withFileTypes: true });
  const files: string[][] = await Promise.all(
    dirents.map((dirent) => {
      const res = resolve(dir, dirent.name);
      return dirent.isDirectory() ? getFiles(res) : [res];
    })
  );
  return Array.prototype.concat(...files);
};

const generateHashes: CustomActionFunction = async (answers) => {
  const hashDir = resolve(answers.destination, ".generator", "hash");
  const files = await getFiles(answers.destination);
  await ensureDir(hashDir);
  await Promise.all(
    files.map(async (f) => {
      const hash = createHash("md5")
        .update(await readFile(f))
        .digest("hex");
      const relativePath = relative(answers.destination, f);
      const outPath = resolve(hashDir, relativePath);
      await ensureDir(dirname(outPath));
      await writeFile(outPath, hash);
    })
  );
  return "File hashes created";
};

const generateConfigJson =
  (generatorName: string, originalDestination: string): CustomActionFunction =>
  async (answers) => {
    const generatorDir = resolve(answers.destination, ".generator");
    await writeFile(
      resolve(generatorDir, "config.json"),
      JSON.stringify(
        {
          generatorName,
          answers: { ...answers, destination: originalDestination },
        },
        null,
        2
      )
    );
    return "Config json created";
  };

export const buildActions =
  (
    generatorName: string,
    buildCustomActions: (arg0: Record<string, any>) => ActionType[]
  ): DynamicActionsFunction =>
  (data?: Record<string, any>): ActionType[] => {
    if (!data?.name) {
      throw new Error("A name is required");
    }
    const originalDestination = data.destination;
    data.destination = data.destination
      ? resolve(cwd(), data.destination)
      : resolve(cwd(), "packages", paramCase(data.name));
    const actions = buildCustomActions(data);
    return [
      ...actions,
      generateHashes,
      generateConfigJson(generatorName, originalDestination),
    ];
  };
