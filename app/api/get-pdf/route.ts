import axios, { AxiosError } from "axios";
import { NextRequest, NextResponse } from "next/server";

export const GET = async (req: NextRequest, res: NextResponse) => {
  const url = req.url;
  const parsedUrl = new URL(url);
  const pdf = parsedUrl.searchParams.get("url") || "";

  if (pdf === "") {
    console.error("PDF URL not found");
    return NextResponse.json({ message: "PDF URL not found"},{
      status:409
    });
  }
  
  const filename = pdf?.slice(pdf?.lastIndexOf("/") + 1) || "these.pdf";
  
  try {
    // Make a GET request to the server serving the PDF
    
    const response = await axios.get(pdf, {
      responseType: "arraybuffer", // Set responseType to 'arraybuffer' to receive binary data
    });

    const pdfData = response.data;
    // Send the PDF data as response
    return new Response(pdfData, {
      headers: {
        "content-type": "application/pdf",
        "Content-Disposition": `inline; filename="${filename}"`,
      },
    });
  } catch (error: any) {
    if (axios.isAxiosError(error)) {
      // Error is an AxiosError
      const axiosError: AxiosError = error;
      console.error("Error fetching PDF:", axiosError);
      return NextResponse.json({
        message: "pdf not found in server",
      },{
        status:404
      });
    } else {
      // Error is not an AxiosError
      console.error("Error fetching PDF:", error);
      return NextResponse.json({ message: error.message },{status:500});
    }
  }
};
