import { NextRequest, NextResponse } from "next/server";
import { createLocaleForwardHeaders } from "@/app/api/_utils/localeHeader";
import { getBearerAuthorizationHeader } from "../../_utils/authHeader";

const BACKEND_API_URL = process.env.BACKEND_API_URL || "http://localhost:5139";

/**
 * GET /api/my-business/dashboard
 * Proxy to backend: GET /api/my-business/dashboard/summary
 * Passes Period, BusinessLocationId, ReferenceDate, FromDate, ToDate query params.
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

    const { searchParams } = new URL(request.url);
    const backendUrl = new URL(
      `${BACKEND_API_URL}/api/my-business/dashboard/summary`,
    );
    searchParams.forEach((value, key) =>
      backendUrl.searchParams.append(key, value),
    );

    const response = await fetch(backendUrl.toString(), {
      method: "GET",
      headers: {
        ...createLocaleForwardHeaders(request),
        "Content-Type": "application/json",
        Authorization: authHeader,
      },
      cache: "no-store",
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Error fetching dashboard summary:", error);
    return NextResponse.json(
      {
        success: false,
        messageCode: "INTERNAL_ERROR",
        message: "Failed to fetch dashboard summary",
      },
      { status: 500 },
    );
  }
}
