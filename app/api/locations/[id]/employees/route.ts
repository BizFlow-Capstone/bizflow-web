import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_API_URL;

// GET /api/locations/[id]/employees - Get employees assigned to a location
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const authHeader = request.headers.get("authorization");

    const response = await fetch(
      `${BACKEND_URL}/api/location/me/owned/${id}/employees`,
      {
        method: "GET",
        headers: {
          accept: "*/*",
          ...(authHeader && { Authorization: authHeader }),
        },
      },
    );

    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Error fetching location employees:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch location employees",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
