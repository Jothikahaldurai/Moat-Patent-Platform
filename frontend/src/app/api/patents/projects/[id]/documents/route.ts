import { NextRequest } from "next/server";
import { PatentsController } from "@/modules/patents/controller";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  return PatentsController.listDocuments(req, { params: resolvedParams });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  return PatentsController.uploadDocument(req, { params: resolvedParams });
}
