import { NextRequest, NextResponse } from "next/server";

const BACKEND_API_URL = process.env.BACKEND_API_URL || "http://localhost:5139";

/**
 * GET /api/debtors/[debtorId]/payments
 * Proxy to backend: GET /api/my-business/debtors/{debtorId}/payments
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ debtorId: string }> },
) {
  try {
    const { debtorId } = await params;
    const authHeader = request.headers.get("authorization");

    const response = await fetch(
      `${BACKEND_API_URL}/api/my-business/debtors/${debtorId}/payments`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(authHeader && { Authorization: authHeader }),
        },
        cache: "no-store",
      },
    );

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Error fetching debtor payments:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch debtor payments",
      },
      { status: 500 },
    );
  }
}

/**
 * POST /api/debtors/[debtorId]/payments
 * Proxy to backend: POST /api/my-business/debtors/{debtorId}/payments
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ debtorId: string }> },
) {
  try {
    const { debtorId } = await params;
    const authHeader = request.headers.get("authorization");
    const body = await request.json();

    const response = await fetch(
      `${BACKEND_API_URL}/api/my-business/debtors/${debtorId}/payments`,
      {
        method: "POST",
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
    console.error("Error recording debtor payment:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to record debtor payment",
      },
      { status: 500 },
    );
  }
}
