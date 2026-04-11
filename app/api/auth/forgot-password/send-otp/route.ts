import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_API_URL;

async function toJsonResponse(response: Response) {
  const raw = await response.text();
  if (!raw.trim()) {
    return NextResponse.json(
      {
        success: response.ok,
        message: response.ok
          ? "OTP sent successfully"
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

    const response = await fetch(`${BACKEND_URL}/api/auth/forgot-password/send-otp`, {
      method: "POST",
      headers: {
        accept: "*/*",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email: body?.email ?? "" }),
    });

    return await toJsonResponse(response);
  } catch (error) {
    console.error("Error sending forgot-password OTP:", error);
    return NextResponse.json(
      { success: false, message: "Failed to send OTP" },
      { status: 500 },
    );
  }
}
