import { NextRequest } from "next/server";
import { AlertsController } from "@/modules/alerts/controller";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const resolved = await params;
  return AlertsController.getOne(req, { params: resolved });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const resolved = await params;
  return AlertsController.update(req, { params: resolved });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const resolved = await params;
  return AlertsController.delete(req, { params: resolved });
}
