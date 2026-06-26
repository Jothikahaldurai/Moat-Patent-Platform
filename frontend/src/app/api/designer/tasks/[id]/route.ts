import { NextRequest } from "next/server";
import { DesignerController } from "@/modules/designer/controller";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const resolved = await params;
  return DesignerController.updateTaskStatus(req, { params: resolved });
}
