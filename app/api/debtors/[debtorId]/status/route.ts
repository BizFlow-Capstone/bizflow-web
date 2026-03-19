import { NextRequest, NextResponse } from "next/server";

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
    const authHeader = request.headers.get("authorization");
    const body = await request.json();

    const response = await fetch(
      `${BACKEND_API_URL}/api/my-business/debtors/${debtorId}/status`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(authHeader && { Authorization: authHeader }),
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
