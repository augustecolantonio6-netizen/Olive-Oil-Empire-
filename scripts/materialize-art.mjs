import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = join(import.meta.dirname, "..", "public", "art");
const b64root = join(root, "b64");
const stems = readdirSync(b64root, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name);

for (const stem of stems) {
  const dir = join(b64root, stem);
  const parts = readdirSync(dir)
    .filter((name) => name.endsWith(".txt"))
    .sort();
  const b64 = parts.map((name) => readFileSync(join(dir, name), "utf8").trim()).join("");
  const png = Buffer.from(b64, "base64");
  writeFileSync(join(root, `${stem}.png`), png);
  console.log(`${stem}.png ${png.length} octets`);
}
