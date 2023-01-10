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
var generateHashes = async (answers) => {
  const hashDir = resolve(answers.destination, ".generator", "hash");
  const files = await getFiles(answers.destination);
  await ensureDir(hashDir);
  await Promise.all(
    files.map(async (f) => {
      const hash = createHash("md5").update(await readFile(f)).digest("hex");
      const relativePath = relative(answers.destination, f);
      const outPath = resolve(hashDir, relativePath);
      await ensureDir(dirname(outPath));
      await writeFile(outPath, hash);
    })
  );
  return "File hashes created";
};
var generateConfigJson = (generatorName2, originalDestination) => async (answers) => {
  const generatorDir = resolve(answers.destination, ".generator");
  await writeFile(
    resolve(generatorDir, "config.json"),
    JSON.stringify(
      {
        generatorName: generatorName2,
        answers: { ...answers, destination: originalDestination }
      },
      null,
      2
    )
  );
  return "Config json created";
};
var buildActions = (generatorName2, buildCustomActions) => (data) => {
  if (!(data == null ? void 0 : data.name)) {
    throw new Error("A name is required");
  }
  const originalDestination = data.destination;
  data.destination = data.destination ? resolve(cwd(), data.destination) : resolve(cwd(), "packages", paramCase(data.name));
  const actions = buildCustomActions(data);
  return [
    ...actions,
    generateHashes,
    generateConfigJson(generatorName2, originalDestination)
  ];
};

// src/typescript-nodejs/index.ts
var generatorName = "typescript-nodejs";
var typescriptNodejs = {
  generatorName,
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
  actions: buildActions(generatorName, (data) => [
    {
      type: "addMany",
      destination: data.destination,
      templateFiles: "**/*",
      base: "typescript-nodejs/templates"
    }
  ])
  //   actions: buildActions(generatorName, (data: GeneratorData) => {
  //     return ;
  //   }),
};

// src/plopfile.ts
function plopfile_default(plop) {
  plop.setGenerator(typescriptNodejs.generatorName, typescriptNodejs);
}
export {
  plopfile_default as default
};
