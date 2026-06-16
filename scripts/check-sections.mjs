// Wave-0 validation (LAYOUT-01 / LAYOUT-03 + I18N-01 smoke): assert BOTH built
// homepages (ES dist/index.html, EN dist/en/index.html) contain the four numbered
// section ids, that the ES page carries the hero name/role strings, and that the
// locale switch links to the OTHER locale on each page (ES→/en/, EN→/). Node
// built-ins only — no deps. Run AFTER `npm run build`. Fails cleanly (exit 1) if a
// dist file is missing — it never throws.
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const distRoot = join(here, "..", "dist");

const REQUIRED_IDS = ["bio", "trayectoria", "proyectos", "contacto"];

/** Count non-overlapping occurrences of a literal substring. */
function count(html, needle) {
  const esc = needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return (html.match(new RegExp(esc, "g")) || []).length;
}

/**
 * Assert one built page. Returns a list of human-readable problem strings (empty = OK).
 * `strings` are substrings that must be present (hero name/role — ES only).
 * `toggle` is the locale-switch link that must point at the other locale: the switch
 * anchor renders `<a href={href} ...>{text}</a>`, so we match the href immediately
 * followed (within the same tag) by the switch label text — robust against the many
 * other `/` and `#anchor` hrefs on the page.
 * `content` asserts Plan-02 section CONTENT via stable structural hooks (data-* attrs,
 * element counts, the translated viewRepo frame label) — never localized copy, so the
 * smoke survives the Phase-6 content swap. Counts must match the parity-locked arrays
 * (3 experience entries, 3 projects), and the conditional repo link (PROJ-02) means the
 * repo-link count is ≥1 but strictly less than the project count (one project has repo:"").
 */
function checkPage(distPath, label, { strings = [], toggle, content }) {
  if (!existsSync(distPath)) {
    return [`${label}: ${distPath} not found — run \`npm run build\` first.`];
  }
  const html = readFileSync(distPath, "utf8");
  const problems = [];

  const missingIds = REQUIRED_IDS.filter((id) => !html.includes(`id="${id}"`));
  if (missingIds.length) problems.push(`${label}: missing section ids: ${missingIds.join(", ")}`);

  const missingStrings = strings.filter((s) => !html.includes(s));
  if (missingStrings.length) problems.push(`${label}: missing hero strings: ${missingStrings.join(", ")}`);

  if (toggle) {
    const escHref = toggle.href.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&");
    const switchRe = new RegExp(`href="${escHref}"[^>]*>\\s*${toggle.text}\\s*<`);
    if (!switchRe.test(html)) {
      problems.push(
        `${label}: locale switch link to "${toggle.href}" (label ${toggle.text}) not found`,
      );
    }
  }

  if (content) {
    if (!html.includes("data-bio")) problems.push(`${label}: Bio body (data-bio) missing`);

    if (!html.includes("<ol")) problems.push(`${label}: Trayectoria <ol> timeline missing`);
    const xp = count(html, "data-xp");
    if (xp < content.experience) {
      problems.push(`${label}: timeline entries ${xp} < expected ${content.experience}`);
    }

    const cards = count(html, "<article");
    if (cards < content.projects) {
      problems.push(`${label}: project cards ${cards} < expected ${content.projects}`);
    }
    // PROJ-02 conditional: at least one repo link, but fewer than the project count
    // (one project has repo:"" → no link). viewRepo is the translated frame label.
    const repoLinks = count(html, content.viewRepo);
    if (repoLinks < 1) {
      problems.push(`${label}: no "${content.viewRepo}" repo link rendered (PROJ-02)`);
    } else if (repoLinks >= cards) {
      problems.push(
        `${label}: every project rendered a repo link (${repoLinks}/${cards}) — the repo:"" conditional did not suppress one (PROJ-02)`,
      );
    }

    const skills = count(html, "data-skill");
    if (skills < 1) problems.push(`${label}: Skills strip (data-skill) missing`);

    // Footer "last updated" presence (D-11) — structural marker only, never the localized date string.
    if (!html.includes("data-updated")) problems.push(`${label}: footer (data-updated) missing`);

    for (const c of ["mailto:", "LinkedIn", "GitHub"]) {
      if (!html.includes(c)) problems.push(`${label}: contact link "${c}" missing (CONT-01)`);
    }
  }

  return problems;
}

const problems = [
  ...checkPage(join(distRoot, "index.html"), "dist/index.html (ES)", {
    strings: ["Juan P. Echeverría", "Ingeniero de datos"],
    toggle: { href: "/en/", text: "EN" },
    content: { experience: 3, projects: 3, viewRepo: "Ver repo" },
  }),
  ...checkPage(join(distRoot, "en", "index.html"), "dist/en/index.html (EN)", {
    toggle: { href: "/", text: "ES" },
    content: { experience: 3, projects: 3, viewRepo: "View repo" },
  }),
];

if (problems.length) {
  console.error("✗ check-sections FAILED:");
  for (const p of problems) console.error(`  ${p}`);
  process.exit(1);
}

console.log(
  "✓ check-sections OK — both pages: 4 section ids, bio + 3 timeline entries + 3 project cards (1 repo:\"\" suppressed) + skills strip + contact links; hero on ES; toggle ES→/en/ + EN→/",
);
