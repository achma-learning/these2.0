"use client";

// Live dashboard: every chart is recomputed in the browser from the theses (passed once by the server page)
// on each search or click, like the FMPM userscript. Filters live in the URL (?search=&year=&spe=…) so a view
// can be shared as a link.
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDebounce } from "use-debounce";
import { Download, Search, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Heatmap, HBars, Legend, Row, Stack, Tip, YearBars } from "@/components/dashboard/charts";
import {
  DESIGNS, fmt, GROUP_COLOR, GROUPS, norm, OTHER_COLOR, PLACES, Rec, SHORT, STOP,
} from "@/lib/dashboard";

type Filters = { year: number | null; groupe: string | null; spe: string | null; rapp: string | null; design: string | null; place: string | null };
const EMPTY: Filters = { year: null, groupe: null, spe: null, rapp: null, design: null, place: null };
const STATUSES = ["confirmée", "probable", "à vérifier"] as const;
const MAX_LIST = 50;

const count = <K,>(rows: Rec[], key: (r: Rec) => K | null) => {
  const m = new Map<K, number>();
  for (const r of rows) { const k = key(r); if (k != null) m.set(k, (m.get(k) || 0) + 1); }
  return m;
};
const ranked = (m: Map<string, number>, n?: number): Row[] =>
  Array.from(m, ([key, value]) => ({ key, value })).sort((a, b) => b.value - a.value).slice(0, n);

// matplotlib image of a chart (scripts/build_charts.py → public/stats/<id>.png), all theses, no filters.
export type Png = { id: string; title: string; label?: string };

const Section = ({ title, note, children, className, png, v }: {
  title: string; note?: string; children: React.ReactNode; className?: string; png?: Png[]; v?: string;
}) => (
  <Card className={`p-4 bg-white/80 min-w-0 flex flex-col ${className || ""}`}>
    <h2 className="font-semibold text-neutral-800">{title}</h2>
    {note ? <p className="text-xs text-slate-500 mb-3">{note}</p> : <div className="mb-3" />}
    <div className="flex-1">{children}</div>
    {png?.length ? (
      <div className="mt-3 flex flex-wrap justify-end gap-2">
        {png.map((p) => (
          <a key={p.id} href={`/stats/${p.id}.png?v=${v}`} download={`${p.id}.png`}
            title={`${p.title} — image PNG (matplotlib) de toutes les thèses, sans les filtres`}
            className="inline-flex items-center gap-1 rounded-md border border-blue-600 px-2 py-0.5 text-xs text-blue-700 hover:bg-blue-50">
            <Download className="h-3 w-3" /> PNG{png.length > 1 ? ` · ${p.label || p.title}` : ""}
          </a>
        ))}
      </div>
    ) : null}
  </Card>
);

