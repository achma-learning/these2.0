// Official FMPM specialty list (docs/liste-des-specialites-fmpm.pdf, 26/10/2024): 42 specialties in 3 groups,
// in the document's order. Spelled as scripts/specialites.py writes them into json/file.json (typos of the PDF
// fixed: « Périphirique », « biologies », « Pneumophtysiologie »…), so a name here matches `These.specialite`.
export const SPECIALITES: Record<string, string[]> = {
  "Spécialités de médecine": [
    "Anesthésie-Réanimation", "Cardiologie", "Dermatologie", "Endocrinologie et Maladies Métaboliques",
    "Gastro-entérologie", "Hématologie clinique", "Médecine interne", "Médecine nucléaire",
    "Médecine physique et réadaptation fonctionnelle", "Médecine communautaire", "Maladies infectieuses",
    "Médecine légale", "Néphrologie", "Neurologie", "Oncologie médicale", "Pédiatrie", "Psychiatrie",
    "Pédopsychiatrie", "Pneumo-phtisiologie", "Radiologie", "Radiothérapie", "Réanimation médicale", "Rhumatologie",
  ],
  "Spécialités de chirurgie": [
    "Chirurgie cardio-vasculaire", "Chirurgie vasculaire périphérique", "Chirurgie générale", "Chirurgie pédiatrique",
    "Chirurgie réparatrice", "Chirurgie thoracique", "Gynécologie-Obstétrique", "Médecine d'urgence et de catastrophes",
    "Neurochirurgie", "Ophtalmologie", "Oto-rhino-laryngologie", "Urologie", "Traumatologie-orthopédie",
    "Stomatologie et chirurgie maxillo-faciale",
  ],
  "Spécialités de biologie": [
    "Anatomie pathologique", "Analyses biologiques médicales", "Biochimie", "Génétique", "Pharmacologie",
  ],
};

const key = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

// URL value of a specialty (?spe=anesthesie-reanimation) and back; undefined when it is not on the list.
export const speSlug = key;
const BY_SLUG = new Map(Object.values(SPECIALITES).flat().map((s) => [key(s), s]));
export const speFromSlug = (slug?: string) => (slug ? BY_SLUG.get(key(slug)) : undefined);
