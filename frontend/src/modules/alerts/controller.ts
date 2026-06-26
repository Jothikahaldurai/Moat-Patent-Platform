import { NextRequest, NextResponse } from "next/server";
import { AlertsService } from "./service";
import { AlertSchema } from "./validation";
import { createAdminClient } from "@/lib/supabase/admin";

const service = new AlertsService();

export class AlertsController {
  static async list(req: NextRequest) {
    try {
      const supabase = createAdminClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

      const data = await service.getUserAlerts(user.id);
      return NextResponse.json({ data });
    } catch (err: any) {
      return NextResponse.json({ error: err.message }, { status: 500 });
    }
  }

  static async getOne(req: NextRequest, { params }: { params: { id: string } }) {
    try {
      const data = await service.getAlert(params.id);
      return NextResponse.json({ data });
    } catch (err: any) {
      return NextResponse.json({ error: err.message }, { status: 404 });
    }
  }

  static async create(req: NextRequest) {
    try {
      const body = await req.json();
      const parsed = AlertSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
      }

      const supabase = createAdminClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

      const data = await service.createAlert({
        ...parsed.data,
        user_id: user.id
      });
      return NextResponse.json({ success: true, data });
    } catch (err: any) {
      return NextResponse.json({ error: err.message }, { status: 500 });
    }
  }

  static async update(req: NextRequest, { params }: { params: { id: string } }) {
    try {
      const body = await req.json();
      const data = await service.updateAlert(params.id, body);
      return NextResponse.json({ success: true, data });
    } catch (err: any) {
      return NextResponse.json({ error: err.message }, { status: 500 });
    }
  }

  static async delete(req: NextRequest, { params }: { params: { id: string } }) {
    try {
      await service.removeAlert(params.id);
      return NextResponse.json({ success: true });
    } catch (err: any) {
      return NextResponse.json({ error: err.message }, { status: 500 });
    }
  }
}
