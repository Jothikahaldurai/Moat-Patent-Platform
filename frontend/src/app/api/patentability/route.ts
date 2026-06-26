import { NextResponse } from "next/server";
import { completeJSON } from "@/lib/llm";
import { hasOpenAIKey } from "@/lib/openai";
import { parseConcepts } from "@/lib/analysis/shared";
import {
  PATENTABILITY_SYSTEM,
  buildPatentabilityUser,
  mockPatentability,
  type PatentabilityAssessment,
} from "@/lib/analysis/patentability";

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
    const baseAssessment = mockPatentability(query, concepts);
    
    // Attempt to call the FastAPI backend for real intelligence scores
    const backendUrl = process.env.API_URL || "http://127.0.0.1:8000/api/v1";
    const res = await fetch(`${backendUrl}/intelligence/patentability`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        invention_id: "inv_" + Date.now(),
        include_commercial_value: true
      })
    });
    
    if (res.ok) {
      const backendData = await res.json();
      
      // Patch the frontend assessment with backend intelligence
      baseAssessment.strength_score = backendData.patentability_score;
      baseAssessment.commercial_value_score = backendData.commercial_value_score;
      baseAssessment.risk_score = backendData.overall_risk === "High" ? 85 : backendData.overall_risk === "Medium" ? 50 : 15;
      baseAssessment.recommendation = backendData.filing_recommendation;
      baseAssessment.source = "ai";
    }
    
    return NextResponse.json(baseAssessment);
  } catch (error) {
    console.error("Backend intelligence failed, falling back to mock:", error);
    return NextResponse.json(mockPatentability(query, concepts));
  }
}
