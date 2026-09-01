import { NextRequest, NextResponse } from "next/server";
import { executeQuery } from "@/lib/supabase/mockDbHelper";

export async function POST(request: NextRequest) {
  try {
    const spec = await request.json();
    const result = await executeQuery(spec);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Mock API route error:", error);
    return NextResponse.json(
      { data: null, error: { message: error.message || "Internal server error" } },
      { status: 500 }
    );
  }
}
