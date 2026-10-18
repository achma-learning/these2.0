import { Metadata } from "next";
import fsPromises from "fs/promises";
import path from "path";
import { getLocalData } from "@/actions/load-data";
import DashboardClient from "@/components/dashboard/dashboard-client";
import { looksEnglish, Rec, statusOf } from "@/lib/dashboard";

// /stats (was /dashboard, redirected in next.config.mjs).
// Live charts: the theses are read here once (static page, rebuilt on each deploy) and every chart is
// recomputed in the browser by DashboardClient on each search or click. The matplotlib PNGs drawn by
// scripts/build_charts.py into public/stats/ are a « ⬇ PNG » button under their live chart (stats.json).
type Chart = { id: string; section: string; title: string };
// Button text when a live chart has two images
const PNG_LABEL: Record<string, string> = { "by-group": "options", "by-specialty": "spécialités" };
// Images with no live twin: listed at the bottom
const SHOWN = new Set(["by-year", "by-group", "by-specialty", "specialty-heatmap", "by-rapporteur", "study-design", "cities", "english-share"]);
type Stats = { version: string; charts: Chart[] };

export const metadata: Metadata = {
  title: "These2.0 | Stats",
  description: "Tableau de bord dynamique des thèses FMPM : années, spécialités officielles, rapporteurs, types d'étude, villes",
};

const getStats = async (): Promise<Stats | null> => {
  try {
    const file = path.join(process.cwd(), "public/stats/stats.json");
    return JSON.parse(await fsPromises.readFile(file, "utf-8")) as Stats;
  } catch {
    return null;
  }
};

// json/status.json: rewritten by the daily check (scripts/update_theses.py), committed when the data changed and on Mondays
const getCheckedAt = async (): Promise<string | null> => {
  try {
    const file = path.join(process.cwd(), "json/status.json");
    const { checkedAt } = JSON.parse(await fsPromises.readFile(file, "utf-8"));
    return new Date(checkedAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
  } catch {
    return null;
  }
};

// Only what the charts need: about a quarter of json/file.json.
const toRec = (t: These): Rec => ({
  id: (t.href.match(/(these\d+-\d+)\.pdf/i) || [])[1] || "",
  y: t.year,
  t: t.title,
  a: t.author,
  s: t.specialite && t.specialite !== "Non classée" ? t.specialite : "",
  g: t.groupe && t.groupe !== "Non classée" ? t.groupe : "",
  st: statusOf(t.specialiteSource),
  r: (t.rapporteur || "").trim(),
  en: t.langue ? /^anglais/i.test(t.langue) : looksEnglish(t.title),
});

const Page = async () => {
  const [{ lastFetched, data }, stats, checkedAt] = await Promise.all([getLocalData(), getStats(), getCheckedAt()]);
  return (
    <div className="max-w-6xl m-auto px-4 sm:px-8 py-10 space-y-6">
      <div>
        <h1 className="font-semibold text-3xl text-neutral-800">Tableau de bord des thèses FMPM</h1>
        <p className="text-slate-700 mt-1">
          {data.length} thèses · données du {String(lastFetched)}
          {checkedAt ? ` · site officiel contrôlé chaque jour (dernier relevé enregistré : ${checkedAt})` : ""} · sources : wd.fmpm.uca.ma (liste
          officielle) et lib.fmpm.uca.ma (jury). Tous les graphiques suivent la recherche et les clics.
        </p>
      </div>
      <DashboardClient theses={data.map(toRec)} version={stats?.version || ""}
        pngs={Object.fromEntries((stats?.charts || []).map((c) => [c.id, { id: c.id, title: c.title, label: PNG_LABEL[c.id] }]))} />
      <p className="text-sm text-slate-700">
        Spécialités et options suivent la liste officielle des spécialités de la FMPM (docs/liste-des-specialites-fmpm.pdf).
        Une thèse = une spécialité : la plus probable, d&apos;après le jury lu sur la page de garde (rapporteur surtout),
        la catégorie de la bibliothèque et le titre ; « ? » = pas confirmée. Type d&apos;étude, villes et langue devinée
        sont lus dans le titre : ce sont des estimations.
      </p>
      {stats?.charts.some((c) => !SHOWN.has(c.id)) ? (
        <details className="text-sm">
          <summary className="cursor-pointer text-slate-700">Autres graphiques en image (PNG, matplotlib)</summary>
          <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
            {stats.charts.filter((c) => !SHOWN.has(c.id)).map((c) => (
              <li key={c.id}>
                <a className="underline text-blue-700" href={`/stats/${c.id}.png?v=${stats.version}`} target="_blank" rel="noopener noreferrer">
                  {c.title}
                </a>
              </li>
            ))}
          </ul>
        </details>
      ) : null}
      <footer className="border-t pt-4 text-sm text-slate-600 text-center">
        <a className="underline" href="https://wd.fmpm.uca.ma/biblio/theses/Accueil.html">thèses FMPM (site officiel)</a> ·{" "}
        <a className="underline" href="https://cdim.fmp-usmba.ac.ma/stats/dashboard_theses.php">
          thèses FMPDF Fès (site officiel)
        </a>
      </footer>
    </div>
  );
};

export default Page;
