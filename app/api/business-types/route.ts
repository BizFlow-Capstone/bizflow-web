import { NextRequest, NextResponse } from "next/server";
import { createLocaleForwardHeaders } from "@/app/api/_utils/localeHeader";
import { getBearerAuthorizationHeader } from "../_utils/authHeader";

const BACKEND_API_URL = process.env.BACKEND_API_URL || "http://localhost:5139";

/**
 * GET /api/business-types
 * Proxy to backend: GET /api/business-types
 * Get all business types for filter tags
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

    const response = await fetch(`${BACKEND_API_URL}/api/business-types`, {
      method: "GET",
      headers: {
        ...createLocaleForwardHeaders(request),
        accept: "*/*",
        Authorization: authHeader,
      },
      cache: "no-store",
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Error fetching business types:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch business types",
      },
      { status: 500 },
    );
  }
}
