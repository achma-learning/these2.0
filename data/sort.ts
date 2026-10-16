function compareValues(valueA: any, valueB: any) {
  if (typeof valueA === "string" && typeof valueB === "string") {
    
    // Case-insensitive string comparison
    return valueA.localeCompare(valueB, undefined, { sensitivity: "base" });
  
  } else if (
    typeof valueA === "number" &&
    typeof valueB === "number" &&
    Number(valueA)
  ) {
    // Numeric comparison
    return Number(valueA) - Number(valueB);
  } else {
    // Fallback to default comparison for other types
    return String(valueA).localeCompare(String(valueB), undefined, {
      sensitivity: "base",
    });
  }
}

type sortParamsType = {
  year?: "asc" | "desc";
  ord?: "asc" | "desc";
  title?: "asc" | "desc";
  author?: "asc" | "desc";
};

export const sortData = async (dataToBeSorted:These[], sortBy:sort) => {
  
  let sortParams:sortParamsType = {};
  if (sortBy === "") {
    sortParams = {
      year: "asc",
      ord: "asc",
    };
  } else if (sortBy === "orderDesc") {
    sortParams = {
      year: "desc",
      ord: "desc",
    };
  } else if (sortBy === "authorAsc") {
    sortParams = {
      author: "asc",
    };
  } else if (sortBy === "authorDesc") {
    sortParams = {
      author: "desc",
    };
  } else if (sortBy === "titleAsc") {
    sortParams = {
      title: "asc",
    };
  } else if (sortBy === "titleDesc") {
    sortParams = {
      title: "desc",
    };
  }

  // sortparams: spreadData
  const sortedData = [...dataToBeSorted];

  sortedData.sort((a, b) => {
    for (const [property, order] of Object.entries(sortParams)) {
      const valueA = a[property as keyof These];
      const valueB = b[property as keyof These];
      // Handle cases where values might be missing or undefined
      if (valueA === undefined || valueB === undefined) {
        // Fallback to default comparison
        return 0;
      }

      // Perform sorting based on property and order
      if (property === 'year') {
        // Sort by year first
        if (valueA !== valueB) {
          return order === 'asc' ? Number(valueA) - Number(valueB) : Number(valueB) - Number(valueA);
        }
      } else {
        // Sort by other properties
        const compareResult =
          order === "asc"
            ? compareValues(valueA, valueB)
            : compareValues(valueB, valueA);

        if (compareResult !== 0) {
          return compareResult;
        }
      }
    }

    return 0;
  });

  return sortedData;
};
