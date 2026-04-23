import { NextRequest, NextResponse } from "next/server";
import { createLocaleForwardHeaders } from "@/app/api/_utils/localeHeader";

const BACKEND_URL = process.env.BACKEND_API_URL;

async function toJsonResponse(response: Response) {
  const raw = await response.text();
  if (!raw.trim()) {
    return NextResponse.json(
      {
        success: response.ok,
        message: response.ok
          ? "OTP verified successfully"
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
    const body = await request.json();

    const response = await fetch(
      `${BACKEND_URL}/api/auth/forgot-password/verify-otp`,
      {
        method: "POST",
        headers: {
          accept: "*/*",
          "Content-Type": "application/json",
          ...createLocaleForwardHeaders(request),
        },
        body: JSON.stringify({
          email: body?.email ?? "",
          otpCode: body?.otpCode ?? "",
        }),
      },
    );

    return await toJsonResponse(response);
  } catch (error) {
    console.error("Error verifying forgot-password OTP:", error);
    return NextResponse.json(
      { success: false, message: "Failed to verify OTP" },
      { status: 500 },
    );
  }
}
