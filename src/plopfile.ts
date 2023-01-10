import { NodePlopAPI } from "plop";
import { typescriptNodejs } from "./typescript-nodejs";
import { typescriptReact } from "./typescript-react";

export default function (plop: NodePlopAPI) {
  plop.setGenerator(typescriptNodejs.generatorName, typescriptNodejs);
  plop.setGenerator(typescriptReact.generatorName, typescriptReact);
}
