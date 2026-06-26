import { NextRequest, NextResponse } from "next/server";
import { TrademarksService } from "./service";
import { TrademarkSchema, TrademarkFileSchema } from "./validation";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/jwt";

const service = new TrademarksService();

async function getAuthUser(req?: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get("custom_access_token")?.value;
  if (!token) return null;
  
  const payload = await verifyToken(token);
  if (!payload) return null;

  return {
    id: payload.sub as string,
    name: (payload.name as string) || (payload.email as string)?.split("@")[0] || "User",
    role: (payload.role as string) || "Patent Analyst",
  };
}

export class TrademarksController {
  static async list(req: NextRequest) {
    try {
      const { searchParams } = new URL(req.url);
      const type = searchParams.get("type") || undefined;
      const status = searchParams.get("status") || undefined;
      const search = searchParams.get("search") || undefined;

      const data = await service.getTrademarks({ type, status, search });
      return NextResponse.json({ data });
    } catch (err: any) {
      return NextResponse.json({ error: err.message }, { status: 500 });
    }
  }

  static async getOne(req: NextRequest, { params }: { params: { id: string } }) {
    try {
      const data = await service.getTrademark(params.id);
      return NextResponse.json({ data });
    } catch (err: any) {
      return NextResponse.json({ error: err.message }, { status: 500 });
    }
  }

  static async create(req: NextRequest) {
    try {
      const user = await getAuthUser();
      if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      if (user.role === "CEO") {
        return NextResponse.json({ error: "CEO cannot create trademarks" }, { status: 403 });
      }

      const body = await req.json();
      const parsed = TrademarkSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
      }

      const data = await service.createTrademark(parsed.data, user.name);
      return NextResponse.json({ success: true, data });
    } catch (err: any) {
      console.error("TrademarksController.create ERROR:", err);
      return NextResponse.json({ error: err.message }, { status: 500 });
    }
  }

  static async update(req: NextRequest, { params }: { params: { id: string } }) {
    try {
      const user = await getAuthUser();
      if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

      const body = await req.json();
      // Allow partial updates
      const data = await service.updateTrademark(params.id, body, user.name);
      return NextResponse.json({ success: true, data });
    } catch (err: any) {
      return NextResponse.json({ error: err.message }, { status: 500 });
    }
  }

  static async delete(req: NextRequest, { params }: { params: { id: string } }) {
    try {
      const user = await getAuthUser();
      if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      if (user.role !== "Admin") {
        return NextResponse.json({ error: "Only Admins can delete trademarks" }, { status: 403 });
      }

      await service.deleteTrademark(params.id, user.name);
      return NextResponse.json({ success: true });
    } catch (err: any) {
      return NextResponse.json({ error: err.message }, { status: 500 });
    }
  }

  static async uploadAttachment(req: NextRequest, { params }: { params: { id: string } }) {
    try {
      const body = await req.json();
      const parsed = TrademarkFileSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
      }

      const file = await service.addAttachment(
        params.id,
        parsed.data.name,
        parsed.data.url,
        parsed.data.size,
        parsed.data.type
      );
      return NextResponse.json({ success: true, data: file });
    } catch (err: any) {
      return NextResponse.json({ error: err.message }, { status: 500 });
    }
  }

  static async deleteAttachment(req: NextRequest, { params }: { params: { id: string } }) {
    try {
      const user = await getAuthUser();
      if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      if (user.role === "CEO") {
        return NextResponse.json({ error: "CEO cannot delete attachments" }, { status: 403 });
      }

      const { searchParams } = new URL(req.url);
      const fileId = searchParams.get("fileId");
      const fileName = searchParams.get("fileName") || "file";
      if (!fileId) return NextResponse.json({ error: "Missing fileId" }, { status: 400 });

      await service.removeAttachment(params.id, fileId, fileName);
      return NextResponse.json({ success: true });
    } catch (err: any) {
      return NextResponse.json({ error: err.message }, { status: 500 });
    }
  }
}
