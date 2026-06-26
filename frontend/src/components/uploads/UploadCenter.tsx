"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { UploadCloud, FileText, Settings, Search, Plus, Trash2, Link as LinkIcon, FileCheck, Filter, MessageSquare, ChevronRight, CheckCircle2, History } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

// Mock Database
export const MOCK_DOCUMENTS = [
  { id: "doc-1", name: "Invention_Disclosure_v2.pdf", size: "2.4 MB", type: "PDF", status: "Under Review", uploader: "Alice (Analyst)", date: "2 hours ago", project: "Quantum Encryption (US-102)", versions: 2, comments: 3 },
  { id: "doc-2", name: "Prior_Art_Search_Results.xlsx", size: "1.1 MB", type: "Excel", status: "Approved", uploader: "Bob (Analyst)", date: "Yesterday", project: "Edge Computing (US-103)", versions: 1, comments: 0 },
  { id: "doc-3", name: "Draft_Claims_Review.docx", size: "450 KB", type: "DOCX", status: "Revision Requested", uploader: "Charlie (Analyst)", date: "3 days ago", project: "Neural Net Quantization", versions: 3, comments: 12 },
];

export function UploadCenter() {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [docs, setDocs] = useState(MOCK_DOCUMENTS);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      simulateUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      simulateUpload(e.target.files[0]);
    }
  };

  const simulateUpload = (file: File) => {
    setUploading(true);
    setProgress(0);
    
    // Simulate progress
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          clearInterval(interval);
          setUploading(false);
          const newDoc = {
            id: `doc-${Date.now()}`,
            name: file.name,
            size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
            type: file.name.split('.').pop()?.toUpperCase() || "FILE",
            status: "Uploaded",
            uploader: "You (Analyst)",
            date: "Just now",
            project: "Unlinked",
            versions: 1,
            comments: 0
          };
          setDocs([newDoc, ...docs]);
          return 100;
        }
        return p + 20;
      });
    }, 300);
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-16">
      {/* Header */}
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="border-blue-500/20 bg-blue-500/10 text-blue-700">Phase 11</Badge>
            <Badge variant="outline" className="border-emerald-500/20 bg-emerald-500/10 text-emerald-700">Phase 12 Pipeline</Badge>
          </div>
          <h1 className="mt-3 text-3xl font-bold tracking-tight">Upload & Review Center</h1>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
            Central repository for file ingestion, version control, and multi-stage document feedback workflows.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <label className="cursor-pointer inline-flex items-center gap-2 rounded-md bg-[#c9a84c] px-4 py-2 text-sm font-semibold text-[#131309] hover:bg-[#b8943d]">
            <UploadCloud className="h-4 w-4" /> New Upload
            <input type="file" multiple className="hidden" onChange={handleFileInput} />
          </label>
        </div>
      </header>

      {/* Drag & Drop Zone */}
      <Card className={cn("border-2 border-dashed transition-all", isDragging ? "border-[#c9a84c] bg-[#c9a84c]/5" : "border-border/60 hover:border-border")}>
        <CardContent className="p-12 text-center"
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
        >
          {uploading ? (
            <div className="mx-auto max-w-sm space-y-4">
              <UploadCloud className="mx-auto h-10 w-10 animate-bounce text-[#c9a84c]" />
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div className="h-full bg-[#c9a84c] transition-all duration-300" style={{ width: `${progress}%` }} />
              </div>
              <p className="text-sm font-medium text-muted-foreground">Uploading and extracting metadata... {progress}%</p>
            </div>
          ) : (
            <div className="mx-auto max-w-sm space-y-4">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-muted/50">
                <UploadCloud className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium">Drag & drop files here, or click <label className="text-[#c9a84c] cursor-pointer hover:underline">browse<input type="file" multiple className="hidden" onChange={handleFileInput} /></label></p>
              <p className="text-xs text-muted-foreground">Supports PDF, DOCX, PPTX, Excel, PNG, JPEG, ZIP (Max 50MB)</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Document Library */}
      <Card className="border-border/70">
        <CardHeader className="border-b border-border/40 bg-muted/10 pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4 text-[#c9a84c]" /> Active Documents
            </CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <input type="text" placeholder="Search files..." className="h-9 w-[200px] rounded-md border border-input bg-background pl-8 text-sm outline-none focus-visible:ring-1 focus-visible:ring-ring" />
              </div>
              <button className="flex h-9 items-center gap-2 rounded-md border border-input bg-background px-3 text-sm hover:bg-muted">
                <Filter className="h-4 w-4" /> Filter
              </button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border/40 bg-muted/30">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">File Name</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Linked Project</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status / Workflow</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Uploaded By</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {docs.map((doc) => (
                  <tr key={doc.id} className="group transition-colors hover:bg-muted/10">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded bg-muted/50 text-[10px] font-bold text-muted-foreground">
                          {doc.type}
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{doc.name}</p>
                          <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                            <span>{doc.size}</span>
                            <span>•</span>
                            <span className="flex items-center gap-1"><History className="h-3 w-3" /> v{doc.versions}</span>
                            <span>•</span>
                            <span>{doc.date}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1.5 text-xs">
                        <LinkIcon className="h-3 w-3 text-muted-foreground" />
                        <span className={doc.project === 'Unlinked' ? 'text-muted-foreground italic' : 'text-foreground'}>{doc.project}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <Badge variant="outline" className={cn(
                        "font-medium",
                        doc.status === "Approved" ? "border-emerald-500/30 text-emerald-600 bg-emerald-500/5" :
                        doc.status === "Under Review" ? "border-blue-500/30 text-blue-600 bg-blue-500/5" :
                        doc.status === "Revision Requested" ? "border-amber-500/30 text-amber-600 bg-amber-500/5" :
                        "border-border/60 text-muted-foreground"
                      )}>
                        {doc.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-4 text-xs text-muted-foreground">
                      {doc.uploader}
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/dashboard/uploads/${doc.id}`} className="inline-flex h-8 items-center gap-1.5 rounded-md bg-primary/10 px-3 text-xs font-semibold text-primary hover:bg-primary/20 transition-colors">
                          <MessageSquare className="h-3 w-3" />
                          Review ({doc.comments})
                          <ChevronRight className="h-3 w-3" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
