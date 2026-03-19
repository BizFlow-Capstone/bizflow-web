import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_API_URL;

export async function POST(request: NextRequest) {
  try {
    const authorization = request.headers.get("authorization") ?? "";

    const response = await fetch(`${BACKEND_URL}/api/auth/logout-all`, {
      method: "POST",
      headers: {
        accept: "*/*",
        ...(authorization ? { Authorization: authorization } : {}),
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
