import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_API_URL;

//trong request chứa token, nếu có thì mới truyền vào header Authorization ocnf không thì không truyền
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const response = await fetch(`${BACKEND_URL}/api/location/me/owned`, {
      method: "GET",
      headers: {
        accept: "*/*",
        ...(authHeader && { Authorization: authHeader }),
      },
    });

    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Error fetching locations:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch locations",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const authHeader = request.headers.get("authorization");

    const response = await fetch(`${BACKEND_URL}/api/location/create`, {
      method: "POST",
      headers: {
        accept: "*/*",
        "Content-Type": "application/json",
        ...(authHeader && { Authorization: authHeader }),
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Error creating location:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to create location",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
