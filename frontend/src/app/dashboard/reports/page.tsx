"use client";

import { useState } from "react";
import { FileText, Sliders, ArrowRight, ArrowLeft, Loader2, Sparkles, CheckCircle2, Download, Printer, ShieldAlert } from "lucide-react";
import { useApp } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";

export default function ReportsPage() {
  const { workspaces, addActivity } = useApp();

  const [step, setStep] = useState(0); // 0: Input, 1: Options, 2: Loading, 3: Completed Report
  const [techDescription, setTechDescription] = useState("");
  const [analysisType, setAnalysisType] = useState("prior_art"); // prior_art | fto | patentability
  const [jurisdictions, setJurisdictions] = useState<string[]>(["US", "EP"]);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState("");
  const [progressMsg, setProgressMsg] = useState("");
  
  const [reportData, setReportData] = useState<any | null>(null);

  const handleNextStep = () => {
    if (step === 0 && !techDescription.trim()) {
      alert("Please describe your technology.");
      return;
    }
    setStep(step + 1);
  };

  const handlePrevStep = () => {
    setStep(step - 1);
  };

  const handleGenerate = async () => {
    setStep(2);
    setProgressMsg("Scanning WIPO/USPTO registries...");

    const timer1 = setTimeout(() => setProgressMsg("Running vector similarity searches..."), 600);
    const timer2 = setTimeout(() => setProgressMsg("Analyzing overlapping claims & boundaries..."), 1200);
    const timer3 = setTimeout(() => setProgressMsg("FTO risk calculations..."), 1800);

    try {
      const res = await fetch('/api/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: techDescription, workspaceId: selectedWorkspaceId || null })
      });
      if (!res.ok) throw new Error('Report generation failed');
      const data = await res.json();
      setReportData(data);
      addActivity("report", `Generated AI Report: "${data.report_title || "Patent Report"}"`);
      setStep(3);
    } catch (e) {
      console.error(e);
      alert("Report generation failed.");
      setStep(1);
    } finally {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const getRiskColor = (level: string) => {
    switch (level?.toLowerCase()) {
      case "high":
        return "text-red-500 border-red-500/20 bg-red-500/5";
      case "medium":
        return "text-amber-500 border-amber-500/20 bg-amber-500/5";
      case "low":
      default:
        return "text-green-500 border-green-500/20 bg-green-500/5";
    }
  };

  return (
    <ErrorBoundary>
    <div className="space-y-6 max-w-4xl mx-auto pb-20">
      {/* Print stylesheet override */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #print-report-area, #print-report-area * {
            visibility: visible;
          }
          #print-report-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 0;
            background: white;
            color: black;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* Title */}
      <div className="no-print">
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <FileText className="h-6 w-6 text-primary" />
          Automated Report Generator
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Generate comprehensive diagnostic patent audits, novelty summaries, and FTO clearance sheets powered by Claude.
        </p>
      </div>

      <Separator className="no-print" />

      {/* Step Progress Stepper (no-print) */}
      {step < 3 && (
        <div className="no-print flex items-center justify-between max-w-md mx-auto py-2 text-xs font-semibold">
          <div className="flex items-center gap-1.5">
            <span className={`h-5 w-5 rounded-full flex items-center justify-center text-[10px] ${step >= 0 ? "bg-primary text-white" : "bg-muted text-muted-foreground"}`}>1</span>
            <span className={step === 0 ? "text-foreground" : "text-muted-foreground"}>Scope details</span>
          </div>
          <div className="h-px bg-border flex-1 mx-3" />
          <div className="flex items-center gap-1.5">
            <span className={`h-5 w-5 rounded-full flex items-center justify-center text-[10px] ${step >= 1 ? "bg-primary text-white" : "bg-muted text-muted-foreground"}`}>2</span>
            <span className={step === 1 ? "text-foreground" : "text-muted-foreground"}>Audit Criteria</span>
          </div>
          <div className="h-px bg-border flex-1 mx-3" />
          <div className="flex items-center gap-1.5">
            <span className={`h-5 w-5 rounded-full flex items-center justify-center text-[10px] ${step >= 2 ? "bg-primary text-white" : "bg-muted text-muted-foreground"}`}>3</span>
            <span className={step === 2 ? "text-foreground" : "text-muted-foreground"}>Compiling</span>
          </div>
        </div>
      )}

      {/* Step Content */}
      <div className="no-print">
        {step === 0 && (
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="text-sm font-bold">Describe the Technology Scope</CardTitle>
              <CardDescription className="text-[10px]">Detail your claims, structural characteristics, or components to index search models.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <textarea
                value={techDescription}
                onChange={(e) => setTechDescription(e.target.value)}
                placeholder="Detail description: e.g. A wearable wrist strap that features non-contact capacitive bio-sensors to log galvanic response trends, sending encrypted packets via BLE to server databases."
                className="w-full min-h-[140px] rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring font-medium"
              />

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground">Select Target Project Workspace (Optional)</label>
                <select
                  value={selectedWorkspaceId}
                  onChange={(e) => setSelectedWorkspaceId(e.target.value)}
                  className="w-full border rounded bg-transparent p-2 text-xs font-semibold h-9"
                >
                  <option value="">No linked workspace</option>
                  {workspaces.map((ws) => (
                    <option key={ws.id} value={ws.id}>
                      {ws.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleNextStep} className="gap-1.5 text-xs font-semibold">
                  Configure Audit Criteria <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 1 && (
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="text-sm font-bold">Select Audit & Analysis Type</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Type Selectors */}
              <div className="grid gap-3 grid-cols-3 text-xs font-semibold">
                <button
                  onClick={() => setAnalysisType("prior_art")}
                  className={`p-4 border rounded-lg flex flex-col items-center justify-center text-center gap-2 hover:border-primary/50 transition-all ${
                    analysisType === "prior_art" ? "border-primary bg-primary/5" : "border-border"
                  }`}
                >
                  <Sliders className="h-5 w-5 text-primary" />
                  <span>Prior Art Search</span>
                </button>
                <button
                  onClick={() => setAnalysisType("fto")}
                  className={`p-4 border rounded-lg flex flex-col items-center justify-center text-center gap-2 hover:border-primary/50 transition-all ${
                    analysisType === "fto" ? "border-primary bg-primary/5" : "border-border"
                  }`}
                >
                  <ShieldAlert className="h-5 w-5 text-amber-500" />
                  <span>FTO Risk Audit</span>
                </button>
                <button
                  onClick={() => setAnalysisType("patentability")}
                  className={`p-4 border rounded-lg flex flex-col items-center justify-center text-center gap-2 hover:border-primary/50 transition-all ${
                    analysisType === "patentability" ? "border-primary bg-primary/5" : "border-border"
                  }`}
                >
                  <Sparkles className="h-5 w-5 text-[#c9a84c]" />
                  <span>Patentability Rating</span>
                </button>
              </div>

              {/* Jurisdictions */}
              <div className="space-y-2 text-xs font-semibold">
                <label className="text-muted-foreground">Audit Registries</label>
                <div className="flex gap-2">
                  {["US", "EP", "WO", "CN", "JP"].map((j) => (
                    <button
                      key={j}
                      onClick={() => {
                        if (jurisdictions.includes(j)) {
                          setJurisdictions(jurisdictions.filter((x) => x !== j));
                        } else {
                          setJurisdictions([...jurisdictions, j]);
                        }
                      }}
                      className={`px-3 py-1.5 rounded border text-xs ${
                        jurisdictions.includes(j) ? "bg-primary text-white border-primary" : "border-border"
                      }`}
                    >
                      {j} Registry
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-between">
                <Button variant="outline" onClick={handlePrevStep} className="gap-1.5 text-xs">
                  <ArrowLeft className="h-3.5 w-3.5" /> Back
                </Button>
                <Button onClick={handleGenerate} className="gap-1.5 text-xs bg-[#b8921e] hover:bg-[#8a6a1e] text-white">
                  <Sparkles className="h-3.5 w-3.5 text-purple-200" /> Generate AI Report
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 2 && (
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <div>
              <h3 className="text-sm font-bold text-foreground">Generating Audit Portfolio</h3>
              <p className="text-[11px] text-muted-foreground mt-1">{progressMsg}</p>
            </div>
          </div>
        )}
      </div>

      {/* Step 3: Finished Report Viewer */}
      {step === 3 && reportData && (
        <div id="print-report-area" className="space-y-6">
          {/* Actions panel (no-print) */}
          <div className="no-print flex justify-between items-center border-b pb-3 text-xs font-semibold">
            <Button variant="outline" onClick={() => setStep(0)} className="h-8">
              <ArrowLeft className="h-3.5 w-3.5 mr-1" /> New Report
            </Button>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={handlePrint} className="h-8">
                <Printer className="h-3.5 w-3.5 mr-1" /> Print Report
              </Button>
            </div>
          </div>

          {/* Core Report Content Card */}
          <Card className="border-border/60 shadow-md">
            <CardContent className="p-6 md:p-8 space-y-6">
              {/* Report Header */}
              <div className="border-b pb-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <h2 className="text-xl font-black text-foreground">{reportData.report_title}</h2>
                  <Badge variant="outline" className="border-[#c9a84c]/20 text-[#c9a84c] text-[10px]">
                    Claude-Sonnet Analysis
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                  {reportData.executive_summary}
                </p>
              </div>

              {/* Invention Breakdown */}
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2 text-xs">
                  <h4 className="font-bold text-sm text-foreground">Invention Analysis</h4>
                  <p><span className="font-semibold text-muted-foreground">Technical Field:</span> {reportData.invention_analysis?.technical_field}</p>
                  <p><span className="font-semibold text-muted-foreground">Patentability Outlook:</span> {reportData.invention_analysis?.patentability_outlook}</p>
                  <div>
                    <span className="font-semibold text-muted-foreground">Key Technical Features:</span>
                    <ul className="list-disc pl-4 mt-1 space-y-0.5 text-muted-foreground">
                      {reportData.invention_analysis?.key_features?.map((f: string, i: number) => (
                        <li key={i}>{f}</li>
                      ))}
                    </ul>
                  </div>
                </div>
                <div className="text-xs space-y-2">
                  <h4 className="font-bold text-sm text-foreground">Novelty Assessment</h4>
                  <p className="text-muted-foreground leading-relaxed">
                    {reportData.invention_analysis?.novelty_assessment}
                  </p>
                </div>
              </div>

              <Separator />

              {/* Prior Art Found Matrix */}
              <div className="space-y-3">
                <h4 className="font-bold text-sm text-foreground">Target Prior Art Matrix</h4>
                <div className="overflow-x-auto border rounded-lg">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b bg-muted/40 text-muted-foreground font-semibold">
                        <th className="p-2.5 text-left">Patent Number</th>
                        <th className="p-2.5 text-left">Title</th>
                        <th className="p-2.5 text-center">Relevance</th>
                        <th className="p-2.5 text-left">Overlap Description</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.prior_art_found?.map((item: any, i: number) => (
                        <tr key={i} className="border-b last:border-0 hover:bg-muted/10">
                          <td className="p-2.5 font-bold text-primary">{item.patent_number}</td>
                          <td className="p-2.5 font-semibold">{item.title}</td>
                          <td className="p-2.5 text-center">
                            <Badge variant={item.relevance === "High" ? "destructive" : "secondary"} className="text-[9px]">
                              {item.relevance}
                            </Badge>
                          </td>
                          <td className="p-2.5 text-muted-foreground leading-relaxed">{item.overlap_description}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <Separator />

              {/* Freedom To Operate and Risk */}
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2 text-xs">
                  <h4 className="font-bold text-sm text-foreground">Freedom to Operate Assessment</h4>
                  <p className="text-muted-foreground leading-relaxed">
                    {reportData.freedom_to_operate?.assessment}
                  </p>
                </div>

                <div className="space-y-3 flex flex-col justify-center">
                  <div className={`p-4 border rounded-lg flex items-center gap-3 ${getRiskColor(reportData.freedom_to_operate?.risk_level)}`}>
                    <ShieldAlert className="h-8 w-8 shrink-0" />
                    <div>
                      <h5 className="font-bold text-xs">Clearance Risk Level</h5>
                      <p className="text-sm font-extrabold uppercase mt-0.5">{reportData.freedom_to_operate?.risk_level} Infringement Risk</p>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Recommendations */}
              <div className="space-y-2 text-xs">
                <h4 className="font-bold text-sm text-foreground">Strategic Recommendations</h4>
                <ul className="list-decimal pl-4 space-y-1.5 text-muted-foreground">
                  {reportData.recommendations?.map((rec: string, i: number) => (
                    <li key={i}>{rec}</li>
                  ))}
                </ul>
              </div>

              <Separator />

              <div className="text-[10px] text-muted-foreground italic text-center">
                This report is compiled autonomously for evaluation. Does not constitute legal advice. PatentAI &copy; {new Date().getFullYear()}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
    </ErrorBoundary>
  );
}
