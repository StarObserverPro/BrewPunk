import {localLuna} from "../server/local-luna.mjs";
import { createServer } from "node:http";
import { createLuna } from "../server/luna.mjs";
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
  ".ttf": "font/ttf",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".webp": "image/webp",
};

const adjudicate = createLuna(process.env.OPENAI_API_KEY ? {} : {provider:localLuna});
const endpoints = new Set(["/api/adjudicate", "/api/guests"]);

async function api(request, response, path) {
  function json(status, body) {
    response
      .writeHead(status, {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store",
      })
      .end(JSON.stringify(body));
  }
  if (!endpoints.has(path)) return json(404, { error: "unknown_route" });
  if (request.method !== "POST") return json(405, { error: "method" });
  // This project's personal server binds loopback. Browser cross-site requests
  // and rebinding hostnames cannot access a configured API key through it.
  if (
    !/^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/i.test(
      request.headers.host || "",
    )
  )
    return json(403, { error: "host" });
  if (
    request.headers.origin &&
    request.headers.origin !== "http://" + request.headers.host
  )
    return json(403, { error: "origin" });
  if (!request.headers["content-type"]?.startsWith("application/json"))
    return json(415, { error: "content_type" });
  try {
    let length = 0;
    const chunks = [];
    for await (const part of request) {
      length += part.length;
      if (length > 32 * 1024) return json(413, { error: "body_size" });
      chunks.push(part);
    }
    let body;
    try {
      body = JSON.parse(Buffer.concat(chunks).toString("utf8"));
    } catch {
      return json(400, { error: "invalid_json" });
    }
    return json(200, await adjudicate(path.slice(5), body));
  } catch (err) {
    return json(err.status || 502, {
      error:
        err.status === 503
          ? "offline"
          : err.status === 400
            ? "invalid_input"
            : "unavailable",
    });
  }
}

createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(
      new URL(request.url, "http://localhost").pathname,
    );
    if (pathname.startsWith("/api/"))
      return await api(request, response, pathname);
    const target = resolve(
      root,
      "." + (pathname === "/" ? "/index.html" : pathname),
    );
    const type = types[extname(target)];
    if (!type || !target.startsWith(resolve(root) + sep)) throw Error();
    const content = await readFile(target);
    response
      .writeHead(200, {
        "Content-Type": type.startsWith("image/")
          ? type
          : type + "; charset=utf-8",
        "Cache-Control": "no-store",
      })
      .end(content);
  } catch {
    response.writeHead(404).end("Not found");
  }
}).listen(port, "127.0.0.1", () =>
  console.log("BrewPunk: http://127.0.0.1:" + port),
);
