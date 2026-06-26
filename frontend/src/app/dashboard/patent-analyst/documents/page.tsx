"use client";

import React, { useState, useEffect, useRef } from "react";
import { useAuthStore } from "@/stores/authStore";
import { Plus, Upload, FileText, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { DocumentTimeline } from "@/components/documents/DocumentTimeline";
import { VersionHistoryTable } from "@/components/documents/VersionHistoryTable";
import { CommentThread } from "@/components/documents/CommentThread";
import { createClient } from "@/lib/supabase/client";

export default function AnalystDocumentsPage() {
  const { user } = useAuthStore();
  const { toast } = useToast();
  const [documents, setDocuments] = useState<any[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<any | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    fetchDocuments();

    // Set up Realtime Subscription
    const channel = supabase
      .channel("analyst-documents-updates")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "patent_documents" },
        () => {
          fetchDocuments();
          if (selectedDoc) fetchDocDetails(selectedDoc.id);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedDoc]);

  const fetchDocuments = async () => {
    try {
      const res = await fetch("/api/documents");
      const data = await res.json();
      if (data.success) {
        setDocuments(data.data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const createDraft = async () => {
    if (!newTitle) return;
    try {
      const res = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTitle }),
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: "Draft created successfully" });
        setIsCreating(false);
        setNewTitle("");
        fetchDocuments();
      }
    } catch (e) {
      toast({ title: "Error creating draft", variant: "destructive" });
    }
  };

  const uploadVersion = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !selectedDoc) return;
    const file = e.target.files[0];
    setIsUploading(true);
    
    try {
      const ext = file.name.split(".").pop();
      const path = `drafts/${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${ext}`;
      
      const formData = new FormData();
      formData.append("file", file);
      formData.append("bucket", "patent_documents");
      formData.append("path", path);

      const uploadRes = await fetch("/api/upload", { method: "POST", body: formData });
      const uploadData = await uploadRes.json();
      
      if (!uploadData.success) throw new Error(uploadData.error || "Upload failed");
      
      const versionPayload = {
        file_name: file.name,
        file_url: uploadData.url,
        file_size: file.size,
        mime_type: file.type,
      };

      const res = await fetch(`/api/documents/${selectedDoc.id}/versions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(versionPayload),
      });

      const resData = await res.json();
      if (resData.success) {
        toast({ title: "Version uploaded successfully" });
        transitionStatus("Uploaded by Patent Analyst");
        fetchDocDetails(selectedDoc.id);
      }
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const fetchDocDetails = async (id: string) => {
    try {
      const res = await fetch(`/api/documents/${id}`);
      const data = await res.json();
      if (data.success) {
        // Hide previous versions from the Patent Analyst interface per specs
        if (data.data && data.data.document_versions && data.data.document_versions.length > 0) {
          const sorted = [...data.data.document_versions].sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
          data.data.document_versions = [sorted[0]]; // Only keep the absolute latest version
        }
        setSelectedDoc(data.data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const transitionStatus = async (newStatus: string) => {
    if (!selectedDoc) return;
    try {
      const res = await fetch(`/api/documents/${selectedDoc.id}/transition`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ new_status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: `Status updated to ${newStatus}` });
        fetchDocDetails(selectedDoc.id);
        fetchDocuments();
      }
    } catch (e) {
      toast({ title: "Failed to update status", variant: "destructive" });
    }
  };

  const handleAddComment = async (text: string) => {
    if (!selectedDoc) return;
    try {
      const res = await fetch(`/api/documents/${selectedDoc.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ comment_text: text }),
      });
      if (res.ok) {
        fetchDocDetails(selectedDoc.id);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto flex gap-6">
      {/* Left Sidebar - List */}
      <div className="w-1/3 flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold">Document Drafts</h2>
          <Button size="sm" onClick={() => setIsCreating(true)}><Plus className="w-4 h-4" /></Button>
        </div>
        
        {isCreating && (
          <div className="p-4 border rounded-lg bg-gray-50 flex flex-col gap-2">
            <Input placeholder="Document Title..." value={newTitle} onChange={(e) => setNewTitle(e.target.value)} />
            <div className="flex gap-2 justify-end">
              <Button size="sm" variant="ghost" onClick={() => setIsCreating(false)}>Cancel</Button>
              <Button size="sm" onClick={createDraft}>Create</Button>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-2">
          {documents.map((doc) => (
            <div 
              key={doc.id} 
              className={`p-4 border rounded-lg cursor-pointer transition-colors ${selectedDoc?.id === doc.id ? 'border-blue-500 bg-blue-50' : 'hover:border-gray-400 bg-white'}`}
              onClick={() => fetchDocDetails(doc.id)}
            >
              <h3 className="font-semibold text-gray-900">{doc.title}</h3>
              <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                <span className="px-2 py-1 bg-gray-200 rounded-full">{doc.status}</span>
                <span>{new Date(doc.updated_at).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right Content - Detail */}
      <div className="w-2/3">
        {selectedDoc ? (
          <div className="flex flex-col gap-6">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-bold">{selectedDoc.title}</h1>
                <p className="text-gray-500 mt-1">Project ID: {selectedDoc.id}</p>
              </div>
              
              <div className="flex gap-2">
                {(selectedDoc.status === "Draft Created" || selectedDoc.status === "Uploaded by Patent Analyst" || selectedDoc.status === "Draft") && (
                  <Button onClick={() => transitionStatus("Pending Design Review")} className="bg-purple-600 hover:bg-purple-700">
                    Assign to Design Team
                  </Button>
                )}
                {(selectedDoc.status === "Waiting for Patent Analyst Review" || selectedDoc.status === "Verification Pending" || selectedDoc.status === "CEO Rejected" || selectedDoc.status === "Revision Requested by CEO") && (
                  <>
                    <Button variant="outline" onClick={() => transitionStatus("Changes Requested")}>Request Additional Changes (Design)</Button>
                    <Button onClick={() => transitionStatus("CEO Approval Pending")} className="bg-green-600 hover:bg-green-700">Approve & Submit to CEO</Button>
                  </>
                )}
              </div>
            </div>

            <DocumentTimeline currentStatus={selectedDoc.status} />

            <div className="grid grid-cols-2 gap-6">
              <div className="flex flex-col gap-4 border p-6 rounded-lg bg-white">
                <h3 className="font-semibold text-lg flex items-center gap-2"><Upload className="w-5 h-5 text-blue-500" /> Upload Version</h3>
                <p className="text-sm text-gray-500">Upload your latest draft here. This will automatically create a new version.</p>
                
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  onChange={uploadVersion} 
                  accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.zip"
                />
                
                <Button 
                  onClick={() => fileInputRef.current?.click()} 
                  disabled={isUploading || ["CEO Approval Pending", "CEO Approved", "Sent for CEO Approval", "Approved"].includes(selectedDoc.status)}
                  className="w-full"
                  variant="outline"
                >
                  {isUploading ? "Uploading..." : "Select File"}
                </Button>
              </div>

              <CommentThread comments={selectedDoc.review_comments} onAddComment={handleAddComment} />
            </div>

            <div className="mt-6">
              <h3 className="font-semibold text-lg mb-4">Version History</h3>
              <VersionHistoryTable versions={selectedDoc.document_versions} onDownload={async (v) => {
                window.open(v.file_url, '_blank');
              }} />
            </div>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-gray-400">
            Select a document to view details
          </div>
        )}
      </div>
    </div>
  );
}
