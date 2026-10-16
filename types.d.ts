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
  lang?: string;
  year?: number;
};
