import { NextRequest, NextResponse } from "next/server";
import { createLocaleForwardHeaders } from "@/app/api/_utils/localeHeader";

const BACKEND_URL =
  process.env.BACKEND_API_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL;

export async function POST(request: NextRequest) {
  try {
    if (!BACKEND_URL) {
      return NextResponse.json(
        {
          success: false,
          message: "Missing backend API URL configuration",
        },
        { status: 500 },
      );
    }

    const body = await request.json();

    const response = await fetch(`${BACKEND_URL}/api/auth/google`, {
      method: "POST",
      headers: {
        accept: "*/*",
        "Content-Type": "application/json",
        ...createLocaleForwardHeaders(request),
      },
      body: JSON.stringify({
        idToken: body?.idToken ?? "",
        deviceInfo: body?.deviceInfo ?? "",
      }),
    });

    const raw = await response.text();
    let data: unknown = null;
    try {
      data = raw ? JSON.parse(raw) : null;
    } catch {
      data = { success: false, message: raw || "Invalid backend response" };
    }

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Error logging in with Google:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to login with Google",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
