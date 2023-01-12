import { server } from "@larner.dev/api";

import { dirname, resolve } from "path";
import { fileURLToPath } from "url";

server({
  rootDirectory: resolve(dirname(fileURLToPath(import.meta.url))),
})
  .then(({ config }) => {
    console.log(`Server started at http://localhost:${config.server.port}`);
  })
  .catch((error) => {
    console.error("The server couldn't start up...");
    console.error(error.message);
  });
