import { NextRequest, NextResponse } from "next/server";

const BACKEND_API_URL = process.env.BACKEND_API_URL || "http://localhost:5139";

/**
 * GET /api/debtors
 * Proxy to backend: GET /api/my-business/debtors
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const authHeader = request.headers.get("authorization");

    const backendUrl = new URL(`${BACKEND_API_URL}/api/my-business/debtors`);
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
    console.error("Error fetching debtors:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch debtors",
      },
      { status: 500 },
    );
  }
}

/**
 * POST /api/debtors
 * Proxy to backend: POST /api/my-business/debtors
 */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const body = await request.json();

    const response = await fetch(`${BACKEND_API_URL}/api/my-business/debtors`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(authHeader && { Authorization: authHeader }),
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Error creating debtor:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to create debtor",
      },
      { status: 500 },
    );
  }
}
