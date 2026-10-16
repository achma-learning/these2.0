"use server";
import { imagePerCategory } from "@/lib/constants";
import { formatTitle, getImageByCategory } from "@/lib/utils";
import { getLocalData } from "./load-data";

export const getAllCategories = async () => {
  
  // Defining empty categ array that should contain {category,image}
  const listOfCategories: Category[] = [];

  try {
    const { data } = await getLocalData();

    // looping through data and only catching categories that are arrays and have a length of 3 
    for (const these of data) {
      if (Array.isArray(these.category) && these.category.length === 3) {
        const categ = these.category[2];
        // only if there is a categ found and doesn't exist in listOfCategories push to listOfCategories
        if (
          categ &&
          !listOfCategories.some((item) => item.category === categ)
        ) {

          listOfCategories.push({
            category: categ,
            image: getImageByCategory(categ),
          });
        }
      }
    }

    // sort the categories alphabetically
    listOfCategories.sort((a, b) => a.category.localeCompare(b.category));

    // push the not classed category
    listOfCategories.push({
      category: "Not Classed yet",
      image: getImageByCategory("notclassedyet"),
    });
    
    return {
      success: "successfully retrieved categories",
      categories: [...listOfCategories],
    };
  } catch (err) {
    console.error(`[ERROR_getAllCategories] : ${err}`);

    return {
      categories: [],
      error: {
        message: "something went wrong while retrieving categories",
        err,
      },
    };
  }
};
