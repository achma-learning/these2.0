// Dashboard: charts are PNGs from scripts/build_charts.py (matplotlib); stats.json lists them
// with their numbers. The explorer table at the bottom filters data/theses.json in the browser.
(function () {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const norm = (s) => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  const slug = (s) => norm(s).replace(/[^a-z0-9]+/g, "-");
  const UNCLASSIFIED = "Non classée";
  const MAX_ROWS = 500;

  const table = (head, rows) => `<table><thead><tr>${head.map((h, i) => `<th class="${i ? "n" : ""}">${esc(h)}</th>`).join("")}</tr></thead><tbody>${
    rows.map((r) => `<tr>${r.map((c, i) => `<td class="${i && typeof c === "number" ? "n" : ""}">${esc(c)}</td>`).join("")}</tr>`).join("")}</tbody></table>`;

  function renderCharts(s) {
    $("sub").textContent = `${s.total} thèses · mis à jour ${s.lastFetched} · sources : wd.fmpm.uca.ma (liste officielle) et lib.fmpm.uca.ma (jury, spécialité)`;
    $("kpis").innerHTML = s.kpis.map(([v, l]) => `<div class="kpi"><div class="v">${esc(v)}</div><div class="l">${esc(l)}</div></div>`).join("");
    const sections = [...new Set(s.charts.map((c) => c.section))];
    $("toc").innerHTML = sections.map((x) => `<a href="#${slug(x)}">${esc(x)}</a>`).join("") + `<a href="#explorer">Filtrage dynamique</a>`;
    $("charts").innerHTML = sections.map((sec) => `<h2 id="${slug(sec)}">${esc(sec)}</h2>` +
      s.charts.filter((c) => c.section === sec).map((c) => `
        <section class="chart">
          <a href="stats/${c.id}.png" target="_blank" rel="noopener" title="Ouvrir en grand">
            <picture>
              <source srcset="stats/${c.id}-dark.png" media="(prefers-color-scheme: dark)">
              <img src="stats/${c.id}.png" alt="${esc(c.alt)}" loading="lazy">
            </picture>
          </a>
          <details><summary>Voir les chiffres</summary><div class="scroll">${table(c.table.head, c.table.rows)}</div></details>
        </section>`).join("")).join("");
  }

  // ---------------------------------------------------------------- explorer
  let ROWS = [];
  function fill(id, values) {
    $(id).insertAdjacentHTML("beforeend", values.map((v) => `<option value="${esc(v)}">${esc(v)}</option>`).join(""));
  }
  function current() {
    const q = norm($("fq").value).split(/\s+/).filter(Boolean);
    const cl = $("fcluster").value, sp = $("fspec").value, y = $("fyear").value;
    return ROWS.filter((r) => (!cl || r.cluster === cl) && (!sp || r.spec === sp) && (!y || String(r.year) === y) &&
      q.every((w) => r.n.includes(w)));
  }
  function renderRows() {
    const rows = current();
    $("fmeta").textContent = `${rows.length} thèse(s)${rows.length > MAX_ROWS ? ` · ${MAX_ROWS} premières affichées, l'export CSV contient tout` : ""}`;
    $("frows").innerHTML = rows.slice(0, MAX_ROWS).map((r) => `<tr>
      <td>${r.year}</td><td>${r.ord}</td><td>${esc(r.spec)}${r.guess ? " ?" : ""}</td><td>${esc(r.cluster)}</td>
      <td>${esc(r.title)}<br><small>Dr ${esc(r.author)}</small></td>
      <td>${r.href ? `<a href="${esc(r.href)}" target="_blank" rel="noopener">PDF</a>` : ""}</td></tr>`).join("");
  }
  function exportCsv() {
    const q = (v) => (/[",\n;]/.test(String(v)) ? `"${String(v).replace(/"/g, '""')}"` : String(v));
    const lines = [["Année", "N°", "Auteur", "Titre", "Spécialité", "Spécialité déduite", "Cluster", "Rapporteur", "PDF"].join(",")]
      .concat(current().map((r) => [r.year, r.ord, r.author, r.title, r.spec, r.guess ? "oui" : "", r.cluster, r.rapporteur, r.href].map(q).join(",")));
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob(["﻿" + lines.join("\n")], { type: "text/csv;charset=utf-8" }));
    a.download = `theses-fmpm-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.append(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  }

  async function start() {
    try {
      const [s, d] = await Promise.all([
        fetch("stats/stats.json", { cache: "no-cache" }).then((r) => r.json()),
        fetch("data/theses.json", { cache: "no-cache" }).then((r) => r.json()),
      ]);
      renderCharts(s);
      ROWS = d.data.map((t) => {
        const spec = Array.isArray(t.category) && t.category.length >= 3 ? t.category[t.category.length - 1] : UNCLASSIFIED;
        return {
          year: t.year, ord: t.ord, title: t.title, author: t.author, rapporteur: t.rapporteur || "",
          href: t.href && t.href !== "not found" ? t.href : "", spec, guess: t.categorySource === "rapporteur",
          cluster: s.clusters[spec] || UNCLASSIFIED, n: norm(`${t.title} ${t.author}`),
        };
      }).sort((a, b) => b.year - a.year || b.ord - a.ord);
      fill("fcluster", [...new Set(Object.values(s.clusters))].sort((a, b) => (a === UNCLASSIFIED) - (b === UNCLASSIFIED) || a.localeCompare(b, "fr")));
      fill("fspec", [...new Set(ROWS.map((r) => r.spec))].sort((a, b) => (a === UNCLASSIFIED) - (b === UNCLASSIFIED) || a.localeCompare(b, "fr")));
      fill("fyear", [...new Set(ROWS.map((r) => r.year))]);
      renderRows();
    } catch (e) {
      $("sub").textContent = "Impossible de charger les données : " + e.message;
    }
  }

  let timer;
  $("fq").addEventListener("input", () => { clearTimeout(timer); timer = setTimeout(renderRows, 150); });
  for (const id of ["fcluster", "fspec", "fyear"]) $(id).addEventListener("change", renderRows);
  $("reset").addEventListener("click", () => { for (const id of ["fq", "fcluster", "fspec", "fyear"]) $(id).value = ""; renderRows(); });
  $("csv").addEventListener("click", exportCsv);
  start();
})();
