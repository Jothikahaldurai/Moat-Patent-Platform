import { NextRequest, NextResponse } from "next/server";
import { DocumentsService } from "./service";
import { PatentDocumentSchema, DocumentVersionSchema, WorkflowTransitionSchema, ReviewCommentSchema } from "./validation";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/jwt";

const service = new DocumentsService();

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

export class DocumentsController {
  static async create(req: NextRequest) {
    try {
      const user = await getAuthUser();
      if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

      const body = await req.json();
      const parsed = PatentDocumentSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
      }

      const data = await service.createDocument(parsed.data, user.id);
      return NextResponse.json({ success: true, data });
    } catch (err: any) {
      console.error("DocumentsController.create ERROR:", err);
      return NextResponse.json({ error: err.message }, { status: 500 });
    }
  }

  static async list(req: NextRequest) {
    try {
      const user = await getAuthUser();
      if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

      const data = await service.getAllDocuments();
      return NextResponse.json({ success: true, data });
    } catch (err: any) {
      console.error("DocumentsController.list ERROR:", err);
      return NextResponse.json({ error: err.message }, { status: 500 });
    }
  }

  static async getById(req: NextRequest, { params }: { params: { id: string } }) {
    try {
      const user = await getAuthUser();
      if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

      const data = await service.getDocumentById(params.id);
      return NextResponse.json({ success: true, data });
    } catch (err: any) {
      console.error("DocumentsController.getById ERROR:", err);
      return NextResponse.json({ error: err.message }, { status: 500 });
    }
  }

  static async addVersion(req: NextRequest, { params }: { params: { id: string } }) {
    try {
      const user = await getAuthUser();
      if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

      const body = await req.json();
      const parsed = DocumentVersionSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
      }

      const data = await service.addVersion(params.id, parsed.data, user.id);
      return NextResponse.json({ success: true, data });
    } catch (err: any) {
      console.error("DocumentsController.addVersion ERROR:", err);
      return NextResponse.json({ error: err.message }, { status: 500 });
    }
  }

  static async transitionStatus(req: NextRequest, { params }: { params: { id: string } }) {
    try {
      const user = await getAuthUser();
      if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

      const body = await req.json();
      const parsed = WorkflowTransitionSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
      }

      // Fetch current status
      const doc = await service.getDocumentById(params.id);
      const previousStatus = doc.status;

      const data = await service.transitionStatus(params.id, previousStatus, parsed.data.new_status, user.id, parsed.data.notes);
      return NextResponse.json({ success: true, data });
    } catch (err: any) {
      console.error("DocumentsController.transitionStatus ERROR:", err);
      return NextResponse.json({ error: err.message }, { status: 500 });
    }
  }

  static async addComment(req: NextRequest, { params }: { params: { id: string } }) {
    try {
      const user = await getAuthUser();
      if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

      const body = await req.json();
      const parsed = ReviewCommentSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
      }

      const data = await service.addComment(params.id, parsed.data, user.id, user.role);
      return NextResponse.json({ success: true, data });
    } catch (err: any) {
      console.error("DocumentsController.addComment ERROR:", err);
      return NextResponse.json({ error: err.message }, { status: 500 });
    }
  }
}
