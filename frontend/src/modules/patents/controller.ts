import { NextRequest, NextResponse } from "next/server";
import { PatentsService } from "./service";
import { CreatePatentProjectSchema, UpdatePatentProjectSchema, UpdatePatentStatusSchema, PatentDocumentSchema } from "./validation";
import { createClient } from "@/lib/supabase/server";

const service = new PatentsService();

async function getAuthUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  return {
    id: user.id,
    name: user.user_metadata?.name || user.email?.split("@")[0] || "User",
    role: user.user_metadata?.role || "Patent Analyst",
  };
}

export class PatentsController {
  static async listProjects(req: NextRequest) {
    try {
      const data = await service.listProjects();
      return NextResponse.json({ data });
    } catch (err: any) {
      return NextResponse.json({ error: err.message }, { status: 500 });
    }
  }

  static async createProject(req: NextRequest) {
    try {
      const body = await req.json();
      const parsed = CreatePatentProjectSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
      }

      const user = await getAuthUser();
      if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      if (user.role === "CEO") {
        return NextResponse.json({ error: "CEO cannot create projects" }, { status: 403 });
      }

      const data = await service.createProject({
        title: parsed.data.title,
        description: parsed.data.description,
        status: parsed.data.status,
        filing_region: parsed.data.filing_region,
        created_by: user?.id || null
      });
      return NextResponse.json({ success: true, data });
    } catch (err: any) {
      return NextResponse.json({ error: err.message }, { status: 500 });
    }
  }

  static async updateProject(req: NextRequest, { params }: { params: { id: string } }) {
    try {
      const body = await req.json();
      const parsed = UpdatePatentProjectSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
      }

      const user = await getAuthUser();
      if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      if (user.role === "CEO") {
        return NextResponse.json({ error: "CEO can only update statuses" }, { status: 403 });
      }

      const data = await service.updateProject(params.id, parsed.data, user?.id);
      return NextResponse.json({ success: true, data });
    } catch (err: any) {
      return NextResponse.json({ error: err.message }, { status: 500 });
    }
  }

  static async deleteProject(req: NextRequest, { params }: { params: { id: string } }) {
    try {
      const user = await getAuthUser();
      if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      if (user.role !== "Admin") {
        return NextResponse.json({ error: "Only Admins can delete projects" }, { status: 403 });
      }

      await service.deleteProject(params.id);
      return NextResponse.json({ success: true });
    } catch (err: any) {
      return NextResponse.json({ error: err.message }, { status: 500 });
    }
  }

  static async updateStatus(req: NextRequest, { params }: { params: { id: string } }) {
    try {
      const body = await req.json();
      const parsed = UpdatePatentStatusSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
      }

      const data = await service.updateStatus(params.id, parsed.data.status, parsed.data.notes);
      return NextResponse.json({ success: true, data });
    } catch (err: any) {
      return NextResponse.json({ error: err.message }, { status: 500 });
    }
  }

  static async listPortfolio(req: NextRequest) {
    try {
      const data = await service.getPortfolio();
      return NextResponse.json({ data });
    } catch (err: any) {
      return NextResponse.json({ error: err.message }, { status: 500 });
    }
  }

  static async listDocuments(req: NextRequest, { params }: { params: { id: string } }) {
    try {
      const data = await service.listDocuments(params.id);
      return NextResponse.json({ data });
    } catch (err: any) {
      return NextResponse.json({ error: err.message }, { status: 500 });
    }
  }

  static async uploadDocument(req: NextRequest, { params }: { params: { id: string } }) {
    try {
      const user = await getAuthUser();
      if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      if (user.role === "CEO") {
        return NextResponse.json({ error: "CEO cannot upload documents" }, { status: 403 });
      }

      const body = await req.json();
      const parsed = PatentDocumentSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
      }
      
      const data = await service.uploadDocument(params.id, parsed.data.name, parsed.data.url, parsed.data.file_type, parsed.data.size);
      return NextResponse.json({ success: true, data });
    } catch (err: any) {
      return NextResponse.json({ error: err.message }, { status: 500 });
    }
  }
}

