"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, BarChart3, CheckCircle2, Clock, AlertCircle, Globe, Loader2, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ceoPatentService, DBInvention, DBAlert, DBActivityLog } from "@/services/ceoPatentService";
import { PatentKPIGrid } from "@/components/ceo/PatentKPIGrid";
import { PatentCharts } from "@/components/ceo/PatentCharts";
import { NotificationCenter } from "@/components/ceo/NotificationCenter";
import { AlertsPanel } from "@/components/ceo/AlertsPanel";
import { QuickActions } from "@/components/ceo/QuickActions";
import { PatentDocumentsModal } from "@/components/ceo/PatentDocumentsModal";

const STATUS_CFG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  drafting:  { label: "Drafting",   color: "#f59e0b", icon: Clock        },
  pending:   { label: "Pending",    color: "#3b82f6", icon: Clock        },
  filed:     { label: "Filed",      color: "#06b6d4", icon: Globe        },
  rejected:  { label: "Rejected",   color: "#ef4444", icon: AlertCircle  },
  approved:  { label: "Approved",   color: "#10b981", icon: CheckCircle2 },
  completed: { label: "Completed",  color: "#8b5cf6", icon: CheckCircle2 },
};

interface SharedPatentDashboardProps {
  backHref: string;
  backLabel: string;
}

