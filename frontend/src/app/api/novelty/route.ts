import { NextResponse } from "next/server";
import { completeJSON } from "@/lib/llm";
import { hasOpenAIKey } from "@/lib/openai";
import { parseConcepts } from "@/lib/analysis/shared";
import {
  NOVELTY_SYSTEM,
  buildNoveltyUser,
  mockNovelty,
  type NoveltyAssessment,
} from "@/lib/analysis/novelty";

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

  try {
    // Generate the base mock data for the complex UI visualizations
    const baseAssessment = mockNovelty(query, concepts);
    
    // Attempt to call the FastAPI backend for real intelligence scores
    // Note: Since we are running on the server side, we use the absolute URL or internal docker URL
    const backendUrl = process.env.API_URL || "http://127.0.0.1:8000/api/v1";
    const res = await fetch(`${backendUrl}/intelligence/novelty`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        invention_id: "inv_" + Date.now(),
        description: query,
        target_claims: concepts
      })
    });
    
    if (res.ok) {
      const backendData = await res.json();
      
      // Patch the frontend assessment with backend intelligence
      baseAssessment.novelty_score = backendData.novelty_score;
      baseAssessment.similarity_score = backendData.similarity_score;
      baseAssessment.source = "ai";
      
      if (backendData.white_space_opportunities && backendData.white_space_opportunities.length > 0) {
        baseAssessment.white_space_areas = backendData.white_space_opportunities.map((opp: string) => ({
          area: opp.substring(0, 30) + "...",
          openness: 80,
          filing_angle: opp
        }));
      }
    }
    
    return NextResponse.json(baseAssessment);
  } catch (error) {
    console.error("Backend intelligence failed, falling back to mock:", error);
    return NextResponse.json(mockNovelty(query, concepts));
  }
}
