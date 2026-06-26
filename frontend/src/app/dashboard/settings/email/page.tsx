"use client";

import { Mail, Server, Shield, Send } from "lucide-react";

export default function EmailConfigurationPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">Email Configuration</h2>
          <p className="text-sm text-muted-foreground">Configure SMTP settings for system-wide email delivery.</p>
        </div>
        <div className="flex gap-3">
          <button className="bg-background border border-border hover:bg-muted text-foreground px-4 py-2 rounded-xl text-sm font-semibold transition-all">
            Send Test Email
          </button>
          <button className="bg-[#c9a84c] hover:bg-[#b8921e] text-white px-6 py-2 rounded-xl text-sm font-bold transition-all shadow-md shadow-[#c9a84c]/20">
            Save Settings
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="p-6 border-b border-border/50">
            <div className="flex items-center gap-2">
              <Server className="h-5 w-5 text-[#c9a84c]" />
              <h3 className="font-bold text-foreground">OAuth2 Provider Details</h3>
            </div>
          </div>
          <div className="p-6 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Email Provider</label>
              <select className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-[#c9a84c]/50">
                <option>Microsoft Graph (Office 365)</option>
                <option>Google Workspace (Gmail API)</option>
                <option>AWS SES API v2</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Tenant ID / Domain (Optional)</label>
              <input 
                type="text" 
                placeholder="e.g. 1234abcd-12ab-34cd-56ef-1234567890ab" 
                className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-[#c9a84c]/50"
              />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="p-6 border-b border-border/50">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-[#c9a84c]" />
              <h3 className="font-bold text-foreground">OAuth2 Credentials</h3>
            </div>
          </div>
          <div className="p-6 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Client ID</label>
              <input 
                type="text" 
                placeholder="Enter OAuth2 Client ID" 
                className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-[#c9a84c]/50"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Client Secret</label>
              <input 
                type="password" 
                placeholder="••••••••••••••••" 
                className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-[#c9a84c]/50"
              />
            </div>
          </div>
        </div>

        <div className="col-span-2 rounded-2xl border border-border bg-card overflow-hidden">
          <div className="p-6 border-b border-border/50">
            <div className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-[#c9a84c]" />
              <h3 className="font-bold text-foreground">Sender Identity</h3>
            </div>
          </div>
          <div className="p-6 grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">From Name</label>
              <input 
                type="text" 
                defaultValue="MOAT Alerts" 
                className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-[#c9a84c]/50"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">From Email Address</label>
              <input 
                type="email" 
                defaultValue="noreply@moatplatform.io" 
                className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-[#c9a84c]/50"
              />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
