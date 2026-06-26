import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { detail: "Email is required." },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    const { data: userList, error: lookupError } = await supabase.auth.admin.listUsers();

    if (lookupError) {
      return NextResponse.json({ detail: lookupError.message }, { status: 500 });
    }

    const user = userList.users.find((u) => u.email === email);

    if (!user) {
      return NextResponse.json(
        { detail: "User not found." },
        { status: 404 }
      );
    }

    if (user.email_confirmed_at) {
      return NextResponse.json({ detail: "Email already confirmed." });
    }

    const { error: updateError } = await supabase.auth.admin.updateUserById(
      user.id,
      { email_confirm: true }
    );

    if (updateError) {
      return NextResponse.json({ detail: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ detail: "Email confirmed successfully." });
  } catch (err: any) {
    return NextResponse.json(
      { detail: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}
