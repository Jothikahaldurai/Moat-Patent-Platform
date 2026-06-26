import { NextRequest } from "next/server";
import { PortfolioController } from "@/modules/portfolio/controller";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const resolved = await params;
  return PortfolioController.getOne(req, { params: resolved });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const resolved = await params;
  return PortfolioController.update(req, { params: resolved });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const resolved = await params;
  return PortfolioController.delete(req, { params: resolved });
}
