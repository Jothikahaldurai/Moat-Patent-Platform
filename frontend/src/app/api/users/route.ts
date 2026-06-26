import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyToken } from "@/lib/jwt";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";

// Authentication Helper
async function getAuthUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("custom_access_token")?.value;
  if (!token) return null;
  try {
    const payload = await verifyToken(token);
    return payload;
  } catch (err) {
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user || (user.role !== "Admin" && user.role !== "Super Admin" && user.role !== "admin")) {
      return NextResponse.json({ detail: "Unauthorized" }, { status: 403 });
    }

    const supabase = createAdminClient();
    
    // Fetch all users with their roles
    const { data: users, error } = await supabase
      .from("users")
      .select(`
        id, 
        name, 
        email, 
        department, 
        designation, 
        status, 
        is_active, 
        last_login, 
        roles (
          role_name
        )
      `)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching users:", error);
      return NextResponse.json({ detail: "Database error" }, { status: 500 });
    }

    // Format the response
    const formattedUsers = users.map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      department: u.department || "N/A",
      designation: u.designation || "N/A",
      status: u.is_active ? "Active" : "Inactive",
      role: u.roles ? u.roles.role_name : "Unknown",
      lastLogin: u.last_login
    }));

    return NextResponse.json(formattedUsers);
  } catch (err: any) {
    console.error("GET users error:", err);
    return NextResponse.json({ detail: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthUser();
    if (!authUser || (authUser.role !== "Admin" && authUser.role !== "Super Admin" && authUser.role !== "admin")) {
      return NextResponse.json({ detail: "Unauthorized" }, { status: 403 });
    }

    const { name, email, role, department, password } = await request.json();

    if (!name || !email || !role || !password) {
      return NextResponse.json({ detail: "Name, email, password, and role are required." }, { status: 400 });
    }

    const supabase = createAdminClient();

    // 1. Check if email exists
    const { data: existingUser } = await supabase.from("users").select("id").eq("email", email).single();
    if (existingUser) {
      return NextResponse.json({ detail: "User with this email already exists." }, { status: 400 });
    }

    // 2. Get the role_id for the given role string
    const { data: roleData, error: roleError } = await supabase
      .from("roles")
      .select("id")
      .eq("role_name", role)
      .single();

    if (roleError || !roleData) {
      return NextResponse.json({ detail: `Role '${role}' not found in database.` }, { status: 400 });
    }

    // 3. Hash the provided password
    const passwordHash = await bcrypt.hash(password, 10);

    // 4. Insert User
    const { data: newUser, error: insertError } = await supabase
      .from("users")
      .insert({
        id: crypto.randomUUID(), // Explicitly generate ID since old db schema might lack default
        name,
        email,
        password_hash: passwordHash,
        password_plain: password, // For debug visibility as requested by user
        role_id: roleData.id,
        department: department || "General",
        status: "Active",
        is_active: true,
        created_by: authUser.sub
      })
      .select("id")
      .single();

    if (insertError) {
      console.error("Error creating user:", insertError);
      return NextResponse.json({ detail: `Failed to create user in database: ${insertError.message}` }, { status: 500 });
    }

    // 5. Audit Log
    await supabase.from("audit_logs").insert({
      user_id: authUser.sub,
      action: `Created User: ${email}`,
      module: "User Management",
      ip: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "Unknown",
    });

    return NextResponse.json({ 
      detail: "User created successfully.", 
      user: { id: newUser.id, name, email, role, department } 
    });

  } catch (err: any) {
    console.error("POST user error:", err);
    return NextResponse.json({ detail: "Internal server error" }, { status: 500 });
  }
}
