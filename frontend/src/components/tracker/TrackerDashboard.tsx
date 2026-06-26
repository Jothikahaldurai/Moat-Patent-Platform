"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Activity, Clock3, AlertTriangle, CheckCircle2, ShieldCheck, Search, Filter, RefreshCw, BarChart2, BriefcaseBusiness, FileText, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { cn } from "@/lib/utils";

// Simulated Event Type
interface TrackerEvent {
  id: string;
  type: "competitor" | "prosecution" | "system" | "deadline";
  title: string;
  description: string;
  timestamp: Date;
  severity: "high" | "medium" | "low";
  read: boolean;
}

const INITIAL_EVENTS: TrackerEvent[] = [
  { id: "1", type: "prosecution", title: "Office Action Received", description: "Non-Final Rejection issued for 'Edge Computing Optimization' (US App 18/234,912). Response due in 3 months.", timestamp: new Date(Date.now() - 1000 * 60 * 5), severity: "high", read: false },
  { id: "2", type: "competitor", title: "New Competitor Filing", description: "GlobalTech Inc. published WO2024123456 related to neural network quantization.", timestamp: new Date(Date.now() - 1000 * 60 * 32), severity: "medium", read: true },
  { id: "3", type: "deadline", title: "Maintenance Fee Window Open", description: "US Patent 10,987,654 entered 3.5-year maintenance fee window. Deadline: Oct 15.", timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), severity: "medium", read: true },
];

const KANBAN_STAGES = [
  { id: "disclosure", label: "Disclosures", count: 12, color: "border-slate-500/30" },
  { id: "drafting", label: "Drafting", count: 8, color: "border-blue-500/30" },
  { id: "filed", label: "Filed / Pending", count: 24, color: "border-amber-500/30" },
  { id: "granted", label: "Granted", count: 156, color: "border-emerald-500/30" },
];

