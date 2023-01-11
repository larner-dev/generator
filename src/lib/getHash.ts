import { createHash } from "crypto";
import { readFile } from "fs/promises";

export const getHash = async (f: string): Promise<string> => {
  try {
    return createHash("md5")
      .update(await readFile(f))
      .digest("hex");
  } catch (error) {
    if ((error as Record<string, unknown>).code === "ENOENT") {
      return "";
    }
    throw error;
  }
};
