type Category = {
  category: string;
  // id: number | null;
  image?: string;
};

type These = {
  ord: number;
  year: number;
  title: string;
  author: string;
  langue: string;
  category?: string[] | null; // if no category i'm gonna put the thesis in the unassigned category 
  tags: string[] | null;
  president: string;
  rapporteur: string;
  jury: string[];
  membreAssocie:  string[] | null;
  profs: string[];
  href: string;
  // official FMPM specialty (docs/liste-des-specialites-fmpm.pdf), set by scripts/specialites.py
  specialite?: string; // "Non classée" when unknown
  groupe?: string; // "Spécialités de médecine" | "Spécialités de chirurgie" | "Spécialités de biologie" | "Non classée"
  // confirmée / vérifiée = final classification (theses-fmpm-specialites.csv); probable / à vérifier / rapporteur / titre = guesses
  specialiteSource?: "confirmée" | "vérifiée" | "probable" | "à vérifier" | "catalogue" | "rapporteur" | "titre";
  specialiteCatalogue?: string; // library category mapped to the official list, kept even when the final classification won
  specialiteConfiance?: number; // 0-1, only for "titre" guesses from the Naive Bayes model
  // cote: string;
};
type sort =
  | ""
  | "orderDesc"
  | "titleAsc"
  | "titleDesc"
  | "authorAsc"
  | "authorDesc";
type searchParams = {
  search?: string;
  page?: number;
  sortBy?: string;
  categ?: string;
  spe?: string; // official FMPM specialty, slug (lib/specialites.ts)
  lang?: string;
  year?: number;
};
