import { NextRequest, NextResponse } from "next/server";
import { getBearerAuthorizationHeader } from "../../_utils/authHeader";

const BACKEND_API_URL = process.env.BACKEND_API_URL || "http://localhost:5139";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ costId: string }> },
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

    const { costId } = await params;
    const formData = await request.formData();
    const response = await fetch(
      `${BACKEND_API_URL}/api/my-business/accounting/costs/${costId}`,
      {
        method: "PUT",
        headers: {
          accept: "*/*",
          Authorization: authHeader,
        },
        body: formData,
      },
    );

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Error updating manual cost:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to update manual cost",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ costId: string }> },
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

    const { costId } = await params;
    const response = await fetch(
      `${BACKEND_API_URL}/api/my-business/accounting/costs/${costId}`,
      {
        method: "DELETE",
        headers: {
          accept: "*/*",
          Authorization: authHeader,
        },
      },
    );

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Error deleting manual cost:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to delete manual cost",
      },
      { status: 500 },
    );
  }
}
