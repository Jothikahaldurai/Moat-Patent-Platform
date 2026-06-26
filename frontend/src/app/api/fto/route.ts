import { NextResponse } from "next/server";
import { completeJSON } from "@/lib/llm";
import { hasOpenAIKey } from "@/lib/openai";
import { parseConcepts } from "@/lib/analysis/shared";
import { FTO_SYSTEM, buildFtoUser, mockFto, type FtoAssessment } from "@/lib/analysis/fto";

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
    const ai = await completeJSON<Partial<FtoAssessment>>({
      system: FTO_SYSTEM,
      user: buildFtoUser(query, concepts),
      maxTokens: 2200,
      temperature: 0.3,
    });
    if (ai && Array.isArray(ai.blocking_patents) && ai.blocking_patents.length) {
      return NextResponse.json({ ...ai, source: "ai" });
    }
  }

  return NextResponse.json(mockFto(query, concepts));
}
