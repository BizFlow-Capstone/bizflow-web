import { NextRequest, NextResponse } from "next/server";

const BACKEND_API_URL = process.env.BACKEND_API_URL || "http://localhost:5139";

/**
 * GET /api/imports
 * Proxy to backend: GET /api/my-business/accounting/imports
 * List imports with filters and pagination
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const backendUrl = new URL(
      `${BACKEND_API_URL}/api/my-business/accounting/imports`,
    );
    searchParams.forEach((value, key) => {
      backendUrl.searchParams.append(key, value);
    });

    const response = await fetch(backendUrl.toString(), {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Error fetching imports:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch imports",
        data: {
          items: [],
          pageNumber: 1,
          pageSize: 10,
          totalPages: 0,
          totalCount: 0,
          hasPreviousPage: false,
          hasNextPage: false,
        },
      },
      { status: 500 },
    );
  }
}

/**
 * POST /api/imports
 * Proxy to backend: POST /api/my-business/accounting/import
 * Create a new import
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const response = await fetch(
      `${BACKEND_API_URL}/api/my-business/accounting/import`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      },
    );

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Error creating import:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to create import",
      },
      { status: 500 },
    );
  }
}
