import { NextRequest, NextResponse } from "next/server";
import { getBearerAuthorizationHeader } from "../../../_utils/authHeader";
import { createLocaleForwardHeaders } from "@/app/api/_utils/localeHeader";

const BACKEND_URL = process.env.BACKEND_API_URL;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
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

    const response = await fetch(`${BACKEND_URL}/api/auth/link/phone`, {
      method: "POST",
      headers: {
        accept: "*/*",
        "Content-Type": "application/json",
        Authorization: authHeader,
        ...createLocaleForwardHeaders(request),
      },
      body: JSON.stringify({
        phone: body?.phone ?? "",
        firebaseIdToken: body?.firebaseIdToken ?? "",
        ...(body?.password ? { password: body.password } : {}),
      }),
    });

    const raw = await response.text();
    let data: unknown = null;

    if (raw.trim().length > 0) {
      try {
        data = JSON.parse(raw);
      } catch {
        data = { message: raw };
      }
    }

    if (data === null) {
      return NextResponse.json(
        {
          success: response.ok,
          message: response.ok
            ? "Phone linked successfully"
            : "Backend returned empty response",
        },
        { status: response.status },
      );
    }

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Error linking phone:", error);
    return NextResponse.json(
      { success: false, message: "Failed to link phone" },
      { status: 500 },
    );
  }
}
