// Wave-0 SEO/download gate (Phase 5: CV-01/CV-02 + SEO-01/SEO-02/SEO-03 + hreflang).
// Assert BOTH built homepages (ES dist/index.html, EN dist/en/index.html) carry the
// per-language head metadata — non-empty <title>, meta description, favicon svg+ico,
// absolute canonical, og:* + twitter:* TEXT card, hreflang es/en/x-default, JSON-LD
// Person — and a same-origin CV download link, and that the two renamed PDFs exist
// non-empty under dist/cv/. Structure/presence ONLY (never localized copy), so the
// gate survives the Phase-6 content swap. The OG image is DEFERRED (D-09 revised):
// og:image / twitter:image MUST be ABSENT. Node built-ins only — no deps. Run AFTER
// `npm run build`. Fails cleanly (exit 1) if a dist file is missing — it never throws.
import { readFileSync, existsSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const distRoot = join(here, "..", "dist");

/**
 * Assert one built page. Returns a list of human-readable problem strings (empty = OK).
 * `cvHref` is the per-language CV PDF path the Hero download anchor must point at.
 * Asserts STRUCTURE/presence only (never localized copy) so the gate survives the
 * Phase-6 content swap. og:image / twitter:image are asserted ABSENT (deferred).
 */
function checkPage(distPath, label, { cvHref }) {
  if (!existsSync(distPath)) {
    return [`${label}: ${distPath} not found — run \`npm run build\` first.`];
  }
  const html = readFileSync(distPath, "utf8");
  const problems = [];
  const miss = (s) => problems.push(`${label}: ${s}`);

  // non-empty <title>
  const titleM = html.match(/<title>([\s\S]*?)<\/title>/);
  if (!titleM || !titleM[1].trim()) miss("missing or empty <title>");

  // meta description present + non-empty
  const descM = html.match(/name="description"[^>]*content="([^"]*)"/);
  if (!descM || !descM[1].trim()) miss('missing or empty <meta name="description">');

  // both favicon links (svg already shipped pre-Phase-5; ico is rounded out in Plan 02)
  if (!html.includes('href="/favicon.svg"')) miss('missing favicon href="/favicon.svg"');
  if (!html.includes('href="/favicon.ico"')) miss('missing favicon href="/favicon.ico"');

  // canonical present + ABSOLUTE (Pitfall 1 — presence alone is insufficient)
  const canM = html.match(/rel="canonical"[^>]*href="([^"]+)"/);
  if (!canM) miss('missing rel="canonical"');
  else if (!/^https:\/\//.test(canM[1])) miss(`canonical not absolute (https): ${canM[1]}`);

  // Open Graph TEXT set present
  for (const p of ["og:title", "og:description", "og:url", "og:type"]) {
    if (!html.includes(`property="${p}"`)) miss(`missing property="${p}"`);
  }
  // og:url ABSOLUTE (Pitfall 1)
  const ogUrlM = html.match(/property="og:url"[^>]*content="([^"]+)"/);
  if (!ogUrlM) miss("missing og:url content");
  else if (!/^https:\/\//.test(ogUrlM[1])) miss(`og:url not absolute (https): ${ogUrlM[1]}`);
  // og:image must be ABSENT (DEFERRED — D-09 revised)
  if (html.includes('property="og:image"')) miss("og:image present but must be DEFERRED (D-09 revised)");

  // Twitter TEXT card: summary (NOT summary_large_image, since there is no image)
  const twCardM = html.match(/name="twitter:card"[^>]*content="([^"]*)"/);
  if (!twCardM) miss('missing name="twitter:card"');
  else if (twCardM[1] !== "summary") miss(`twitter:card must be "summary" (text card), got "${twCardM[1]}"`);
  if (!html.includes('name="twitter:title"')) miss('missing name="twitter:title"');
  // twitter:image must be ABSENT (DEFERRED — D-09 revised)
  if (html.includes('name="twitter:image"')) miss("twitter:image present but must be DEFERRED (D-09 revised)");

  // hreflang alternates
  for (const l of ["es", "en", "x-default"]) {
    if (!html.includes(`hreflang="${l}"`)) miss(`missing hreflang="${l}" alternate`);
  }

  // JSON-LD Person: parse inside try/catch (push a problem rather than throwing)
  const ldM = html.match(/application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/);
  if (!ldM) miss('missing JSON-LD <script type="application/ld+json">');
  else {
    try {
      const obj = JSON.parse(ldM[1]);
      if (obj["@type"] !== "Person") miss(`JSON-LD @type must be "Person", got "${obj["@type"]}"`);
    } catch (e) {
      miss(`JSON-LD did not parse: ${e.message}`);
    }
  }

  // per-language CV download link (Pitfall 5): href + download attr, NO target="_blank"
  const escHref = cvHref.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&");
  const anchorM = html.match(new RegExp(`<a[^>]*href="${escHref}"[^>]*>`, "i"));
  if (!anchorM) miss(`CV download anchor href="${cvHref}" not found`);
  else {
    if (!/\bdownload\b/.test(anchorM[0])) miss(`CV link href="${cvHref}" missing download attribute`);
    if (/target="_blank"/.test(anchorM[0])) {
      miss(`CV link href="${cvHref}" must NOT have target="_blank" (same-origin, Pitfall 5)`);
    }
  }

  return problems;
}

const problems = [
  ...checkPage(join(distRoot, "index.html"), "dist/index.html (ES)", {
    cvHref: "/cv/Juan-Echeverria-CV-ES.pdf",
  }),
  ...checkPage(join(distRoot, "en", "index.html"), "dist/en/index.html (EN)", {
    cvHref: "/cv/Juan-Echeverria-CV-EN.pdf",
  }),
];

// Filesystem assertions (run once): the two renamed PDFs exist non-empty in dist/cv/.
for (const pdf of ["Juan-Echeverria-CV-ES.pdf", "Juan-Echeverria-CV-EN.pdf"]) {
  const p = join(distRoot, "cv", pdf);
  if (!existsSync(p)) problems.push(`dist/cv/${pdf} missing — PDF not copied into dist (CV asset).`);
  else if (statSync(p).size === 0) problems.push(`dist/cv/${pdf} is empty (0 bytes).`);
}

if (problems.length) {
  console.error("✗ check-seo FAILED:");
  for (const p of problems) console.error(`  ${p}`);
  process.exit(1);
}

console.log(
  "✓ check-seo OK — both pages: non-empty title + meta description, favicon svg+ico, absolute canonical, " +
    "og:* + twitter:card=summary text card (no og:image), hreflang es/en/x-default, JSON-LD Person, " +
    "same-origin CV download link; dist/cv/*-ES.pdf + *-EN.pdf non-empty.",
);
