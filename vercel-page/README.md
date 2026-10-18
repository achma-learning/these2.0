# These2.0 (Next.js) — upgraded version

Find FMPM theses easily. This is the original These2.0 app with three additions:

1. **Fresh data, checked every day.** `scripts/update_theses.py` re-reads the official catalogue
   (<https://wd.fmpm.uca.ma/biblio/theses/annee-htm/YEAR.htm>) and fills jury / specialty /
   keywords from the library OPAC (lib.fmpm.uca.ma), then rewrites `json/file.json` in the same
   format as before (plus optional fields). Existing records are kept; it refuses to write if the
   result shrinks, and leaves the file untouched when nothing changed (`json/status.json` records
   the check).
   Data went from 3,219 theses (June 2024) to 4,000+ (2006 → current year).
2. **`/stats` page** (was `/dashboard`, redirected) with live charts + matplotlib PNG downloads (`scripts/build_charts.py` → `public/stats/`):
   theses per year, English share, the 3 official specialty groups, the 42 official specialties,
   specialty × year heatmap, study design, keywords, rapporteurs, most solicited professors, cities.
   **Official specialties:** `scripts/specialites.py` classifies every thesis into the FMPM list
   (`docs/liste-des-specialites-fmpm.pdf`): library category first, then the rapporteur's other
   theses, then the title (Naive Bayes, only when ≥ 90 % sure). Fields: `specialite`, `groupe`,
   `specialiteSource`, `specialiteConfiance`. The library's own `category` is left untouched.
3. **A GitHub Action** (`.github/workflows/update-data.yml`) that checks the sources every day
   and redraws the charts only when the data changed. Vercel redeploys on the push. This replaces `/api/renew-data`, which cannot work on
   Vercel because the deployed file system is read-only.

## Run

```bash
npm install
npm run dev                                  # http://localhost:3000

pip install -r scripts/requirements.txt      # Python 3.10+
python scripts/update_theses.py              # refresh json/file.json (~1 min; first run ~5 min)
python scripts/build_charts.py               # redraw public/stats/*.png + stats.json
```

## Notes

- Since 2024 the library no longer fills the specialty field, so recent theses get an inferred
  official specialty (hatched on the charts). Theses from the current year often have no jury
  yet: the library catalogues them late.
- If the faculty server blocks GitHub's robots, export the CSV with the FMPM userscript
  (greasyfork #600588, "Exporter CSV brut") and commit it as `json/official-export.csv`.
- PDF links now use `https://wd.fmpm.uca.ma/...`.
