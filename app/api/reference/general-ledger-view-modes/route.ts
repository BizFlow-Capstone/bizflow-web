import { NextRequest, NextResponse } from "next/server";
import { getBearerAuthorizationHeader } from "@/app/api/_utils/authHeader";

const BACKEND_API_URL = process.env.BACKEND_API_URL || "http://localhost:5139";

/**
 * GET /api/reference/general-ledger-view-modes
 * Proxy to backend: GET /api/reference/general-ledger-view-modes
 */
export async function GET(request: NextRequest) {
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

    const response = await fetch(
      `${BACKEND_API_URL}/api/reference/general-ledger-view-modes`,
      {
        method: "GET",
        headers: {
          accept: "*/*",
          Authorization: authHeader,
        },
        cache: "no-store",
      },
    );

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Error fetching GL view modes:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch general ledger view modes",
      },
      { status: 500 },
    );
  }
}
