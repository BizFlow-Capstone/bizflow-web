import { NextRequest, NextResponse } from "next/server";
import { createLocaleForwardHeaders } from "@/app/api/_utils/localeHeader";
import { getBearerAuthorizationHeader } from "../../../_utils/authHeader";

const BACKEND_API_URL = process.env.BACKEND_API_URL || "http://localhost:5139";

/**
 * PATCH /api/debtors/[debtorId]/status
 * Proxy to backend: PATCH /api/my-business/debtors/{debtorId}/status
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ debtorId: string }> },
) {
  try {
    const { debtorId } = await params;
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

    const response = await fetch(
      `${BACKEND_API_URL}/api/my-business/debtors/${debtorId}/status`,
      {
        method: "PATCH",
        headers: {
          ...createLocaleForwardHeaders(request),
          "Content-Type": "application/json",
          Authorization: authHeader,
        },
        body: JSON.stringify(body),
      },
    );

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Error updating debtor status:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to update debtor status",
      },
      { status: 500 },
    );
  }
}
