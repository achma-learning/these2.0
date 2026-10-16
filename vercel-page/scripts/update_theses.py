#!/usr/bin/env python3
"""Refresh the FMPM thesis list so the site stays up to date.

Sources (both public, both read-only for us):
  1. Official catalogue  https://wd.fmpm.uca.ma/biblio/theses/annee-htm/<YEAR>.htm
     -> the source of truth for WHICH theses exist: year, number, author, title, PDF link.
  2. Library OPAC (PMB)  https://lib.fmpm.uca.ma/lib/opac_css/
     -> extra details the official pages don't have: president, rapporteur, jury,
        specialty (category), keywords. Only queried for recent / incomplete years.

The existing JSON file is used as the starting point ("seed"), so records we already
know keep their rich details and old data is never lost if a site is down.

Output format is exactly what the Next.js app reads (json/file.json):
  {"lastFetched": "...", "data": [These, ...]}

Usage:
  python scripts/update_theses.py                      # updates json/file.json in place
  python scripts/update_theses.py --json ../github-page/data/theses.json --seed json/file.json
  python scripts/update_theses.py --no-opac            # official pages only (fast)
"""
from __future__ import annotations

import argparse
import datetime as dt
import json
import re
import sys
import time
import unicodedata
from pathlib import Path

import requests
from bs4 import BeautifulSoup

OFFICIAL_BASE = "https://wd.fmpm.uca.ma/biblio/theses/annee-htm/"
OPAC_URL = "https://lib.fmpm.uca.ma/lib/opac_css/index.php?lvl=more_results&mode=extended&tab=catalog"
OPAC_EXPAND_URL = "https://lib.fmpm.uca.ma/lib/opac_css/ajax.php?module=expand_notice&categ=expand_block"
FIRST_YEAR = 2006
PAUSE_S = 1.0          # politeness pause between requests to the faculty servers
OPAC_PAGE_SIZE = 100   # keep pages small: the OPAC is a shared library server
OPAC_MAX_PAGES = 8
UA = "these2.0-updater (+https://github.com/achma-learning/these2.0)"

# "these53-25.pdf" -> ord=53, yy=25
PDF_RE = re.compile(r"these(\d+)-(\d{2})\.pdf", re.I)

session = requests.Session()
session.headers["User-Agent"] = UA


def fix_c1(text: str) -> str:
    """Pages served as ISO-8859-1 really contain windows-1252 bytes: map stray C1 control chars
    back (\x92 -> ', \x96 -> –, \x9c -> œ ...). Original symptom: 'Pain \x96 Children' tags."""
    return re.sub(r"[\x80-\x9f]", lambda m: m.group().encode("latin-1").decode("cp1252", errors="replace"), text)


def clean(text: str | None) -> str:
    return re.sub(r"\s+", " ", fix_c1(text or "")).strip()


def decode(raw: bytes) -> str:
    # Old pages are windows-1252, 2026+ pages are UTF-8 (same trick as the userscript).
    try:
        return raw.decode("utf-8")
    except UnicodeDecodeError:
        return raw.decode("cp1252", errors="replace")


def get(url: str, method: str = "GET", retries: int = 3, **kw) -> requests.Response | None:
    for attempt in range(retries):
        try:
            return session.request(method, url, timeout=60, **kw)
        except requests.RequestException as e:  # the faculty servers reset connections sometimes
            print(f"  ! {url} attempt {attempt + 1}: {e}", file=sys.stderr)
            time.sleep(2 ** (attempt + 1))
    return None


# ---------------------------------------------------------------- language guess
FR_WORDS = set("le la les des du de et en au aux une un chez sur dans par pour avec sans service cas propos".split())
EN_WORDS = set("the of and in on at for with without a an from to study patients children case cases".split())


def guess_language(title: str) -> str:
    words = re.findall(r"[a-zA-Z']+", unicodedata.normalize("NFD", title.lower()))
    fr = sum(w in FR_WORDS for w in words)
    en = sum(w in EN_WORDS for w in words)
    return "Anglais (eng)" if en > fr else "Français (fre)"


