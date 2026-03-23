import { NextRequest, NextResponse } from "next/server";
import { getBearerAuthorizationHeader } from "@/app/api/_utils/authHeader";

const BACKEND_API_URL = process.env.BACKEND_API_URL || "http://localhost:5139";

/**
 * GET /api/my-business/accounting/gl-entries
 * Proxy to backend: GET /api/my-business/accounting/gl-entries
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

    const backendUrl = new URL(
      `${BACKEND_API_URL}/api/my-business/accounting/gl-entries`,
    );
    const { searchParams } = new URL(request.url);
    searchParams.forEach((value, key) => {
      backendUrl.searchParams.append(key, value);
    });

    const response = await fetch(backendUrl.toString(), {
      method: "GET",
      headers: {
        accept: "*/*",
        Authorization: authHeader,
      },
      cache: "no-store",
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Error fetching GL entries:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch general ledger entries",
      },
      { status: 500 },
    );
  }
}
