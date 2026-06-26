"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Loader2, ShieldAlert } from "lucide-react";
import { useAnalysis } from "@/components/decision/useAnalysis";
import {
  BackToConsole,
  ConsoleShell,
  MetricBar,
  Pill,
  ScoreBadge,
  SectionLabel,
} from "@/components/decision/primitives";
import { parseConcepts } from "@/lib/analysis/shared";
import type { FtoAssessment } from "@/lib/analysis/fto";

const RISK_TONE: Record<string, string> = { high: "rose", medium: "amber", low: "emerald" };
const STATUS_TONE: Record<string, string> = { Active: "rose", Pending: "amber", Expired: "emerald" };

function FtoInner() {
  const params = useSearchParams();
  const { data, loading, error, run } = useAnalysis<FtoAssessment>("/api/fto");
  const [query, setQuery] = useState("");
  const ran = useRef(false);

  useEffect(() => {
    const q = params.get("q") || "";
    const concepts = parseConcepts(params.get("concepts"));
    setQuery(q);
    if (q && !ran.current) {
      ran.current = true;
      run(q, concepts);
    }
  }, [params, run]);

  const riskTone = data ? RISK_TONE[data.risk_level] : "slate";

  return (
    <ConsoleShell tag="Freedom to Operate">
      <div className="pt-8">
        <BackToConsole />
        <h1 className="mt-3 text-[34px] font-semibold leading-[1.1] text-foreground md:text-[40px] [font-family:var(--font-playfair)]">Freedom-to-Operate Assessment</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Could making, using, or selling this infringe live, enforceable patents?
        </p>

        <div className="mt-5 flex items-end gap-2">
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) run(query, parseConcepts(params.get("concepts")));
            }}
            rows={2}
            placeholder="Describe the product or invention to clear…"
            className="flex-1 resize-none rounded-sm border border-border bg-card px-3 py-2 text-sm text-foreground outline-none transition placeholder:text-muted-foreground/70 focus:border-[#c9a84c]/50"
          />
          <button
            onClick={() => run(query, parseConcepts(params.get("concepts")))}
            disabled={loading || !query.trim()}
            className="inline-flex h-9 items-center gap-2 rounded-sm bg-[#c9a84c] px-4 text-sm font-semibold text-black transition hover:bg-[#b0913b] disabled:opacity-40"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldAlert className="h-4 w-4" />}
            {loading ? "Assessing" : "Assess risk"}
          </button>
        </div>
      </div>

      {error && (
        <div className="mt-8 rounded-sm border border-rose-500/30 bg-rose-500/5 px-4 py-3 text-sm text-rose-700 dark:text-rose-300">
          {error}
        </div>
      )}

      {loading && !data && <LoadingLines />}

      {data && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-9 space-y-6">
          {/* risk header */}
          <div className="flex items-start justify-between gap-4 rounded-sm border border-border bg-card/40 p-5">
            <div className="min-w-0">
              <SectionLabel>Overall exposure</SectionLabel>
              <div className="mt-2 flex items-center gap-2">
                <h2 className="text-xl font-semibold capitalize text-foreground">{data.risk_level} risk</h2>
                <Pill tone={riskTone}>{data.risk_level}</Pill>
                {data.source === "mock" && <Pill tone="amber">offline</Pill>}
              </div>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{data.summary}</p>
            </div>
            <ScoreBadge score={data.risk_score} label="exposure" tone={riskTone as "emerald" | "amber" | "rose"} />
          </div>

          {/* recommendation */}
          <div className="rounded-sm border border-[#c9a84c]/25 bg-[#c9a84c]/[0.04] p-4">
            <SectionLabel>Recommendation</SectionLabel>
            <div className="mt-2 text-lg font-semibold text-foreground">{data.recommendation.action}</div>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{data.recommendation.rationale}</p>
          </div>

          {/* blocking patents */}
          <div>
            <SectionLabel>Potential blocking patents</SectionLabel>
            <div className="mt-3 space-y-2">
              {data.blocking_patents.map((p, i) => (
                <div key={i} className="rounded-sm border border-border p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[12px] font-semibold text-[#c9a84c] dark:text-amber-300/90 [font-family:var(--font-mono)]">
                          {p.patent_number}
                        </span>
                        <Pill tone={STATUS_TONE[p.status] ?? "slate"}>{p.status}</Pill>
                        <Pill tone={RISK_TONE[p.risk] ?? "slate"}>{p.risk} risk</Pill>
                      </div>
                      <p className="mt-1 text-sm text-foreground">{p.title}</p>
                      <p className="mt-0.5 text-[11px] text-muted-foreground/70">
                        {p.assignee} · {p.jurisdiction} · expires {p.expiry}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <span className="text-[11px] text-muted-foreground [font-family:var(--font-mono)]">{p.claim_overlap}% claim overlap</span>
                      <MetricBar value={p.claim_overlap} invert width="w-20" />
                    </div>
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{p.overlap}</p>
                </div>
              ))}
            </div>
          </div>

          {/* exposure by feature */}
          <div>
            <SectionLabel>Exposure by feature</SectionLabel>
            <div className="mt-3 divide-y divide-border rounded-sm border border-border">
              {data.exposure_by_feature.map((f, i) => (
                <div key={i} className="px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm text-foreground">{f.feature}</span>
                    <div className="flex items-center gap-3">
                      <MetricBar value={f.exposure} invert width="w-28" />
                      <span className="w-10 text-right text-[11px] text-muted-foreground [font-family:var(--font-mono)]">{f.exposure}%</span>
                    </div>
                  </div>
                  {f.note && <p className="mt-1 text-xs text-muted-foreground/80">{f.note}</p>}
                </div>
              ))}
            </div>
          </div>

          {/* mitigations */}
          <div>
            <SectionLabel>Mitigation paths</SectionLabel>
            <div className="mt-3 space-y-2">
              {data.mitigations.map((m, i) => (
                <div key={i} className="rounded-sm border border-border p-3">
                  <p className="text-sm font-medium text-foreground">{m.strategy}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{m.detail}</p>
                </div>
              ))}
            </div>
          </div>

          <p className="border-t border-border pt-2 text-[11px] leading-relaxed text-muted-foreground">
            PFS provides research assistance, not legal advice. An FTO clearance opinion must be issued
            by qualified patent counsel before commercial launch.
          </p>
        </motion.div>
      )}
    </ConsoleShell>
  );
}

function LoadingLines() {
  const steps = ["Mapping product features…", "Searching live, enforceable claims…", "Scoring infringement exposure…", "Assembling FTO assessment…"];
  return (
    <div className="mt-8 space-y-1.5 rounded-sm border border-border bg-muted/20 p-5 [font-family:var(--font-mono)]">
      {steps.map((s, i) => (
        <div key={s} className="flex items-center gap-2 text-[13px] text-muted-foreground" style={{ opacity: 1 - i * 0.15 }}>
          <span className="text-[#c9a84c] animate-pulse">▸</span>
          {s}
        </div>
      ))}
    </div>
  );
}

export default function RiskPage() {
  return (
    <Suspense fallback={null}>
      <FtoInner />
    </Suspense>
  );
}
