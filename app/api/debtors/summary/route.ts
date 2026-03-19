import { NextRequest, NextResponse } from "next/server";

const BACKEND_API_URL = process.env.BACKEND_API_URL || "http://localhost:5139";

/**
 * GET /api/debtors/summary
 * Proxy to backend: GET /api/my-business/debtors/summary
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const authHeader = request.headers.get("authorization");

    const backendUrl = new URL(
      `${BACKEND_API_URL}/api/my-business/debtors/summary`,
    );
    searchParams.forEach((value, key) => {
      backendUrl.searchParams.append(key, value);
    });

    const response = await fetch(backendUrl.toString(), {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...(authHeader && { Authorization: authHeader }),
      },
      cache: "no-store",
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Error fetching debtors summary:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch debtors summary",
      },
      { status: 500 },
    );
  }
}
