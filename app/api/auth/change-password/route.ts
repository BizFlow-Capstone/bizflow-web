import { NextRequest, NextResponse } from "next/server";
import { getBearerAuthorizationHeader } from "../../_utils/authHeader";
import { createLocaleForwardHeaders } from "@/app/api/_utils/localeHeader";

const BACKEND_URL = process.env.BACKEND_API_URL;

async function toJsonResponse(response: Response) {
  const raw = await response.text();
  if (!raw.trim()) {
    return NextResponse.json(
      {
        success: response.ok,
        message: response.ok
          ? "Password changed successfully"
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

export async function POST(request: NextRequest) {
  try {
    const authorization = getBearerAuthorizationHeader(request);
    if (!authorization) {
      return NextResponse.json(
        {
          success: false,
          messageCode: "AUTH_UNAUTHORIZED",
          message: "Missing Authorization Bearer token",
        },
        { status: 401 },
      );
    }

    const body = await request.json();
    const response = await fetch(`${BACKEND_URL}/api/auth/change-password`, {
      method: "POST",
      headers: {
        accept: "*/*",
        "Content-Type": "application/json",
        Authorization: authorization,
        ...createLocaleForwardHeaders(request),
      },
      body: JSON.stringify({
        currentPassword: body?.currentPassword ?? "",
        newPassword: body?.newPassword ?? "",
      }),
    });

    return await toJsonResponse(response);
  } catch (error) {
    console.error("Error changing password:", error);
    return NextResponse.json(
      { success: false, message: "Failed to change password" },
      { status: 500 },
    );
  }
}
