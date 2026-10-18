// Shared by the dashboard server page (projection of json/file.json) and its client component (live charts).

// One thesis, only the fields the charts need (keeps the page payload small).
export type Rec = {
  id: string; // "these188-26" → /these/[theseId]
  y: number;
  t: string; // title
  a: string; // author
  s: string; // official specialty ("" when unknown)
  g: string; // official group ("" when unknown)
  st: Status;
  r: string; // rapporteur
  en: boolean; // English title (library language, else guessed from the title)
};

export type Status = "confirmée" | "probable" | "à vérifier" | "";

export const GROUPS = ["Spécialités de médecine", "Spécialités de chirurgie", "Spécialités de biologie"] as const;
export const SHORT: Record<string, string> = {
  "Spécialités de médecine": "Médecine",
  "Spécialités de chirurgie": "Chirurgie",
  "Spécialités de biologie": "Biologie",
};
export const GROUP_COLOR: Record<string, string> = {
  "Spécialités de médecine": "#2a78d6",
  "Spécialités de chirurgie": "#eb6834",
  "Spécialités de biologie": "#1baf7a",
};
export const OTHER_COLOR = "#b4b2ab";
// Bar shade = how sure the specialty is (classer_fmpm.py Statut, or the pipeline's own guesses for new theses).
export const STATUS_OPACITY: Record<string, number> = { "confirmée": 1, "probable": 0.55, "à vérifier": 0.25 };

// specialiteSource (scripts/specialites.py) → the 3 statuses shown on the charts.
export const statusOf = (src?: string): Status =>
  src === "confirmée" || src === "vérifiée" ? "confirmée"
    : src === "probable" || src === "catalogue" ? "probable"
      : src ? "à vérifier" : "";

export const norm = (s: string) =>
  (s || "").replace(/\s+/g, " ").trim().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[’'`]/g, "'").toLowerCase();

const EN = /\b(the|of|and|in|with|among|patients|study|assessment|knowledge|outcomes?)\b/g;
export const looksEnglish = (title: string) => (norm(title).match(EN) || []).length >= 2;

// Read in the TITLE only: indicative, not official data (same lists as the FMPM userscript).
export const DESIGNS: [string, RegExp][] = [
  ["Expérience d’un service", /experience d[ue'] |experience des services|au sein du service|au service d/],
  ["Rétrospective", /retrospecti/],
  ["Prospective", /prospecti/],
  ["À propos de cas", /a propos d[e']|cas clinique|case report/],
  ["Revue de la littérature", /revue de (la )?litterature|revue systematique|meta-?analyse|literature review|systematic review/],
  ["Enquête / connaissances", /enquete|connaissances|attitudes|pratiques|perception|knowledge|survey|questionnaire/],
  ["Transversale", /transversal|cross-sectional/],
  ["Épidémiologique", /epidemiolog|prevalence|incidence|profil/],
];
export const PLACES: [string, RegExp][] = [
  ["CHU Mohammed VI", /chu mohammed vi|chu med vi|chu mohamed vi|chu de marrakech|chu mohammed 6/],
  ["Hôpital Militaire Avicenne", /militaire|avicenne|\bhma\b/],
  ["Hôpital Ibn Tofail", /ibn tofa/],
  ["Hôpital Arrazi", /arrazi|ar-razi/],
  ["Hôpital Mère-Enfant", /mere[- ]enfant|mere et enfant/],
  ["Centre d’oncologie / CRO", /oncologie.*(centre|hematologie)|centre regional d'oncologie|\bcro\b/],
  ["Hôpital Ibn Nafis", /ibn nafis/],
  ["Hôpital Ibn Zohr", /ibn zohr/],
  ["Agadir", /agadir/], ["Safi", /\bsafi\b/], ["Essaouira", /essaouira/], ["Beni Mellal", /beni[- ]mellal/],
  ["Ouarzazate", /ouarzazate/], ["Laâyoune", /laayoune/], ["Guelmim", /guelmim/],
];
export const STOP = new Set(("de du des la le les et en au aux a l d un une dans chez par pour sur avec sans entre ou propos " +
  "experience service cas etude chu marrakech mohammed vi hopital militaire avicenne prise charge profil revue litterature " +
  "apport place interet evaluation serie resultats the of in and at to for with on an from patients clinique cliniques " +
  "epidemiologique epidemiologiques therapeutique therapeutiques diagnostique aspects ibn tofail est son ses sa leur leurs " +
  "cours lors apres avant non type role").split(" "));

export const fmt = (n: number) => Math.round(n).toLocaleString("fr-FR");
export const pct = (a: number, b: number) => (b ? `${Math.round((100 * a) / b)} %` : "—");
