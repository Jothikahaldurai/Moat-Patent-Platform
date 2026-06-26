import { NextRequest } from "next/server";
import { WorkspaceController } from "@/modules/workspace/controller";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const resolved = await params;
  return WorkspaceController.getInvention(req, { params: resolved });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const resolved = await params;
  return WorkspaceController.updateInvention(req, { params: resolved });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const resolved = await params;
  return WorkspaceController.deleteInvention(req, { params: resolved });
}
