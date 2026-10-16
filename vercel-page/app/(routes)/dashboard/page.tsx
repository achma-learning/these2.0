import { Metadata } from "next";
import fsPromises from "fs/promises";
import path from "path";

// Charts are PNGs drawn by scripts/build_charts.py (matplotlib) into public/stats/.
// stats.json lists every chart with its numbers, so a new chart there shows up here by itself.
type Chart = {
  id: string;
  section: string;
  title: string;
  alt: string;
  table: { head: string[]; rows: (string | number)[][] };
};
type Stats = {
  total: number;
  lastFetched: string;
  kpis: [number, string][];
  charts: Chart[];
};

export const metadata: Metadata = {
  title: "These2.0 | Dashboard",
  description: "Tableau de bord des thèses FMPM : années, clusters, spécialités, rapporteurs, types d'étude, villes",
};

const getStats = async (): Promise<Stats | null> => {
  try {
    const file = path.join(process.cwd(), "public/stats/stats.json");
    return JSON.parse(await fsPromises.readFile(file, "utf-8")) as Stats;
  } catch (error) {
    console.error("[dashboard] could not read public/stats/stats.json", error);
    return null;
  }
};

const slug = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-");

const ChartBlock = ({ chart }: { chart: Chart }) => (
  <section>
    <a href={`/stats/${chart.id}.png`} target="_blank" rel="noopener noreferrer" title="Ouvrir en grand">
      <picture>
        <source srcSet={`/stats/${chart.id}-dark.png`} media="(prefers-color-scheme: dark)" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`/stats/${chart.id}.png`} alt={chart.alt} className="w-full h-auto rounded-md border bg-white" loading="lazy" />
      </picture>
    </a>
    <details className="mt-2 text-sm">
      <summary className="cursor-pointer text-slate-700">Voir les chiffres</summary>
      <div className="max-h-80 overflow-auto mt-2">
        <table className="w-full text-left">
          <thead>
            <tr>
              {chart.table.head.map((h) => (
                <th key={h} className="py-1 pr-4 font-semibold">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {chart.table.rows.map((r, i) => (
              <tr key={i} className="border-t">
                {r.map((c, j) => (
                  <td key={j} className="py-1 pr-4">{c}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  </section>
);

const Page = async () => {
  const stats = await getStats();
  if (!stats) {
    return <p className="p-12 text-lg">Dashboard not generated yet — run <code>python scripts/build_charts.py</code>.</p>;
  }
  const sections = Array.from(new Set(stats.charts.map((c) => c.section)));
  return (
    <div className="max-w-5xl m-auto px-4 sm:px-8 py-10 space-y-8">
      <div>
        <h1 className="font-semibold text-3xl text-neutral-800">Tableau de bord des thèses FMPM</h1>
        <p className="text-slate-700 mt-1">
          {stats.total} thèses · mis à jour {stats.lastFetched} · sources : wd.fmpm.uca.ma (liste officielle) et
          lib.fmpm.uca.ma (jury, spécialité)
        </p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {stats.kpis.map(([v, l]) => (
          <div key={l} className="rounded-md border bg-white/70 p-3">
            <p className="text-2xl font-bold">{v}</p>
            <p className="text-xs text-slate-600">{l}</p>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        {sections.map((s) => (
          <a key={s} href={`#${slug(s)}`} className="text-sm rounded-full border bg-white/70 px-3 py-1 text-blue-700">
            {s}
          </a>
        ))}
      </div>
      {sections.map((s) => (
        <div key={s} className="space-y-8">
          <h2 id={slug(s)} className="font-semibold text-2xl text-neutral-800">{s}</h2>
          {stats.charts
            .filter((c) => c.section === s)
            .map((c) => (
              <ChartBlock key={c.id} chart={c} />
            ))}
        </div>
      ))}
      <p className="text-sm text-slate-700">
        Jurys, mots-clés et spécialités viennent du catalogue de la bibliothèque, qui n&apos;a pas encore catalogué la
        plupart des thèses récentes. Depuis 2024 la spécialité est déduite des thèses précédentes du rapporteur
        (hachures). Type d&apos;étude et villes sont lus dans le titre : ce sont des estimations.
      </p>
      <footer className="border-t pt-4 text-sm text-slate-600 text-center">
        Graphiques générés avec matplotlib ·{" "}
        <a className="underline" href="https://wd.fmpm.uca.ma/biblio/theses/Accueil.html">thèses FMPM (site officiel)</a> ·{" "}
        <a className="underline" href="https://cdim.fmp-usmba.ac.ma/stats/dashboard_theses.php">
          thèses FMPDF Fès (site officiel)
        </a>
      </footer>
    </div>
  );
};

export default Page;
