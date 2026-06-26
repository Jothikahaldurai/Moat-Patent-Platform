import { NextRequest } from "next/server";
import { NotificationsController } from "@/modules/notifications/controller";

export async function GET(req: NextRequest) {
  return NotificationsController.list(req);
}

export async function POST(req: NextRequest) {
  return NotificationsController.send(req);
}
