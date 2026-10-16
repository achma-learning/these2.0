import { renewData } from "@/actions/renew-data";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export async function GET(request: NextRequest) {
  const { success, error } = await renewData();
  if (error) {
    return new Response("Couldn't renew data");
  }

  return new Response("data renewed");
}
