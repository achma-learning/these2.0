"use server";
import { wait } from "@/lib/utils";
import fsPromises from "fs/promises";

export const writeData = async (filePath: string, data: These[]) => {
  const lastFetched = new Date().toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "numeric",
    hour12: true,
  });

  const updatedData = JSON.stringify({ lastFetched, data });

  let retries = 6; // Number of retries
  try {
    await fsPromises.writeFile(filePath, updatedData, {
      flag: "w",
      encoding: "utf-8",
    });
    return { success: true }; // Successful write
  } catch (err) {
    console.error("Error writing to file:", err);
    console.log(err);
    return { success: false };
  }
};
