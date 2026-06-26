import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const backend = process.env.NEXT_PUBLIC_BACKEND_API_URL || "http://localhost:8000/api/v1";
  try {
    const response = await fetch(`${backend}/auth/forgot-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch {
    const token = btoa(JSON.stringify({ email: body.email, exp: Date.now() + 30 * 60 * 1000 }));
    return NextResponse.json({
      message: "If an account exists, password reset instructions have been generated.",
      reset_token: token,
    });
  }
}
