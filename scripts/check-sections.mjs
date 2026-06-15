// Wave-0 validation (LAYOUT-01 / LAYOUT-03 smoke): assert the built ES homepage
// contains the four numbered section ids and the hero name/role strings. Node
// built-ins only — no deps. Run AFTER `npm run build` (reads dist/index.html).
// Until Plan 03 composes the pages this fails cleanly (exit 1) — it never throws.
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const distIndex = join(here, "..", "dist", "index.html");

if (!existsSync(distIndex)) {
  console.error(`✗ check-sections: ${distIndex} not found — run \`npm run build\` first.`);
  process.exit(1);
}

const html = readFileSync(distIndex, "utf8");

const requiredIds = ["bio", "trayectoria", "proyectos", "contacto"];
const requiredStrings = ["Juan P. Echeverría", "Ingeniero de datos"];

const missingIds = requiredIds.filter((id) => !html.includes(`id="${id}"`));
const missingStrings = requiredStrings.filter((s) => !html.includes(s));

if (missingIds.length || missingStrings.length) {
  console.error("✗ check-sections FAILED on dist/index.html:");
  if (missingIds.length) console.error(`  missing section ids: ${missingIds.join(", ")}`);
  if (missingStrings.length) console.error(`  missing hero strings: ${missingStrings.join(", ")}`);
  process.exit(1);
}

console.log("✓ check-sections OK — 4 section ids + hero name/role present in dist/index.html");
