"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Sparkles,
  SlidersHorizontal,
  Hash,
  Terminal,
  Bookmark,
  BookmarkCheck,
  GitCompare,
  FileJson,
  ChevronDown,
  LayoutGrid,
  LayoutList,
  Download,
  Info,
  Loader2,
  Trash2,
  GripVertical,
  Plus,
  HelpCircle,
  ListPlus,
  Brain,
} from "lucide-react";
import { useApp } from "@/lib/store";
import { useSandboxStore } from "@/stores/sandboxStore";
import { useMemoryStore } from "@/stores/memoryStore";
import { useHighlightStore } from "@/stores/highlightStore";
import { useAlertStore } from "@/stores/alertStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { PatentDetailPanel } from "@/components/search/PatentDetailPanel";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useToast } from "@/components/shared/Toast";
import { SearchResultsSkeleton } from "@/components/shared/LoadingSkeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";

const ADVANCED_SEARCH_MODES = [
  { id: "keyword", label: "Keyword" },
  { id: "semantic", label: "Semantic" },
  { id: "hybrid", label: "Hybrid" },
  { id: "boolean", label: "Boolean" },
  { id: "concept", label: "Concept" },
  { id: "claim", label: "Claim" },
  { id: "inventor", label: "Inventor" },
  { id: "assignee", label: "Assignee" },
  { id: "technology", label: "Technology" },
  { id: "family", label: "Family" },
  { id: "citation", label: "Citation" },
  { id: "classification", label: "CPC / IPC" },
  { id: "image", label: "Image" },
  { id: "drawing", label: "Drawing" },
  { id: "document", label: "Document" },
  { id: "multilanguage", label: "Multi-language" },
];

