import { NextRequest, NextResponse } from "next/server";
import { getBearerAuthorizationHeader } from "../_utils/authHeader";

const BACKEND_API_URL = process.env.BACKEND_API_URL || "http://localhost:5139";

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const response = await fetch(`${BACKEND_API_URL}/api/notifications?${searchParams.toString()}`, {
      method: "GET",
      headers: {
        Authorization: authHeader,
        "Accept": "application/json",
      },
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch notifications",
      },
      { status: 500 },
    );
  }
}
