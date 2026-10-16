import { getAllCategories } from "@/actions/get-all-categories";
import { imagePerCategory } from "@/lib/constants";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// cn to merge classnames
export const cn = (...inputs: ClassValue[]) => {
  return twMerge(clsx(inputs));
};

// to sleep/ wait for testing purposes
export const wait = (ms: number) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

// format as title
export const formatTitle = (word: string) => {
  return word
    .trim()
    .toLowerCase()
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
};

// prof name for search purposes
export const getProfName = (inputString: string): string => {
  // Split the input string into words
  const words = inputString.split(/\s+/);

  // Initialize variables to store the length of the longest word and the longest words found
  let minLength = 2;
  let largestWords = [];

  // Iterate through each word
  for (let word of words) {
    // only push words that do not contains pr or a .
    if (
      word.length >= minLength &&
      !word.toLowerCase().includes("pr") &&
      !word.includes(".")
    ) {
      largestWords.push(word.toLowerCase().trim());
    }
  }

  // Return the array of largest words joined by a space which is the prof name ...
  return largestWords.join(" ");
};

// get the image already dummy typed in a constants file in
type categoryImage = keyof typeof imagePerCategory;

export const getImageByCategory = (category: string) => {
  const formattedCategory = category
    .normalize("NFD")
    .replace(/[\u0300-\u036f\s-]/g, "")
    .toLowerCase();

  let image = imagePerCategory[formattedCategory as categoryImage];
  if (!image) {
    image = imagePerCategory["idk"];
  }

  return image;
};

export const slugify = (category: string) => {
  // Normalize to handle diacritic marks
  const normalizedCategory = category.normalize("NFD");

  // Replace diacritic marks with base characters, and replace spaces with hyphens
  const slug = normalizedCategory
    // .replace(/[\u0300-\u036f]/g, '') // Remove diacritic marks
    // .replace(/é/g, 'e') // Replace specific diacritic marks
    // .replace(/è/g, 'e') // Replace specific diacritic marks
    .replace(/ /g, "-") // Replace spaces with hyphens
    .toLowerCase(); // Convert to lowercase

  return slug;
};

export const unSlugify = (category: string) => {
  // Replace hyphens with spaces and decode URI components
  const decodedCategory = decodeURIComponent(category.replace(/-/g, " "));

  // Use formatTitle to capitalize the first letter of each word
  return formatTitle(decodedCategory);
};

export const isPartOfSort = (value: string) => {
  return [
    "",
    "orderDesc",
    "titleAsc",
    "titleDesc",
    "authorAsc",
    "authorDesc",
  ].includes(value)
    ? value
    : "";
};

export const isPartOfCategories = async (categ: string) => {
  const categories = (await getAllCategories()).categories.map((item) =>
    slugify(item.category)
  );
  return categories.includes(slugify(categ)) ? categ : undefined;
};

export const isPartOfNumberRange = (year: number) => {
  if (!year) return undefined;
  const currentYear: number = new Date().getFullYear();
  const baseYear: number = 2006;

  if (year >= baseYear && year <= currentYear) {
    return year;
  }
  return undefined;
};

export const isPartOfLang = (lang: string) => {
  const languages = ["fr", "eng"];
  return languages.includes(lang) ? lang : undefined;
};

export const getSearchParams = async (searchParams: searchParams) => {
  const search = (searchParams?.search?.trim() as string) || "";
  const page = Number(searchParams?.page) || 1;
  const sort = isPartOfSort(searchParams?.sortBy || "") as sort;
  const categ = await isPartOfCategories(searchParams?.categ || "");
  const lang = isPartOfLang(searchParams?.lang || "") as
    | "fr"
    | "eng"
    | undefined;
  const year = isPartOfNumberRange(Number(searchParams?.year));
  
  return { search, categ, lang, year, sort, page };
};

