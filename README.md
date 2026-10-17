# These2.0 — FMPM theses, always up to date

Search engine + dashboard for the theses of the Faculté de Médecine et de Pharmacie de Marrakech
(FMPM). The official catalogue <https://wd.fmpm.uca.ma/biblio/theses/Accueil.html> is checked
every week; data and matplotlib charts are regenerated only when it changed. Jury details come from
the library catalogue (lib.fmpm.uca.ma); every thesis is classified into the official FMPM specialty
list (`vercel-page/docs/liste-des-specialites-fmpm.pdf`).

## Live sites

| Site | URL |
|---|---|
| Original project (Akram Ammour) | <https://thesefmpm.vercel.app/> |
| My fork (Next.js, upgraded) | <https://thesefmpm3.vercel.app/> |
| GitHub Pages (static) | <https://achma-learning.github.io/these2.0/github-page/> |

| Folder | What it is | Deployed where |
|---|---|---|
| [`github-page/`](./github-page) | Our static site (plain HTML/JS): search + dashboard | GitHub Pages (`.github/workflows/pages.yml`) |
| [`vercel-page/`](./vercel-page) | The original Next.js app by Akram Ammour, upgraded (fresh data, `/dashboard`) — to send back to its author | Vercel (root directory = `vercel-page`) |
| `these2.0-v1-original.zip` | Read-only backup of the original code (commit `29a96f5`). Never edit. | — |

Weekly check (Monday 04:17 UTC): `.github/workflows/update-data.yml` runs
`vercel-page/scripts/update_theses.py`. If the rebuilt data differs from the committed file, it also
runs `build_charts.py` and copies everything into `github-page/`; otherwise only `status.json`
("vérifié le …") is committed. Run it by hand from Actions → Update data → Run workflow.

If the faculty server blocks GitHub's robots: install the FMPM userscript (greasyfork #600588), click
"Exporter CSV brut" on the official site, and commit the file as `vercel-page/json/official-export.csv`.
The next run uses it for every year the site doesn't answer.

Run the data pipeline by hand:

```bash
pip install -r vercel-page/scripts/requirements.txt
python vercel-page/scripts/update_theses.py      # refresh vercel-page/json/file.json (~1 min)
python vercel-page/scripts/build_charts.py       # redraw vercel-page/public/stats/
cp vercel-page/json/file.json github-page/data/theses.json && cp vercel-page/public/stats/* github-page/stats/
```

Preview the static site: `python -m http.server` at the repo root, open <http://localhost:8000/github-page/>.

AI assistants: read [`CONTEXT.md`](./CONTEXT.md) first.
