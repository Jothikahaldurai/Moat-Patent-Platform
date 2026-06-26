import { NextResponse } from "next/server";
import { completeJSON } from "@/lib/llm";
import { hasOpenAIKey } from "@/lib/openai";
import { parseConcepts } from "@/lib/analysis/shared";
import {
  LANDSCAPE_SYSTEM,
  buildLandscapeUser,
  mockLandscape,
  type LandscapeReport,
} from "@/lib/analysis/landscape";

export async function POST(request: Request) {
  let query = "";
  let concepts: string[] = [];
  try {
    const body = await request.json();
    query = typeof body?.query === "string" ? body.query : "";
    concepts = Array.isArray(body?.concepts) ? body.concepts : parseConcepts(body?.concepts);
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!query.trim()) {
    return NextResponse.json({ error: "A query is required" }, { status: 400 });
  }

  if (hasOpenAIKey) {
    const ai = await completeJSON<Partial<LandscapeReport>>({
      system: LANDSCAPE_SYSTEM,
      user: buildLandscapeUser(query, concepts),
      maxTokens: 2600,
      temperature: 0.4,
    });
    if (ai && Array.isArray(ai.top_assignees) && ai.top_assignees.length) {
      return NextResponse.json({ ...ai, source: "ai" });
    }
  }

  return NextResponse.json(mockLandscape(query, concepts));
}
