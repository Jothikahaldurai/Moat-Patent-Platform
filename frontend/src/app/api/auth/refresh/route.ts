import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { cookies } from "next/headers";
import { signToken, verifyToken } from "@/lib/jwt";

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get("custom_refresh_token")?.value;

    if (!refreshToken) {
      return NextResponse.json({ detail: "No refresh token provided." }, { status: 401 });
    }

    const payload = await verifyToken(refreshToken);
    if (!payload || !payload.sub) {
      return NextResponse.json({ detail: "Invalid refresh token." }, { status: 401 });
    }

    const supabase = createAdminClient();

    // Verify session exists and is active in DB
    const { data: session } = await supabase
      .from("user_sessions")
      .select("id")
      .eq("refresh_token", refreshToken)
      .eq("status", "Active")
      .single();

    if (!session) {
      return NextResponse.json({ detail: "Session expired or revoked." }, { status: 401 });
    }

    // Get user
    const { data: user } = await supabase
      .from("users")
      .select("id, email, name, roles(role_name)")
      .eq("id", payload.sub)
      .single();

    if (!user) {
      return NextResponse.json({ detail: "User not found." }, { status: 401 });
    }

    const roleName = (Array.isArray(user.roles) ? user.roles[0]?.role_name : (user.roles as any)?.role_name) || "Viewer";

    // Issue new access token
    const newAccessToken = await signToken({
      sub: user.id,
      email: user.email,
      role: roleName,
      name: user.name,
    }, "1h");

    // Update session in DB
    await supabase
      .from("user_sessions")
      .update({ jwt_token: newAccessToken })
      .eq("id", session.id);

    // Set new cookie
    cookieStore.set("custom_access_token", newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 3600,
      path: "/",
    });

    return NextResponse.json({ success: true, access_token: newAccessToken });
  } catch (err: any) {
    console.error("Refresh token error:", err);
    return NextResponse.json({ detail: "Internal server error" }, { status: 500 });
  }
}
