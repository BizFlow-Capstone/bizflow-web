import { NextRequest, NextResponse } from "next/server";
import { getBearerAuthorizationHeader } from "../../_utils/authHeader";

const BACKEND_URL = process.env.BACKEND_API_URL;

async function toJsonResponse(response: Response) {
  const raw = await response.text();
  if (!raw.trim()) {
    return NextResponse.json(
      {
        success: response.ok,
        message: response.ok
          ? "Profile request succeeded"
          : "Backend returned empty response",
      },
      { status: response.status },
    );
  }

  try {
    return NextResponse.json(JSON.parse(raw), { status: response.status });
  } catch {
    return NextResponse.json(
      { success: response.ok, message: raw },
      { status: response.status },
    );
  }
}

function getAuthResponse(request: NextRequest) {
  const authorization = getBearerAuthorizationHeader(request);
  if (!authorization) {
    return {
      authorization: null,
      response: NextResponse.json(
        {
          success: false,
          messageCode: "AUTH_UNAUTHORIZED",
          message: "Missing Authorization Bearer token",
        },
        { status: 401 },
      ),
    };
  }

  return { authorization, response: null };
}

export async function GET(request: NextRequest) {
  try {
    const auth = getAuthResponse(request);
    if (!auth.authorization) {
      return auth.response as NextResponse;
    }

    const response = await fetch(`${BACKEND_URL}/api/auth/profile`, {
      method: "GET",
      headers: {
        accept: "*/*",
        Authorization: auth.authorization,
      },
      cache: "no-store",
    });

    return await toJsonResponse(response);
  } catch (error) {
    console.error("Error getting profile:", error);
    return NextResponse.json(
      { success: false, message: "Failed to get profile" },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = getAuthResponse(request);
    if (!auth.authorization) {
      return auth.response as NextResponse;
    }

    const body = await request.json();
    const response = await fetch(`${BACKEND_URL}/api/auth/profile`, {
      method: "PUT",
      headers: {
        accept: "*/*",
        "Content-Type": "application/json",
        Authorization: auth.authorization,
      },
      body: JSON.stringify(body ?? {}),
    });

    return await toJsonResponse(response);
  } catch (error) {
    console.error("Error updating profile:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update profile" },
      { status: 500 },
    );
  }
}