export function TrackerDashboard() {
  const [events, setEvents] = useState<TrackerEvent[]>(INITIAL_EVENTS);
  const [isConnected, setIsConnected] = useState(false);

  // Simulate Realtime Connection & Event Streaming
  useEffect(() => {
    const timer = setTimeout(() => setIsConnected(true), 1500);
    
    const interval = setInterval(() => {
      const newEvent: TrackerEvent = {
        id: Math.random().toString(36).substr(2, 9),
        type: "system",
        title: "Automated Search Complete",
        description: "Weekly FTO sweep finished. 2 potential low-risk conflicts flagged for review.",
        timestamp: new Date(),
        severity: "low",
        read: false,
      };
      setEvents((prev) => [newEvent, ...prev].slice(0, 20));
    }, 45000); // New event every 45s for demo

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-16">
      {/* Header */}
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className={cn("transition-colors", isConnected ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-700" : "border-amber-500/20 bg-amber-500/10 text-amber-700")}>
              <span className={cn("mr-1.5 h-2 w-2 rounded-full", isConnected ? "bg-emerald-500 animate-pulse" : "bg-amber-500")} />
              {isConnected ? "Live Connection" : "Connecting..."}
            </Badge>
            <Badge variant="outline" className="border-[#c9a84c]/25 bg-[#c9a84c]/10 text-[#8a6a1e]">Phase 10</Badge>
          </div>
          <h1 className="mt-3 text-3xl font-bold tracking-tight">Realtime Tracker</h1>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
            Live monitoring of prosecution pipelines, competitor filings, and critical IP deadlines.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-4 py-2 text-sm font-semibold hover:bg-muted">
            <Filter className="h-4 w-4" /> Filter Stream
          </button>
        </div>
      </header>

      {/* Main Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        
        {/* LEFT COL: Live Feed (Span 1) */}
        <div className="lg:col-span-1 space-y-4 flex flex-col h-[700px]">
          <Card className="flex-1 flex flex-col border-border/70 overflow-hidden">
            <CardHeader className="border-b border-border/40 pb-4 shrink-0 bg-muted/10">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Activity className="h-4 w-4 text-primary" /> Live Event Stream
                </CardTitle>
                <RefreshCw className={cn("h-4 w-4 text-muted-foreground", isConnected && "animate-spin-slow")} />
              </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto p-0">
              <div className="divide-y divide-border/40">
                <AnimatePresence initial={false}>
                  {events.map((event) => (
                    <motion.div
                      key={event.id}
                      initial={{ opacity: 0, height: 0, backgroundColor: "hsl(var(--primary) / 0.1)" }}
                      animate={{ opacity: 1, height: "auto", backgroundColor: "transparent" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className={cn("p-4 transition-colors hover:bg-muted/20", !event.read && "bg-primary/5")}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          {event.type === 'prosecution' && <BriefcaseBusiness className="h-4 w-4 text-blue-500" />}
                          {event.type === 'competitor' && <BarChart2 className="h-4 w-4 text-amber-500" />}
                          {event.type === 'deadline' && <Clock3 className="h-4 w-4 text-rose-500" />}
                          {event.type === 'system' && <ShieldCheck className="h-4 w-4 text-emerald-500" />}
                          <span className="text-sm font-semibold">{event.title}</span>
                        </div>
                        <span className="text-[10px] uppercase text-muted-foreground whitespace-nowrap">
                          {event.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                        {event.description}
                      </p>
                      {event.severity === "high" && (
                        <div className="mt-3 flex items-center gap-1.5 text-[10px] font-bold uppercase text-rose-500">
                          <AlertTriangle className="h-3 w-3" /> Action Required
                        </div>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT COL: Pipeline & Deadlines (Span 2) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Prosecution Funnel */}
          <Card className="border-border/70">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4 text-[#c9a84c]" /> Prosecution Pipeline
              </CardTitle>
              <CardDescription>Live snapshot of active matters across all stages.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {KANBAN_STAGES.map((stage) => (
                  <div key={stage.id} className={cn("rounded-lg border bg-card p-4 transition-all hover:shadow-md", stage.color)}>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{stage.label}</p>
                    <p className="mt-2 text-3xl font-bold tracking-tight">{stage.count}</p>
                    <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                      <span>View items</span>
                      <ArrowRight className="h-3 w-3" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Critical Deadlines Table */}
          <Card className="border-border/70">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Clock3 className="h-4 w-4 text-rose-500" /> Critical Deadlines
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/30 border-b border-border/70">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Matter Ref</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Task / Action</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Due Date</th>
                      <th className="px-4 py-3 text-right font-medium text-muted-foreground">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    <tr className="transition-colors hover:bg-muted/10">
                      <td className="px-4 py-3 font-medium text-blue-600 dark:text-blue-400">US-2023-01A</td>
                      <td className="px-4 py-3">Response to Non-Final OA</td>
                      <td className="px-4 py-3 text-rose-500 font-medium">In 12 Days</td>
                      <td className="px-4 py-3 text-right"><Badge variant="outline" className="border-rose-500/30 text-rose-600">Urgent</Badge></td>
                    </tr>
                    <tr className="transition-colors hover:bg-muted/10">
                      <td className="px-4 py-3 font-medium text-blue-600 dark:text-blue-400">EP-10492-B</td>
                      <td className="px-4 py-3">Pay Grant Fee</td>
                      <td className="px-4 py-3 text-amber-500">In 28 Days</td>
                      <td className="px-4 py-3 text-right"><Badge variant="outline" className="border-amber-500/30 text-amber-600">Pending</Badge></td>
                    </tr>
                    <tr className="transition-colors hover:bg-muted/10">
                      <td className="px-4 py-3 font-medium text-blue-600 dark:text-blue-400">P-DISC-008</td>
                      <td className="px-4 py-3">Committee Review Decision</td>
                      <td className="px-4 py-3">Next Month</td>
                      <td className="px-4 py-3 text-right"><Badge variant="outline" className="border-emerald-500/30 text-emerald-600">On Track</Badge></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}
