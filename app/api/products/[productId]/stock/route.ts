import { NextRequest, NextResponse } from "next/server";
import { getBearerAuthorizationHeader } from "../../../_utils/authHeader";

const BACKEND_API_URL = process.env.BACKEND_API_URL || "http://localhost:5139";

/**
 * PATCH /api/products/[productId]/stock
 * Proxy to backend: PATCH /api/my-business/product/{productId}/stock
 *
 * Manual stock adjustment with optional memo.
 * Increase creates import + stock movement. Decrease creates stock movement only.
 * Owner only.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> },
) {
  try {
    const { productId } = await params;
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
      `${BACKEND_API_URL}/api/my-business/product/${productId}/stock`,
      {
        method: "PATCH",
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
    console.error("Error adjusting product stock:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to adjust product stock",
      },
      { status: 500 },
    );
  }
}
