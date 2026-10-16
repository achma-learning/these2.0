"use server";
import fsPromises from "fs/promises";
import path from "path";
type jsonData = {
  data: These[];
  lastFetched: Date;
};

export async function getLocalData() {
  // Get the path of the json file
  const filePath = path.join(process.cwd(), "json/file.json");

  try {
    // Read the json file with utf-8 encoding
    const jsonData = await fsPromises.readFile(filePath, "utf-8");
    // Parse data as json
    const { lastFetched, data } = JSON.parse(jsonData) as jsonData;

    return { lastFetched, data };
  } catch (error) {
    console.error("Error reading or parsing JSON file:", error);
    throw error;
  }
}
