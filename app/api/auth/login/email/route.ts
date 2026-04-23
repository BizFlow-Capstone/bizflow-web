import { NextRequest, NextResponse } from "next/server";
import { createLocaleForwardHeaders } from "@/app/api/_utils/localeHeader";

const BACKEND_URL = process.env.BACKEND_API_URL;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const response = await fetch(`${BACKEND_URL}/api/auth/login/email`, {
      method: "POST",
      headers: {
        accept: "*/*",
        "Content-Type": "application/json",
        ...createLocaleForwardHeaders(request),
      },
      body: JSON.stringify({
        email: body?.email ?? "",
        password: body?.password ?? "",
        deviceInfo: body?.deviceInfo ?? "",
      }),
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Error logging in with email:", error);
    return NextResponse.json(
      { success: false, message: "Failed to login with email" },
      { status: 500 },
    );
  }
}
