import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_API_URL;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const response = await fetch(`${BACKEND_URL}/api/auth/login/phone`, {
      method: "POST",
      headers: {
        accept: "*/*",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        phone: body?.phone ?? "",
        password: body?.password ?? "",
        deviceInfo: body?.deviceInfo ?? "",
      }),
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Error logging in with phone:", error);
    return NextResponse.json(
      { success: false, message: "Failed to login with phone" },
      { status: 500 },
    );
  }
}
