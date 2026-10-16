"use server";

import { getLocalData } from "./load-data";
import { combinedSearch, baseSearch } from "@/data/search";
import { sortData } from "@/data/sort";

type getThese = {
  searchParams: {
    search?: string;
    category?: string;
    langue?: "fr" | "eng";
    year?: number;
  };
  sort: sort;
  page: number;
  nbPerPage: number;
};

// get these based on searchParams (search,category,langue,year) and sort and page and nbPerPage

export const getTheses = async ({
  searchParams: { category, langue, search, year },
  sort,
  page,
  nbPerPage,
}: getThese) => {
  let result: These[];
  try {
    // getting data
    const { data } = await getLocalData();

    const isCombinedSearch = !!category || !!langue || !!year;

    // if not combined search run a baseSearch
    if (!isCombinedSearch) {
      result = await baseSearch(data, search ?? "");
    } else {
      //? the searchParams of the combined search should have an object that contains non null values
      //? therefor the use of the AND logical operator and the spread operator to spread the object if it's non null
      result = await combinedSearch(data, search ?? "", {
        ...(category && { category }),
        ...(langue && { langue }),
        ...(year && { year }),
      });
    }

    // sorts the data according to the user preference though it has a default sort of year:"asc" and order:"asc"
    const sortedData = await sortData(result, sort);
    // total number of theses
    const totalTheses = sortedData.length;

    const totalPages = Math.ceil(totalTheses / nbPerPage) || 1;

    // Calculate start and end indices for the specified page
    const startIndex = (page - 1) * nbPerPage;
    const endIndex = startIndex + nbPerPage;

    // Extract the subset of data for the specified page
    const pageData = sortedData.slice(startIndex, endIndex);

    return { pageData, totalPages, totalTheses };
  } catch (error) {
    console.log("error [get_theses]", error);
    return  { pageData: [], totalPages: 1, totalTheses: 0 }
  }
};