export default function SearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { searchPatents, savePatent, removePatent, savedPatents, isPatentSaved } = useApp();
  const { show } = useToast();

  const [activeTab, setActiveTab] = useState<string>("ai");
  // Carried over from the Decision Intelligence console hand-off.
  const [handoffMode, setHandoffMode] = useState<string | undefined>(undefined);
  const [handoffConcepts, setHandoffConcepts] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState("");
  const [searchResults, setSearchResults] = useState<any | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [selectedPatent, setSelectedPatent] = useState<any | null>(null);
  
  // Sandbox
  const sandbox = useSandboxStore();
  // Auto Memory
  const memory = useMemoryStore();
  // Highlights
  const highlight = useHighlightStore();
  const activeScheme = highlight.getActiveScheme();
  // Alerts
  const alertStore = useAlertStore();
  
  // Compare queue loaded from/saved to localStorage
  const [compareQueue, setCompareQueue] = useState<any[]>([]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("compare_queue");
      if (saved) setCompareQueue(JSON.parse(saved));
    } catch {}
  }, []);

  const saveCompareQueue = (queue: any[]) => {
    setCompareQueue(queue);
    localStorage.setItem("compare_queue", JSON.stringify(queue));
  };

  // URL Query handling
  useEffect(() => {
    const q = searchParams.get("q");
    const tab = searchParams.get("tab");
    const patentId = searchParams.get("patentId");
    const mode = searchParams.get("mode");
    const concepts = searchParams.get("concepts");

    if (mode) setHandoffMode(mode);
    if (concepts) setHandoffConcepts(concepts);

    if (tab) {
      setActiveTab(tab);
    }
    if (q) {
      if (tab === "ai" || !tab) {
        setAiQuery(q);
        handleAiSearch(q);
      } else if (tab === "fielded") {
        setFieldedKeywords(q);
      } else if (tab === "boolean") {
        setBooleanQuery(q);
      }
    }
    if (patentId) {
      // Find patent if visible in current results or load mock
      const existing = searchResults?.results?.find((p: any) => p.id === patentId || p.patent_number === patentId) || 
                       savedPatents.find((p) => p.id === patentId);
      if (existing) {
        setSelectedPatent(existing);
      }
    }
  }, [searchParams]);

  // -------------------------------------------------------------
  // TAB 1: AI Search State & Execution
  // -------------------------------------------------------------
  const [aiQuery, setAiQuery] = useState("");
  const [searchBase, setSearchBase] = useState("Description and claims");
  const [globalLogic, setGlobalLogic] = useState("AND");
  const [restrictPublication, setRestrictPublication] = useState(false);
  const [runInBackground, setRunInBackground] = useState(false);
  const [resultsCount, setResultsCount] = useState(100);
  const [selectedModes, setSelectedModes] = useState<string[]>(["keyword", "semantic", "hybrid"]);
  const [includeSynonyms, setIncludeSynonyms] = useState(true);
  const [includeVectors, setIncludeVectors] = useState(true);
  const [includeCitations, setIncludeCitations] = useState(true);
  const [countryFilter, setCountryFilter] = useState("US");
  const [statusFilter, setStatusFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [technologyFilter, setTechnologyFilter] = useState("");
  const [familyQuery, setFamilyQuery] = useState("");
  const [citationQuery, setCitationQuery] = useState("");
  const [documentQuery, setDocumentQuery] = useState("");
  const [imageQuery, setImageQuery] = useState("");

  // Semantic Search State
  const [semanticQuery, setSemanticQuery] = useState("");
  const [semanticResults, setSemanticResults] = useState<any[]>([]);

  const handleSemanticSearch = async () => {
    if (!semanticQuery.trim()) return;
    setLoading(true);
    setLoadingStep("Running vector similarity search...");
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1"}/ai/semantic-search`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ query: semanticQuery, limit: 20 }),
      });
      if (res.ok) {
        const data = await res.json();
        setSemanticResults(data.results || []);
        show(`Semantic search found ${data.results?.length || 0} similar patents`, "success");
      } else {
        show("Semantic search failed. Is the backend running?", "error");
      }
    } catch {
      show("Connection error. Please check your backend.", "error");
    } finally {
      setLoading(false);
    }
  };

  const [queryGroups, setQueryGroups] = useState<any[]>([
    {
      id: "g1",
      logic: "AND",
      fields: [
        { id: "f1", type: "Full Text", value1: "", value2: "" },
        { id: "f2", type: "Publication date", value1: "", value2: "" },
        { id: "f3", type: "Country code", value1: "", value2: "" },
        { id: "f4", type: "IPC", value1: "", value2: "" },
        { id: "f5", type: "Assignees / Applicants", value1: "All", value2: "" },
        { id: "f6", type: "Legal status is", value1: "", value2: "" },
        { id: "f7", type: "Line numbers", value1: "", value2: "" },
      ],
    },
  ]);

  const addGroup = () => {
    setQueryGroups([...queryGroups, { id: `g${Date.now()}`, logic: "AND", fields: [] }]);
  };

  const addField = (groupId: string, index: number) => {
    setQueryGroups(queryGroups.map(g => {
      if (g.id === groupId) {
        const newFields = [...g.fields];
        newFields.splice(index + 1, 0, { id: `f${Date.now()}`, type: "Full Text", value1: "", value2: "" });
        return { ...g, fields: newFields };
      }
      return g;
    }));
  };

  const removeField = (groupId: string, fieldId: string) => {
    setQueryGroups(queryGroups.map(g => {
      if (g.id === groupId) {
        return { ...g, fields: g.fields.filter((f: any) => f.id !== fieldId) };
      }
      return g;
    }));
  };

  const updateField = (groupId: string, fieldId: string, key: string, value: string) => {
    setQueryGroups(queryGroups.map(g => {
      if (g.id === groupId) {
        return {
          ...g,
          fields: g.fields.map((f: any) => f.id === fieldId ? { ...f, [key]: value } : f)
        };
      }
      return g;
    }));
  };

  const updateGroupLogic = (groupId: string, logic: string) => {
    setQueryGroups(queryGroups.map(g => g.id === groupId ? { ...g, logic } : g));
  };

  const handleAiSearch = async (overrideQuery?: string) => {
    setLoading(true);
    setLoadingStep("Understanding your request...");

    if (sandbox.enabled) {
      const qValue = overrideQuery || aiQuery;
      sandbox.search(qValue);
      const results = sandbox.results;
      const tagged = memory.tagResults(results);
      const summary = memory.getSummary(results);
      setSearchResults({
        results: tagged,
        total: results.length,
        page: 1,
        page_size: results.length,
        took_ms: 0,
        _memorySummary: summary,
        _sandbox: true,
      });
      show(`[SANDBOX] Found ${results.length} patents`, "success");
      setLoading(false);
      return;
    }

    // Collect all values to form a Google Patents query
    const terms: string[] = [];
    const qValue = overrideQuery !== undefined ? overrideQuery : aiQuery;
    if (qValue.trim()) terms.push(qValue.trim());
    
    queryGroups.forEach(g => {
      const groupTerms: string[] = [];
      g.fields.forEach((f: any) => {
        if (f.value1 || f.value2) {
          if (f.type === "Full Text" && f.value1) groupTerms.push(`"${f.value1}"`);
          else if (f.type === "Country code" && f.value1) groupTerms.push(`country:${f.value1}`);
          else if (f.type === "IPC" && f.value1) groupTerms.push(`ipc:${f.value1}`);
          else if (f.type === "Assignees / Applicants" && f.value2) groupTerms.push(`assignee:${f.value2}`);
        }
      });
      if (groupTerms.length > 0) {
        terms.push(`(${groupTerms.join(` ${g.logic} `)})`);
      }
    });

    const finalQuery = terms.join(` ${globalLogic} `) || "patent";

    setLoadingStep("Searching patent indexes...");

    try {
      const data = await searchPatents(finalQuery, "ai", buildAdvancedOptions({
        threshold: 80,
        mode: handoffMode,
        concepts: handoffConcepts,
      }));
      const mapped = {
        ...data,
        results: data.results.map((r: any) => ({
          ...r,
          id: r.patent_number,
        }))
      };
      const tagged = memory.tagResults(mapped.results);
      const summary = memory.getSummary(mapped.results);
      setSearchResults({
        ...mapped,
        results: tagged,
        _memorySummary: summary,
        _sandbox: false,
      });
      show(`Found ${mapped.results?.length || 0} patents`, "success");
    } catch (e: any) {
      console.error(e);
      show(e.message || "Search failed. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  // -------------------------------------------------------------
  // TAB 2: Fielded Search State & Execution
  // -------------------------------------------------------------
  const [fieldedKeywords, setFieldedKeywords] = useState("");
  const [fieldedInventor, setFieldedInventor] = useState("");
  const [fieldedAssignee, setFieldedAssignee] = useState("");
  const [fieldedPatNum, setFieldedPatNum] = useState("");
  const [fieldedAbstract, setFieldedAbstract] = useState("");
  const [fieldedClaims, setFieldedClaims] = useState("");
  const [fieldedIpc, setFieldedIpc] = useState("ALL");
  const [fieldedCpc, setFieldedCpc] = useState("");
  const [fieldedJurisdiction, setFieldedJurisdiction] = useState<string[]>(["US"]);
  const [fieldedSort, setFieldedSort] = useState("relevance");

  const handleFieldedSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setLoadingStep("Processing fielded filters...");

    if (sandbox.enabled) {
      const filters: any = {};
      if (fieldedKeywords) filters.query = fieldedKeywords;
      if (fieldedAssignee) filters.assignee = fieldedAssignee;
      if (fieldedInventor) filters.inventor = fieldedInventor;
      if (fieldedIpc !== "ALL") filters.cpc_class = fieldedIpc;
      sandbox.search("", filters);
      const results = sandbox.results;
      const tagged = memory.tagResults(results);
      const summary = memory.getSummary(results);
      setSearchResults({
        results: tagged,
        total: results.length,
        page: 1,
        page_size: results.length,
        took_ms: 0,
        _memorySummary: summary,
        _sandbox: true,
      });
      show(`[SANDBOX] Found ${results.length} patents`, "success");
      setLoading(false);
      return;
    }
    
    const constructedQuery = [
      fieldedKeywords && `Keywords: "${fieldedKeywords}"`,
      fieldedInventor && `Inventor: ${fieldedInventor}`,
      fieldedAssignee && `Assignee: ${fieldedAssignee}`,
      fieldedPatNum && `Patent Number: ${fieldedPatNum}`,
      fieldedIpc !== "ALL" && `IPC: ${fieldedIpc}`,
      fieldedJurisdiction.length > 0 && `Jurisdiction: ${fieldedJurisdiction.join(",")}`
    ].filter(Boolean).join(", ");

    try {
      const data = await searchPatents(constructedQuery || "general patent query", "fielded", buildAdvancedOptions({
        resultsCount: 10,
        searchModes: [...new Set([...selectedModes, "inventor", "assignee", "classification", "claim"])],
      }));
      const mapped = {
        ...data,
        results: data.results.map((r: any) => ({
          ...r,
          id: r.patent_number,
        }))
      };
      const tagged = memory.tagResults(mapped.results);
      const summary = memory.getSummary(mapped.results);
      setSearchResults({
        ...mapped,
        results: tagged,
        _memorySummary: summary,
        _sandbox: false,
      });
      show(`Found ${mapped.results?.length || 0} patents`, "success");
    } catch (e: any) {
      console.error(e);
      show(e.message || "Search failed. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  // -------------------------------------------------------------
  // TAB 3: Numbers Search State & Execution
  // -------------------------------------------------------------
  const [numbersQuery, setNumbersQuery] = useState("");
  const [includeFamily, setIncludeFamily] = useState(true);

  function toggleSearchMode(mode: string) {
    setSelectedModes((prev) => {
      if (prev.includes(mode)) return prev.filter((m) => m !== mode);
      return [...prev, mode];
    });
  }

  function buildAdvancedOptions(extra: Record<string, any> = {}) {
    const modes = selectedModes.length ? selectedModes : ["keyword"];
    return {
      resultsCount,
      searchModes: modes,
      expandQuery: true,
      includeSynonyms,
      includeSemantic: modes.some((m) => ["semantic", "hybrid", "concept"].includes(m)),
      includeVectors,
      includeCitations,
      includeFamily,
      filters: {
        country: countryFilter,
        status: statusFilter,
        date_from: dateFrom,
        date_to: dateTo,
        inventor: fieldedInventor,
        assignee: fieldedAssignee,
        technology: technologyFilter,
        cpc_class: fieldedCpc,
        ipc_class: fieldedIpc === "ALL" ? "" : fieldedIpc,
        patent_family: familyQuery,
        citation: citationQuery,
        document_query: documentQuery,
        image_query: imageQuery,
      },
      ...extra,
    };
  }
  
  const handleNumbersSearch = async () => {
    if (!numbersQuery.trim()) return;
    setLoading(true);
    setLoadingStep("Looking up patent numbers...");

    if (sandbox.enabled) {
      sandbox.search(numbersQuery);
      const results = sandbox.results;
      const tagged = memory.tagResults(results);
      const summary = memory.getSummary(results);
      setSearchResults({
        results: tagged, total: results.length,
        page: 1, page_size: results.length, took_ms: 0,
        _memorySummary: summary, _sandbox: true,
      });
      show(`[SANDBOX] Found ${results.length} patents`, "success");
      setLoading(false);
      return;
    }

    try {
      const data = await searchPatents(numbersQuery, "numbers", buildAdvancedOptions({
        resultsCount: 10,
        searchModes: [...new Set([...selectedModes, "family"])],
      }));
      const mapped = {
        ...data,
        results: data.results.map((r: any) => ({
          ...r,
          id: r.patent_number,
        }))
      };
      const tagged = memory.tagResults(mapped.results);
      const summary = memory.getSummary(mapped.results);
      setSearchResults({ ...mapped, results: tagged, _memorySummary: summary, _sandbox: false });
      show(`Found ${mapped.results?.length || 0} patents`, "success");
    } catch (e: any) {
      console.error(e);
      show(e.message || "Search failed. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  // -------------------------------------------------------------
  // TAB 4: Boolean Search State & Execution
  // -------------------------------------------------------------
  const [booleanQuery, setBooleanQuery] = useState("");
  const [cursorPos, setCursorPos] = useState(0);
  const booleanTextareaRef = useRef<HTMLTextAreaElement>(null);

  const insertOperator = (operator: string) => {
    const textarea = booleanTextareaRef.current;
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    
    const newText = text.substring(0, start) + operator + text.substring(end);
    setBooleanQuery(newText);
    
    // Put cursor back after the inserted operator
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + operator.length, start + operator.length);
    }, 50);
  };

  const handleBooleanSearch = async () => {
    if (!booleanQuery.trim()) return;
    setLoading(true);
    setLoadingStep("Parsing Boolean logic...");

    if (sandbox.enabled) {
      sandbox.search(booleanQuery);
      const results = sandbox.results;
      const tagged = memory.tagResults(results);
      const summary = memory.getSummary(results);
      setSearchResults({
        results: tagged, total: results.length,
        page: 1, page_size: results.length, took_ms: 0,
        _memorySummary: summary, _sandbox: true,
      });
      show(`[SANDBOX] Found ${results.length} patents`, "success");
      setLoading(false);
      return;
    }

    try {
      const data = await searchPatents(booleanQuery, "boolean", buildAdvancedOptions({
        resultsCount: 10,
        searchModes: [...new Set([...selectedModes, "boolean"])],
      }));
      const mapped = {
        ...data,
        results: data.results.map((r: any) => ({
          ...r,
          id: r.patent_number,
        }))
      };
      const tagged = memory.tagResults(mapped.results);
      const summary = memory.getSummary(mapped.results);
      setSearchResults({ ...mapped, results: tagged, _memorySummary: summary, _sandbox: false });
      show(`Found ${mapped.results?.length || 0} patents`, "success");
    } catch (e: any) {
      console.error(e);
      show(e.message || "Search failed. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  // -------------------------------------------------------------
  // Helpers: Save, Compare, Export
  // -------------------------------------------------------------
  const toggleSave = async (p: any) => {
    const isSaved = savedPatents.some((saved) => saved.id === p.id || saved.patentNumber === p.patent_number);
    if (isSaved) {
      const saved = savedPatents.find((s) => s.id === p.id || s.patentNumber === p.patent_number);
      if (saved) {
        await removePatent(saved.id);
        show("Patent removed from saved", "info");
      }
    } else {
      const ok = await savePatent({
        id: p.id,
        patentNumber: p.patent_number,
        title: p.title,
        assignee: p.assignee,
        date: p.filing_date,
        abstract: p.abstract,
        ipc: p.ipc_codes || [],
      });
      if (ok) show("Patent saved successfully", "success");
      else show("Failed to save patent", "error");
    }
  };

  const toggleCompare = (p: any) => {
    const inQueue = compareQueue.some((q) => q.id === p.id);
    if (inQueue) {
      saveCompareQueue(compareQueue.filter((q) => q.id !== p.id));
    } else {
      if (compareQueue.length >= 3) {
        alert("You can compare up to 3 patents. Please remove one first.");
        return;
      }
      saveCompareQueue([...compareQueue, p]);
    }
  };

  const exportPatentJson = (p: any) => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(p, null, 2));
    const dlAnchorElem = document.createElement("a");
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", `patent_${p.patent_number}.json`);
    dlAnchorElem.click();
  };

  const [expandedAbstracts, setExpandedAbstracts] = useState<Record<string, boolean>>({});

  return (
    <ErrorBoundary>
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Patent Search</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Access the complete prior art database using AI-driven semantic match or traditional fielded parameters.
        </p>
      </div>

      {/* Rith banner */}
      <div
        onClick={() => router.push("/dashboard/zyra")}
        className="cursor-pointer rounded-xl border border-purple-300/60 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950/30 dark:to-indigo-950/30 dark:border-[#8a6a1e]/40 px-4 py-3 flex items-center gap-3 transition-all hover:shadow-sm"
      >
        <span className="text-xl shrink-0">✦</span>
        <div className="min-w-0">
          <p className="text-sm font-bold text-[#8a6a1e] dark:text-[#e8c97a] m-0">
            Try Rith — AI-powered conversational patent search
          </p>
          <p className="text-xs text-[#b8921e] dark:text-[#c9a84c] m-0 mt-0.5">
            Ask in plain English and get instant patent results →
          </p>
        </div>
      </div>

      {/* Advanced Search Intelligence */}
      <Card className="border-border/70 bg-card rounded-md shadow-sm">
        <CardContent className="p-4 space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-foreground">Advanced Search Intelligence</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Hybrid patent discovery across text, claims, families, citations, classifications, documents, and drawings.</p>
            </div>
            <div className="flex flex-wrap gap-2 text-[10px] font-semibold text-muted-foreground">
              <span className="rounded border border-border bg-muted/30 px-2 py-1">Query expansion</span>
              <span className="rounded border border-border bg-muted/30 px-2 py-1">Embedding rank</span>
              <span className="rounded border border-border bg-muted/30 px-2 py-1">Hybrid score</span>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Search Modes</label>
            <div className="flex flex-wrap gap-2">
              {ADVANCED_SEARCH_MODES.map((mode) => {
                const active = selectedModes.includes(mode.id);
                return (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => toggleSearchMode(mode.id)}
                    className={`rounded border px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                      active
                        ? "border-[#b8921e]/50 bg-[#c9a84c]/15 text-[#8a6a1e] dark:text-[#f1d88a]"
                        : "border-border bg-background text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {mode.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid gap-3 lg:grid-cols-[1.1fr_1.5fr]">
            <div className="grid gap-2 sm:grid-cols-2">
              {[
                ["Synonym engine", includeSynonyms, setIncludeSynonyms],
                ["Vector search", includeVectors, setIncludeVectors],
                ["Citation search", includeCitations, setIncludeCitations],
                ["Patent families", includeFamily, setIncludeFamily],
              ].map(([label, value, setter]: any) => (
                <label key={label} className="flex items-center justify-between gap-3 rounded-md border border-border bg-background px-3 py-2 text-xs font-semibold">
                  <span>{label}</span>
                  <input
                    type="checkbox"
                    checked={Boolean(value)}
                    onChange={(e) => setter(e.target.checked)}
                    className="rounded accent-primary"
                  />
                </label>
              ))}
            </div>

            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Country</label>
                <select value={countryFilter} onChange={(e) => setCountryFilter(e.target.value)} className="mt-1 h-9 w-full rounded border border-input bg-background px-2 text-xs">
                  <option value="">All</option>
                  <option value="US">US</option>
                  <option value="EP">EP</option>
                  <option value="WO">WO</option>
                  <option value="CN">CN</option>
                  <option value="JP">JP</option>
                  <option value="KR">KR</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Status</label>
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="mt-1 h-9 w-full rounded border border-input bg-background px-2 text-xs">
                  <option value="">Any</option>
                  <option value="Active">Active</option>
                  <option value="Pending">Pending</option>
                  <option value="Expired">Expired</option>
                  <option value="Abandoned">Abandoned</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">From</label>
                <Input value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} placeholder="YYYY-MM-DD" className="mt-1 h-9 text-xs" />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">To</label>
                <Input value={dateTo} onChange={(e) => setDateTo(e.target.value)} placeholder="YYYY-MM-DD" className="mt-1 h-9 text-xs" />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Technology</label>
                <Input value={technologyFilter} onChange={(e) => setTechnologyFilter(e.target.value)} placeholder="wearables, battery" className="mt-1 h-9 text-xs" />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Patent Family</label>
                <Input value={familyQuery} onChange={(e) => setFamilyQuery(e.target.value)} placeholder="INPADOC / family" className="mt-1 h-9 text-xs" />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Citation</label>
                <Input value={citationQuery} onChange={(e) => setCitationQuery(e.target.value)} placeholder="US10987234B2" className="mt-1 h-9 text-xs" />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Document / Image</label>
                <Input
                  value={documentQuery || imageQuery}
                  onChange={(e) => { setDocumentQuery(e.target.value); setImageQuery(e.target.value); }}
                  placeholder="figure, PDF, drawing"
                  className="mt-1 h-9 text-xs"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5 max-w-3xl bg-muted/60 p-1">
          <TabsTrigger value="ai" className="gap-1.5 text-xs font-semibold">
            <Sparkles className="h-3.5 w-3.5 text-[#c9a84c]" />
            AI Search
          </TabsTrigger>
          <TabsTrigger value="fielded" className="gap-1.5 text-xs font-semibold">
            <SlidersHorizontal className="h-3.5 w-3.5 text-blue-500" />
            Fielded
          </TabsTrigger>
          <TabsTrigger value="numbers" className="gap-1.5 text-xs font-semibold">
            <Hash className="h-3.5 w-3.5 text-teal-500" />
            Numbers
          </TabsTrigger>
          <TabsTrigger value="boolean" className="gap-1.5 text-xs font-semibold">
            <Terminal className="h-3.5 w-3.5 text-orange-500" />
            Boolean
          </TabsTrigger>
          <TabsTrigger value="semantic" className="gap-1.5 text-xs font-semibold">
            <Brain className="h-3.5 w-3.5 text-[#c9a84c]" />
            Semantic
          </TabsTrigger>
        </TabsList>

        {/* AI Search Tab */}
        <TabsContent value="ai" className="space-y-4">
          <Card className="border-border/60 bg-card rounded-md shadow-sm overflow-hidden">
            <CardContent className="p-0">
              {/* Top Textarea Section */}
              <div className="p-4 bg-muted/20 border-b">
                <textarea
                  value={aiQuery}
                  onChange={(e) => setAiQuery(e.target.value)}
                  className="w-full min-h-[120px] rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-y"
                  placeholder=""
                />
                
                <div className="mt-4 flex items-center gap-2">
                  <span className="text-xs font-semibold text-foreground">Find patent publications based on their</span>
                  <select 
                    value={searchBase}
                    onChange={(e) => setSearchBase(e.target.value)}
                    className="border border-input rounded bg-background px-2 py-1.5 text-xs focus:outline-none"
                  >
                    <option value="Description and claims">Description and claims</option>
                    <option value="Title and abstract">Title and abstract</option>
                    <option value="Full document">Full document</option>
                  </select>
                </div>
              </div>

              {/* Toolbar Section */}
              <div className="flex items-center justify-between p-3 border-b bg-muted/30 flex-wrap gap-2">
                <div className="flex items-center gap-4">
                  <select 
                    value={globalLogic}
                    onChange={(e) => setGlobalLogic(e.target.value)}
                    className="border border-emerald-500/30 rounded bg-emerald-500/10 text-emerald-600 font-bold px-2 py-1 text-xs focus:outline-none"
                  >
                    <option value="AND">AND</option>
                    <option value="OR">OR</option>
                  </select>
                  <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={restrictPublication}
                      onChange={(e) => setRestrictPublication(e.target.checked)}
                      className="rounded border-input text-primary" 
                    />
                    Restrict the fields below to the same publication <Info className="h-3 w-3" />
                  </label>
                </div>
                <Button variant="outline" size="sm" className="h-7 text-xs font-semibold bg-background">
                  <Terminal className="h-3 w-3 mr-1" /> Open in command editor
                </Button>
              </div>

              {/* Dynamic Groups Section */}
              <div className="p-4 space-y-4 bg-muted/10">
                {queryGroups.map((group, gIdx) => (
                  <div key={group.id} className="border border-border/80 rounded-md bg-background overflow-hidden">
                    <div className="flex items-center p-2 border-b bg-muted/30 gap-2">
                      <Badge variant="secondary" className="text-[10px] bg-muted-foreground/10 text-muted-foreground px-1.5 rounded-sm shadow-none">Group {gIdx + 1}</Badge>
                      <span className="text-xs font-semibold text-muted-foreground">Logic between these fields:</span>
                      <select 
                        value={group.logic}
                        onChange={(e) => updateGroupLogic(group.id, e.target.value)}
                        className="border border-input rounded bg-background px-2 py-1 text-xs font-bold focus:outline-none h-6"
                      >
                        <option value="AND">AND</option>
                        <option value="OR">OR</option>
                      </select>
                    </div>
                    
                    <div className="p-3 space-y-2.5">
                      {group.fields.map((field: any, fIdx: number) => (
                        <div key={field.id} className="flex items-center gap-2">
                          <GripVertical className="h-4 w-4 text-muted-foreground cursor-move shrink-0" />
                          <select 
                            value={field.type}
                            onChange={(e) => updateField(group.id, field.id, "type", e.target.value)}
                            className="border border-input rounded bg-background px-2 py-1.5 text-xs focus:outline-none min-w-[150px]"
                          >
                            <option>Full Text</option>
                            <option>Publication date</option>
                            <option>Country code</option>
                            <option>IPC</option>
                            <option>Assignees / Applicants</option>
                            <option>Legal status is</option>
                            <option>Line numbers</option>
                          </select>

                          {field.type === "Publication date" ? (
                            <div className="flex-1 flex flex-wrap sm:flex-nowrap items-center gap-2">
                              <span className="text-xs text-muted-foreground">from</span>
                              <Input 
                                placeholder="" 
                                value={field.value1} 
                                onChange={(e) => updateField(group.id, field.id, "value1", e.target.value)} 
                                className="h-7 text-xs flex-1 min-w-[100px]" 
                              />
                              <span className="text-xs text-muted-foreground">to</span>
                              <Input 
                                placeholder="" 
                                value={field.value2} 
                                onChange={(e) => updateField(group.id, field.id, "value2", e.target.value)} 
                                className="h-7 text-xs flex-1 min-w-[100px]" 
                              />
                              <Button variant="outline" size="sm" className="h-7 text-xs">Modifier</Button>
                            </div>
                          ) : field.type === "Assignees / Applicants" ? (
                            <div className="flex-1 flex flex-wrap sm:flex-nowrap items-center gap-2">
                              <select 
                                value={field.value1}
                                onChange={(e) => updateField(group.id, field.id, "value1", e.target.value)}
                                className="border border-input rounded bg-background px-2 py-1.5 text-xs focus:outline-none shrink-0"
                              >
                                <option>All</option>
                                <option>Current</option>
                                <option>Original</option>
                              </select>
                              <Input 
                                placeholder="" 
                                value={field.value2} 
                                onChange={(e) => updateField(group.id, field.id, "value2", e.target.value)} 
                                className="h-7 text-xs flex-1 min-w-[140px]" 
                              />
                            </div>
                          ) : field.type === "Legal status is" ? (
                            <div className="flex-1 flex items-center gap-2">
                              <select className="border border-input rounded bg-background px-2 py-1.5 text-xs focus:outline-none flex-1">
                                <option>Select one or more options</option>
                                <option>Active</option>
                                <option>Expired</option>
                              </select>
                              <Button variant="outline" size="sm" className="h-7 text-xs shrink-0">Modifier</Button>
                            </div>
                          ) : (
                            <Input 
                              placeholder=""
                              value={field.value1}
                              onChange={(e) => updateField(group.id, field.id, "value1", e.target.value)}
                              className="h-7 text-xs flex-1 min-w-[140px]"
                            />
                          )}

                          <div className="flex items-center gap-1 shrink-0 ml-1">
                            <Button variant="outline" size="icon" className="h-7 w-7 text-muted-foreground bg-background" onClick={(e) => { e.preventDefault(); addField(group.id, fIdx); }}>
                              <Plus className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="outline" size="icon" className="h-7 w-7 text-red-500 hover:text-red-600 hover:bg-red-500/10 bg-background" onClick={(e) => { e.preventDefault(); removeField(group.id, field.id); }}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                <div className="flex gap-2 mt-2">
                  <Button variant="outline" size="sm" className="h-7 text-xs bg-background" onClick={(e) => { e.preventDefault(); addField(queryGroups[0]?.id || `g${Date.now()}`, 0); }}>
                    <Plus className="h-3.5 w-3.5 mr-1.5" /> New field
                  </Button>
                  <Button variant="outline" size="sm" className="h-7 text-xs bg-background" onClick={(e) => { e.preventDefault(); addGroup(); }}>
                    <ListPlus className="h-3.5 w-3.5 mr-1.5" /> New group
                  </Button>
                </div>
              </div>
              
              {/* Footer Section */}
              <div className="flex flex-wrap items-center justify-between p-3 border-t bg-muted/20 gap-3">
                <div className="flex flex-wrap items-center gap-4">
                  <Button
                    onClick={() => handleAiSearch()}
                    disabled={loading}
                    className="h-8 bg-blue-500 hover:bg-blue-600 text-white font-bold text-xs px-4"
                  >
                    {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : <Sparkles className="h-3.5 w-3.5 mr-1.5" />}
                    Run search
                  </Button>
                  <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={runInBackground}
                      onChange={(e) => setRunInBackground(e.target.checked)}
                      className="rounded border-input text-primary" 
                    />
                    Run in the background
                  </label>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span>Max. number of results:</span>
                    <select 
                      value={resultsCount}
                      onChange={(e) => setResultsCount(Number(e.target.value))}
                      className="border border-input rounded bg-background px-1.5 py-1 focus:outline-none h-7"
                    >
                      <option value={10}>10</option>
                      <option value={25}>25</option>
                      <option value={100}>100</option>
                    </select>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" className="h-8 text-xs text-muted-foreground hover:text-foreground">
                    <HelpCircle className="h-3.5 w-3.5 mr-1.5" /> Help
                  </Button>
                  <Button variant="outline" size="sm" className="h-8 text-xs text-red-500 hover:text-red-600 hover:bg-red-500/10 border-red-500/30 bg-background" onClick={(e) => { e.preventDefault(); setQueryGroups([]); addGroup(); setAiQuery(""); }}>
                    <Trash2 className="h-3 w-3 mr-1.5" /> Reset
                  </Button>
                  <Button variant="outline" size="sm" className="h-8 text-xs bg-background">
                    Cancel
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Fielded Search Tab */}
        <TabsContent value="fielded" className="space-y-4">
          <form onSubmit={handleFieldedSearch}>
            <Card>
              <CardContent className="pt-6 grid gap-6 md:grid-cols-2">
                {/* Left Column */}
                <div className="space-y-3">
                  <div>
                    <label className="text-[11px] font-bold text-muted-foreground">Keywords / Title</label>
                    <Input value={fieldedKeywords} onChange={(e) => setFieldedKeywords(e.target.value)} placeholder="" className="mt-1" />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-muted-foreground">Inventor Name</label>
                    <Input value={fieldedInventor} onChange={(e) => setFieldedInventor(e.target.value)} placeholder="" className="mt-1" />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-muted-foreground">Assignee</label>
                    <Input value={fieldedAssignee} onChange={(e) => setFieldedAssignee(e.target.value)} placeholder="" className="mt-1" />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-muted-foreground">Patent Number</label>
                    <Input value={fieldedPatNum} onChange={(e) => setFieldedPatNum(e.target.value)} placeholder="" className="mt-1" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] font-bold text-muted-foreground">Abstract Keywords</label>
                      <Input value={fieldedAbstract} onChange={(e) => setFieldedAbstract(e.target.value)} placeholder="" className="mt-1" />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-muted-foreground">Claims Keywords</label>
                      <Input value={fieldedClaims} onChange={(e) => setFieldedClaims(e.target.value)} placeholder="" className="mt-1" />
                    </div>
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] font-bold text-muted-foreground">IPC Section</label>
                      <select
                        value={fieldedIpc}
                        onChange={(e) => setFieldedIpc(e.target.value)}
                        className="w-full mt-1 border rounded bg-transparent p-2 text-xs font-semibold h-9"
                      >
                        <option value="ALL">All Sections (A-H)</option>
                        <option value="A">Section A (Human Necessities)</option>
                        <option value="B">Section B (Operations; Transporting)</option>
                        <option value="C">Section C (Chemistry; Metallurgy)</option>
                        <option value="D">Section D (Textiles; Paper)</option>
                        <option value="E">Section E (Fixed Constructions)</option>
                        <option value="F">Section F (Mechanical Eng; Lighting)</option>
                        <option value="G">Section G (Physics)</option>
                        <option value="H">Section H (Electricity)</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-muted-foreground">CPC Code</label>
                      <Input value={fieldedCpc} onChange={(e) => setFieldedCpc(e.target.value)} placeholder="" className="mt-1" />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-muted-foreground">Country/Jurisdiction</label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {["US", "EP", "WO", "CN", "JP"].map((j) => (
                        <button
                          type="button"
                          key={j}
                          onClick={() => {
                            if (fieldedJurisdiction.includes(j)) {
                              setFieldedJurisdiction(fieldedJurisdiction.filter((x) => x !== j));
                            } else {
                              setFieldedJurisdiction([...fieldedJurisdiction, j]);
                            }
                          }}
                          className={`px-2.5 py-1 rounded text-xs font-semibold border ${
                            fieldedJurisdiction.includes(j) ? "bg-primary text-white border-primary" : "border-border"
                          }`}
                        >
                          {j}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] font-bold text-muted-foreground">Sort By</label>
                      <select
                        value={fieldedSort}
                        onChange={(e) => setFieldedSort(e.target.value)}
                        className="w-full mt-1 border rounded bg-transparent p-2 text-xs font-semibold h-9"
                      >
                        <option value="relevance">Relevance</option>
                        <option value="newest">Date Newest</option>
                        <option value="oldest">Date Oldest</option>
                        <option value="citations">Citations</option>
                      </select>
                    </div>
                    <div className="flex items-end gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setFieldedKeywords("");
                          setFieldedInventor("");
                          setFieldedAssignee("");
                          setFieldedPatNum("");
                          setFieldedIpc("ALL");
                          setFieldedCpc("");
                          setFieldedJurisdiction(["US"]);
                        }}
                        className="w-1/2 h-9 text-xs"
                      >
                        Reset
                      </Button>
                      <Button type="submit" disabled={loading} className="w-1/2 h-9 text-xs font-bold">
                        Search &rarr;
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </form>
        </TabsContent>

        {/* Numbers Search Tab */}
        <TabsContent value="numbers" className="space-y-4">
          <Card>
            <CardContent className="pt-6 space-y-4">
              <textarea
                value={numbersQuery}
                onChange={(e) => setNumbersQuery(e.target.value)}
                placeholder=""
                className="w-full min-h-[120px] rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />

              <div className="flex items-center gap-4 text-xs font-semibold">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeFamily}
                    onChange={(e) => setIncludeFamily(e.target.checked)}
                    className="rounded accent-primary"
                  />
                  Include patent family members
                </label>
              </div>

              <Button
                onClick={handleNumbersSearch}
                disabled={loading || !numbersQuery.trim()}
                className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold h-11"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Hash className="h-4 w-4 mr-2" />}
                Look Up Patents &rarr;
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Boolean Search Tab */}
        <TabsContent value="boolean" className="space-y-4">
          <Card>
            <CardContent className="pt-6 space-y-4">
              <textarea
                ref={booleanTextareaRef}
                value={booleanQuery}
                onChange={(e) => setBooleanQuery(e.target.value)}
                placeholder=""
                className="w-full min-h-[120px] rounded-md border border-input bg-mono bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring font-mono"
              />

              {/* Operator Chips */}
              <div className="flex flex-wrap gap-1.5 items-center">
                <span className="text-[10px] font-bold text-muted-foreground mr-1">Insert Operator:</span>
                {["AND", "OR", "NOT", "NEAR/5", "ADJ", "TTL:()", "ASGN:()", "INV:()", "ACLM:()", "IPC:()"].map((op) => (
                  <button
                    key={op}
                    type="button"
                    onClick={() => insertOperator(op)}
                    className="px-2 py-0.5 rounded border border-border bg-muted/40 hover:bg-muted text-[10px] font-semibold transition-colors"
                  >
                    {op}
                  </button>
                ))}
              </div>

              {/* Guide */}
              <details className="group border rounded-md p-2 bg-muted/20">
                <summary className="text-xs font-semibold cursor-pointer list-none flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Info className="h-3.5 w-3.5 text-primary" />
                    Boolean Query Syntax Guide
                  </span>
                  <ChevronDown className="h-3 w-3 transition-transform group-open:rotate-180" />
                </summary>
                <div className="mt-2 text-[11px] text-muted-foreground space-y-1 pl-4 leading-relaxed">
                  <p><span className="font-bold text-foreground">TTL:</span> Searches within the patent title only.</p>
                  <p><span className="font-bold text-foreground">ASGN:</span> Matches the assignee company name.</p>
                  <p><span className="font-bold text-foreground">INV:</span> Matches inventors.</p>
                  <p><span className="font-bold text-foreground">ACLM:</span> Searches inside individual claims.</p>
                  <p><span className="font-bold text-foreground">NEAR/5:</span> Matches terms within 5 words of each other in any direction.</p>
                </div>
              </details>

              <Button
                onClick={handleBooleanSearch}
                disabled={loading || !booleanQuery.trim()}
                className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold h-11"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Terminal className="h-4 w-4 mr-2" />}
                Execute Query &rarr;
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Semantic Search Tab */}
        <TabsContent value="semantic" className="space-y-4">
          <Card className="border-border/60 rounded-xl overflow-hidden">
            <CardContent className="p-6 space-y-5">
              {/* Header */}
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#c9a84c]/10 border border-[#c9a84c]/20">
                  <Brain className="h-5 w-5 text-[#c9a84c]" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground">Semantic / Vector Search</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Uses Weaviate embeddings to find patents by conceptual similarity — not just keywords.
                    Describe the invention in natural language and let the AI find semantically related patents.
                  </p>
                </div>
              </div>

              {/* Input */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Describe the Invention or Concept</label>
                <textarea
                  value={semanticQuery}
                  onChange={(e) => setSemanticQuery(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && e.ctrlKey) handleSemanticSearch(); }}
                  rows={4}
                  placeholder="e.g. A method for detecting blood glucose non-invasively using near-infrared spectroscopy without drawing blood samples..."
                  className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#c9a84c]/50 resize-y"
                />
                <p className="text-[10px] text-muted-foreground">Ctrl+Enter to search · Natural language supported · Uses vector embeddings</p>
              </div>

              <Button
                onClick={handleSemanticSearch}
                disabled={loading || !semanticQuery.trim()}
                className="w-full h-11 bg-gradient-to-r from-[#b8921e] to-[#b8921e] hover:from-[#c9a84c] hover:to-[#c9a84c] text-white font-bold shadow-lg shadow-[#c9a84c]/20"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Brain className="h-4 w-4 mr-2" />}
                Run Semantic Search →
              </Button>

              {/* Results */}
              {semanticResults.length > 0 && (
                <div className="space-y-3 pt-2 border-t border-border/60">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-foreground">
                      Semantic Matches <span className="text-muted-foreground font-normal">({semanticResults.length} results)</span>
                    </h4>
                    <span className="text-[10px] text-[#c9a84c] font-mono">Ranked by vector similarity</span>
                  </div>
                  <div className="space-y-2">
                    {semanticResults.map((r: any, i: number) => (
                      <div
                        key={i}
                        onClick={() => setSelectedPatent(r)}
                        className="flex items-start gap-3 p-3 rounded-xl border border-border/60 hover:border-[#c9a84c]/30 hover:bg-[#c9a84c]/5 cursor-pointer transition-all group"
                      >
                        {/* Score Badge */}
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#c9a84c]/10 border border-[#c9a84c]/20 text-[11px] font-bold text-[#c9a84c] font-mono">
                          {Math.round((r.score || 0) * 100)}%
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-mono text-[#c9a84c]">{r.patent_number}</p>
                          <p className="text-sm font-semibold text-foreground leading-snug mt-0.5 line-clamp-1 group-hover:text-[#e8c97a] transition-colors">
                            {r.title}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                            {r.abstract}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Sandbox Mode Banner */}
      <div className="flex items-center justify-between py-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              sandbox.toggle();
              setSearchResults(null);
              if (!sandbox.enabled) show("Sandbox mode activated — searching 23 sample patents", "info");
              else show("Live search mode activated", "info");
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
              sandbox.enabled
                ? "bg-amber-100 border-amber-300 text-amber-800 dark:bg-amber-900/30 dark:border-amber-700 dark:text-amber-300"
                : "bg-muted border-border text-muted-foreground"
            }`}
          >
            {sandbox.enabled ? "[SANDBOX MODE ON]" : "Sandbox Mode"}
          </button>
          {!activeScheme && (
            <span className="text-[10px] text-muted-foreground italic">
              No highlight scheme selected.{" "}
              <button
                onClick={() => router.push("/dashboard/highlights")}
                className="text-primary hover:underline"
              >
                Apply one from your Highlight Library?
              </button>
            </span>
          )}
        </div>
        <button
          onClick={() => {
            memory.resetMemory();
            show("Memory cleared", "info");
          }}
          className="text-[10px] text-muted-foreground hover:text-foreground"
        >
          Clear memory
        </button>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="space-y-4 pt-6">
          <p className="text-sm font-semibold text-foreground text-center mb-4">{loadingStep}</p>
          <SearchResultsSkeleton count={6} />
        </div>
      )}

      {/* Empty State */}
      {!loading && searchResults && searchResults.results?.length === 0 && (
        <EmptyState
          icon="🔍"
          title="No patents found"
          description="Try adjusting your search terms or use different keywords"
          action="Clear search"
          onAction={() => setSearchResults(null)}
        />
      )}

      {/* Search Results Display */}
      {!loading && searchResults && searchResults.results?.length > 0 && (
        <div className="space-y-4">
          {/* Header Bar */}
          <div className="flex flex-wrap items-center justify-between border-b pb-3">
            <div className="text-xs font-semibold text-muted-foreground">
              {searchResults._sandbox && (
                <span className="inline-block px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 mr-1 align-middle">
                  [SANDBOX]
                </span>
              )}
              {searchResults.results?.length} results &middot; {searchResults.search_stats?.search_time_ms || 0}ms
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setViewMode("list")}
                className={`h-8 w-8 ${viewMode === "list" ? "bg-muted" : ""}`}
              >
                <LayoutList className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setViewMode("grid")}
                className={`h-8 w-8 ${viewMode === "grid" ? "bg-muted" : ""}`}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Memory Summary */}
          {searchResults._memorySummary && (
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                {searchResults._memorySummary.total} results —{" "}
                <span className="text-emerald-600 font-semibold">{searchResults._memorySummary.newCount} NEW</span>
                {", "}
                <span className="text-muted-foreground">{searchResults._memorySummary.seenCount} already seen</span>
              </p>
              {searchResults._memorySummary.seenCount > 0 &&
                searchResults._memorySummary.seenCount / searchResults._memorySummary.total > 0.7 && (
                  <p className="text-[10px] text-amber-600 italic">
                    Most results are patents you've already reviewed. Consider refining your search.
                  </p>
                )}
            </div>
          )}

          {/* Sandbox Export Prompt */}
          {searchResults._sandbox && (
            <div className="flex items-center gap-2 p-2 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-lg">
              <span className="text-xs text-amber-800 dark:text-amber-300">
                Searching in Sandbox mode. Would you like to save this search to a new project?
              </span>
              <button
                onClick={() => {
                  sandbox.disable();
                  router.push("/dashboard/workspace");
                }}
                className="text-xs font-semibold text-primary hover:underline"
              >
                Save to project →
              </button>
            </div>
          )}

          {/* Check Alerts */}
          {!sandbox.enabled && (
            <div className="flex justify-end">
              <button
                onClick={async () => {
                  try {
                    const res = await fetch("/api/check-alerts", { method: "POST" });
                    const data = await res.json();
                    if (data.notifications?.length > 0) {
                      data.notifications.forEach((n: any) => {
                        alertStore.addNotification(n);
                      });
                      show(`${data.notifications.length} alert(s) triggered`, "info");
                    } else {
                      show("No new alert matches found", "info");
                    }
                  } catch {
                    show("Failed to check alerts", "error");
                  }
                }}
                className="text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-1"
              >
                🔔 Check Alerts
              </button>
            </div>
          )}

          {/* Search Intelligence Summary */}
          {(searchResults.search_modes?.length || searchResults.query_expansion?.expandedTerms?.length || searchResults.suggestions?.length) && (
            <Card className="border-border/70 bg-card">
              <CardContent className="p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h4 className="text-xs font-bold text-foreground">Search Intelligence</h4>
                  {searchResults.search_stats?.ai_model && (
                    <span className="text-[10px] font-mono text-muted-foreground">{searchResults.search_stats.ai_model}</span>
                  )}
                </div>
                {searchResults.search_modes?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 items-center">
                    <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Modes</span>
                    {searchResults.search_modes.map((mode: string) => (
                      <Badge key={mode} variant="outline" className="rounded-sm border-[#c9a84c]/30 bg-[#c9a84c]/10 text-[9px] text-[#8a6a1e] dark:text-[#f1d88a]">
                        {mode}
                      </Badge>
                    ))}
                  </div>
                )}
                {searchResults.query_expansion?.expandedTerms?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 items-center">
                    <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Expanded</span>
                    {searchResults.query_expansion.expandedTerms.slice(0, 12).map((term: string) => (
                      <button
                        key={term}
                        type="button"
                        onClick={() => { setAiQuery(term); setActiveTab("ai"); }}
                        className="rounded border border-border bg-background px-2 py-0.5 text-[10px] font-semibold text-muted-foreground hover:text-foreground"
                      >
                        {term}
                      </button>
                    ))}
                  </div>
                )}
                {searchResults.suggestions?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 items-center">
                    <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Suggestions</span>
                    {searchResults.suggestions.slice(0, 8).map((suggestion: string) => (
                      <button
                        key={suggestion}
                        type="button"
                        onClick={() => { setAiQuery(suggestion); handleAiSearch(suggestion); }}
                        className="rounded border border-blue-500/20 bg-blue-500/10 px-2 py-0.5 text-[10px] font-semibold text-blue-700 hover:bg-blue-500/15 dark:text-blue-300"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* AI Interpretation Box (only for AI searches) */}
          {activeTab === "ai" && searchResults.query_interpretation && (
            <Card className="bg-[#c9a84c]/5 border-[#c9a84c]/10">
              <CardContent className="p-4 space-y-3">
                <div>
                  <h4 className="text-xs font-bold text-[#c9a84c]">Query interpreted as:</h4>
                  <p className="text-xs text-foreground mt-0.5 italic">{searchResults.query_interpretation}</p>
                </div>
                <div className="flex flex-wrap gap-1.5 items-center">
                  <span className="text-[10px] font-bold text-muted-foreground">Key Concepts:</span>
                  {searchResults.key_concepts?.map((c: string) => (
                    <Badge key={c} variant="outline" className="text-[9px] font-normal px-2 py-0 border-[#c9a84c]/20 text-[#c9a84c]">
                      {c}
                    </Badge>
                  ))}
                </div>
                {searchResults.suggested_ipc_codes && (
                  <div className="flex flex-wrap gap-1.5 items-center">
                    <span className="text-[10px] font-bold text-muted-foreground">Suggested IPCs:</span>
                    {searchResults.suggested_ipc_codes.map((ipc: string) => (
                      <button
                        key={ipc}
                        onClick={() => {
                          setFieldedIpc(ipc[0]);
                          setFieldedCpc(ipc);
                          setActiveTab("fielded");
                        }}
                        className="px-2 py-0.5 rounded text-[9px] font-semibold bg-[#c9a84c]/10 hover:bg-[#c9a84c]/20 text-[#c9a84c]"
                      >
                        {ipc}
                      </button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Results List / Grid */}
          <div className={viewMode === "list" ? "space-y-4" : "grid gap-4 sm:grid-cols-2 md:grid-cols-3"}>
            {searchResults.results?.map((patent: any) => {
              const isSaved = savedPatents.some((saved) => saved.id === patent.id || saved.patentNumber === patent.patent_number);
              const inCompare = compareQueue.some((q) => q.id === patent.id);
              const hybridScore = Math.round(patent.hybrid_score ?? patent.ai_match_score ?? 80);
              const semanticScore = Math.round(patent.semantic_score ?? hybridScore);
              const relevanceScore = Math.round(patent.relevance_score ?? hybridScore);
              const noveltyScore = Math.round(patent.novelty_score ?? 50);
              const citationScore = Math.round(patent.citation_score ?? 0);
              const score = hybridScore;
              const barColor = score > 85 ? "bg-emerald-500" : score > 70 ? "bg-amber-500" : "bg-gray-400";
              const isExpanded = expandedAbstracts[patent.id] || false;

              return (
                <div
                  key={patent.id}
                  className="group relative flex flex-col justify-between rounded-lg border border-border/60 bg-card overflow-hidden hover:border-primary/40 hover:shadow-sm transition-all"
                >
                  {/* Match Relevance Bar */}
                  <div className="w-full h-1 bg-muted">
                    <div className={`h-full ${barColor}`} style={{ width: `${score}%` }} />
                  </div>

                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      {/* Top Bar */}
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => {
                              memory.markSeen(patent.id);
                              setSelectedPatent(patent);
                            }}
                            className="font-semibold text-primary hover:underline"
                          >
                            {patent.patent_number}
                          </button>
                          {patent.status === "NEW" && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                              [NEW]
                            </span>
                          )}
                          {patent.status === "SEEN" && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded font-bold bg-muted text-muted-foreground">
                              [SEEN]
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-muted-foreground font-semibold">Hybrid: {score}%</span>
                          <button
                            onClick={() => toggleSave(patent)}
                            className="text-muted-foreground hover:text-emerald-500 transition-colors"
                            title={isSaved ? "Saved" : "Save Patent"}
                          >
                            {isSaved ? (
                              <BookmarkCheck className="h-4 w-4 text-emerald-500" />
                            ) : (
                              <Bookmark className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Title */}
                      <h3 
                        onClick={() => setSelectedPatent(patent)}
                        className="mt-2 text-sm font-bold text-foreground leading-snug cursor-pointer hover:text-primary transition-colors"
                        title="View full patent details"
                      >
                        {patent.title}
                      </h3>

                      {/* Metadata */}
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        {patent.assignee} &middot; Filed {patent.filing_date} &middot; {patent.citations} citations
                      </p>

                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {[
                          ["Semantic", semanticScore, "text-sky-700 border-sky-500/20 bg-sky-500/10 dark:text-sky-300"],
                          ["Relevance", relevanceScore, "text-emerald-700 border-emerald-500/20 bg-emerald-500/10 dark:text-emerald-300"],
                          ["Novelty", noveltyScore, "text-violet-700 border-violet-500/20 bg-violet-500/10 dark:text-violet-300"],
                          ["Citation", citationScore, "text-amber-700 border-amber-500/20 bg-amber-500/10 dark:text-amber-300"],
                        ].map(([label, value, classes]: any) => (
                          <span key={label} className={`rounded border px-1.5 py-0.5 text-[9px] font-bold ${classes}`}>
                            {label}: {value}%
                          </span>
                        ))}
                        {(patent.matched_modes || []).slice(0, 4).map((mode: string) => (
                          <span key={mode} className="rounded border border-border bg-muted/40 px-1.5 py-0.5 text-[9px] font-semibold text-muted-foreground">
                            {mode}
                          </span>
                        ))}
                      </div>

                      {/* Abstract */}
                      <div className="mt-3">
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {isExpanded || !patent.abstract || patent.abstract.length <= 160
                            ? patent.abstract || "No abstract available."
                            : `${patent.abstract.substring(0, 160)}...`}
                          
                          {patent.abstract && patent.abstract.length > 160 && (
                            <button
                              onClick={() => setExpandedAbstracts((prev) => ({ ...prev, [patent.id]: !isExpanded }))}
                              className="ml-1 text-primary hover:underline font-semibold"
                            >
                              {isExpanded ? "Read less" : "Read more"}
                            </button>
                          )}
                        </p>
                        <button
                          onClick={() => setSelectedPatent(patent)}
                          className="text-xs font-semibold text-blue-500 hover:text-blue-600 hover:underline mt-1.5 inline-block"
                        >
                          View Full Patent &rarr;
                        </button>
                      </div>
                    </div>

                    {/* Bottom Actions */}
                    <div className="mt-5 flex items-center justify-between">
                      <div className="flex flex-wrap gap-1">
                        {(patent.ipc_codes || patent.ipc || []).slice(0, 2).map((ipcCode: string) => (
                          <Badge key={ipcCode} variant="secondary" className="text-[9px] px-1.5 py-0 font-normal">
                            {ipcCode}
                          </Badge>
                        ))}
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => exportPatentJson(patent)}
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          title="Export JSON"
                        >
                          <FileJson className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => toggleCompare(patent)}
                          className={`h-8 w-8 ${inCompare ? "text-primary hover:text-primary" : "text-muted-foreground hover:text-foreground"}`}
                          title="Add to Compare Queue"
                        >
                          <GitCompare className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Floating Compare Queue Indicator */}
      {compareQueue.length > 0 && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 bg-popover border shadow-lg rounded-full px-5 py-2.5 flex items-center gap-4">
          <span className="text-xs font-semibold">
            Comparing <span className="text-primary font-bold">{compareQueue.length}</span> / 3 patents
          </span>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={() => router.push("/dashboard/comparison")}
              className="h-8 text-xs font-bold"
            >
              Compare Now &rarr;
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => saveCompareQueue([])}
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
              title="Clear Queue"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}

      {/* Patent Detail Dialog */}
      <Dialog open={!!selectedPatent} onOpenChange={(open) => {
        if (!open) setSelectedPatent(null);
      }}>
        <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto p-0">
          {selectedPatent && (
            <PatentDetailPanel
              patent={selectedPatent}
              onClose={() => {
                memory.markSeen(selectedPatent.id);
                setSelectedPatent(null);
              }}
              highlightScheme={activeScheme}
              highlightText={highlight.applyHighlight}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
    </ErrorBoundary>
  );
}
