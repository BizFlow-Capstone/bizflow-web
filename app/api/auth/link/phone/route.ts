import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_API_URL;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const authHeader = request.headers.get("authorization") ?? "";

    const response = await fetch(`${BACKEND_URL}/api/auth/link/phone`, {
      method: "POST",
      headers: {
        accept: "*/*",
        "Content-Type": "application/json",
        Authorization: authHeader,
      },
      body: JSON.stringify({
        phone: body?.phone ?? "",
        firebaseIdToken: body?.firebaseIdToken ?? "",
        ...(body?.password ? { password: body.password } : {}),
      }),
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Error linking phone:", error);
    return NextResponse.json(
      { success: false, message: "Failed to link phone" },
      { status: 500 },
    );
  }
}
