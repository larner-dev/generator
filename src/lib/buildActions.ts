import { dirname, relative, resolve } from "path";
import { cwd } from "process";
import { paramCase } from "change-case";
import { writeFile } from "fs/promises";
import { ensureDir } from "fs-extra";
import { DynamicActionsFunction } from "node-plop";
import { ActionType, CustomActionFunction } from "plop";
import { exec } from "child_process";
import { getFiles } from "./getFiles";
import { getCurrentValueOrHash } from "./getCurrentValueOrHash";
import packageJson from "../../package.json";
import { promisify } from "util";

const execPromise = promisify(exec);

export interface GeneratorData {
  name: string;
  destination: string;
  originalDestination: string;
}

const generateHashes: CustomActionFunction = async (answers) => {
  const hashDir = resolve(answers.destination, ".generator", "hash");
  const files = await getFiles(answers.destination);
  await ensureDir(hashDir);
  await Promise.all(
    files.map(async (f) => {
      const hash = await getCurrentValueOrHash(f);
      const relativePath = relative(answers.destination, f);
      const outPath = resolve(hashDir, relativePath);
      await ensureDir(dirname(outPath));
      await writeFile(outPath, hash);
    })
  );
  return "File hashes created";
};

const installDependencies: CustomActionFunction = async (answers) => {
  await execPromise("yarn install", { cwd: answers.destination });
  return "dependencies installed";
};

const formatFiles: CustomActionFunction = async (answers) => {
  await execPromise("yarn format", { cwd: answers.destination });
  return "files formatted";
};

const build: CustomActionFunction = async (answers) => {
  await execPromise("yarn build", { cwd: answers.destination });
  return "project built";
};

const generateConfigJson =
  (generatorName: string, originalDestination: string): CustomActionFunction =>
  async (answers) => {
    const generatorDir = resolve(answers.destination, ".generator");
    await writeFile(
      resolve(generatorDir, "config.json"),
      JSON.stringify(
        {
          version: packageJson.version,
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
      installDependencies,
      build,
      formatFiles,
      generateHashes,
      generateConfigJson(generatorName, originalDestination),
    ];
  };
