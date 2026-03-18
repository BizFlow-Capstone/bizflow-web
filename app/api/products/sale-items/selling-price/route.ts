import { NextRequest, NextResponse } from "next/server";

const BACKEND_API_URL = process.env.BACKEND_API_URL || "http://localhost:5139";

/**
 * PATCH /api/products/sale-items/selling-price
 * Proxy to backend: PATCH /api/my-business/products/sale-items/selling-price
 *
 * Adjust selected sale-item selling prices by fixed delta.
 * Positive delta increases price, negative delta decreases price. Owner only.
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const authHeader = request.headers.get("authorization");

    const response = await fetch(
      `${BACKEND_API_URL}/api/my-business/products/sale-items/selling-price`,
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
    console.error("Error adjusting sale item prices:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to adjust sale item prices",
      },
      { status: 500 },
    );
  }
}
