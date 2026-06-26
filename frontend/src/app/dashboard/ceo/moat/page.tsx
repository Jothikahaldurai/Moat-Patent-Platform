"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft, Plus, Download, Lightbulb, Trash2,
  Calendar, Tag, Star, StarOff, X, Check,
  Search, Sparkles, Edit, Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import MoatEditor from "@/components/ceo/MoatEditor";

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
  draft:      "bg-slate-500/15 text-slate-400 border-slate-500/30",
  review:     "bg-amber-500/15 text-amber-400 border-amber-500/30",
  filed:      "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  pfs_search: "bg-violet-500/15 text-violet-400 border-violet-500/30",
  archived:   "bg-zinc-700/30 text-zinc-500 border-zinc-600/30",
};

const STATUS_LABELS: Record<string, string> = {
  draft:      "Draft",
  review:     "In Review",
  filed:      "Filed",
  pfs_search: "PFS Search",
  archived:   "Archived",
};

const PRIORITY_COLORS: Record<string, string> = {
  high:   "text-rose-400",
  medium: "text-amber-400",
  low:    "text-emerald-400",
};

const CATEGORIES = [
  "Artificial Intelligence", "Cybersecurity", "IoT & Energy",
  "Cloud Infrastructure", "UX & Design", "Data Analytics", "Other"
];

const EMPTY_IDEA = {
  title:       "",
  description: "",
  category:    "Artificial Intelligence",
  tags:        [] as string[],
  status:      "draft",
  priority:    "medium",
  starred:     false,
  notes:       "",
  content:     null as any,
};

// ─── Page Component ───────────────────────────────────────────────────────────

