# These2.0 — FMPM theses, always up to date

Search engine + dashboard for the theses of the Faculté de Médecine et de Pharmacie de Marrakech
(FMPM). The official catalogue <https://wd.fmpm.uca.ma/biblio/theses/Accueil.html> is checked
every week; data and matplotlib charts are regenerated only when it changed. Jury details come from
the library catalogue (lib.fmpm.uca.ma); every thesis is classified into the official FMPM specialty
list (`vercel-page/docs/liste-des-specialites-fmpm.pdf`).

## This repo is Vercel-only

The GitHub Pages site and the previous layout were moved: the static site now lives in
[achma-learning/theses-maroc](https://github.com/achma-learning/theses-maroc) (`these2/`), and the
full previous structure of this repo is kept on the [`old`](https://github.com/achma-learning/these2.0/tree/old) branch.

| Site | URL |
|---|---|
| Original project (Akram Ammour) | <https://thesefmpm.vercel.app/> |
| This repo (Next.js, upgraded) | <https://thesefmpm3.vercel.app/search> |

`vercel-page/` is the Next.js app (Vercel root directory = `vercel-page`). `these2.0-v1-original.zip` is a read-only backup of the original code.

Weekly check (Monday 04:17 UTC): `.github/workflows/update-data.yml` runs `vercel-page/scripts/update_theses.py`.
If the data changed it also redraws the charts and commits (Vercel redeploys); otherwise only `status.json` is committed.
Run it by hand from Actions → Update data → Run workflow.

If the faculty server blocks GitHub's runners: export the CSV with the FMPM userscript and commit it as `vercel-page/json/official-export.csv`.

Run the data pipeline by hand:

```bash
pip install -r vercel-page/scripts/requirements.txt
python vercel-page/scripts/update_theses.py      # refresh vercel-page/json/file.json (~1 min)
python vercel-page/scripts/build_charts.py       # redraw vercel-page/public/stats/
```


AI assistants: read [`CONTEXT.md`](./CONTEXT.md) first.
