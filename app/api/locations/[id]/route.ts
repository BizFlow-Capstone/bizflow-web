import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_API_URL;

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const authHeader = request.headers.get("authorization");

    const response = await fetch(`${BACKEND_URL}/api/location/me/owned/${id}`, {
      method: "PUT",
      headers: {
        accept: "*/*",
        "Content-Type": "application/json",
        ...(authHeader && { Authorization: authHeader }),
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Error updating location:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to update location",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const authHeader = request.headers.get("authorization");

    const response = await fetch(`${BACKEND_URL}/api/location/me/owned/${id}`, {
      method: "DELETE",
      headers: {
        accept: "*/*",
        ...(authHeader && { Authorization: authHeader }),
      },
    });

    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Error deleting location:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to delete location",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
