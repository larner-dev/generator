// src/lib/buildActions.ts
import { dirname, relative, resolve } from "path";
import { cwd } from "process";
import { paramCase } from "change-case";
import { createHash } from "crypto";
import { readdir, readFile, writeFile } from "fs/promises";
import { ensureDir } from "fs-extra";
var getFiles = async (dir) => {
  const dirents = await readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    dirents.map((dirent) => {
      const res = resolve(dir, dirent.name);
      return dirent.isDirectory() ? getFiles(res) : [res];
    })
  );
  return Array.prototype.concat(...files);
};
var buildActions = (cb) => (data) => {
  if (!data.name) {
    throw new Error("A name is required");
  }
  const originalDestination = data.destination;
  data.destination = data.destination ? resolve(cwd(), data.destination) : resolve(cwd(), "packages", paramCase(data.name));
  const actions = cb(data);
  const generatorDir = resolve(data.destination, ".generator", "hash");
  return [
    ...actions,
    async (data2) => {
      const files = await getFiles(data2.destination);
      await ensureDir(generatorDir);
      await Promise.all([
        Promise.all(
          files.map(async (f) => {
            const hash = createHash("md5").update(await readFile(f)).digest("hex");
            const relativePath = relative(data2.destination, f);
            const outPath = resolve(generatorDir, "hash", relativePath);
            await ensureDir(dirname(outPath));
            await writeFile(outPath, hash);
          })
        ),
        writeFile(
          resolve(generatorDir, "data.json"),
          JSON.stringify(
            { ...data2, destination: originalDestination },
            null,
            2
          )
        )
      ]);
      return "File hashes created";
    }
  ];
};

// src/typescript-nodejs/index.ts
var typescriptNodejs = {
  description: "Nodejs, ESM, TypeScript, Jest",
  prompts: [
    {
      type: "input",
      name: "name",
      message: "Package Name"
    },
    {
      type: "input",
      name: "destination",
      message: `Package Destination (default: packages/package-name)`
    }
  ],
  actions: buildActions((data) => {
    return [
      {
        type: "addMany",
        destination: data.destination,
        templateFiles: "**/*",
        base: "typescript-nodejs/templates"
      }
    ];
  })
};

// src/plopfile.ts
function plopfile_default(plop) {
  plop.setGenerator("typescript-nodejs", typescriptNodejs);
}
export {
  plopfile_default as default
};
