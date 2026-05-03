import { NextRequest, NextResponse } from "next/server";
import { createLocaleForwardHeaders } from "@/app/api/_utils/localeHeader";
import { getBearerAuthorizationHeader } from "../../../_utils/authHeader";

const BACKEND_API_URL = process.env.BACKEND_API_URL || "http://localhost:5139";

/**
 * GET /api/products/[productId]/stock-movements
 * Proxy to backend: GET /api/my-business/product/{productId}/stock-movements
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

    const backendUrl = new URL(
      `${BACKEND_API_URL}/api/my-business/product/${productId}/stock-movements`,
    );
    request.nextUrl.searchParams.forEach((value, key) => {
      backendUrl.searchParams.set(key, value);
    });

    const response = await fetch(backendUrl, {
      method: "GET",
      headers: {
        ...createLocaleForwardHeaders(request),
        "Content-Type": "application/json",
        Authorization: authHeader,
      },
      cache: "no-store",
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Error fetching product stock movements:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch product stock movements",
        data: {
          items: [],
          pageNumber: 1,
          pageSize: 10,
          totalPages: 1,
          totalCount: 0,
          hasPreviousPage: false,
          hasNextPage: false,
        },
      },
      { status: 500 },
    );
  }
}