# ---------------------------------------------------------------- official pages
def fetch_official_year(year: int) -> list[dict] | None:
    """Return the rows of one official year page, or None if the page is missing/unreachable."""
    r = get(f"{OFFICIAL_BASE}{year}.htm")
    if r is None or r.status_code != 200:
        print(f"  official {year}: {'unreachable' if r is None else r.status_code}")
        return None
    soup = BeautifulSoup(decode(r.content), "html.parser")
    rows = []
    for tr in soup.find_all("tr"):
        cells = tr.find_all(["td", "th"], recursive=False)
        if len(cells) < 3:
            continue
        num = clean(cells[0].get_text())
        if not num.isdigit():
            continue  # header rows
        title_cell = cells[2]
        for a in title_cell.find_all("a"):
            a.decompose()
        pdf = ""
        for a in tr.find_all("a", href=True):
            if "/FT/" in a["href"].upper():
                pdf = requests.compat.urljoin(r.url, a["href"]).replace("http://", "https://")
                break
        rows.append({
            "year": year,
            "ord": int(num),
            "author": clean(cells[1].get_text()),
            "title": clean(title_cell.get_text()),
            "href": pdf,
        })
    print(f"  official {year}: {len(rows)} theses")
    return rows


# ---------------------------------------------------------------- library OPAC
def _opac_body(year: int, page: int) -> dict:
    # Same advanced search the original renew-lib.ts used: document type "th" + publication year.
    return {
        "search[]": ["f_24", "f_23"],
        "inter_0_f_24": "", "op_0_f_24": "STARTWITH", "field_0_f_24[]": "th",
        "inter_1_f_23": "and", "op_1_f_23": "EQ", "field_1_f_23[]": str(year),
        "page": str(page), "nb_per_page_custom": str(OPAC_PAGE_SIZE),
        "filtre_compare": "", "catalog_page": str(page), "affiliate_page": "1",
    }


def parse_opac(html: str, year: int) -> dict[tuple[int, int], dict]:
    """Map (year, ord) -> details, from the inline 'div_public' blocks of PMB results."""
    soup = BeautifulSoup(html, "html.parser")
    out: dict[tuple[int, int], dict] = {}
    for block in soup.select("[id^=div_public]"):
        rec = {"president": "", "rapporteur": "", "jury": [], "membreAssocie": [], "pdf": ""}
        categ = clean(block.select_one(".public_categ").get_text()) if block.select_one(".public_categ") else ""
        rec["category"] = [c.strip() for c in categ.split(":")] if categ else None
        tags = [clean(a.get_text()) for a in block.select(".public_keywords a")]
        if len(tags) == 1 and re.search(r"[-–]", tags[0]):
            tags = [t.strip() for t in re.split(r"[-–]", tags[0]) if t.strip()]
        rec["tags"] = tags or None
        lang = block.select_one(".public_langues")
        rec["langue"] = clean(lang.get_text()) if lang else ""
        for tr in block.select(".tr_persofield"):
            label = re.sub(r"[\s:]", "", tr.find("td").get_text()).lower()
            value = clean(tr.select_one(".public_persofield").get_text()) if tr.select_one(".public_persofield") else ""
            if label == "president":
                rec["president"] = value
            elif label == "rapporteur":
                rec["rapporteur"] = value
            elif label == "jury":
                rec["jury"] = [j.strip() for j in value.split("/") if j.strip()]
            elif label == "membreassocie":
                rec["membreAssocie"] += [j.strip() for j in value.split("/") if j.strip()]
            link = tr.select_one("a[href]")
            if link and PDF_RE.search(link["href"]):
                rec["pdf"] = link["href"]
        m = PDF_RE.search(rec["pdf"])
        if not m:
            continue  # no reliable key -> skip rather than guess
        y = 2000 + int(m.group(2))
        if y != year:
            continue
        out[(y, int(m.group(1)))] = rec
    return out


def _opac_decode(r: requests.Response) -> str:
    return fix_c1(r.content.decode("iso-8859-1"))


