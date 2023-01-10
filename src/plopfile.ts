import { NodePlopAPI } from "plop";
import { cwd } from "process";
import { typescriptNodejs } from "./typescript-nodejs";

export default function (plop: NodePlopAPI) {
  plop.setGenerator("typescript-nodejs", typescriptNodejs);
}
