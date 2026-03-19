import { NextRequest, NextResponse } from "next/server";
import { getBearerAuthorizationHeader } from "../../_utils/authHeader";

const BACKEND_URL = process.env.BACKEND_API_URL;

export async function POST(request: NextRequest) {
  try {
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

    const response = await fetch(`${BACKEND_URL}/api/auth/logout-all`, {
      method: "POST",
      headers: {
        accept: "*/*",
        Authorization: authorization,
      },
    });

    const raw = await response.text();
    let data: unknown = null;

    if (raw.trim().length > 0) {
      try {
        data = JSON.parse(raw);
      } catch {
        data = { message: raw };
      }
    }

    if (data === null) {
      return NextResponse.json(
        {
          success: response.ok,
          message: response.ok
            ? "Logged out all devices successfully"
            : "Backend returned empty response",
        },
        { status: response.status },
      );
    }

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Error logging out all devices:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to logout all devices",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