def expand_opac(html: str) -> str:
    """PMB only renders the first few notices of a page; the others are collapsed behind an
    <img param='...'> and must be fetched from expand_notice (40 per call, like renew-lib.ts)."""
    params = re.findall(r"<img[^>]*\sparam='([^']+)'", html)
    parts = []
    for i in range(0, len(params), 40):
        r = get(OPAC_EXPAND_URL, method="POST",
                data="display_cmd=" + "|*|*|".join(params[i:i + 40]),
                headers={"content-type": "application/x-www-form-urlencoded"})
        time.sleep(PAUSE_S)
        if r is not None and r.status_code == 200:
            parts.append(_opac_decode(r))
    return html + "".join(parts)


def fetch_opac_year(year: int) -> dict[tuple[int, int], dict]:
    found: dict[tuple[int, int], dict] = {}
    for page in range(1, OPAC_MAX_PAGES + 1):
        r = get(OPAC_URL, method="POST", data=_opac_body(year, page))
        time.sleep(PAUSE_S)
        if r is None or r.status_code != 200:
            break
        html = _opac_decode(r)
        notices = len(re.findall(r'id="el\d+Parent"', html))
        batch = parse_opac(expand_opac(html), year)
        new = {k: v for k, v in batch.items() if k not in found}
        found.update(new)
        if notices < OPAC_PAGE_SIZE or not new:
            break  # last page
    print(f"  opac {year}: {len(found)} detailed records")
    return found


# ---------------------------------------------------------------- merge
def make_record(row: dict, extra: dict | None) -> dict:
    extra = extra or {}
    jury = extra.get("jury") or []
    membres = extra.get("membreAssocie") or []
    president, rapporteur = extra.get("president", ""), extra.get("rapporteur", "")
    langue = extra.get("langue") or guess_language(row["title"])
    if "eng" in langue.lower() or "anglais" in langue.lower():
        langue = "Anglais (eng)"
    else:
        langue = "Français (fre)"
    return {
        "ord": row["ord"],
        "year": row["year"],
        "title": row["title"],
        "author": row["author"],
        "langue": langue,
        "category": extra.get("category"),
        "tags": extra.get("tags"),
        "president": president,
        "rapporteur": rapporteur,
        "jury": jury,
        "membreAssocie": membres or None,
        "profs": [p for p in [president, rapporteur, *jury, *membres] if p],
        "href": row["href"] or "not found",
    }


def sanitize(t: dict) -> None:
    """Repair records saved by older runs (C1 chars, keyword lists glued with dashes)."""
    for k, v in t.items():
        if isinstance(v, str):
            t[k] = fix_c1(v)
        elif isinstance(v, list):
            t[k] = [fix_c1(x) if isinstance(x, str) else x for x in v]
    tags = t.get("tags")
    if tags:
        out = []
        for tag in tags:
            out += [x.strip() for x in re.split(r"\s[-–]\s|–", tag) if x.strip()]
        t["tags"] = out


def prof_key(name: str) -> str:
    """'Pr M.  EL BAZ ' / 'Pr. M.EL BAZ' -> 'M. EL BAZ' (used to group the same professor)."""
    n = unicodedata.normalize("NFD", name or "")
    n = re.sub(r"[̀-ͯ]", "", n).upper()
    n = re.sub(r"^\s*(PR|PROFESSEUR|DR)\.?\s+", "", n)
    n = re.sub(r"\.\s*", ". ", n)
    return re.sub(r"\s+", " ", n).strip()


