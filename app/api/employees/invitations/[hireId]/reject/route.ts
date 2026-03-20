import { NextRequest, NextResponse } from "next/server";
import { getBearerAuthorizationHeader } from "@/app/api/_utils/authHeader";

const BACKEND_API_URL = process.env.BACKEND_API_URL || "http://localhost:5139";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ hireId: string }> },
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

    const { hireId } = await context.params;
    const response = await fetch(
      `${BACKEND_API_URL}/api/my-employee/invitations/${hireId}/reject`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: authHeader,
        },
      },
    );

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Error rejecting invitation:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to reject invitation",
      },
      { status: 500 },
    );
  }
}
