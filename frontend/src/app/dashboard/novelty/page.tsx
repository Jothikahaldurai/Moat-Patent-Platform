"use client";

import { Suspense, useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { BookOpen, Code2, FileSearch, GitBranch, Layers3, Loader2, Network, Radar, Sparkles } from "lucide-react";

import { useAnalysis } from "@/components/decision/useAnalysis";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { parseConcepts } from "@/lib/analysis/shared";
import { cn } from "@/lib/utils";
import type { HeatmapCell, MappingItem, NetworkNode, NoveltyAssessment } from "@/lib/analysis/novelty";

const STATUS_TONE: Record<string, string> = {
  novel: "border-emerald-500/20 bg-emerald-500/10 text-emerald-700",
  "partially disclosed": "border-amber-500/20 bg-amber-500/10 text-amber-700",
  disclosed: "border-rose-500/20 bg-rose-500/10 text-rose-700",
};

const SEVERITY_TONE: Record<string, string> = {
  low: "border-emerald-500/20 bg-emerald-500/10 text-emerald-700",
  medium: "border-amber-500/20 bg-amber-500/10 text-amber-700",
  high: "border-rose-500/20 bg-rose-500/10 text-rose-700",
};

const GROUP_STYLE: Record<NetworkNode["group"], string> = {
  invention: "border-[#c9a84c]/50 bg-[#c9a84c]/15 text-[#8a6a1e]",
  patent: "border-blue-500/30 bg-blue-500/10 text-blue-700",
  paper: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700",
  technology: "border-violet-500/30 bg-violet-500/10 text-violet-700",
  standard: "border-rose-500/30 bg-rose-500/10 text-rose-700",
};

function NoveltyInner() {
  const params = useSearchParams();
  const { data, loading, error, run } = useAnalysis<NoveltyAssessment>("/api/novelty");
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

  const doRun = () => run(query, parseConcepts(params.get("concepts")));

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-16">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="border-emerald-500/20 bg-emerald-500/10 text-emerald-700">live</Badge>
          </div>
          <h1 className="mt-3 text-2xl font-bold tracking-tight">Novelty + Prior Art Engine</h1>
          <p className="mt-1 max-w-3xl text-sm leading-relaxed text-muted-foreground">
            Core moat intelligence across patents, research papers, technical publications, GitHub, standards, and web sources.
          </p>
        </div>
      </div>

      <Separator />

      <Card className="border-border/70">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm"><Sparkles className="h-4 w-4 text-[#c9a84c]" />Run moat analysis</CardTitle>
          <CardDescription>Assess novelty, prior-art overlap, patent gaps, and white-space opportunities.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
            <textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) doRun();
              }}
              rows={3}
              placeholder="Describe the invention, claims, or technical concept to test for novelty..."
              className="min-h-[92px] flex-1 resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none transition placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
            />
            <Button onClick={doRun} disabled={loading || !query.trim()} className="gap-2 lg:h-10">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {loading ? "Analyzing" : "Run Engine"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {error && <div className="rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">{error}</div>}
      {loading && !data && <LoadingState />}
      {data && <Results data={data} />}
    </div>
  );
}

