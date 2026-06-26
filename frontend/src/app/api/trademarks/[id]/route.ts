import { NextRequest } from "next/server";
import { TrademarksController } from "@/modules/trademarks/controller";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const resolved = await params;
  return TrademarksController.getOne(req, { params: resolved });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const resolved = await params;
  return TrademarksController.update(req, { params: resolved });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const resolved = await params;
  return TrademarksController.delete(req, { params: resolved });
}
