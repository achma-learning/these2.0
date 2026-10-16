# These2.0 (FMPM theses) — AI Context File
_Last synced: 2026-10-16 @ 29a96f5 + branch `claude/wonderful-wozniak-at61ir` (restructure, dashboard, daily refresh)_

## 1. What This Is (Plain English)
- **In one sentence:** a search engine and a stats dashboard for the ~4,000 medical theses defended at the Marrakech faculty of medicine (FMPM), refreshed every day from the faculty's own website.
- **Why it exists:** the official catalogue (wd.fmpm.uca.ma) is one plain HTML page per year with no search. These2.0 (by Akram Ammour) fixed that but its data froze in June 2024. This repo makes it current again and adds charts like the Fès faculty dashboard.
- **Who uses it:** public (med students, residents, faculty). Be careful with data accuracy; never invent thesis metadata.
- **Vibe:** polished personal tool, two deliverables in one repo.

## 2. How To Run It
Two sub-projects, deliberately separate:
- **`github-page/`** = OUR site, plain HTML/JS, deployed on GitHub Pages. No build. Preview: `python -m http.server` at repo root → `http://localhost:8000/github-page/`.
- **`vercel-page/`** = the original Next.js app, upgraded, **to send back to its author** so he updates his site. `cd vercel-page && npm install && npm run dev` → `http://localhost:3000`.
- **Refresh the data (both):** `pip install -r vercel-page/scripts/requirements.txt`, then `python vercel-page/scripts/update_theses.py` (about 1 min; first run ~5 min) and `python vercel-page/scripts/build_charts.py`, then copy into github-page (exact commands in `README.md`).
- **Deploy:** automatic. `.github/workflows/update-data.yml` (daily 04:17 UTC) refreshes and commits; `.github/workflows/pages.yml` publishes `github-page/` (Pages source must be "GitHub Actions"). Vercel: project Root Directory = `vercel-page`, redeploys on push.
- **Required env vars:** none.

## 3. Tech Stack
- **Pipeline:** Python 3.12 (CI), `requests`, `beautifulsoup4`, `matplotlib` (`vercel-page/scripts/requirements.txt`).
- **github-page:** vanilla HTML/CSS/JS, zero dependencies, zero build.
- **vercel-page:** Next.js 14.1.0 App Router, React 18, TypeScript 5, Tailwind 3, shadcn/ui (Radix), react-pdf 7, cheerio, iconv-lite (`vercel-page/package.json`). Node 22 works locally.
- **External sources (read-only, public):**
  - `https://wd.fmpm.uca.ma/biblio/theses/annee-htm/<YEAR>.htm`: official list (year, n°, author, title, PDF). Source of truth for *which* theses exist. PDFs at `.../FT/<YEAR>/theseNN-YY.pdf`.
  - `https://lib.fmpm.uca.ma/lib/opac_css/`: PMB library OPAC, used for president / rapporteur / jury / specialty / keywords.
- **Inspiration (Fès faculty, FMPDF):** `cdim.fmp-usmba.ac.ma/stats/dashboard_theses.php` and `.../cartographie_2025/cartographie-theses.html` (Chart.js). Linked in the dashboard footers.
- **Related userscript:** greasyfork #600588 "FMPM thèses — recherche en ligne + export CSV" (namespace github.com/achma-learning/these). It parses the same official year pages in the browser.

## 4. Code Map
- `vercel-page/scripts/update_theses.py`: **the data pipeline, start here.** Seed = existing JSON → official year pages → OPAC enrichment (only for new/incomplete years) → specialty inference → writes `{lastFetched, data: These[]}`. Used by BOTH sub-projects.
- `vercel-page/scripts/build_charts.py`: matplotlib dashboard. Writes `<id>.png` + `<id>-dark.png` + `stats.json` (chart list with tables, KPIs, specialty→cluster map). The `CLUSTERS`, `DESIGNS` and `CITIES` constants live here.
- `github-page/index.html` + `assets/app.js`: search (client-side over `data/theses.json`, URL-synced filters).
- `github-page/dashboard.html` + `assets/dashboard.js`: renders charts generically from `stats/stats.json`, plus the "Filtrage dynamique" table and CSV export.
- `vercel-page/app/(routes)/dashboard/page.tsx`: same dashboard in Next (reads `public/stats/stats.json` at build).
- `vercel-page/actions/load-data.ts` reads `json/file.json`; `data/search.ts` and `data/sort.ts` handle search and sort; `types.d.ts` holds the `These` type.
- `vercel-page/lib/renew-lib.ts` + `actions/renew-data.ts` + `app/api/renew-data`: the ORIGINAL scraper (TS). Superseded by the Python pipeline; kept for the author.
- `these2.0-v1-original.zip`: read-only backup of the original code (git archive of `29a96f5`).

