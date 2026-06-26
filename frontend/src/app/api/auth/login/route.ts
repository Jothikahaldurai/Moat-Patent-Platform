import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { signToken } from "@/lib/jwt";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ detail: "Email and password are required." }, { status: 400 });
    }

    const supabase = createAdminClient();

    // 1. Fetch user by email
    const { data: user, error } = await supabase
      .from("users")
      .select("id, name, email, password_hash, role_id, is_active, roles(role_name)")
      .eq("email", email)
      .single();

    if (error || !user) {
      return NextResponse.json({ detail: "Account not found. Please contact your administrator." }, { status: 401 });
    }

    if (!user.is_active) {
      return NextResponse.json({ detail: "Account is disabled. Please contact your administrator." }, { status: 403 });
    }

    // 2. Validate password
    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      // Security measure: Do not differentiate between wrong email vs wrong password
      return NextResponse.json({ detail: "Account not found. Please contact your administrator." }, { status: 401 });
    }

    // 3. Issue JWT Tokens
    const roleName = (Array.isArray(user.roles) ? user.roles[0]?.role_name : (user.roles as any)?.role_name) || "Viewer";
    
    const payload = {
      sub: user.id,
      email: user.email,
      role: roleName,
      name: user.name,
    };

    const accessToken = await signToken(payload, "1h");
    const refreshToken = await signToken({ sub: user.id }, "7d");

    // 4. Update last login
    await supabase.from("users").update({ last_login: new Date().toISOString() }).eq("id", user.id);

    // 5. Audit Log & User Session
    const userAgent = request.headers.get("user-agent") || "Unknown";
    const ipAddress = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "Unknown";

    await supabase.from("user_sessions").insert({
      user_id: user.id,
      jwt_token: accessToken,
      refresh_token: refreshToken,
      device: userAgent,
      ip_address: ipAddress,
    });

    await supabase.from("audit_logs").insert({
      user_id: user.id,
      action: "Login",
      module: "Authentication",
      ip: ipAddress,
      browser: userAgent,
    });

    // 6. Set Cookies
    const cookieStore = await cookies();
    cookieStore.set("custom_access_token", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 3600, // 1 hour
      path: "/",
    });
    cookieStore.set("custom_refresh_token", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 3600, // 7 days
      path: "/api/auth/refresh",
    });

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: roleName,
      },
    });
  } catch (err: any) {
    console.error("Login error:", err);
    return NextResponse.json({ detail: "Internal server error" }, { status: 500 });
  }
}