function Results({ data }: { data: NoveltyAssessment }) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="border-border/70">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Moat verdict</CardTitle>
            <CardDescription>{data.summary}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap items-center gap-2">
            <Badge className="capitalize" variant="secondary">{data.verdict}</Badge>
            {data.source === "mock" && <Badge variant="outline">offline model</Badge>}
            <Badge variant="outline">{data.invention}</Badge>
          </CardContent>
        </Card>
        <div className="grid gap-4 sm:grid-cols-3">
          <ScoreCard label="Novelty" value={data.novelty_score} goodHigh />
          <ScoreCard label="Risk" value={data.risk_score} />
          <ScoreCard label="Similarity" value={data.similarity_score} />
        </div>
      </div>

      <SourceSweep data={data} />

      <div className="grid gap-4 xl:grid-cols-3">
        <RankedList icon={<FileSearch className="h-4 w-4" />} title="Top Similar Patents" items={data.closest_prior_art.map((item) => ({ key: item.patent_number, title: item.title, meta: `${item.patent_number} - ${item.assignee} - ${item.year}`, score: item.similarity, body: item.overlap }))} />
        <RankedList icon={<BookOpen className="h-4 w-4" />} title="Top Similar Research" items={data.top_similar_research.map((item) => ({ key: item.title, title: item.title, meta: `${item.venue} - ${item.year}`, score: item.similarity, body: item.overlap }))} />
        <RankedList icon={<Code2 className="h-4 w-4" />} title="Top Similar Technologies" items={data.top_similar_technologies.map((item) => ({ key: item.name, title: item.name, meta: `${item.source} - ${item.maturity}`, score: item.similarity, body: item.overlap }))} />
      </div>

      <MappingSection title="Claim Mapping" items={data.claim_elements.map((el) => ({ item: el.element, matches: [el.status], overlap: el.coverage, gap: el.note }))} status />
      <MappingSection title="Feature Mapping" items={data.feature_mapping} />
      <MappingSection title="Concept Mapping" items={data.concept_mapping} />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-border/70">
          <CardHeader className="pb-3"><CardTitle className="text-sm">Patent Gaps</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {data.patent_gaps.map((gap) => (
              <div key={gap.area} className="rounded-lg border border-border/70 p-3">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-medium">{gap.area}</p>
                  <Badge variant="outline" className={SEVERITY_TONE[gap.severity]}>{gap.severity}</Badge>
                </div>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{gap.rationale}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-border/70">
          <CardHeader className="pb-3"><CardTitle className="text-sm">White Space Areas</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {data.white_space_areas.map((area) => (
              <div key={area.area} className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-medium text-emerald-800">{area.area}</p>
                  <span className="text-xs font-medium text-emerald-700">{area.openness}% open</span>
                </div>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{area.filing_angle}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Visualizations data={data} />

      <Card className="border-[#c9a84c]/30 bg-[#c9a84c]/5">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Recommendation</CardTitle>
          <CardDescription>{data.recommendation.rationale}</CardDescription>
        </CardHeader>
        <CardContent><Badge className="bg-[#c9a84c] text-[#131309] hover:bg-[#c9a84c]">{data.recommendation.action}</Badge></CardContent>
      </Card>

      <p className="text-xs leading-relaxed text-muted-foreground">
        PFS provides research assistance, not legal advice. Phase 3 findings require validation against live patent, publication, standards, and repository databases before filing or clearance decisions.
      </p>
    </motion.div>
  );
}

function LoadingState() {
  const steps = ["Sweeping patent sources", "Matching research and technical publications", "Mapping claims and concepts", "Scoring novelty, risk, and white space"];
  return (
    <Card className="border-border/70">
      <CardContent className="space-y-3 p-5">
        {steps.map((step) => <div key={step} className="flex items-center gap-3 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin text-primary" />{step}</div>)}
      </CardContent>
    </Card>
  );
}

function ScoreCard({ label, value, goodHigh = false }: { label: string; value: number; goodHigh?: boolean }) {
  const good = goodHigh ? value >= 70 : value <= 35;
  const warn = goodHigh ? value >= 50 : value <= 65;
  const color = good ? "text-emerald-600" : warn ? "text-amber-600" : "text-rose-600";
  return (
    <Card className="border-border/70">
      <CardContent className="p-4">
        <div className={cn("text-3xl font-bold tracking-tight", color)}>{value}%</div>
        <div className="mt-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</div>
        <Meter value={value} invert={!goodHigh} className="mt-3" />
      </CardContent>
    </Card>
  );
}

function SourceSweep({ data }: { data: NoveltyAssessment }) {
  return (
    <Card className="border-border/70">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">Source Coverage</CardTitle>
        <CardDescription>USPTO, WIPO, EPO, research, publications, GitHub, standards, and web sources.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {data.source_coverage.map((source) => (
          <div key={source.source} className="rounded-lg border border-border/70 p-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-medium">{source.source}</span>
              <span className="text-xs text-muted-foreground">{source.records} refs</span>
            </div>
            <Meter value={source.confidence} className="mt-3" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function RankedList({ icon, title, items }: { icon: ReactNode; title: string; items: { key: string; title: string; meta: string; score: number; body: string }[] }) {
  return (
    <Card className="border-border/70">
      <CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-sm">{icon}{title}</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        {items.map((item) => (
          <div key={item.key} className="rounded-lg border border-border/70 p-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">{item.meta}</p>
                <p className="mt-1 text-sm font-medium leading-snug">{item.title}</p>
              </div>
              <span className="shrink-0 text-xs font-semibold text-muted-foreground">{item.score}%</span>
            </div>
            <Meter value={item.score} invert className="mt-2" />
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{item.body}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function MappingSection({ title, items, status = false }: { title: string; items: MappingItem[]; status?: boolean }) {
  return (
    <Card className="border-border/70">
      <CardHeader className="pb-3"><CardTitle className="text-sm">{title}</CardTitle></CardHeader>
      <CardContent className="divide-y divide-border rounded-lg border border-border/70 p-0">
        {items.map((item, i) => (
          <div key={`${item.item}-${i}`} className="p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0">
                <p className="text-sm font-medium">{item.item}</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{item.gap}</p>
              </div>
              <div className="flex shrink-0 flex-wrap items-center gap-2">
                {item.matches.map((match) => <Badge key={match} variant="outline" className={status ? STATUS_TONE[match] : undefined}>{match}</Badge>)}
                <span className="text-xs text-muted-foreground">{item.overlap}% overlap</span>
              </div>
            </div>
            <Meter value={item.overlap} invert className="mt-3" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function Visualizations({ data }: { data: NoveltyAssessment }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <SimilarityNetwork data={data} />
      <ClusterMap data={data} />
      <CitationGraph data={data} />
      <Heatmap cells={data.visualization.heatmap} />
    </div>
  );
}

function SimilarityNetwork({ data }: { data: NoveltyAssessment }) {
  const nodes = data.visualization.similarity_network.nodes;
  const outer = nodes.filter((node) => node.id !== "inv");
  return (
    <Card className="border-border/70">
      <CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-sm"><Network className="h-4 w-4 text-primary" />Similarity Network</CardTitle></CardHeader>
      <CardContent>
        <div className="relative mx-auto aspect-square max-w-[320px] rounded-full border border-border bg-muted/20">
          <NodeBubble node={nodes[0]} className="left-1/2 top-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2" />
          {outer.map((node, i) => {
            const angle = (i / Math.max(1, outer.length)) * Math.PI * 2 - Math.PI / 2;
            const x = 50 + Math.cos(angle) * 34;
            const y = 50 + Math.sin(angle) * 34;
            return <NodeBubble key={node.id} node={node} className="h-16 w-16" style={{ left: `${x}%`, top: `${y}%`, transform: "translate(-50%, -50%)" }} />;
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function NodeBubble({ node, className, style }: { node: NetworkNode; className?: string; style?: CSSProperties }) {
  return <div className={cn("absolute flex items-center justify-center rounded-full border p-2 text-center text-[10px] font-medium leading-tight", GROUP_STYLE[node.group], className)} style={style}><span className="line-clamp-3">{node.label}</span></div>;
}

function ClusterMap({ data }: { data: NoveltyAssessment }) {
  return (
    <Card className="border-border/70">
      <CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-sm"><Layers3 className="h-4 w-4 text-primary" />Technology Clusters</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        {data.visualization.technology_clusters.map((cluster) => (
          <div key={cluster.name}>
            <div className="flex items-center justify-between gap-3 text-sm"><span className="font-medium">{cluster.name}</span><span className="text-xs text-muted-foreground">D {cluster.density}% / N {cluster.novelty}%</span></div>
            <div className="mt-2 grid grid-cols-2 gap-2"><Meter value={cluster.density} invert /><Meter value={cluster.novelty} /></div>
            <p className="mt-1 text-xs text-muted-foreground">{cluster.examples.join(" - ")}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function CitationGraph({ data }: { data: NoveltyAssessment }) {
  const max = Math.max(...data.visualization.citation_graph.map((node) => node.citations), 1);
  return (
    <Card className="border-border/70">
      <CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-sm"><GitBranch className="h-4 w-4 text-primary" />Citation Graph</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        {data.visualization.citation_graph.map((node) => (
          <div key={node.patent} className="grid grid-cols-[104px_1fr_44px] items-center gap-2 text-xs">
            <span className="truncate font-medium text-[#8a6a1e]">{node.patent}</span>
            <div className="h-2 rounded-full bg-muted"><div className="h-full rounded-full bg-blue-500/70" style={{ width: `${Math.max(6, (node.citations / max) * 100)}%` }} /></div>
            <span className="text-right text-muted-foreground">{node.relevance}%</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function Heatmap({ cells }: { cells: HeatmapCell[] }) {
  const features = useMemo(() => Array.from(new Set(cells.map((cell) => cell.feature))), [cells]);
  const sources = useMemo(() => Array.from(new Set(cells.map((cell) => cell.source))), [cells]);
  const cellFor = (feature: string, source: string) => cells.find((cell) => cell.feature === feature && cell.source === source)?.overlap ?? 0;

  return (
    <Card className="border-border/70">
      <CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-sm"><Radar className="h-4 w-4 text-primary" />Overlap Heatmap</CardTitle></CardHeader>
      <CardContent className="overflow-x-auto">
        <div className="grid min-w-[420px] gap-1" style={{ gridTemplateColumns: `56px repeat(${sources.length}, minmax(54px, 1fr))` }}>
          <div />
          {sources.map((source) => <div key={source} className="truncate text-[10px] text-muted-foreground">{source}</div>)}
          {features.map((feature) => (
            <div key={feature} className="contents">
              <div className="text-xs font-medium text-muted-foreground">{feature}</div>
              {sources.map((source) => {
                const value = cellFor(feature, source);
                const rgb = value > 66 ? "244,63,94" : value > 40 ? "245,158,11" : "16,185,129";
                return <div key={`${feature}-${source}`} className="h-7 rounded-md border border-border text-center text-[10px] leading-7" style={{ backgroundColor: `rgba(${rgb},${0.12 + value / 180})` }}>{value}</div>;
              })}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function Meter({ value, invert = false, className }: { value: number; invert?: boolean; className?: string }) {
  const good = invert ? value < 40 : value >= 66;
  const bad = invert ? value >= 66 : value < 40;
  const color = good ? "bg-emerald-500" : bad ? "bg-rose-500" : "bg-amber-500";
  return <div className={cn("h-2 overflow-hidden rounded-full bg-muted", className)}><div className={cn("h-full rounded-full", color)} style={{ width: `${Math.max(0, Math.min(100, value))}%` }} /></div>;
}

export default function NoveltyPage() {
  return (
    <Suspense fallback={null}>
      <NoveltyInner />
    </Suspense>
  );
}