## 5. Rules For Editing This Code
- `CONTEXT.md` is the single context file. Update §7 after every change.
- **Never edit or delete `these2.0-v1-original.zip`.**
- Keep `github-page/` and `vercel-page/` independent: `vercel-page/` must work alone once copied to the author's repo. The shared Python scripts live in `vercel-page/scripts/`; github-page only receives copied output.
- The JSON format (`These` in `vercel-page/types.d.ts`) is a contract with the Next app. New fields must be optional (e.g. `categorySource`).
- Be polite to the faculty servers: `PAUSE_S = 1.0`, OPAC pages of 100, retries with backoff. No parallel requests. The user once stopped a 500-records-per-page OPAC query.
- Charts: one series = one hue (`#2a78d6` light / `#3987e5` dark), always light + dark PNGs, text in text colors, "Non classée" in gray and last.
- github-page stays zero-dependency, with no external scripts.
- Inferred data must be flagged and labeled (`categorySource: "rapporteur"`, hatched bars, "?" chips).

## 6. Fragile Bits & Landmines
- **Encodings:** official pages are windows-1252 up to 2025 and UTF-8 from 2026; decode UTF-8 first, then fall back. The OPAC says ISO-8859-1 but sends cp1252 bytes: `fix_c1()` maps `\x92 \x96 \x9c`… (symptom: `Pain  Children` in keywords).
- **OPAC collapsed notices:** each result page lists 100 notices but renders only ~5. The rest need `ajax.php?module=expand_notice` with the `img[param]` values joined by `|*|*|`, max 40 per call (`expand_opac`).
- **OPAC key:** records are matched by the PDF name `theseNN-YY` in the "Texte integrale" field. Records without it are skipped on purpose (no guessing).
- **Library lag:** the OPAC has had no specialty since 2024 and almost no 2025–2026 records. Rapporteur and specialty charts are therefore mostly ≤ 2024. That reflects the source, not a bug.
- **Safety nets:** the pipeline exits without writing if no official year page is reachable, or if the record count drops below 90 %.
- **Vercel:** the file system is read-only, so `/api/renew-data` can't persist there. Use the Action instead.
- **`/dashboard` in Next is static** (prerendered at build). New charts appear only after a redeploy (automatic on push).
- **`pages.yml` uses `workflow_run`** because pushes made with `GITHUB_TOKEN` don't trigger other workflows. Don't "simplify" it to `push` only.
- **Skip on cleanup:** `vercel-page/json/file copy.json` (author's old snapshot, unused). `vercel-page/.github/workflows/` is inert here on purpose: it's for the author's repo.

## 7. Current State
- **Last shipped (2026-10-16):** moved the app to `vercel-page/`, created `github-page/` (search + dashboard), added the Python pipeline (3,219 → 4,014 theses, 2006–2026), 10 matplotlib charts (year, English share, clusters, specialties, heatmap, study design, keywords, rapporteurs, professors, cities), daily Action plus Pages deploy, root redirect `index.html`, backup zip.
- **Working on now:** first deploy. Enable Pages (Settings → Pages → Source: GitHub Actions) and run "Update data" once by hand.
- **Next up:**
  1. Send `vercel-page/` to Akram Ammour (original author).
  2. Later, not now: also search FMPDF Fès theses (`https://cdim.fmp-usmba.ac.ma/e_theses/`, stats at `.../stats/`).
  3. Maybe: read rapporteur and specialty from the PDF cover pages for 2025+ theses the library hasn't catalogued.

## 8. Update Protocol (Verbatim)
> **For the AI Assistant:** When asked to "Update CONTEXT.md":
> 1. Re-run Phase 0 — check for new or changed `CLAUDE.md` / `AGENTS.md` / `GEMINI.md` / `.github/` files, merge what's new, and re-run Phase 3 so each of them still points to `CONTEXT.md`.
> 2. Re-scan the tree, manifests, and `.github/workflows/` for drift.
> 3. Read our recent conversation for new decisions, fragile bits discovered, or shifted goals.
> 4. Refresh the `_Last synced_` line with today's date and current commit SHA.
> 5. Rewrite — do not append. One clean source of truth. Preserve still-true content, revise the rest.
> 6. Keep §1 and §2 in plain English. Keep the file under ~200 lines.
