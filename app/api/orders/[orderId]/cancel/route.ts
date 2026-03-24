import { NextRequest, NextResponse } from "next/server";
import { getBearerAuthorizationHeader } from "../../../_utils/authHeader";

const BACKEND_API_URL = process.env.BACKEND_API_URL || "http://localhost:5139";

export async function POST(
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
    const response = await fetch(
      `${BACKEND_API_URL}/api/my-business/accounting/orders/${orderId}/cancel`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          accept: "*/*",
          Authorization: authHeader,
        },
        body: JSON.stringify(body),
      },
    );

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Error cancelling order:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to cancel order",
      },
      { status: 500 },
    );
  }
}
