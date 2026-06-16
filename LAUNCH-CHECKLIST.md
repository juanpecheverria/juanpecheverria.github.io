# Pre-Launch Checklist — Portfolio CV

> Run this top-to-bottom against the **live** site after the latest `main`/`desarrollo` is deployed.
> Measurements are **manual and Juan-driven** (Lighthouse on the live site, not CI — D-12).
> Live URL: **https://juanpecheverria.github.io** (ES `/`, EN `/en/`).

**Scope note (D-08 — INFO-01 is PARTIAL by design):** the project section still carries placeholder
case-study copy with profile-level repo links. **The launch gate does NOT block on real per-project
content.** It blocks only on: truthful bio/trayectoria/contact, every link resolving, the footer
"last updated" date being present, and the Lighthouse thresholds. Real per-project repos are a
deferred follow-up.

---

## 1. Deploy & confirm the latest build is live

- [ ] Push the latest `desarrollo` work (and merge/deploy to the Pages source) and wait for the
      GitHub Action (`withastro/action` → `deploy-pages`) to finish green.
- [ ] Load **https://juanpecheverria.github.io** and confirm the **new real content** is live:
      bio mentions "más de 5 años… fintech, medios y consultoría"; the timeline shows Pulppo /
      Accenture (Mercado Libre) / Prexcard.
- [ ] Confirm the **footer** shows the current month: **"Actualizado: \<mes\> 2026"** on `/` and
      **"Updated: \<month\> 2026"** on `/en/`.

## 2. Lighthouse — a11y ≥ 95 / perf ≥ 90 (manual, D-12)

Run for **both** `/` and `/en/`.

- [ ] Open the page in Chrome → **DevTools (F12)** → **Lighthouse** tab.
- [ ] Categories: check **Performance** + **Accessibility**. Device: **Mobile** (then optionally Desktop).
- [ ] Click **Analyze page load** and record the two scores.
- [ ] **Fallback (no local Chrome):** use **PageSpeed Insights** — https://pagespeed.web.dev/ — with
      the live URL.

**Record:**

| Page | Accessibility (≥95) | Performance (≥90) |
|------|---------------------|-------------------|
| `/` (ES)    |   |   |
| `/en/` (EN) |   |   |

If a score is **below threshold**, do **not** auto-fix — record the number and use the **§6 D-13
diagnostics** table to decide fix-now vs ship-with-noted-debt together.

## 3. The <60-second recruiter test (Core Value lens)

Open the live site **cold** (as a recruiter who's never seen it), start a 60-second timer, once on
`/` and once on `/en/`. Within 60s, confirm all three are unmistakably clear:

- [ ] **WHO** — Data Engineer, 5+ years.
- [ ] **WHAT** — the skills / trayectoria (what he can do).
- [ ] **HOW to contact** — email / LinkedIn / GitHub.

Pass = all three clear in under a minute. If not, note what was unclear (feeds §6).

## 4. Contact & link click-test (D-15) — in a real browser

Click each on the **live** site and confirm the expected result:

- [ ] **Contacto email (mailto)** → opens the OS mail client addressed to **`jp.echeverria@outlook.com.ar`**.
- [ ] **Copy-email button** → copies the address **and** announces success (aria-live / screen reader).
- [ ] **LinkedIn** → **https://www.linkedin.com/in/juan-pablo-echeverria/** loads the real profile.
      ⚠ **Verify in the BROWSER** — `curl` returns **HTTP 999** (LinkedIn anti-bot), which is **NOT**
      a 404; only a real browser load confirms it.
- [ ] **GitHub** → **https://github.com/juanpecheverria** loads.
- [ ] **CV-PDF (ES)** and **CV-PDF (EN)** → both download/open (200, not 404).
- [ ] **Hero quick-access** LinkedIn + GitHub links → both resolve (no `#`).

None should 404. (Per **D-08**, the project cards' repo links pointing at the GitHub profile is
expected and is **not** a failure.)

## 5. Automated post-deploy sweep — `npm run check:deploy`

- [ ] From `portfolio/`, run **`npm run check:deploy`** and confirm it ends with
      **"✓ check:deploy OK"**.

It checks the live **shell** reachability: http→https 301, `GET /` → 200, `GET /en/` → 200, ≥1
`/_astro/` asset → 200, favicon → 200, and a themed 404 page. This **complements** (does not replace)
the §4 click-test: `check:deploy` covers the site shell; the click-test covers the outbound contact
destinations `check:deploy` does not hit.

---

## 6. If a gate misses — diagnostics & decide (D-13)

Report the gap and decide **fix-now vs ship-with-noted-debt** together — **not** blind
auto-fix-until-pass.

| Gate | Most probable cause | Static-site-safe fix | Then |
|------|---------------------|----------------------|------|
| **Perf < 90** | Unoptimized / oversized images | Compress + resize; serve appropriately-sized assets | Report → decide |
| **Perf < 90** | Fonts not `woff2` / not preloaded | Self-host `woff2`; `preload` the body font (Inter already preloaded) | Report → decide |
| **Perf < 90** | Render-blocking CSS | Inline critical CSS / ensure CSS is minimal (Tailwind v4 already purges) | Report → decide |
| **A11y < 95** | Insufficient text/background contrast | Bump contrast on the dark/technical tokens (`--fg-subtle`, accent) | Report → decide |
| **A11y < 95** | Missing labels on icon/links | Add `aria-label` or visible text to any unlabeled link | Report → decide |
| **A11y < 95** | Landmark / heading order | Ensure one `<h1>` (hero) + ordered `<h2>` sections; correct landmarks | Report → decide |

---

## Sign-off

- [ ] §1 deploy confirmed (real content + footer date live)
- [ ] §2 Lighthouse a11y ≥95 / perf ≥90 recorded for `/` and `/en/`
- [ ] §3 <60s recruiter test passed (ES + EN)
- [ ] §4 all contact/links resolve (LinkedIn browser-verified), mailto + copy work
- [ ] §5 `check:deploy` green
- [ ] Any sub-threshold gate handled via §6 (report-and-decide)

When all boxes are checked (or sub-threshold items consciously accepted), the site has passed the
Phase 6 launch gates. INFO-01 closes to its intended **PARTIAL** state (real bio/trayectoria/contact;
project case studies deferred per D-08).
