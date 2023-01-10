import { NodePlopAPI } from "plop";
import { typescriptNodejs } from "./typescript-nodejs";

export default function (plop: NodePlopAPI) {
  plop.setGenerator(typescriptNodejs.generatorName, typescriptNodejs);
}
