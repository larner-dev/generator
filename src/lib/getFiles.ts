import { readdir } from "fs/promises";
import { resolve, sep } from "path";

export const getFiles = async (
  dir: string,
  skip: string[] = []
): Promise<string[]> => {
  skip = skip.map((f) => (!f.endsWith(sep) ? f + sep : f));
  if (skip.some((f) => dir.startsWith(f))) {
    return [];
  }
  const dirents = await readdir(dir, { withFileTypes: true });
  const files: string[][] = await Promise.all(
    dirents.map((dirent) => {
      const res = resolve(dir, dirent.name);
      return dirent.isDirectory() ? getFiles(res) : [res];
    })
  );
  return Array.prototype.concat(...files);
};