export default function MyMoatPage() {
  const [ideas, setIdeas]               = useState<any[]>([]);
  const [search, setSearch]             = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [showForm, setShowForm]         = useState(false);
  const [form, setForm]                 = useState<any>(EMPTY_IDEA);
  const [loading, setLoading]           = useState(true);
  const [saving, setSaving]             = useState(false);
  const [saveError, setSaveError]       = useState<string | null>(null);
  const [activeIdeaId, setActiveIdeaId] = useState<string | null>(null);

  // ─── Fetch ──────────────────────────────────────────────────────────────────
  const fetchIdeas = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ status: filterStatus, query: search });
      const res  = await fetch(`/api/moat?${params}`);
      const json = await res.json();
      setIdeas(Array.isArray(json.data) ? json.data : []);
    } catch (err) {
      console.error("fetchIdeas error:", err);
    } finally {
      setLoading(false);
    }
  }, [filterStatus, search]);

  useEffect(() => { fetchIdeas(); }, [fetchIdeas]);

  // ─── Save (Create or Update) ────────────────────────────────────────────────
  const saveIdea = async () => {
    if (!form.title.trim()) {
      setSaveError("Please enter an idea title.");
      return;
    }
    setSaving(true);
    setSaveError(null);

    try {
      const isEdit = !!activeIdeaId;
      const method = isEdit ? "PUT" : "POST";
      const url    = isEdit ? `/api/moat/${activeIdeaId}` : "/api/moat";

      const res  = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to save idea");
      }

      // Optimistic update — immediately reflect change in UI
      if (isEdit) {
        setIdeas(prev => prev.map(i => i.id === activeIdeaId ? data : i));
      } else {
        setIdeas(prev => [data, ...prev]);
      }

      // Reset form
      setShowForm(false);
      setActiveIdeaId(null);
      setForm(EMPTY_IDEA);
    } catch (err: any) {
      console.error("saveIdea error:", err);
      setSaveError(err.message || "Something went wrong.");
    } finally {
      setSaving(false);
    }
  };

  // ─── Handlers ───────────────────────────────────────────────────────────────
  const toggleStar = async (id: string, current: boolean) => {
    // Optimistic local update
    setIdeas(prev => prev.map(i => i.id === id ? { ...i, starred: !current } : i));
    try {
      await fetch(`/api/moat/${id}`, {
        method:  "PUT",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ starred: !current }),
      });
    } catch (err) {
      // Revert on failure
      setIdeas(prev => prev.map(i => i.id === id ? { ...i, starred: current } : i));
    }
  };

  const deleteIdea = async (id: string) => {
    setIdeas(prev => prev.filter(i => i.id !== id));
    try {
      await fetch(`/api/moat/${id}`, { method: "DELETE" });
    } catch (err) {
      fetchIdeas(); // Re-fetch on failure
    }
  };

  const handleEdit = (idea: any) => {
    setForm({ ...idea, tags: idea.tags || [] });
    setActiveIdeaId(idea.id);
    setSaveError(null);
    setShowForm(true);
  };

  const handleNew = () => {
    setForm(EMPTY_IDEA);
    setActiveIdeaId(null);
    setSaveError(null);
    setShowForm(true);
  };

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(ideas, null, 2)], { type: "application/json" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url; a.download = "my_moat_ideas.json"; a.click();
    URL.revokeObjectURL(url);
  };

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-16">

      {/* ── Header ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Button variant="ghost" size="sm" asChild className="text-muted-foreground hover:text-foreground -ml-2 mb-2">
            <Link href="/dashboard/ceo"><ArrowLeft className="h-4 w-4 mr-1" />Back to CEO Workspace</Link>
          </Button>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#c9a84c]/10">
              <Lightbulb className="h-6 w-6 text-[#c9a84c]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">My MOAT</h1>
              <p className="text-sm text-muted-foreground">
                Your private innovation vault · {ideas.length} idea{ideas.length !== 1 ? "s" : ""} stored
              </p>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" className="gap-2 border-border/70" onClick={exportJson}>
            <Download className="h-4 w-4" />Export JSON
          </Button>
          <Button size="sm" className="gap-2 bg-[#c9a84c] hover:bg-[#b8943d] text-black font-semibold" onClick={handleNew}>
            <Plus className="h-4 w-4" />New Idea
          </Button>
        </div>
      </div>

      {/* ── New / Edit Form ── */}
      {showForm && (
        <Card className="border-[#c9a84c]/30 bg-card shadow-xl shadow-[#c9a84c]/5">
          <CardHeader className="pb-3 border-b border-border/40">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Sparkles className="h-4 w-4 text-[#c9a84c]" />
                {activeIdeaId ? "Edit Idea" : "New Innovation Idea"}
              </CardTitle>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowForm(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>

          <CardContent className="p-5 space-y-5">
            {/* Title + Category */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Idea Title *</label>
                <input
                  value={form.title}
                  onChange={e => setForm((f: any) => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. Adaptive Cache Routing for CDNs"
                  className="w-full px-3 py-2 text-sm bg-background border border-border/60 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#c9a84c]/50"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Category</label>
                <select
                  value={form.category}
                  onChange={e => setForm((f: any) => ({ ...f, category: e.target.value }))}
                  className="w-full px-3 py-2 text-sm bg-background border border-border/60 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#c9a84c]/50"
                >
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Description</label>
              <textarea
                value={form.description}
                onChange={e => setForm((f: any) => ({ ...f, description: e.target.value }))}
                rows={2}
                placeholder="Brief summary of the invention..."
                className="w-full px-3 py-2 text-sm bg-background border border-border/60 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#c9a84c]/50 resize-none"
              />
            </div>

            {/* Rich Text Editor */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Rich Text Content</label>
                <span className="text-[10px] text-muted-foreground">Auto-saves to Version History</span>
              </div>
              <MoatEditor
                content={form.content}
                onChange={content => setForm((f: any) => ({ ...f, content }))}
              />
            </div>

            {/* Priority + Status */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Priority</label>
                <select
                  value={form.priority}
                  onChange={e => setForm((f: any) => ({ ...f, priority: e.target.value }))}
                  className="w-full px-3 py-2 text-sm bg-background border border-border/60 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#c9a84c]/50"
                >
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</label>
                <select
                  value={form.status}
                  onChange={e => setForm((f: any) => ({ ...f, status: e.target.value }))}
                  className="w-full px-3 py-2 text-sm bg-background border border-border/60 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#c9a84c]/50"
                >
                  <option value="draft">Draft</option>
                  <option value="review">In Review</option>
                  <option value="filed">Filed</option>
                  <option value="pfs_search">PFS Search</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Notes</label>
              <textarea
                value={form.notes}
                onChange={e => setForm((f: any) => ({ ...f, notes: e.target.value }))}
                rows={2}
                placeholder="Prior art search status, inventor names, deadlines…"
                className="w-full px-3 py-2 text-sm bg-background border border-border/60 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#c9a84c]/50 resize-none"
              />
            </div>

            {/* Error */}
            {saveError && (
              <p className="text-xs text-rose-500 bg-rose-500/10 px-3 py-2 rounded-lg border border-rose-500/20">
                ⚠ {saveError}
              </p>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button
                size="sm"
                className="bg-[#c9a84c] hover:bg-[#b8943d] text-black font-semibold gap-2 min-w-[110px]"
                onClick={saveIdea}
                disabled={saving}
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                {saving ? "Saving…" : "Save Idea"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Search + Filter ── */}
      {!showForm && (
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search ideas by title or description…"
              className="w-full pl-9 pr-4 py-2.5 text-sm bg-card/80 border border-border/60 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#c9a84c]/50 placeholder:text-muted-foreground/50"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {(["all", "draft", "review", "filed", "pfs_search", "archived"] as const).map(s => (
              <Button
                key={s}
                variant={filterStatus === s ? "default" : "outline"}
                size="sm"
                className={`text-xs capitalize ${filterStatus === s ? "bg-[#c9a84c] text-black hover:bg-[#b8943d]" : "border-border/60"}`}
                onClick={() => setFilterStatus(s)}
              >
                {STATUS_LABELS[s] ?? s}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* ── Idea Cards ── */}
      {!showForm && (
        <>
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-6 w-6 animate-spin text-[#c9a84c]" />
            </div>
          ) : ideas.length === 0 ? (
            <div className="text-center py-20 border border-dashed border-border/40 rounded-2xl bg-muted/5">
              <Lightbulb className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">No ideas found. Start capturing your innovations!</p>
              <Button size="sm" className="mt-4 bg-[#c9a84c] text-black hover:bg-[#b8943d]" onClick={handleNew}>
                <Plus className="h-4 w-4 mr-1" />Add First Idea
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-2">
              {ideas.map(idea => (
                <Card
                  key={idea.id}
                  className="border-border/60 bg-card/90 hover:border-[#c9a84c]/30 hover:shadow-lg hover:shadow-[#c9a84c]/5 transition-all duration-200"
                >
                  <CardContent className="p-5 space-y-4">
                    {/* Card Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 cursor-pointer" onClick={() => handleEdit(idea)}>
                        <div className="flex flex-wrap items-center gap-2 mb-1.5">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${STATUS_COLORS[idea.status] || STATUS_COLORS.draft}`}>
                            {STATUS_LABELS[idea.status] || idea.status}
                          </span>
                          <span className={`text-xs font-semibold ${PRIORITY_COLORS[idea.priority] || ""}`}>
                            ● {idea.priority} priority
                          </span>
                        </div>
                        <h3 className="font-semibold text-foreground leading-snug hover:text-[#c9a84c] transition-colors">
                          {idea.title}
                        </h3>
                      </div>
                      <button onClick={() => toggleStar(idea.id, idea.starred)} className="mt-0.5 shrink-0">
                        {idea.starred
                          ? <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                          : <StarOff className="h-4 w-4 text-muted-foreground hover:text-amber-400 transition-colors" />}
                      </button>
                    </div>

                    {/* Description */}
                    {idea.description && (
                      <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">{idea.description}</p>
                    )}

                    {/* Notes */}
                    {idea.notes && (
                      <div className="p-3 rounded-lg bg-muted/20 border border-border/30 text-xs text-muted-foreground">
                        <span className="font-semibold text-foreground/60 uppercase tracking-wider">Notes · </span>
                        {idea.notes}
                      </div>
                    )}

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-1">
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(idea.created_at).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <Tag className="h-3 w-3" />{idea.category}
                        </span>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost" size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-[#c9a84c]"
                          onClick={() => handleEdit(idea)}
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost" size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-rose-400"
                          onClick={() => deleteIdea(idea.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
