import { NextRequest, NextResponse } from "next/server";

const BACKEND_API_URL = process.env.BACKEND_API_URL || "http://localhost:5139";

/**
 * GET /api/imports/template
 * Proxy to backend: GET /api/my-business/accounting/import-template
 * Get import template schema
 */
export async function GET(request: NextRequest) {
  try {
    const response = await fetch(
      `${BACKEND_API_URL}/api/my-business/accounting/import-template`,
      {
        method: "GET",
        headers: {
          accept: "*/*",
        },
        cache: "no-store",
      },
    );

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Error fetching import template:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch import template",
      },
      { status: 500 },
    );
  }
}
