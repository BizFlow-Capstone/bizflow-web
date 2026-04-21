import { NextRequest, NextResponse } from "next/server";
import { getBearerAuthorizationHeader } from "../../_utils/authHeader";

const BACKEND_API_URL = process.env.BACKEND_API_URL || "http://localhost:5139";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> },
) {
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

    const { orderId } = await params;
    const acceptLanguage = request.headers.get("Accept-Language") ?? "vi";
    const response = await fetch(
      `${BACKEND_API_URL}/api/my-business/accounting/orders/${orderId}`,
      {
        method: "GET",
        headers: {
          accept: "*/*",
          Authorization: authHeader,
          "Accept-Language": acceptLanguage,
        },
        cache: "no-store",
      },
    );

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Error fetching order detail:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch order detail",
      },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> },
) {
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

    const { orderId } = await params;
    const body = await request.json();
    const acceptLanguage = request.headers.get("Accept-Language") ?? "vi";
    const response = await fetch(
      `${BACKEND_API_URL}/api/my-business/accounting/orders/${orderId}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          accept: "*/*",
          Authorization: authHeader,
          "Accept-Language": acceptLanguage,
        },
        body: JSON.stringify(body),
      },
    );

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Error updating order:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to update order",
      },
      { status: 500 },
    );
  }
}
