import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("activity_logs")
      .select("*")
      .eq("entity_type", "notification")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return NextResponse.json(data || []);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const supabase = createAdminClient();

    if (id) {
      const { error } = await supabase
        .from("activity_logs")
        .update({ action: "read" })
        .eq("id", id);
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from("activity_logs")
        .update({ action: "read" })
        .eq("entity_type", "notification");
      if (error) throw error;
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
