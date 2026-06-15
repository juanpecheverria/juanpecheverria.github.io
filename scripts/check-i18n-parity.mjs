// Wave-0 validation (Pitfall 6): assert es.json and en.json have identical key
// sets so the ES/EN dictionaries never drift. Node built-ins only — no deps.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const i18nDir = join(here, "..", "src", "i18n");

/**
 * Recursively collect dotted key paths describing the SHAPE of a nested object.
 * Array-aware (Pitfall 1): each array emits a synthetic `path#len=N` marker so an
 * ES/EN length mismatch surfaces as an only-in-one-locale path, and every item is
 * descended by index (`path[i]`) so a missing inner field (e.g. `projects[1].repo`)
 * is caught too. Compares key shape only, never values — ES and EN string values
 * are expected to differ.
 */
function keyPaths(obj, prefix = "") {
  const out = [];
  for (const [k, v] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${k}` : k;
    if (Array.isArray(v)) {
      out.push(`${path}#len=${v.length}`);
      v.forEach((item, i) => {
        const itemPath = `${path}[${i}]`;
        if (item && typeof item === "object" && !Array.isArray(item)) {
          out.push(...keyPaths(item, itemPath));
        } else {
          out.push(itemPath);
        }
      });
    } else if (v && typeof v === "object") {
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
