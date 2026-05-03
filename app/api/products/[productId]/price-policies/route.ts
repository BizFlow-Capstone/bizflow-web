import { NextRequest, NextResponse } from "next/server";
import { createLocaleForwardHeaders } from "@/app/api/_utils/localeHeader";
import { getBearerAuthorizationHeader } from "../../../_utils/authHeader";

const BACKEND_API_URL = process.env.BACKEND_API_URL || "http://localhost:5139";

/**
 * GET /api/products/[productId]/price-policies
 * Proxy to backend: GET /api/my-business/product/{productId}/price-policies
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> },
) {
  try {
    const { productId } = await params;
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
      `${BACKEND_API_URL}/api/my-business/product/${productId}/price-policies`,
      {
        method: "GET",
        headers: {
          ...createLocaleForwardHeaders(request),
          "Content-Type": "application/json",
          Authorization: authHeader,
        },
        cache: "no-store",
      },
    );

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Error fetching product price policies:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch product price policies",
        data: {
          productId: 0,
          saleItems: [],
        },
      },
      { status: 500 },
    );
  }
}
