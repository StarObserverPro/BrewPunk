import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const port = Number(process.env.PORT ?? 4189);
const types = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".webp": "image/webp",
};

createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(
      new URL(request.url, "http://localhost").pathname,
    );
    const target = resolve(
      root,
      "." + (pathname === "/" ? "/index.html" : pathname),
    );
    const type = types[extname(target)];
    if (!type || !target.startsWith(resolve(root) + sep)) throw Error();
    const content = await readFile(target);
    response
      .writeHead(200, {
        "Content-Type": type.startsWith("image/") ? type : type + "; charset=utf-8",
        "Cache-Control": "no-store",
      })
      .end(content);
  } catch {
    response.writeHead(404).end("Not found");
  }
}).listen(port, "127.0.0.1", () =>
  console.log("BrewPunk: http://127.0.0.1:" + port),
);
