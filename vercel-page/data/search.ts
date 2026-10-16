import { slugify } from "@/lib/utils";

// normalize string and remove undetected characters
function normalizeString(str: string) {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9\s]/g, "");
}

// base search
export const baseSearch = async (data: These[], query: string) => {
  // normalized query search
  const normalizedQuery = normalizeString(query.toLowerCase());

  return data.filter((item) => {
    const normalizedTitle = item.title
      ? normalizeString(item.title.toLowerCase())
      : "";
    const normalizedAuthor = item.author
      ? normalizeString(item.author.toLowerCase())
      : "";

    const normalizedTags = item.tags
      ? item.tags.map((tag) => normalizeString(tag.toLowerCase()))
      : [];

    const normalizedCategory = item.category
      ? item.category.map((categ) => normalizeString(categ.toLowerCase()))
      : [];

    //   const normalizedCote = item.cote ? normalizeString(item.cote.toLowerCase()) : "";
    const normalizedProfs = item.profs
      ? item.profs.map((prof) => normalizeString(prof.toLowerCase()))
      : [];

    const titleMatch = normalizedTitle.includes(normalizedQuery);
    const authorMatch = normalizedAuthor.includes(normalizedQuery);

    // const tagsMatch = normalizedTags.includes(normalizedQuery);
    const tagsMatch = normalizedTags.some((tag) =>
      tag.includes(normalizedQuery)
    );

    // const categoryMatch = normalizedCategory.includes(normalizedQuery);
    const categoryMatch = normalizedCategory.some((categ) =>
      categ.includes(normalizedQuery)
    );


    const profMatch = normalizedProfs.some((prof) =>
      prof.includes(normalizedQuery)
    );

    // Check if the year matches
    const yearMatch = item.year.toString().includes(query);

    // Return items that match any of the criteria
    return (
      titleMatch ||
      authorMatch ||
      yearMatch ||
      tagsMatch ||
      categoryMatch ||
      profMatch
    );
  });
};

// Example usage:
// const strictSearchResults = strictSearch({
//   search: "search query for title",
//   year: "search query for year",
//   category: "search query for category"
//   lang: "search query for lang"
// });
type Criteria = {
  category?: string;
  langue?: "eng" | "fr";
  year?: number;
};

export const combinedSearch = async (
  data: These[],
  query: string,
  criteria?: Criteria
) => {
  const basicSearch = await baseSearch(data, query);
  if (!criteria || Object.keys(criteria).length === 0) {
    return basicSearch
  }
  return basicSearch.filter((these) => {
    // Check if all specified criteria are met
    return Object.entries(criteria).every(([key, value]) => {
      if (key === "category" && value !== undefined) {
        if (
          slugify((value as string).toLowerCase()) ===
          slugify("Not Classed Yet".toLowerCase())
        ) {
          return (
            !these[key] ||
            these[key]!.length < 3 ||
            !Array.isArray(these[key])
          );
        }
        return (
          these[key] &&
          Array.isArray(these[key]) &&
          these[key]!.length === 3 &&
          these[key]!.some(
            (entry) =>
              slugify(String(entry).toLowerCase()) ===
              slugify((value as string).toLowerCase())
          )
        );
      } else if (key === "year" && value !== undefined) {
        // For year, convert to string and check if it includes the value
        return these[key].toString() === `${value}`;
      } else if (key === "langue" && value !== undefined) {
        // For other keys, check if the lowercase value is included
        return these[key].toLowerCase().includes(String(value).toLowerCase());
      }
    });
  });
};