def infer_specialties(data: list[dict]) -> int:
    """Since ~2024 the library no longer fills the specialty. Guess it from the rapporteur's
    past classified theses, only when the answer is clear (>= 3 theses, >= 60 % in one
    specialty). Guesses are flagged with categorySource="rapporteur" so they stay honest."""
    from collections import Counter, defaultdict
    history: dict[str, Counter] = defaultdict(Counter)
    paths: dict[str, list[str]] = {}
    for t in data:
        cat = t.get("category")
        if isinstance(cat, list) and len(cat) == 3 and t.get("categorySource") != "rapporteur" and t.get("rapporteur"):
            history[prof_key(t["rapporteur"])][cat[2]] += 1
            paths[cat[2]] = cat
    count = 0
    for t in data:
        cat = t.get("category")
        if t.get("categorySource") == "rapporteur":
            t["category"], t["categorySource"] = None, None  # recompute with fresh history
        elif isinstance(cat, list) and len(cat) == 3:
            continue
        hist = history.get(prof_key(t.get("rapporteur", "")))
        if not hist:
            t.pop("categorySource", None)
            continue
        spec, n = hist.most_common(1)[0]
        if sum(hist.values()) >= 3 and n / sum(hist.values()) >= 0.6:
            t["category"], t["categorySource"] = paths[spec], "rapporteur"
            count += 1
        else:
            t.pop("categorySource", None)
    return count


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    here = Path(__file__).resolve().parent.parent
    ap.add_argument("--json", default=str(here / "json/file.json"), help="output file")
    ap.add_argument("--seed", default=None, help="existing data to start from (default: the output file)")
    ap.add_argument("--no-opac", action="store_true", help="skip the library catalogue enrichment")
    ap.add_argument("--from-year", type=int, default=FIRST_YEAR)
    args = ap.parse_args()

    out_path = Path(args.json)
    seed_path = Path(args.seed) if args.seed else out_path
    seed = json.loads(seed_path.read_text("utf-8"))["data"] if seed_path.exists() else []
    print(f"seed: {len(seed)} records from {seed_path}")

    by_key: dict[tuple[int, int], dict] = {}
    for t in seed:
        sanitize(t)
        if isinstance(t.get("ord"), int) and isinstance(t.get("year"), int):
            t.setdefault("president", ""); t.setdefault("rapporteur", ""); t.setdefault("jury", [])
            t["href"] = t.get("href", "not found").replace("http://", "https://")
            by_key[(t["year"], t["ord"])] = t
    unkeyed = [t for t in seed if (t.get("year"), t.get("ord")) not in by_key]

    this_year = dt.date.today().year
    official: list[dict] = []
    reachable_years = 0
    for year in range(args.from_year, this_year + 1):
        rows = fetch_official_year(year)
        time.sleep(PAUSE_S)
        if rows is not None:
            reachable_years += 1
            official += rows
    if reachable_years == 0:
        print("official site unreachable: keeping the current file untouched", file=sys.stderr)
        return 1

    # Which years need OPAC details: theses we don't know yet, or known ones with no rapporteur
    # in the last 3 years (the library often catalogues a thesis weeks after it is published).
    need_opac = sorted({r["year"] for r in official
                        if (r["year"], r["ord"]) not in by_key
                        or (r["year"] >= this_year - 2 and not by_key[(r["year"], r["ord"])].get("rapporteur"))})
    opac: dict[tuple[int, int], dict] = {}
    if not args.no_opac and need_opac:
        print(f"opac enrichment for years: {need_opac}")
        for year in need_opac:
            opac.update(fetch_opac_year(year))

    added = enriched = 0
    for row in official:
        key = (row["year"], row["ord"])
        old = by_key.get(key)
        if old is None:
            by_key[key] = make_record(row, opac.get(key))
            added += 1
            continue
        if row["href"]:
            old["href"] = row["href"]
        if not old.get("title"):
            old["title"] = row["title"]
        if not old.get("rapporteur") and key in opac:
            fresh = make_record({**row, "title": old.get("title") or row["title"],
                                 "author": old.get("author") or row["author"]}, opac[key])
            by_key[key] = fresh
            enriched += 1

    data = sorted(by_key.values(), key=lambda t: (t["year"], t["ord"])) + unkeyed
    inferred = infer_specialties(data)
    if len(data) < 0.9 * len(seed):
        print(f"refusing to write: {len(data)} records vs {len(seed)} before", file=sys.stderr)
        return 1

    last = dt.datetime.now(dt.timezone.utc).strftime("%a, %b %d, %Y, %I:%M %p UTC")
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps({"lastFetched": last, "data": data}, ensure_ascii=False), "utf-8")
    print(f"wrote {out_path}: {len(data)} theses (+{added} new, {enriched} enriched, "
          f"{inferred} specialties inferred from the rapporteur)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
