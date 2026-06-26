import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { adminUpsertUser } from "@/lib/supabase/userService";
import type { AppRole } from "@/types";

const ALLOWED_ROLES: AppRole[] = [
  "Admin",
  "CEO",
  "CTO",
  "CIO",
  "Chief IP Officer",
  "Patent Analyst",
  "Inventor",
  "Business Development",
];

export async function POST(request: NextRequest) {
  try {
    const { name, email, password, role, department, company } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { detail: "Email and password are required." },
        { status: 400 }
      );
    }

    if (!name?.trim()) {
      return NextResponse.json(
        { detail: "Full name is required." },
        { status: 400 }
      );
    }

    const assignedRole: AppRole =
      ALLOWED_ROLES.includes(role) ? role : "Patent Analyst";

    const supabase = await createClient();

    // Create the Supabase Auth user
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name.trim(),
          role: assignedRole,
          department: department ?? null,
          company: company ?? null,
        },
      },
    });

    if (error || !data.user) {
      return NextResponse.json(
        { detail: error?.message ?? "Registration failed." },
        { status: 400 }
      );
    }

    // Upsert into public.users (in case the trigger hasn't fired yet)
    const profile = await adminUpsertUser({
      id: data.user.id,
      email: data.user.email!,
      name: name.trim(),
      role: assignedRole,
      department: department ?? undefined,
      company: company ?? undefined,
    });

    const user = {
      id: data.user.id,
      email: data.user.email!,
      name: profile?.name ?? name.trim(),
      role: (profile?.role as AppRole) ?? assignedRole,
      department: profile?.department ?? null,
      company: profile?.company ?? null,
      createdAt: profile?.createdAt ?? data.user.created_at,
    };

    return NextResponse.json({
      user,
      access_token: data.session?.access_token ?? null,
      refresh_token: data.session?.refresh_token ?? null,
      message: data.session
        ? "Account created successfully."
        : "Account created. Please check your email to confirm before signing in.",
    });
  } catch (err: any) {
    return NextResponse.json(
      { detail: err.message ?? "Internal server error" },
      { status: 500 }
    );
  }
}
