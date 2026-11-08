// Pack the same ES modules into an import map. No third-party bundler is required.
import { readFile, readdir, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const read = (p) => readFile(path.join(root, p), "utf8");
const id = (p) => "brewpunk/" + path.posix.normalize(p);
const imports = {};
const assets = new Map();
for (const directory of ["assets/kitchen", "assets/taproom", "assets/packaging", "assets/workshop", "assets/ingredients"]) {
  for (const name of await readdir(path.join(root, directory))) {
    if (!/\.(png|jpg)$/.test(name)) continue;
    const file = directory + "/" + name;
    const type = name.endsWith(".png") ? "png" : "jpeg";
    assets.set(file, "data:image/" + type + ";base64," + (await readFile(path.join(root, file))).toString("base64"));
  }
}
for (const dir of ["ui", "core", "vendor/brewlab"]) {
  for (const name of await readdir(path.join(root, dir))) {
    if (!name.endsWith(".js")) continue;
    const file = dir + "/" + name;
    const code = (await read(file)).replace(
      /(["'])(assets\/(?:kitchen|taproom|packaging|workshop|ingredients)\/[^"']+\.(?:png|jpg))\1/g,
      (match, quote, asset) => JSON.stringify(assets.get(asset) ?? asset),
    ).replace(
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
let inkCSS = await read("ui/ink.css");
for (const name of await readdir(path.join(root, "assets/ink"))) {
  const mime = name.endsWith(".svg") ? "image/svg+xml" : name.endsWith(".ttf") ? "font/ttf" : null;
  if (mime) inkCSS = inkCSS.replaceAll("../assets/ink/" + name, "data:" + mime + ";base64," + (await readFile(path.join(root,"assets/ink",name))).toString("base64"));
}
const css = await read(styleRef[1]) + "\n" + inkCSS;
const notice = [
  await read("LICENSE"),
  await read("vendor/brewlab/LICENSE"),
  await read("assets/ink/OFL.txt"),
].join("\n\n");
const html = source
  .replace('  <link rel="stylesheet" href="./ui/ink.css">', "")
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
