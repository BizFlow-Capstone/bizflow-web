import { NextRequest, NextResponse } from "next/server";
import { getBearerAuthorizationHeader } from "../_utils/authHeader";

const BACKEND_API_URL = process.env.BACKEND_API_URL || "http://localhost:5139";

/**
 * GET /api/debtors
 * Proxy to backend: GET /api/my-business/debtors
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const authHeader = getBearerAuthorizationHeader(request);
    if (!authHeader) {
      return NextResponse.json(
        {
          success: false,
          messageCode: "AUTH_UNAUTHORIZED",
          message: "Missing Authorization Bearer token",
        },
        { status: 401 },
      );
    }

    const backendUrl = new URL(`${BACKEND_API_URL}/api/my-business/debtors`);
    searchParams.forEach((value, key) => {
      backendUrl.searchParams.append(key, value);
    });

    const response = await fetch(backendUrl.toString(), {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader,
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
    const authHeader = getBearerAuthorizationHeader(request);
    if (!authHeader) {
      return NextResponse.json(
        {
          success: false,
          messageCode: "AUTH_UNAUTHORIZED",
          message: "Missing Authorization Bearer token",
        },
        { status: 401 },
      );
    }
    const body = await request.json();

    const response = await fetch(`${BACKEND_API_URL}/api/my-business/debtors`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader,
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
