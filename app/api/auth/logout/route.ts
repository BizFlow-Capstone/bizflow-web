import { NextRequest, NextResponse } from "next/server";
import { getBearerAuthorizationHeader } from "../../_utils/authHeader";

const BACKEND_URL = process.env.BACKEND_API_URL;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const authorization = getBearerAuthorizationHeader(request);
    if (!authorization) {
      return NextResponse.json(
        {
          success: false,
          messageCode: "AUTH_UNAUTHORIZED",
          message: "Missing Authorization Bearer token",
        },
        { status: 401 },
      );
    }

    const response = await fetch(`${BACKEND_URL}/api/auth/logout`, {
      method: "POST",
      headers: {
        accept: "*/*",
        "Content-Type": "application/json",
        Authorization: authorization,
      },
      body: JSON.stringify({
        refreshToken: body?.refreshToken ?? "",
        deviceInfo: body?.deviceInfo ?? "",
      }),
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Error logging out:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to logout",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
