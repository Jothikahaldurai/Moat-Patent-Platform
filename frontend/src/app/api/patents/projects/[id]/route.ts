import { NextRequest } from "next/server";
import { PatentsController } from "@/modules/patents/controller";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  return PatentsController.updateProject(req, { params: resolvedParams });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  return PatentsController.deleteProject(req, { params: resolvedParams });
}
