import { NextRequest, NextResponse } from "next/server";
import { getBearerAuthorizationHeader } from "@/app/api/_utils/authHeader";

const BACKEND_API_URL = process.env.BACKEND_API_URL || "http://localhost:5139";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: locationId } = await params;
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
    const backendUrl = new URL(
      `${BACKEND_API_URL}/api/my-business/locations/${locationId}/products/quick-search`,
    );
    searchParams.forEach((value, key) => {
      if (value && value.trim() !== "") {
        backendUrl.searchParams.append(key, value);
      }
     });

    const response = await fetch(backendUrl.toString(), {
      method: "GET",
      headers: {
        accept: "*/*",
        Authorization: authHeader,
      },
      cache: "no-store",
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Error fetching quick search products:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch quick search products",
      },
      { status: 500 },
    );
  }
}
