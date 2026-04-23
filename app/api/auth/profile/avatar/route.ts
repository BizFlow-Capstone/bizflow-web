import { NextRequest, NextResponse } from "next/server";
import { getBearerAuthorizationHeader } from "../../../_utils/authHeader";
import { createLocaleForwardHeaders } from "@/app/api/_utils/localeHeader";

const BACKEND_URL = process.env.BACKEND_API_URL;

async function toJsonResponse(response: Response) {
  const raw = await response.text();
  if (!raw.trim()) {
    return NextResponse.json(
      {
        success: response.ok,
        message: response.ok
          ? "Avatar updated successfully"
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

export async function PUT(request: NextRequest) {
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

    const incoming = await request.formData();
    const formData = new FormData();
    const avatar = incoming.get("avatar");
    const removeAvatar = incoming.get("removeAvatar");

    if (avatar instanceof File) {
      formData.append("avatar", avatar, avatar.name);
    }

    if (removeAvatar !== null) {
      formData.append("removeAvatar", String(removeAvatar));
    }

    const response = await fetch(`${BACKEND_URL}/api/auth/profile/avatar`, {
      method: "PUT",
      headers: {
        accept: "*/*",
        Authorization: authorization,
        ...createLocaleForwardHeaders(request),
      },
      body: formData,
    });

    return await toJsonResponse(response);
  } catch (error) {
    console.error("Error updating avatar:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update avatar" },
      { status: 500 },
    );
  }
}
