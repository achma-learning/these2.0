# These2.0 — FMPM theses, always up to date

Search engine + dashboard for the theses of the Faculté de Médecine et de Pharmacie de Marrakech
(FMPM). Data is re-read every day from the official catalogue
<https://wd.fmpm.uca.ma/biblio/theses/Accueil.html>, with jury and specialty details from the
library catalogue (lib.fmpm.uca.ma). Charts are drawn with matplotlib.

| Folder | What it is | Deployed where |
|---|---|---|
| [`github-page/`](./github-page) | Our static site (plain HTML/JS): search + dashboard | GitHub Pages (`.github/workflows/pages.yml`) |
| [`vercel-page/`](./vercel-page) | The original Next.js app by Akram Ammour, upgraded (fresh data, `/dashboard`) — to send back to its author | Vercel (root directory = `vercel-page`) |
| `these2.0-v1-original.zip` | Read-only backup of the original code (commit `29a96f5`). Never edit. | — |

Daily refresh: `.github/workflows/update-data.yml` runs `vercel-page/scripts/update_theses.py` and
`build_charts.py`, then copies the results into `github-page/`.

Run the data pipeline by hand:

```bash
pip install -r vercel-page/scripts/requirements.txt
python vercel-page/scripts/update_theses.py      # refresh vercel-page/json/file.json (~1 min)
python vercel-page/scripts/build_charts.py       # redraw vercel-page/public/stats/
cp vercel-page/json/file.json github-page/data/theses.json && cp vercel-page/public/stats/* github-page/stats/
```

Preview the static site: `python -m http.server` at the repo root, open <http://localhost:8000/github-page/>.

AI assistants: read [`CONTEXT.md`](./CONTEXT.md) first.
