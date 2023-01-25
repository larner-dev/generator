import { createHash } from "crypto";
import { readFile } from "fs/promises";
import { JSONValueOrUndefined } from "./types";
import { isConfigFile, parseConfig } from "./configFileHelpers";

export const getCurrentValueOrHash = async (f: string): Promise<string> => {
  let val = null;
  // Certain special file types we will not has (just JSON for now) and try to be smarter about
  // merging changes.
  if (isConfigFile(f)) {
    val = (await readFile(f)).toString();
  }

  if (val !== null) {
    return val;
  }

  // Fallback to hashing
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