const DashboardClient = ({ theses, pngs = {}, version = "" }: { theses: Rec[]; pngs?: Record<string, Png>; version?: string }) => {
  // live chart → its matplotlib image(s), when build_charts.py drew one (stats.json)
  const png = (...ids: string[]) => ({ png: ids.map((id) => pngs[id]).filter(Boolean), v: version });
  const [query, setQuery] = useState("");
  const [debounced] = useDebounce(query, 200);
  const [f, setF] = useState<Filters>(EMPTY);
  const [tip, setTipState] = useState<{ x: number; y: number; text: string } | null>(null);
  const ready = useRef(false);

  // URL → state once, then state → URL (replaceState: no navigation, no server round-trip).
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    setQuery(p.get("search") || "");
    setF({ year: p.get("year") ? Number(p.get("year")) : null, groupe: p.get("groupe"), spe: p.get("spe"),
      rapp: p.get("rapporteur"), design: p.get("type"), place: p.get("lieu") });
    ready.current = true;
  }, []);
  useEffect(() => {
    if (!ready.current) return;
    const p = new URLSearchParams();
    if (debounced.trim()) p.set("search", debounced.trim());
    if (f.year) p.set("year", String(f.year));
    if (f.groupe) p.set("groupe", f.groupe);
    if (f.spe) p.set("spe", f.spe);
    if (f.rapp) p.set("rapporteur", f.rapp);
    if (f.design) p.set("type", f.design);
    if (f.place) p.set("lieu", f.place);
    const qs = p.toString();
    // keep Next's own history state: Next 14.1 patches replaceState and crashes on null
    window.history.replaceState(window.history.state, "", qs ? `?${qs}` : window.location.pathname);
  }, [debounced, f]);

  const toggle = useCallback(<K extends keyof Filters>(k: K, v: Filters[K]) =>
    setF((o) => ({ ...o, [k]: o[k] === v ? null : v })), []);

  const tipProps: Tip = useCallback((text: string) => ({
    onMouseMove: (e: React.MouseEvent) => setTipState({ x: e.clientX, y: e.clientY, text }),
    onMouseLeave: () => setTipState(null),
  }), []);

  // Normalized text once; the regex lists are matched on it.
  const index = useMemo(() => theses.map((r) => ({ r, n: norm(`${r.a} ${r.t} ${r.y} ${r.r}`), nt: ` ${norm(r.t)} ` })), [theses]);
  const NT = useMemo(() => new Map(index.map((x) => [x.r, x.nt])), [index]);
  const designRe = useMemo(() => new Map(DESIGNS), []);
  const placeRe = useMemo(() => new Map(PLACES), []);

  // Query matches feed the charts that offer the filter (so you can still see and change it); the rest use every filter.
  const base = useMemo(() => {
    const terms = norm(debounced).split(" ").filter(Boolean);
    return terms.length ? index.filter((x) => terms.every((t) => x.n.includes(t))).map((x) => x.r) : theses;
  }, [debounced, index, theses]);
  const keep = useCallback((r: Rec, skip?: keyof Filters) =>
    (skip === "year" || !f.year || r.y === f.year)
    && (skip === "groupe" || !f.groupe || r.g === f.groupe)
    && (skip === "spe" || !f.spe || r.s === f.spe)
    && (skip === "rapp" || !f.rapp || r.r === f.rapp)
    && (skip === "design" || !f.design || designRe.get(f.design)!.test(NT.get(r)!))
    && (skip === "place" || !f.place || placeRe.get(f.place)!.test(NT.get(r)!)), [f, NT, designRe, placeRe]);
  const rows = useMemo(() => base.filter((r) => keep(r)), [base, keep]);
  const without = useCallback((k: keyof Filters) => base.filter((r) => keep(r, k)), [base, keep]);

  const years = useMemo(() => {
    const ys = theses.map((r) => r.y);
    const lo = Math.min(...ys), hi = Math.max(...ys);
    return Array.from({ length: hi - lo + 1 }, (_, i) => lo + i);
  }, [theses]);

  const charts = useMemo(() => {
    const byYear = without("year");
    const yearStacks: Stack[] = [
      ...GROUPS.map((g) => ({ label: SHORT[g], color: GROUP_COLOR[g], counts: count(byYear, (r) => (r.g === g ? r.y : null)) })),
      { label: "non classées", color: OTHER_COLOR, counts: count(byYear, (r) => (r.g ? null : r.y)) },
    ];
    const bySpe = without("spe");
    const speRows = (g: string): Row[] => {
      const m = new Map<string, Record<string, number>>();
      for (const r of bySpe) if (r.g === g && r.s) {
        const it = m.get(r.s) || m.set(r.s, {}).get(r.s)!;
        it[r.st || "à vérifier"] = (it[r.st || "à vérifier"] || 0) + 1;
      }
      return Array.from(m, ([key, st]) => ({ key, value: STATUSES.reduce((a, s) => a + (st[s] || 0), 0),
        parts: STATUSES.map((s) => ({ label: s, value: st[s] || 0 })) })).sort((a, b) => b.value - a.value);
    };
    const heatRows = without("year").filter((r) => r.s);
    const speTotal = count(heatRows, (r) => r.s);
    const heat = GROUPS.flatMap((g) => ranked(new Map(Array.from(speTotal).filter(([k]) => heatRows.find((r) => r.s === k)?.g === g)))
      .map((x) => ({ key: x.key, total: x.value })));
    const groupOf = new Map(heatRows.map((r) => [r.s, r.g]));
    const words = new Map<string, number>();
    const qw = new Set(norm(debounced).split(" "));
    for (const r of rows) for (const w of new Set(NT.get(r)!.match(/[a-z][a-z-]{3,}/g) || [])) if (!STOP.has(w) && !qw.has(w)) words.set(w, (words.get(w) || 0) + 1);
    return {
      yearStacks,
      speRows: Object.fromEntries(GROUPS.map((g) => [g, speRows(g)])) as Record<string, Row[]>,
      heat, heatCell: count(heatRows, (r) => `${r.s}|${r.y}`), groupOf,
      rapp: ranked(count(without("rapp").filter((r) => r.r), (r) => r.r), 15),
      design: ranked(new Map(DESIGNS.map(([k, re]) => [k, without("design").filter((r) => re.test(NT.get(r)!)).length] as [string, number]).filter((x) => x[1]))),
      place: ranked(new Map(PLACES.map(([k, re]) => [k, without("place").filter((r) => re.test(NT.get(r)!)).length] as [string, number]).filter((x) => x[1])), 10),
      english: count(rows.filter((r) => r.en), (r) => r.y),
      words: ranked(words, 24),
      status: count(rows, (r) => r.st || null),
    };
  }, [rows, without, debounced, NT]);

  const hits = useMemo(() => rows.slice().sort((a, b) => b.y - a.y), [rows]);
  const active = !!debounced.trim() || Object.values(f).some(Boolean);
  const chips: [keyof Filters, string][] = [
    ["year", f.year ? `Année ${f.year}` : ""], ["groupe", f.groupe ? SHORT[f.groupe] || f.groupe : ""], ["spe", f.spe || ""],
    ["rapp", f.rapp ? `Rapporteur : ${f.rapp}` : ""], ["design", f.design || ""], ["place", f.place || ""],
  ];
  const classified = rows.filter((r) => r.s).length;

  return (
    <div className="space-y-4">
      <Card className="p-4 bg-white/80 space-y-3 sticky top-0 z-10">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} className="pl-9"
            placeholder="Filtrer les graphiques : mots du titre, auteur, rapporteur, année (ex. lupus, fracture 2023)" />
        </div>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="text-2xl font-bold tabular-nums">{fmt(rows.length)}</span>
          <span className="text-slate-700">thèse{rows.length > 1 ? "s" : ""}{active ? " (filtrées)" : " au total"}</span>
          <span className="text-slate-500">· {fmt(classified)} classées</span>
          {STATUSES.map((s) => (charts.status.get(s) ? <span key={s} className="text-slate-500">· {s} {fmt(charts.status.get(s)!)}</span> : null))}
          {chips.filter(([, l]) => l).map(([k, l]) => (
            <button key={k} type="button" onClick={() => setF((o) => ({ ...o, [k]: null }))}
              className="inline-flex items-center gap-1 rounded-full border border-blue-600 px-2 py-0.5 text-xs text-blue-700 hover:bg-blue-50">
              {l} <X className="h-3 w-3" />
            </button>
          ))}
          {active ? <button type="button" className="text-xs underline text-slate-600" onClick={() => { setQuery(""); setF(EMPTY); }}>tout effacer</button> : null}
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Section className="lg:col-span-2" title="Thèses par année, par option" {...png("by-year")}
          note="Une thèse = une spécialité (classement final : barycentre jury de la page de garde, bibliothèque, titre). Clic sur une barre = filtrer l'année.">
          <YearBars years={years} stacks={charts.yearStacks} active={f.year} onPick={(y) => toggle("year", y)} tip={tipProps} />
          <Legend items={charts.yearStacks.map((s) => ({ label: s.label, color: s.color, value: Array.from(s.counts.values()).reduce((a, b) => a + b, 0) }))} />
        </Section>

        <Section className="lg:col-span-2" title="Spécialités officielles, par option" {...png("by-group", "by-specialty")}
          note="Liste officielle des 42 spécialités FMPM. Teinte = statut : foncé confirmée · moyen probable · clair à vérifier. Clic = filtrer la spécialité ; clic sur l'option = filtrer l'option.">
          <div className="grid gap-6 md:grid-cols-3">
            {GROUPS.map((g) => {
              const list = charts.speRows[g];
              return (
                <div key={g} className="min-w-0">
                  <button type="button" onClick={() => toggle("groupe", g)} className={`mb-2 text-sm font-semibold ${f.groupe === g ? "underline" : ""}`}>
                    <span style={{ color: GROUP_COLOR[g] }}>●</span> {SHORT[g]}{" "}
                    <span className="font-normal text-slate-500">{fmt(list.reduce((a, r) => a + r.value, 0))} thèses</span>
                  </button>
                  <HBars rows={list} color={GROUP_COLOR[g]} total={list.reduce((a, r) => a + r.value, 0)} active={f.spe}
                    onPick={(k) => toggle("spe", k)} tip={tipProps} labelWidth="9.5rem" />
                </div>
              );
            })}
          </div>
        </Section>

        <Section className="lg:col-span-2" title="Carte spécialité × année" {...png("specialty-heatmap")}
          note="Plus la case est foncée, plus il y a de thèses. Clic sur une case = spécialité + année ; sur un nom = la spécialité.">
          <Heatmap rows={charts.heat} years={years} cell={charts.heatCell} color={(k) => GROUP_COLOR[charts.groupOf.get(k) || ""] || OTHER_COLOR}
            tip={tipProps} onPick={(spe, y) => setF((o) => (y ? { ...o, spe, year: o.year === y && o.spe === spe ? null : y } : { ...o, spe: o.spe === spe ? null : spe }))} />
        </Section>

        <Section title="Rapporteurs (top 15)" {...png("by-rapporteur")} note="Jury lu dans le catalogue de la bibliothèque (lib.fmpm.uca.ma). Clic = filtrer.">
          <HBars rows={charts.rapp} color="#6250d6" total={rows.length} active={f.rapp} onPick={(k) => toggle("rapp", k)} tip={tipProps} />
        </Section>
        <Section title="Type d’étude" {...png("study-design")} note="D’après le titre — indicatif. Une thèse peut compter dans plusieurs types. Clic = filtrer.">
          <HBars rows={charts.design} color="#6250d6" total={rows.length} active={f.design} onPick={(k) => toggle("design", k)} tip={tipProps} />
        </Section>
        <Section title="Hôpitaux et villes cités" {...png("cities")} note="D’après le titre — indicatif. Clic = filtrer.">
          <HBars rows={charts.place} color="#1baf7a" total={rows.length} active={f.place} onPick={(k) => toggle("place", k)} tip={tipProps} />
        </Section>
        <Section title="Thèses en anglais, par année" {...png("english-share")} note="Langue du catalogue, à défaut devinée sur le titre.">
          <YearBars years={years} stacks={[{ label: "en anglais", color: "#eda100", counts: charts.english }]} tip={tipProps} height={110} />
          <p className="text-xs text-slate-500 mt-1">{fmt(Array.from(charts.english.values()).reduce((a, b) => a + b, 0))} sur {fmt(rows.length)} thèses.</p>
        </Section>
        <Section className="lg:col-span-2" title="Mots les plus fréquents des titres" note="Clic = ajouter à la recherche.">
          <div className="flex flex-wrap gap-1.5">
            {charts.words.map((w) => (
              <button key={w.key} type="button" onClick={() => setQuery((q) => `${q.trim()} ${w.key}`.trim())}
                className="rounded-md border border-blue-600 px-2 py-0.5 text-xs text-blue-700 hover:bg-blue-50">
                {w.key} · {w.value}
              </button>
            ))}
          </div>
        </Section>
      </div>

      {active ? (
        <Section title={`${fmt(hits.length)} thèse${hits.length > 1 ? "s" : ""}${hits.length > MAX_LIST ? ` — ${MAX_LIST} premières` : ""}`}>
          <ul className="divide-y text-sm">
            {hits.slice(0, MAX_LIST).map((r) => (
              <li key={`${r.id}-${r.a}`} className="py-2">
                {r.id ? <Link href={`/these/${r.id}`} className="font-medium text-neutral-800 hover:underline">{r.t}</Link> : <span className="font-medium">{r.t}</span>}
                <p className="text-xs text-slate-600">
                  {r.y} · {r.a}{r.r ? ` · Pr ${r.r}` : ""}{r.s ? ` · ${r.s}${r.st === "confirmée" ? "" : " ?"}` : ""}
                </p>
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      {tip ? (
        <div className="pointer-events-none fixed z-50 rounded-md bg-neutral-900 px-2 py-1 text-xs text-white whitespace-nowrap"
          style={{ left: Math.min(tip.x + 12, (typeof window !== "undefined" ? window.innerWidth : 1200) - 320), top: tip.y + 14 }}>
          {tip.text}
        </div>
      ) : null}
    </div>
  );
};

export default DashboardClient;
