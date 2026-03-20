import { NextRequest, NextResponse } from "next/server";
import { getBearerAuthorizationHeader } from "@/app/api/_utils/authHeader";

const BACKEND_API_URL = process.env.BACKEND_API_URL || "http://localhost:5139";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const body = await request.json();
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
      `${BACKEND_API_URL}/api/locations/${id}/accounting/periods/opening-balance-suggestion`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: authHeader,
        },
        body: JSON.stringify(body),
      },
    );

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Error fetching opening balance suggestion:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch opening balance suggestion",
      },
      { status: 500 },
    );
  }
}
