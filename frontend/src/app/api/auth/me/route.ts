import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/jwt";

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("custom_access_token")?.value;

    if (!token) {
      return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload || !payload.sub) {
      return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
    }

    const supabase = createAdminClient();

    const { data: user, error } = await supabase
      .from("users")
      .select("id, name, email, role_id, department, designation, created_at, last_login, roles(role_name)")
      .eq("id", payload.sub)
      .single();

    if (error || !user) {
      return NextResponse.json({ detail: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      id: user.id,
      email: user.email,
      name: user.name,
      role: (Array.isArray(user.roles) ? user.roles[0]?.role_name : (user.roles as any)?.role_name) || "Viewer",
      department: user.department,
      designation: user.designation,
      createdAt: user.created_at,
      lastLogin: user.last_login,
    });
  } catch (err: any) {
    return NextResponse.json({ detail: "Internal server error" }, { status: 500 });
  }
}
