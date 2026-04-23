import { NextRequest, NextResponse } from "next/server";
import { createLocaleForwardHeaders } from "@/app/api/_utils/localeHeader";
import { getBearerAuthorizationHeader } from "../../_utils/authHeader";

const BACKEND_API_URL = process.env.BACKEND_API_URL || "http://localhost:5139";

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

    const formData = await request.formData();
    const response = await fetch(
      `${BACKEND_API_URL}/api/my-business/accounting/costs/manual`,
      {
        method: "POST",
        headers: {
          ...createLocaleForwardHeaders(request),
          accept: "*/*",
          Authorization: authHeader,
        },
        body: formData,
      },
    );

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Error creating manual cost:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to create manual cost",
      },
      { status: 500 },
    );
  }
}
