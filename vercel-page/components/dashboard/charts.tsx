"use client";

// Chart primitives for the live dashboard: plain HTML / SVG + Tailwind, no chart library.
// Every mark takes a `tip` text (shown by the parent's tooltip) and an optional click handler.
import { cn } from "@/lib/utils";
import { fmt, pct, STATUS_OPACITY } from "@/lib/dashboard";

export type Tip = (text: string) => {
  onMouseMove: (e: React.MouseEvent) => void;
  onMouseLeave: () => void;
};

export type Stack = { label: string; color: string; counts: Map<number, number> };

// Bars per year, stacked by series; click = pick the year.
export const YearBars = ({ years, stacks, active, onPick, tip, height = 160 }: {
  years: number[]; stacks: Stack[]; active?: number | null; onPick?: (y: number) => void; tip: Tip; height?: number;
}) => {
  const total = (y: number) => stacks.reduce((s, st) => s + (st.counts.get(y) || 0), 0);
  const max = Math.max(1, ...years.map(total));
  const every = Math.ceil(years.length / 12);
  return (
    <div>
      <div className="flex items-end gap-[2px] border-b border-slate-300" style={{ height }}>
        {years.map((y) => {
          const t = total(y);
          const text = `${y} · ${fmt(t)} thèse${t > 1 ? "s" : ""}` +
            stacks.filter((st) => st.counts.get(y)).map((st) => ` · ${st.label} ${fmt(st.counts.get(y) || 0)}`).join("");
          return (
            <button key={y} type="button" aria-label={text} {...tip(text)} onClick={() => onPick?.(y)}
              className={cn("flex-1 min-w-0 h-full flex flex-col-reverse group", onPick ? "cursor-pointer" : "cursor-default")}>
              {stacks.map((st) => {
                const v = st.counts.get(y) || 0;
                return v ? (
                  <span key={st.label} className={cn("w-full first:rounded-none last:rounded-t-[3px] group-hover:opacity-80",
                    active === y && "ring-2 ring-slate-800")} style={{ height: `${(100 * v) / max}%`, background: st.color }} />
                ) : null;
              })}
            </button>
          );
        })}
      </div>
      <div className="flex gap-[2px] text-[11px] text-slate-500 mt-1 tabular-nums">
        {years.map((y, i) => (
          <span key={y} className="flex-1 min-w-0 text-center">{i % every === 0 || i === years.length - 1 ? String(y).slice(2) : ""}</span>
        ))}
      </div>
    </div>
  );
};

export const Legend = ({ items }: { items: { label: string; color: string; value?: number }[] }) => (
  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-700 mt-2">
    {items.map((it) => (
      <span key={it.label} className="inline-flex items-center gap-1.5">
        <i className="inline-block w-2.5 h-2.5 rounded-sm" style={{ background: it.color }} />
        {it.label}{it.value != null ? ` — ${fmt(it.value)}` : ""}
      </span>
    ))}
  </div>
);

// Ranked horizontal bars; `parts` splits a bar into shaded segments (status), value written at the end.
export type Row = { key: string; value: number; parts?: { label: string; value: number }[] };

export const HBars = ({ rows, color, total, active, onPick, tip, labelWidth = "11rem" }: {
  rows: Row[]; color: string; total: number; active?: string | null; onPick?: (k: string) => void; tip: Tip; labelWidth?: string;
}) => {
  if (!rows.length) return <p className="text-sm text-slate-500">Aucune thèse.</p>;
  const max = Math.max(...rows.map((r) => r.value));
  return (
    <div className="space-y-[3px]">
      {rows.map((r) => {
        const text = `${r.key} : ${fmt(r.value)} (${pct(r.value, total)})` +
          (r.parts ? " — " + r.parts.filter((p) => p.value).map((p) => `${p.label} ${fmt(p.value)}`).join(", ") : "");
        return (
          <button key={r.key} type="button" {...tip(text)} onClick={() => onPick?.(r.key)}
            className={cn("grid w-full items-center gap-2 text-left text-xs group", onPick ? "cursor-pointer" : "cursor-default")}
            style={{ gridTemplateColumns: `${labelWidth} 1fr` }}>
            <span className={cn("truncate text-right text-slate-800", active === r.key && "font-bold")}>{r.key}</span>
            <span className="flex items-center gap-1.5 min-w-0">
              <span className="flex h-3.5 rounded-r-[3px] overflow-hidden group-hover:opacity-80" style={{ width: `${(100 * r.value) / max}%` }}>
                {(r.parts || [{ label: "", value: r.value }]).map((p) => p.value ? (
                  <span key={p.label} className="h-full" style={{ flexGrow: p.value, background: color, opacity: STATUS_OPACITY[p.label] ?? 1 }} />
                ) : null)}
              </span>
              <span className="shrink-0 text-slate-600 tabular-nums">{fmt(r.value)}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
};

// Specialty × year grid; cell shade = count (square root, so small specialties stay visible).
export const Heatmap = ({ rows, years, cell, color, onPick, tip }: {
  rows: { key: string; total: number }[]; years: number[]; cell: Map<string, number>;
  color: (k: string) => string; onPick?: (spe: string, year?: number) => void; tip: Tip;
}) => {
  if (!rows.length) return <p className="text-sm text-slate-500">Aucune thèse classée.</p>;
  const max = Math.max(1, ...cell.values());
  const every = Math.ceil(years.length / 12);
  const cols = `minmax(9rem, 14rem) repeat(${years.length}, minmax(14px, 1fr)) 3rem`;
  return (
    <div className="overflow-x-auto">
      <div className="grid gap-[2px] text-[11px] min-w-[640px]" style={{ gridTemplateColumns: cols }}>
        <span />
        {years.map((y, i) => <span key={y} className="text-center text-slate-500">{i % every === 0 ? String(y).slice(2) : ""}</span>)}
        <span />
        {rows.map(({ key, total }) => (
          <div key={key} className="contents">
            <button type="button" onClick={() => onPick?.(key)} {...tip(`${key} : ${fmt(total)} thèses`)}
              className="truncate text-right pr-1 text-slate-800 hover:underline">{key}</button>
            {years.map((y) => {
              const v = cell.get(`${key}|${y}`) || 0;
              return (
                <button key={y} type="button" onClick={() => onPick?.(key, y)} {...tip(`${key} · ${y} : ${fmt(v)}`)}
                  className="h-3.5 rounded-[2px] hover:ring-1 hover:ring-slate-800"
                  style={v ? { background: color(key), opacity: 0.1 + 0.9 * Math.sqrt(v / max) } : { background: "#e2e8f0", opacity: 0.5 }} />
              );
            })}
            <span className="text-slate-600 tabular-nums pl-1">{fmt(total)}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
