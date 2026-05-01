import { NextRequest, NextResponse } from "next/server";
import { createLocaleForwardHeaders } from "@/app/api/_utils/localeHeader";
import { getBearerAuthorizationHeader } from "../../_utils/authHeader";

const BACKEND_API_URL = process.env.BACKEND_API_URL || "http://localhost:5139";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ revenueId: string }> },
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

    const { revenueId } = await params;
    const response = await fetch(
      `${BACKEND_API_URL}/api/my-business/accounting/revenues/${revenueId}`,
      {
        method: "DELETE",
        headers: {
          ...createLocaleForwardHeaders(request),
          accept: "*/*",
          Authorization: authHeader,
        },
      },
    );

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Error deleting manual revenue:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to delete manual revenue",
      },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ revenueId: string }> },
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

    const { revenueId } = await params;
    const formData = await request.formData();
    const response = await fetch(
      `${BACKEND_API_URL}/api/my-business/accounting/revenues/${revenueId}`,
      {
        method: "PUT",
        headers: {
          ...createLocaleForwardHeaders(request),
          accept: "*/*",
          Authorization: authHeader,
        },
        body: formData,
      },
    );

    const data = await response.json().catch(async () => {
      const text = await response.text();
      return { success: false, message: text };
    });

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Error updating manual revenue:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to update manual revenue",
      },
      { status: 500 },
    );
  }
}
