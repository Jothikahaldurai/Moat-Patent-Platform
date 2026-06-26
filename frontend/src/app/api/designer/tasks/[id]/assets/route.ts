import { NextRequest } from "next/server";
import { DesignerController } from "@/modules/designer/controller";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const resolved = await params;
  return DesignerController.addAsset(req, { params: resolved });
}
