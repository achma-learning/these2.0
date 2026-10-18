import Link from "next/link";
import { SPECIALITES, speSlug } from "@/lib/specialites";

// Official FMPM specialties (lib/specialites.ts) with their number of theses; a click opens the search on it.
// One thesis = one specialty: the final classification (cover-page jury, library category, title).
const COLOR: Record<string, string> = {
  "Spécialités de médecine": "#2a78d6",
  "Spécialités de chirurgie": "#eb6834",
  "Spécialités de biologie": "#1baf7a",
};
const SHORT: Record<string, string> = {
  "Spécialités de médecine": "Médecine",
  "Spécialités de chirurgie": "Chirurgie",
  "Spécialités de biologie": "Biologie",
};

const SpecialitesSection = ({ counts, unclassified }: { counts: Record<string, number>; unclassified: number }) => (
  <section className="space-y-4">
    <div>
      <h1 className="font-semibold text-2xl text-neutral-800">Spécialités officielles de la FMPM</h1>
      <p className="text-sm text-slate-700">
        Liste officielle des spécialités de la FMPM (2024) : 42 spécialités en 3 options. Une thèse = une spécialité, la
        plus probable d&apos;après le jury de la page de garde, la catégorie de la bibliothèque et le titre
        {unclassified ? ` (${unclassified} thèse${unclassified > 1 ? "s" : ""} non classée${unclassified > 1 ? "s" : ""})` : ""}.{" "}
        <Link href="/stats" className="underline">Voir les graphiques</Link>
      </p>
    </div>
    <div className="grid gap-6 md:grid-cols-3">
      {Object.entries(SPECIALITES).map(([group, list]) => {
        const max = Math.max(1, ...list.map((s) => counts[s] || 0));
        const total = list.reduce((a, s) => a + (counts[s] || 0), 0);
        return (
          <div key={group} className="rounded-lg border bg-white/70 p-4">
            <h2 className="font-semibold mb-2">
              <span style={{ color: COLOR[group] }}>●</span> {SHORT[group]}{" "}
              <span className="font-normal text-sm text-slate-500">{list.length} spécialités · {total} thèses</span>
            </h2>
            <ul className="space-y-1">
              {list.map((s) => {
                const n = counts[s] || 0;
                return (
                  <li key={s}>
                    <Link href={`/search?spe=${speSlug(s)}`}
                      className="group grid grid-cols-[1fr_auto] items-center gap-2 rounded px-1 py-0.5 text-sm hover:bg-blue-600/10">
                      <span className="relative truncate">
                        <span className="absolute inset-y-0 left-0 rounded-sm opacity-20" style={{ width: `${(100 * n) / max}%`, background: COLOR[group] }} />
                        <span className="relative">{s}</span>
                      </span>
                      <span className="tabular-nums text-slate-600">{n}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </div>
  </section>
);

export default SpecialitesSection;
