// Pack the same ES modules into an import map. No third-party bundler is required.
import { readFile, readdir, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const read = (p) => readFile(path.join(root, p), "utf8");
const id = (p) => "brewpunk/" + path.posix.normalize(p);
const imports = {};
for (const dir of ["ui", "core", "vendor/brewlab"]) {
  for (const name of await readdir(path.join(root, dir))) {
    if (!name.endsWith(".js")) continue;
    const file = dir + "/" + name;
    const code = (await read(file)).replace(
      /(\bfrom\s*|\bimport\s*)(['"])(\.\.?\/[^'"]+)\2/g,
      (_, prefix, quote, spec) =>
        prefix + quote + id(path.posix.join(dir, spec)) + quote,
    );
    imports[id(file)] =
      "data:text/javascript;base64," + Buffer.from(code).toString("base64");
  }
}
const source = await read("index.html");
const styleRef = source.match(
  /<link\b[^>]*rel=["']stylesheet["'][^>]*href=["']([^"']+)["'][^>]*>/i,
);
const entry = source.match(
  /<script\b[^>]*type=["']module["'][^>]*src=["']([^"']+)["'][^>]*>\s*<\/script>/i,
);
if (!styleRef || !entry)
  throw Error("Expected a local stylesheet and a module entry in index.html");
const css = await read(styleRef[1]);
const notice = [
  await read("LICENSE"),
  await read("vendor/brewlab/LICENSE"),
].join("\n\n");
const html = source
  .replace(styleRef[0], () => "<style>" + css + "</style>")
  .replace(
    entry[0],
    () =>
      '<script type="importmap">' +
      JSON.stringify({ imports }) +
      '</script>\n<script type="module">import ' +
      JSON.stringify(id(entry[1])) +
      ";</script>",
  )
  .replace(
    "</html>",
    () => "<!-- Bundled MIT notices\n" + notice + "\n-->\n</html>",
  );
await mkdir(path.join(root, "dist"), { recursive: true });
await writeFile(path.join(root, "dist", "BrewPunk.html"), html);
console.log("dist/BrewPunk.html");
