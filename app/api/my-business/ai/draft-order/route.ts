import { NextRequest, NextResponse } from "next/server";
import { createLocaleForwardHeaders } from "@/app/api/_utils/localeHeader";
import { getBearerAuthorizationHeader } from "@/app/api/_utils/authHeader";

const AI_BACKEND_API_URL =
  process.env.AI_BACKEND_API_URL ||
  process.env.BACKEND_API_URL ||
  "http://localhost:8080";

export async function POST(request: NextRequest) {
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

    const incomingFormData = await request.formData();
    const audio = incomingFormData.get("audio");
    const locationId = incomingFormData.get("locationId");

    if (!(audio instanceof File)) {
      return NextResponse.json(
        {
          success: false,
          messageCode: "VALIDATION_ERROR",
          message: "audio file is required",
        },
        { status: 400 },
      );
    }

    if (!locationId) {
      return NextResponse.json(
        {
          success: false,
          messageCode: "VALIDATION_ERROR",
          message: "locationId is required",
        },
        { status: 400 },
      );
    }

    const backendFormData = new FormData();
    backendFormData.append("audio", audio, audio.name || "voice.webm");
    backendFormData.append("locationId", String(locationId));

    const response = await fetch(
      `${AI_BACKEND_API_URL}/api/my-business/ai/draft-order`,
      {
        method: "POST",
        headers: {
          ...createLocaleForwardHeaders(request),
          accept: "*/*",
          Authorization: authHeader,
        },
        body: backendFormData,
      },
    );

    const raw = await response.text();
    let data: unknown = null;

    try {
      data = raw ? JSON.parse(raw) : null;
    } catch {
      data = {
        success: false,
        message: raw || "Invalid backend response",
      };
    }

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Error creating AI draft order:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to create AI draft order",
      },
      { status: 500 },
    );
  }
}
