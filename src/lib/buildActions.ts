import { dirname, relative, resolve } from "path";
import { cwd } from "process";
import { paramCase } from "change-case";
import { createHash } from "crypto";
import { readdir, readFile, writeFile } from "fs/promises";
import { ensureDir } from "fs-extra";

interface GeneratorData {
  name?: string;
  destination?: string;
  originalDestination?: string;
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

export const buildActions =
  (cb: (data: GeneratorData) => []) => (data: GeneratorData) => {
    if (!data.name) {
      throw new Error("A name is required");
    }
    const originalDestination = data.destination;
    data.destination = data.destination
      ? resolve(cwd(), data.destination)
      : resolve(cwd(), "packages", paramCase(data.name));
    const actions = cb(data);
    const generatorDir = resolve(data.destination, ".generator", "hash");
    return [
      ...actions,
      async (data: Required<GeneratorData>) => {
        const files = await getFiles(data.destination);
        await ensureDir(generatorDir);
        await Promise.all([
          Promise.all(
            files.map(async (f) => {
              const hash = createHash("md5")
                .update(await readFile(f))
                .digest("hex");
              const relativePath = relative(data.destination, f);
              const outPath = resolve(generatorDir, "hash", relativePath);
              await ensureDir(dirname(outPath));
              await writeFile(outPath, hash);
            })
          ),
          writeFile(
            resolve(generatorDir, "data.json"),
            JSON.stringify(
              { ...data, destination: originalDestination },
              null,
              2
            )
          ),
        ]);
        return "File hashes created";
      },
    ];
  };
