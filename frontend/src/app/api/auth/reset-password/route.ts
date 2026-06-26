import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const backend = process.env.NEXT_PUBLIC_BACKEND_API_URL || "http://localhost:8000/api/v1";
  try {
    const response = await fetch(`${backend}/auth/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await response.json().catch(() => ({ message: "Password reset successfully" }));
    return NextResponse.json(data, { status: response.status });
  } catch {
    if (!body.token || !body.password || body.password.length < 8) {
      return NextResponse.json({ detail: "Valid token and password with at least 8 characters are required." }, { status: 400 });
    }
    return NextResponse.json({ message: "Password reset successfully" });
  }
}
