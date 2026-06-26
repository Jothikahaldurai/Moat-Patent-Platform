"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle, ShieldAlert, Clock, CheckCircle2, UserPlus, FileText, Activity, Users,
  Check, X, MessageSquare, Search, Filter, History, RefreshCw, ChevronRight, CornerDownRight
} from "lucide-react";

interface Alert {
  id: string;
  title: string;
  description: string;
  type: string;
  priority: string;
  status: string;
  created_at: string;
  created_by: string;
  history: any[];
}

const alertTypes = ["Approval Required", "Patent Filed", "Draft Completed", "Patent Expired", "Renewal", "Office Action", "High Priority", "Meeting", "Tasks"];
const statusTypes = ["Pending", "Approved", "Rejected", "Assigned"];

const typeIcons: Record<string, any> = {
  "Approval Required": CheckCircle2,
  "Patent Filed": FileText,
  "Draft Completed": FileText,
  "Patent Expired": Clock,
  "Renewal": Activity,
  "Office Action": ShieldAlert,
  "High Priority": AlertTriangle,
  "Meeting": Users,
  "Tasks": CheckCircle2,
};

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("Pending");
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [comment, setComment] = useState("");

  const fetchAlerts = useCallback(async () => {
    setLoading(true);
    try {
      let url = "/api/alerts";
      const params = new URLSearchParams();
      if (filterStatus !== "All") params.append("status", filterStatus);
      if (search) params.append("search", search);
      
      const res = await fetch(`${url}?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setAlerts(data.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [filterStatus, search]);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  const handleAction = async (id: string, action: string) => {
    try {
      await fetch(`/api/alerts/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, note: comment }),
      });
      setComment("");
      setSelectedAlert(null);
      fetchAlerts();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="mx-auto max-w-7xl pb-16 space-y-6">
      <motion.header initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight pfs-heading flex items-center gap-2">
            <AlertTriangle className="h-6 w-6 pfs-cyan" /> Alerts & Actions
          </h1>
          <p className="mt-1 text-sm pfs-muted">
            Manage critical alerts, approvals, and actions requiring your immediate attention.
          </p>
        </div>
      </motion.header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <div className="rounded-xl pfs-panel p-4 space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 pfs-muted" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search alerts..."
                className="h-10 w-full rounded-lg pfs-field pl-9 pr-3 text-sm"
              />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
              {["Pending", "Approved", "Rejected", "All"].map(status => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-bold transition-colors ${filterStatus === status ? 'bg-[hsl(var(--pfs-cyan))] text-[hsl(var(--pfs-cyan-foreground))]' : 'bg-[hsl(var(--muted))]/40 pfs-muted hover:bg-[hsl(var(--muted))]/80'}`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            {loading ? (
              <div className="flex justify-center p-12"><RefreshCw className="h-6 w-6 animate-spin pfs-cyan" /></div>
            ) : alerts.length === 0 ? (
              <div className="rounded-xl border border-dashed border-[hsl(var(--border))] p-8 text-center">
                <p className="text-sm pfs-muted">No alerts found.</p>
              </div>
            ) : (
              alerts.map(alert => {
                const Icon = typeIcons[alert.type] || AlertTriangle;
                const isSelected = selectedAlert?.id === alert.id;
                return (
                  <button
                    key={alert.id}
                    onClick={() => setSelectedAlert(alert)}
                    className={`w-full text-left rounded-xl p-4 transition-all border ${isSelected ? 'border-[hsl(var(--pfs-cyan))] bg-[hsl(var(--pfs-cyan))]/10 shadow-md' : 'border-[hsl(var(--border))] bg-[hsl(var(--card))] hover:border-[hsl(var(--pfs-cyan))]/30'}`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <Icon className={`h-4 w-4 ${isSelected ? 'pfs-cyan' : 'pfs-muted'}`} />
                        <span className="text-[10px] font-bold uppercase tracking-wider pfs-muted">{alert.type}</span>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${alert.status === 'Pending' ? 'bg-amber-500/20 text-amber-500' : alert.status === 'Approved' ? 'bg-emerald-500/20 text-emerald-500' : alert.status === 'Rejected' ? 'bg-red-500/20 text-red-500' : 'bg-blue-500/20 text-blue-500'}`}>
                        {alert.status}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold pfs-heading line-clamp-1">{alert.title}</h3>
                    <p className="text-xs pfs-muted mt-1">{new Date(alert.created_at).toLocaleDateString()}</p>
                  </button>
                )
              })
            )}
          </div>
        </div>

        <div className="lg:col-span-2">
          {selectedAlert ? (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] overflow-hidden flex flex-col h-full min-h-[600px]">
              <div className="p-6 border-b border-[hsl(var(--border))]">
                <div className="flex items-center gap-3 mb-4">
                  <span className={`text-xs font-bold px-3 py-1 rounded-full ${selectedAlert.priority === 'High' ? 'bg-red-500/20 text-red-500' : 'bg-[hsl(var(--pfs-cyan))]/20 pfs-cyan'}`}>
                    {selectedAlert.priority} Priority
                  </span>
                  <span className="text-xs pfs-muted">{new Date(selectedAlert.created_at).toLocaleString()}</span>
                </div>
                <h2 className="text-2xl font-bold pfs-heading mb-2">{selectedAlert.title}</h2>
                <p className="text-sm leading-relaxed pfs-muted">{selectedAlert.description}</p>
              </div>

              <div className="flex-1 p-6 bg-[hsl(var(--muted))]/10 overflow-y-auto">
                <h3 className="text-sm font-bold pfs-heading flex items-center gap-2 mb-4">
                  <History className="h-4 w-4 pfs-cyan" /> Timeline & History
                </h3>
                <div className="space-y-6">
                  {selectedAlert.history?.map((entry: any, i: number) => (
                    <div key={i} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="h-2 w-2 rounded-full bg-[hsl(var(--pfs-cyan))]" />
                        {i !== selectedAlert.history.length - 1 && <div className="w-px h-full bg-[hsl(var(--border))] mt-2" />}
                      </div>
                      <div className="-mt-1.5">
                        <p className="text-sm font-bold pfs-heading">
                          {entry.action} <span className="font-normal pfs-muted">by</span> {entry.by}
                        </p>
                        {entry.note && (
                          <div className="mt-2 flex gap-2 rounded-lg bg-[hsl(var(--card))] p-3 border border-[hsl(var(--border))]">
                            <CornerDownRight className="h-4 w-4 shrink-0 pfs-cyan" />
                            <p className="text-xs italic pfs-muted">"{entry.note}"</p>
                          </div>
                        )}
                        <p className="mt-1 text-[10px] pfs-muted">{new Date(entry.timestamp).toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                  {(!selectedAlert.history || selectedAlert.history.length === 0) && (
                    <p className="text-sm pfs-muted italic">No history available.</p>
                  )}
                </div>
              </div>

              {selectedAlert.status === "Pending" && (
                <div className="p-6 border-t border-[hsl(var(--border))] bg-[hsl(var(--card))]">
                  <h3 className="text-sm font-bold pfs-heading mb-3">Required Action</h3>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Add an optional comment or reason..."
                    className="w-full h-20 rounded-lg pfs-field p-3 text-sm mb-4 resize-none"
                  />
                  <div className="flex gap-3">
                    <button onClick={() => handleAction(selectedAlert.id, 'Approved')} className="flex-1 flex justify-center items-center gap-2 h-10 rounded-lg bg-emerald-500/10 text-emerald-500 font-bold hover:bg-emerald-500/20 transition-colors">
                      <Check className="h-4 w-4" /> Approve
                    </button>
                    <button onClick={() => handleAction(selectedAlert.id, 'Rejected')} className="flex-1 flex justify-center items-center gap-2 h-10 rounded-lg bg-red-500/10 text-red-500 font-bold hover:bg-red-500/20 transition-colors">
                      <X className="h-4 w-4" /> Reject
                    </button>
                    <button onClick={() => handleAction(selectedAlert.id, 'Assigned')} className="flex-1 flex justify-center items-center gap-2 h-10 rounded-lg bg-[hsl(var(--pfs-cyan))]/10 pfs-cyan font-bold hover:bg-[hsl(var(--pfs-cyan))]/20 transition-colors">
                      <UserPlus className="h-4 w-4" /> Assign
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          ) : (
            <div className="h-full min-h-[600px] flex flex-col items-center justify-center text-center rounded-xl border border-dashed border-[hsl(var(--border))] bg-[hsl(var(--muted))]/10 p-12">
              <AlertTriangle className="h-16 w-16 pfs-muted opacity-20 mb-4" />
              <h2 className="text-xl font-bold pfs-heading">Select an Alert</h2>
              <p className="mt-2 text-sm pfs-muted max-w-md">Choose an alert from the left panel to view its details, history, and take required actions.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
