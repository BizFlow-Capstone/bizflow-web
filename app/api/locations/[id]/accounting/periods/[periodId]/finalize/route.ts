import { NextRequest, NextResponse } from "next/server";
import { createLocaleForwardHeaders } from "@/app/api/_utils/localeHeader";
import { getBearerAuthorizationHeader } from "@/app/api/_utils/authHeader";

const BACKEND_API_URL = process.env.BACKEND_API_URL || "http://localhost:5139";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string; periodId: string }> },
) {
  try {
    const { id, periodId } = await context.params;
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
      `${BACKEND_API_URL}/api/locations/${id}/accounting/periods/${periodId}/finalize`,
      {
        method: "POST",
        headers: {
          ...createLocaleForwardHeaders(request),
          "Content-Type": "application/json",
          Authorization: authHeader,
        },
      },
    );

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Error finalizing accounting period:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to finalize accounting period",
      },
      { status: 500 },
    );
  }
}
