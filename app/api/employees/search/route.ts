import { NextRequest, NextResponse } from "next/server";
import { getBearerAuthorizationHeader } from "../../_utils/authHeader";

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
    const backendUrl = new URL(`${BACKEND_API_URL}/api/my-employee/search`);
    searchParams.forEach((value, key) => {
      backendUrl.searchParams.append(key, value);
    });

    const response = await fetch(backendUrl.toString(), {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader,
      },
      cache: "no-store",
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Error searching employees:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to search employees",
        data: [],
      },
      { status: 500 },
    );
  }
}
