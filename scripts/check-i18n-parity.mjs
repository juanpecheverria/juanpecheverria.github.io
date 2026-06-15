// Wave-0 validation (Pitfall 6): assert es.json and en.json have identical key
// sets so the ES/EN dictionaries never drift. Node built-ins only — no deps.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const i18nDir = join(here, "..", "src", "i18n");

/** Recursively collect dotted key paths from a nested object. */
function keyPaths(obj, prefix = "") {
  const out = [];
  for (const [k, v] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === "object" && !Array.isArray(v)) {
      out.push(...keyPaths(v, path));
    } else {
      out.push(path);
    }
  }
  return out;
}

const es = JSON.parse(readFileSync(join(i18nDir, "es.json"), "utf8"));
const en = JSON.parse(readFileSync(join(i18nDir, "en.json"), "utf8"));

const esKeys = new Set(keyPaths(es));
const enKeys = new Set(keyPaths(en));

const onlyEs = [...esKeys].filter((k) => !enKeys.has(k)).sort();
const onlyEn = [...enKeys].filter((k) => !esKeys.has(k)).sort();

if (onlyEs.length || onlyEn.length) {
  console.error("✗ i18n key parity FAILED — es.json and en.json differ:");
  if (onlyEs.length) console.error(`  only in es.json: ${onlyEs.join(", ")}`);
  if (onlyEn.length) console.error(`  only in en.json: ${onlyEn.join(", ")}`);
  process.exit(1);
}

console.log(`✓ i18n key parity OK — ${esKeys.size} keys match in es.json and en.json`);
