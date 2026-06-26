import { NextRequest } from "next/server";
import { DocumentsController } from "@/modules/documents/controller";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const resolved = await params;
  return DocumentsController.transitionStatus(req, { params: resolved });
}
