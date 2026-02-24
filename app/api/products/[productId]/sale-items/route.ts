import { NextRequest, NextResponse } from "next/server";

const BACKEND_API_URL = process.env.BACKEND_API_URL || "http://localhost:5139";

/**
 * GET /api/products/[productId]/sale-items
 * Proxy to backend: GET /api/my-business/product/{productId}/sale-items
 * Get product price tiers (sale items)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> },
) {
  try {
    const { productId } = await params;

    const response = await fetch(
      `${BACKEND_API_URL}/api/my-business/product/${productId}/sale-items`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-store",
      },
    );

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Error fetching sale items:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch sale items",
        data: {
          productId: 0,
          saleItems: [],
        },
      },
      { status: 500 },
    );
  }
}
