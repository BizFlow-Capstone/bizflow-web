import { NextRequest, NextResponse } from "next/server";
import { getBearerAuthorizationHeader } from "../../_utils/authHeader";
import { createLocaleForwardHeaders } from "../../_utils/localeHeader";

const BACKEND_API_URL = process.env.BACKEND_API_URL || "http://localhost:5139";

// GET /api/my-employee/employees
// Proxy to backend endpoint used by location assignment flow.
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
      `${BACKEND_API_URL}/api/my-employee/employees`,
      {
        method: "GET",
        headers: {
          accept: "*/*",
          Authorization: authHeader,
          ...createLocaleForwardHeaders(request),
        },
        cache: "no-store",
      },
    );

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Error fetching my employees:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch my employees",
        data: { employees: [] },
      },
      { status: 500 },
    );
  }
}
