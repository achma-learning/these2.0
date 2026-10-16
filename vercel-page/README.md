# These2.0 (Next.js) — upgraded version

Find FMPM theses easily. This is the original These2.0 app with three additions:

1. **Fresh data, every day.** `scripts/update_theses.py` re-reads the official catalogue
   (<https://wd.fmpm.uca.ma/biblio/theses/annee-htm/YEAR.htm>) and fills jury / specialty /
   keywords from the library OPAC (lib.fmpm.uca.ma), then rewrites `json/file.json` in the same
   format as before. Existing records are kept; it refuses to write if the result shrinks.
   Data went from 3,219 theses (June 2024) to 4,000+ (2006 → current year).
2. **`/dashboard` page** with matplotlib charts (`scripts/build_charts.py` → `public/stats/`):
   theses per year, English share, thematic clusters, specialties, specialty × year heatmap,
   study design, keywords, rapporteurs, most solicited professors, cities cited in titles.
3. **A GitHub Action** (`.github/workflows/update-data.yml`) that runs both scripts daily and
   commits. Vercel redeploys on the push. This replaces `/api/renew-data`, which cannot work on
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

- Since 2024 the library no longer fills the specialty field. When the rapporteur's past theses
  make it clear, the specialty is inferred and flagged `categorySource: "rapporteur"` (hatched on
  the chart, "?" in lists). Theses from the current year often have no jury yet: the library
  catalogues them late.
- PDF links now use `https://wd.fmpm.uca.ma/...`.
