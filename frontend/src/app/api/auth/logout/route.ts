import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/jwt";

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get("custom_access_token")?.value;

    if (accessToken) {
      const payload = await verifyToken(accessToken);
      if (payload && payload.sub) {
        const supabase = createAdminClient();
        
        // Mark session as inactive
        await supabase
          .from("user_sessions")
          .update({ status: "Inactive", logout_time: new Date().toISOString() })
          .eq("jwt_token", accessToken);
          
        // Log audit
        await supabase.from("audit_logs").insert({
          user_id: payload.sub,
          action: "Logout",
          module: "Authentication",
          ip: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip"),
          browser: request.headers.get("user-agent"),
        });
      }
    }

    // Clear cookies
    cookieStore.delete("custom_access_token");
    cookieStore.delete({
      name: "custom_refresh_token",
      path: "/api/auth/refresh",
    });

    return NextResponse.json({ message: "Logged out successfully" });
  } catch (err: any) {
    console.error("Logout error:", err);
    return NextResponse.json({ detail: "Internal server error" }, { status: 500 });
  }
}
