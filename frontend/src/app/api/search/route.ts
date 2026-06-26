import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Simple in-memory cache for search queries
const searchCache = new Map<string, { data: any, timestamp: number }>();
const CACHE_TTL_MS = 60 * 1000; // 60 seconds

function hashQuery(body: any): string {
  return JSON.stringify(body);
}

function parseFilters(options: any = {}) {
  return options.filters || {};
}

function scorePatent(p: any, query: string, modes: string[]) {
  // Mock scoring for hybrid/semantic feel based on the data
  let relevance = 85;
  if (query) {
    const qTerms = query.toLowerCase().split(/\s+/);
    const text = `${p.title || ""} ${p.abstract || ""} ${p.description || ""} ${p.claims || ""}`.toLowerCase();
    const hits = qTerms.filter((term) => text.includes(term)).length;
    relevance = qTerms.length ? Math.min(100, Math.round((hits / qTerms.length) * 82 + 12)) : 75;
  }
  const semantic = Math.min(99, Math.max(55, relevance - 5));
  const citation = Math.min(100, Math.round(Math.log1p(p.citations || 0) / Math.log(100) * 100));
  const novelty = Math.max(8, Math.min(98, 100 - Math.round(relevance * 0.42) + 15));
  const hybrid = Math.round(semantic * 0.35 + relevance * 0.35 + citation * 0.15 + novelty * 0.15);
  
  return { semantic_score: semantic, citation_score: citation, novelty_score: novelty, relevance_score: relevance, hybrid_score: hybrid };
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { query, searchType = "keyword", options = {} } = body;
    
    // 1. Caching
    const cacheKey = hashQuery(body);
    const cached = searchCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      console.log(`[Search API] Cache hit for query: ${query}`);
      return NextResponse.json(cached.data);
    }

    const supabase = await createClient();
    const filters = parseFilters(options);
    
    // 2. Pagination
    const page = Number(options.page) || 1;
    const pageSize = Number(options.resultsCount) || 10;
    const offset = (page - 1) * pageSize;

    // 3. Construct Query
    let dbQuery = supabase.from("patent_search").select("*", { count: "exact" });

    // Handle string query (FTS or basic search)
    const searchString = typeof query === "string" ? query : JSON.stringify(query);
    if (searchString && searchString.trim() !== "") {
      if (searchType === "numbers") {
        dbQuery = dbQuery.ilike("patent_number", `%${searchString.trim()}%`);
      } else {
        // Use Full Text Search if valid terms exist, else fallback to ilike
        const terms = searchString.trim().split(/\s+/).map(t => `'${t}'`).join(' | ');
        if (terms) {
          dbQuery = dbQuery.textSearch("fts", terms);
        }
      }
    }

    // Apply Fielded Filters
    if (filters.country) dbQuery = dbQuery.eq("country", filters.country);
    if (filters.status) dbQuery = dbQuery.eq("status", filters.status);
    if (filters.technology) dbQuery = dbQuery.ilike("technology", `%${filters.technology}%`);
    if (filters.inventor) dbQuery = dbQuery.contains("inventors", `["${filters.inventor}"]`);
    if (filters.assignee) dbQuery = dbQuery.contains("assignees", `["${filters.assignee}"]`);
    if (filters.ipc_class) dbQuery = dbQuery.contains("ipc_codes", `["${filters.ipc_class}"]`);
    if (filters.cpc_class) dbQuery = dbQuery.contains("cpc_codes", `["${filters.cpc_class}"]`);
    if (filters.date_from) dbQuery = dbQuery.gte("filing_date", filters.date_from);
    if (filters.date_to) dbQuery = dbQuery.lte("filing_date", filters.date_to);

    // 4. Sorting
    const sortBy = options.sortBy || "filing_date";
    const sortOrder = options.sortOrder || "desc";
    dbQuery = dbQuery.order(sortBy, { ascending: sortOrder === "asc" });

    // Execute Pagination
    dbQuery = dbQuery.range(offset, offset + pageSize - 1);

    const startTime = Date.now();
    const { data, count, error } = await dbQuery;
    const searchTimeMs = Date.now() - startTime;

    if (error) {
      console.error("[Search API] Supabase Error:", error);
      throw error;
    }

    // Decorate results with scores
    const modes = [searchType, ...(options.searchModes || [])];
    const results = (data || []).map((p: any) => {
      const scores = scorePatent(p, searchString, modes);
      return {
        ...p,
        semantic_score: scores.semantic_score,
        citation_score: scores.citation_score,
        novelty_score: scores.novelty_score,
        relevance_score: scores.relevance_score,
        hybrid_score: scores.hybrid_score,
        ai_match_score: scores.hybrid_score,
        relevance_reason: `Matched by ${modes.join(" + ")} search in Supabase.`,
      };
    });

    const responsePayload = {
      results,
      query_interpretation: `Supabase Postgres search executed for: ${searchString}`,
      key_concepts: searchString ? searchString.split(/\s+/) : [],
      suggested_ipc_codes: [],
      search_stats: {
        total_found: count || 0,
        search_time_ms: searchTimeMs,
        ai_model: "postgres-fts-v1",
        modes,
        filters
      }
    };

    // Save to Cache
    searchCache.set(cacheKey, { data: responsePayload, timestamp: Date.now() });

    return NextResponse.json(responsePayload);
  } catch (err) {
    console.error("[Search API] Uncaught error:", err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
