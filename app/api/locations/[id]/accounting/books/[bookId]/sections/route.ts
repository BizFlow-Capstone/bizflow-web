import { NextRequest, NextResponse } from "next/server";
import { getBearerAuthorizationHeader } from "@/app/api/_utils/authHeader";

const BACKEND_API_URL = process.env.BACKEND_API_URL || "http://localhost:5139";

type Context = { params: Promise<{ id: string; bookId: string }> };

export async function GET(request: NextRequest, context: Context) {
  try {
    const { id: locationId, bookId } = await context.params;
    const authHeader = getBearerAuthorizationHeader(request);

    if (!authHeader) {
      return NextResponse.json(
        { success: false, message: "Missing Authorization Bearer token" },
        { status: 401 },
      );
    }

    const response = await fetch(
      `${BACKEND_API_URL}/api/locations/${locationId}/accounting/books/${bookId}/sections`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: authHeader,
        },
        cache: "no-store",
      },
    );

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Error fetching book sections:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}
