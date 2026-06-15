// Live-deploy sweep (D-05). Node built-ins only — no deps; uses global fetch
// (Node 22+, required by package.json engines). ESM. Prints a per-check ✓/✗ line
// and exits non-zero if ANY check fails. Run AFTER the GitHub Action redeploys:
//   cd portfolio && npm run check:deploy
//
// Checks against the live site:
//   1. http→https 301 redirect (transport, T-03-03 / DEPLOY-01)
//   2. GET /        → 200
//   3. GET /en/     → 200
//   4. ≥1 /_astro/ asset → 200 (Jekyll-trap guard, Pitfall 2; URL derived from
//      the live HTML so it survives content-hash filename changes)
//   5. GET /favicon.svg → 200 (tolerates /favicon.ico fallback)
//   6. GET a bogus path → body contains "Volver al inicio" AND "404"
//      (themed dist/404.html served, NOT GitHub's default 404; Pitfall 11)

const BASE = "https://juanpecheverria.github.io";
const HTTP_BASE = "http://juanpecheverria.github.io";

let failed = false;
const pass = (m) => console.log(`✓ ${m}`);
const fail = (m) => {
  console.error(`✗ ${m}`);
  failed = true;
};

// 1. http → https 301 redirect
try {
  const res = await fetch(`${HTTP_BASE}/`, { redirect: "manual" });
  const loc = res.headers.get("location") || "";
  if (res.status === 301 && loc.startsWith("https://")) {
    pass(`http→https 301 redirect (Location: ${loc})`);
  } else {
    fail(`http→https redirect: expected 301 + https Location, got status ${res.status}, Location "${loc}"`);
  }
} catch (err) {
  fail(`http→https redirect: fetch threw — ${err.message}`);
}

// 2. GET / → 200
try {
  const res = await fetch(`${BASE}/`);
  res.status === 200 ? pass("GET / → 200") : fail(`GET / → expected 200, got ${res.status}`);
} catch (err) {
  fail(`GET / : fetch threw — ${err.message}`);
}

// 3. GET /en/ → 200
try {
  const res = await fetch(`${BASE}/en/`);
  res.status === 200 ? pass("GET /en/ → 200") : fail(`GET /en/ → expected 200, got ${res.status}`);
} catch (err) {
  fail(`GET /en/ : fetch threw — ${err.message}`);
}

// 4. ≥1 /_astro/ asset → 200 (derive URL from the live home HTML)
try {
  const res = await fetch(`${BASE}/`);
  const html = await res.text();
  // Match an href= or src= pointing under /_astro/ (CSS or font), absolute or relative.
  const m = html.match(/(?:href|src)=["']([^"']*\/_astro\/[^"']+)["']/);
  if (!m) {
    fail("/_astro/ asset: no /_astro/ href/src found in the home HTML");
  } else {
    let assetUrl = m[1];
    if (assetUrl.startsWith("//")) assetUrl = `https:${assetUrl}`;
    else if (assetUrl.startsWith("/")) assetUrl = `${BASE}${assetUrl}`;
    else if (!assetUrl.startsWith("http")) assetUrl = `${BASE}/${assetUrl}`;
    const a = await fetch(assetUrl);
    a.status === 200
      ? pass(`/_astro/ asset → 200 (${assetUrl})`)
      : fail(`/_astro/ asset → expected 200, got ${a.status} (${assetUrl})`);
  }
} catch (err) {
  fail(`/_astro/ asset: fetch threw — ${err.message}`);
}

// 5. GET /favicon.svg → 200 (tolerate /favicon.ico fallback)
try {
  const svg = await fetch(`${BASE}/favicon.svg`);
  if (svg.status === 200) {
    pass("GET /favicon.svg → 200");
  } else {
    const ico = await fetch(`${BASE}/favicon.ico`);
    ico.status === 200
      ? pass("GET /favicon.ico → 200 (svg unavailable, ico fallback OK)")
      : fail(`favicon → /favicon.svg got ${svg.status}, /favicon.ico got ${ico.status}`);
  }
} catch (err) {
  fail(`favicon: fetch threw — ${err.message}`);
}

// 6. Bogus path → themed 404 body (marker substrings)
try {
  const res = await fetch(`${BASE}/__does-not-exist__`);
  const body = await res.text();
  const hasHome = body.includes("Volver al inicio");
  const has404 = body.includes("404");
  if (hasHome && has404) {
    pass('bogus path serves themed 404 (body contains "Volver al inicio" + "404")');
  } else {
    fail(
      `bogus path: themed-404 marker missing (Volver al inicio: ${hasHome}, 404: ${has404}) — GitHub default 404 may be served`
    );
  }
} catch (err) {
  fail(`bogus path: fetch threw — ${err.message}`);
}

if (failed) {
  console.error("✗ check:deploy FAILED — one or more live checks did not pass.");
  process.exit(1);
}
console.log("✓ check:deploy OK — live deploy healthy (HTTPS, /, /en/, _astro, favicon, themed 404).");
