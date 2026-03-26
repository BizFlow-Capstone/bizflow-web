import { NextRequest, NextResponse } from "next/server";
import { getBearerAuthorizationHeader } from "../../_utils/authHeader";

const BACKEND_API_URL = process.env.BACKEND_API_URL || "http://localhost:5139";

interface Props {
  params: Promise<{
    userNotificationId: string;
  }>;
}

export async function GET(
  request: NextRequest,
  { params }: Props
) {
  const { userNotificationId } = await params;
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

    const response = await fetch(`${BACKEND_API_URL}/api/notifications/${userNotificationId}`, {
      method: "GET",
      headers: {
        Authorization: authHeader,
        "Accept": "application/json",
      },
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error(`Error fetching notification ${userNotificationId} detail:`, error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch notification detail",
      },
      { status: 500 },
    );
  }
}
