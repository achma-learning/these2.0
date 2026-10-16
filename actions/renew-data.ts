"use server"

import { formatHtmlToJson, getAllPageContent } from "@/lib/renew-lib";
import { getLocalData } from "./load-data";
import { writeData } from "./write-data";

export const renewData = async () => {
    const currentYear = new Date().getFullYear();
    const prevYear = currentYear - 1;
  
    const { data } = await getLocalData();
  
    let oldData = data
      .filter((these) => these.year !== currentYear && these.year !== prevYear)
      .sort((a, b) => {
        // First, compare by year
        if (a.year !== b.year) {
          return a.year - b.year;
        }
  
        // If years are the same, compare by ord
        return a.ord - b.ord;
      });
  
    const dataYear1 = await getAllPageContent(prevYear);
    const json1 = formatHtmlToJson(dataYear1!);
  
    const dataYear2 = await getAllPageContent(currentYear);
    const json2 = formatHtmlToJson(dataYear2!);
  
    const renewedFreshData = [...oldData,...json1, ...json2];
    const { success } = await writeData("json/file.json", renewedFreshData);
    if (!success) {
      return { error: "couldn't update data" };
    }
    return { success: "updated db successfully" };
  };