export function SharedPatentDashboard({ backHref, backLabel }: SharedPatentDashboardProps) {
  const [projects, setProjects]     = useState<DBInvention[]>([]);
  const [alerts, setAlerts]         = useState<DBAlert[]>([]);
  const [notifications, setNotifs]  = useState<DBActivityLog[]>([]);
  const [loading, setLoading]       = useState(true);
  const [selectedProject, setSelectedProject] = useState<DBInvention | null>(null);

  const fetchAll = async () => {
    try {
      setLoading(true);
      const [p, a, n] = await Promise.all([
        ceoPatentService.getProjects(),
        ceoPatentService.getAlerts(),
        ceoPatentService.getNotifications(),
      ]);
      setProjects(p); setAlerts(a); setNotifs(n);
    } finally { setLoading(false); }
  };

  useEffect(() => { 
    fetchAll(); 
    
    // Subscribe to realtime changes
    const unsubscribe = ceoPatentService.subscribeToDashboardChanges(() => {
      fetchAll();
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // ── Summary ────────────────────────────────────────────────────────────────
  const summary = useMemo(() => {
    const c = { total: projects.length, drafting:0, pending:0, filed:0, rejected:0, approved:0, completed:0 };
    projects.forEach(p => { const s = p.status.toLowerCase(); if (s in c) (c as any)[s]++; });
    return c;
  }, [projects]);

  // ── Chart data ─────────────────────────────────────────────────────────────
  const statusData = useMemo(() => [
    { name:"Drafting",   value: summary.drafting,  color:"#f59e0b" },
    { name:"Pending",    value: summary.pending,   color:"#3b82f6" },
    { name:"Filed",      value: summary.filed,     color:"#06b6d4" },
    { name:"Rejected",   value: summary.rejected,  color:"#ef4444" },
    { name:"Approved",   value: summary.approved,  color:"#10b981" },
    { name:"Completed",  value: summary.completed, color:"#8b5cf6" },
  ].filter(d => d.value > 0), [summary]);

  const trendData = useMemo(() => {
    const m: Record<string,{year:string;filed:number;approved:number}> = {};
    projects.forEach(p => {
      const y = new Date(p.created_at).getFullYear().toString();
      if (!m[y]) m[y] = {year:y,filed:0,approved:0};
      m[y].filed++;
      if (["approved","completed"].includes(p.status)) m[y].approved++;
    });
    return Object.values(m).sort((a,b) => +a.year - +b.year);
  }, [projects]);

  const monthlyData = useMemo(() => {
    const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    const yr = new Date().getFullYear();
    const data = months.map(m => ({ month: m, count: 0 }));
    projects.forEach(p => {
      const d = new Date(p.created_at);
      if (d.getFullYear() === yr) data[d.getMonth()].count++;
    });
    return data;
  }, [projects]);

  const radarData = useMemo(() => {
    const t: Record<string,number> = {};
    projects.forEach(p => p.tags.forEach(tag => { t[tag] = (t[tag]||0)+1; }));
    return Object.entries(t).map(([subject, A]) => ({ subject, A, fullMark: projects.length })).slice(0,8);
  }, [projects]);

  const growthData = useMemo(() => {
    let n = 0;
    return [...projects]
      .sort((a,b) => +new Date(a.created_at) - +new Date(b.created_at))
      .map(p => ({ date: new Date(p.created_at).toLocaleDateString("en-US",{month:"short",day:"numeric"}), growth: ++n }));
  }, [projects]);

  // ── Notification actions ───────────────────────────────────────────────────
  const markRead = async (id: string) => {
    await ceoPatentService.markNotificationRead(id);
    setNotifs(prev => prev.map(n => n.id === id ? {...n, action:"read"} : n));
  };
  const markAll = async () => {
    await ceoPatentService.markAllNotificationsRead();
    setNotifs(prev => prev.map(n => ({...n, action:"read"})));
  };
  const dismissAlert = async (id: string) => {
    await ceoPatentService.dismissAlert(id);
    setAlerts(prev => prev.filter(a => a.id !== id));
  };

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            <div className="h-14 w-14 rounded-full border-2 border-[#c9a84c]/20 animate-pulse" />
            <Loader2 className="absolute inset-0 m-auto h-6 w-6 animate-spin text-[#c9a84c]" />
          </div>
          <p className="text-xs font-bold text-muted-foreground/60 tracking-widest uppercase animate-pulse">Loading Intelligence…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative pb-16">
      {/* ── Ambient background orbs ─────────────────────────────────────────── */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden -z-10">
        <div className="absolute -top-40 -left-40 h-[500px] w-[500px] rounded-full opacity-[0.04] blur-3xl"
          style={{ background: "radial-gradient(circle, #c9a84c, transparent)" }} />
        <div className="absolute top-1/2 -right-60 h-[600px] w-[600px] rounded-full opacity-[0.03] blur-3xl"
          style={{ background: "radial-gradient(circle, #3b82f6, transparent)" }} />
        <div className="absolute -bottom-40 left-1/3 h-[400px] w-[400px] rounded-full opacity-[0.03] blur-3xl"
          style={{ background: "radial-gradient(circle, #10b981, transparent)" }} />
      </div>

      <div className="space-y-5 pt-2">

        {/* ── Hero Header ─────────────────────────────────────────────────── */}
        <motion.div initial={{ opacity:0, y:-16 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.5 }}
          className="relative rounded-3xl overflow-hidden border border-border/60 bg-gradient-to-br from-[#c9a84c]/10 via-card/90 to-emerald-500/5 p-6 sm:p-8 backdrop-blur-md">
          {/* subtle grid texture */}
          <div className="absolute inset-0 opacity-[0.015]"
            style={{ backgroundImage: "linear-gradient(rgba(201,168,76,0.5) 1px,transparent 1px),linear-gradient(90deg,rgba(201,168,76,0.5) 1px,transparent 1px)", backgroundSize: "40px 40px" }} />

          <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <Button variant="ghost" size="sm" asChild className="mb-3 -ml-2 text-muted-foreground/60 hover:text-foreground">
                <Link href={backHref}><ArrowLeft className="h-4 w-4 mr-1.5" />{backLabel}</Link>
              </Button>
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="h-14 w-14 rounded-2xl flex items-center justify-center"
                    style={{ background: "linear-gradient(135deg, rgba(201,168,76,0.2), rgba(201,168,76,0.05))", border: "1px solid rgba(201,168,76,0.3)" }}>
                    <BarChart3 className="h-7 w-7 text-[#c9a84c]" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 h-3 w-3 rounded-full bg-emerald-400 border-2 border-background animate-pulse" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-black tracking-tight"
                    style={{ background: "linear-gradient(135deg, #e8dfc8, #c9a84c)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>
                    Patent Portfolio
                  </h1>
                  <p className="text-sm text-muted-foreground/60 mt-0.5">Live intelligence · Last synced just now</p>
                </div>
              </div>
            </div>

            {/* Live stat pills */}
            <div className="flex flex-wrap gap-2">
              {[
                { label: "Total Projects", val: summary.total,    color: "#c9a84c" },
                { label: "Approved",       val: summary.approved, color: "#10b981" },
                { label: "At Risk",        val: summary.rejected + summary.pending, color: "#ef4444" },
              ].map(s => (
                <div key={s.label} className="px-4 py-2 rounded-xl border text-center min-w-[80px]"
                  style={{ borderColor: `${s.color}30`, background: `${s.color}0d` }}>
                  <p className="text-xl font-black" style={{ color: s.color }}>{s.val}</p>
                  <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* ── KPI Grid ────────────────────────────────────────────────────── */}
        <PatentKPIGrid summary={summary} />

        {/* ── Main content grid ───────────────────────────────────────────── */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Charts — 2 cols */}
          <div className="xl:col-span-2">
            <PatentCharts
              statusData={statusData}
              trendData={trendData}
              monthlyData={monthlyData}
              radarData={radarData}
              growthData={growthData}
            />
          </div>

          {/* Right sidebar — Alerts, Notifs, Quick Actions */}
          <div className="space-y-4">
            <QuickActions onRefresh={fetchAll} projects={projects} />
            <AlertsPanel alerts={alerts} onDismiss={dismissAlert} />
            <NotificationCenter notifications={notifications} onMarkRead={markRead} onMarkAll={markAll} />
          </div>
        </div>

        {/* ── Projects Table ───────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.4 }}
          className="rounded-2xl border border-border/60 bg-card/70 backdrop-blur-sm overflow-hidden"
        >
          <div className="flex items-center justify-between px-6 py-4 border-b border-border/60">
            <div>
              <p className="text-sm font-bold text-foreground">Active Patent Projects</p>
              <p className="text-[10px] text-muted-foreground/60">All records sync live</p>
            </div>
            <span className="text-xs font-bold text-muted-foreground/60">{projects.length} entries</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/60">
                  {["Title & Description","Technology Area","Tags","Status","Updated",""].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {projects.map((p, i) => {
                  const s = STATUS_CFG[p.status.toLowerCase()] ?? STATUS_CFG.drafting;
                  return (
                    <motion.tr key={p.id}
                      initial={{ opacity:0, x:-8 }} animate={{ opacity:1, x:0 }}
                      transition={{ delay: 0.45 + i * 0.04 }}
                      className="border-b border-border/40 hover:bg-muted/30 transition-colors group cursor-pointer"
                      onClick={() => setSelectedProject(p)}
                    >
                      <td className="px-5 py-3.5 max-w-[240px]">
                        <p className="font-semibold text-foreground group-hover:text-[#c9a84c] transition-colors leading-tight">{p.title}</p>
                        <p className="text-[11px] text-muted-foreground/60 truncate mt-0.5">{p.description}</p>
                      </td>
                      <td className="px-5 py-3.5 text-xs text-muted-foreground/80">
                        {(p.metadata as any)?.technology_area ?? "General"}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex flex-wrap gap-1">
                          {p.tags.map(t => (
                            <span key={t} className="px-1.5 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider border border-border text-muted-foreground/60">{t}</span>
                          ))}
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border"
                          style={{ color: s.color, borderColor: `${s.color}30`, background: `${s.color}10` }}>
                          <s.icon className="h-3 w-3" />{s.label}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-[11px] text-muted-foreground/60">
                        {new Date(p.updated_at).toLocaleDateString()}
                      </td>
                      <td className="px-5 py-3.5">
                        <button className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 text-[11px] font-bold text-[#c9a84c] hover:text-[#e8c97a] transition-all">
                          View <ChevronRight className="h-3 w-3" />
                        </button>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </motion.div>

      </div>

      <PatentDocumentsModal 
        isOpen={!!selectedProject} 
        onClose={() => setSelectedProject(null)} 
        project={selectedProject} 
      />
    </div>
  );
}
