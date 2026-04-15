import { NextRequest, NextResponse } from "next/server";
import { getBearerAuthorizationHeader } from "@/app/api/_utils/authHeader";

const AI_BACKEND_API_URL =
  process.env.AI_BACKEND_API_URL ||
  process.env.BACKEND_API_URL ||
  "http://localhost:8080";

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
    const locationId = searchParams.get("locationId");

    if (!locationId) {
      return NextResponse.json(
        {
          success: false,
          messageCode: "VALIDATION_ERROR",
          message: "locationId is required",
        },
        { status: 400 },
      );
    }

    const backendUrl = new URL(
      `${AI_BACKEND_API_URL}/api/my-business/ai/reorder`,
    );
    backendUrl.searchParams.set("locationId", locationId);

    const response = await fetch(backendUrl.toString(), {
      method: "GET",
      headers: {
        accept: "*/*",
        Authorization: authHeader,
      },
      cache: "no-store",
    });

    const raw = await response.text();
    let data: unknown = null;

    try {
      data = raw ? JSON.parse(raw) : null;
    } catch {
      data = {
        success: false,
        message: raw || "Invalid backend response",
      };
    }

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Error fetching AI reorder suggestions:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch AI reorder suggestions",
      },
      { status: 500 },
    );
  }
}
