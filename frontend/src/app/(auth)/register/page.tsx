"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/stores/authStore";
import { getRoleWorkspace } from "@/lib/roleIntelligence";
import {
  Loader2, ArrowRight, User, Mail, Lock, Shield,
  Building2, Briefcase, Eye, EyeOff, CheckCircle2,
} from "lucide-react";
import type { AppRole } from "@/types";

// ─────────────────────────────────────────────────────────────────────────────
// All supported roles with descriptions
// ─────────────────────────────────────────────────────────────────────────────
const ROLES: { value: AppRole; label: string; desc: string }[] = [
  { value: "CEO",                  label: "CEO",                  desc: "Executive strategy & portfolio value" },
  { value: "CTO",                  label: "CTO",                  desc: "Engineering signals & technical intelligence" },
  { value: "CIO",                  label: "CIO",                  desc: "Enterprise technology & innovation strategy" },
  { value: "Chief IP Officer",     label: "Chief IP Officer",     desc: "Patent filing, prior art & claim analysis" },
  { value: "Patent Analyst",       label: "Patent Analyst",       desc: "Search, landscape & evidence intelligence" },
  { value: "Inventor",             label: "Inventor",             desc: "Research-to-patent commercialization" },
  { value: "Business Development", label: "Business Development", desc: "Competitive intelligence & opportunity mapping" },
  { value: "Admin",                label: "Admin",                desc: "Platform governance & user management" },
];

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuthStore();

  const [step, setStep] = useState<1 | 2>(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<AppRole>("Patent Analyst");
  const [department, setDepartment] = useState("");
  const [company, setCompany] = useState("");

  const inputCls =
    "w-full h-12 rounded-xl bg-white/[0.04] border border-white/[0.08] pl-11 pr-4 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-[#c9a84c]/50 focus:ring-1 focus:ring-[#c9a84c]/20 focus:bg-white/[0.07] transition-all";
  const selectCls =
    "w-full h-12 rounded-xl bg-[#0c0c08] border border-white/[0.08] pl-11 pr-4 text-sm text-slate-200 focus:outline-none focus:border-[#c9a84c]/50 focus:ring-1 focus:ring-[#c9a84c]/20 transition-all appearance-none";

  const handleStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setError("Full name is required."); return; }
    if (password.length < 8) { setError("Password must be at least 8 characters."); return; }
    setError("");
    setStep(2);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      const { user, needsConfirmation } = await register(name, email, password, role, department, company);

      if (needsConfirmation) {
        setSuccess("Account created! Check your email to confirm your address before signing in.");
        return;
      }

      const workspace = getRoleWorkspace(user.role);
      router.push(workspace.route);
    } catch (err: any) {
      setError(err.message ?? "Registration failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/20">
          <CheckCircle2 className="h-8 w-8 text-emerald-400" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Check your inbox</h2>
        <p className="text-sm text-slate-400 leading-relaxed mb-8">{success}</p>
        <Link href="/login" className="text-sm font-semibold text-[#c9a84c] hover:text-[#e8c97a] transition-colors">
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* ── Header ── */}
      <div className="mb-7">
        <h2 className="text-2xl font-black text-white tracking-tight">Create account</h2>
        <p className="text-sm text-slate-500 mt-1.5">
          Request role-based access to MOAT Intelligence
        </p>
      </div>

      {/* ── Step indicator ── */}
      <div className="flex items-center gap-2 mb-7">
        {([1, 2] as const).map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold transition-all ${
                step === s
                  ? "bg-[#c9a84c] text-black"
                  : s < step
                  ? "bg-[#c9a84c]/20 text-[#c9a84c]"
                  : "bg-white/[0.06] text-slate-600"
              }`}
            >
              {s < step ? "✓" : s}
            </div>
            <span className={`text-xs font-medium ${step === s ? "text-white" : "text-slate-600"}`}>
              {s === 1 ? "Account" : "Role & Org"}
            </span>
            {s < 2 && <div className="w-8 h-px bg-white/10 mx-1" />}
          </div>
        ))}
      </div>

      {/* ── Error ── */}
      {error && (
        <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-red-500/20 bg-red-500/8 px-4 py-3 text-sm text-red-400 animate-in fade-in duration-200">
          <Shield className="h-4 w-4 mt-0.5 shrink-0" />
          {error}
        </div>
      )}

      {/* ── Step 1: Account Info ── */}
      {step === 1 && (
        <form onSubmit={handleStep1} className="space-y-4">
          {/* Full name */}
          <div className="relative">
            <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-600 pointer-events-none" />
            <input
              id="reg-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Full name"
              required
              autoComplete="name"
              className={inputCls}
            />
          </div>

          {/* Email */}
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-600 pointer-events-none" />
            <input
              id="reg-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Work email"
              required
              autoComplete="email"
              className={inputCls}
            />
          </div>

          {/* Password */}
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-600 pointer-events-none" />
            <input
              id="reg-password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password (min 8 chars)"
              minLength={8}
              required
              autoComplete="new-password"
              className={`${inputCls} pr-11`}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-400 transition-colors"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>

          {/* Password strength */}
          {password.length > 0 && (
            <div className="flex gap-1">
              {[8, 12, 16].map((threshold, i) => (
                <div
                  key={i}
                  className={`h-1 flex-1 rounded-full transition-all ${
                    password.length >= threshold
                      ? i === 0 ? "bg-red-400" : i === 1 ? "bg-amber-400" : "bg-emerald-400"
                      : "bg-white/10"
                  }`}
                />
              ))}
              <span className="text-[11px] text-slate-600 ml-1">
                {password.length < 8 ? "Too short" : password.length < 12 ? "Weak" : password.length < 16 ? "Good" : "Strong"}
              </span>
            </div>
          )}

          <button
            type="submit"
            className="w-full h-12 mt-2 rounded-xl font-bold text-sm text-white transition-all flex items-center justify-center gap-2 group"
            style={{ background: "linear-gradient(135deg, #c9a84c, #8a6a1e)" }}
          >
            Continue
            <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </form>
      )}

      {/* ── Step 2: Role & Org ── */}
      {step === 2 && (
        <form onSubmit={handleRegister} className="space-y-4">
          {/* Role selector */}
          <div className="relative">
            <Shield className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-600 pointer-events-none z-10" />
            <select
              id="reg-role"
              value={role}
              onChange={(e) => setRole(e.target.value as AppRole)}
              className={selectCls}
            >
              {ROLES.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>

          {/* Role description */}
          <div className="rounded-xl border border-[#c9a84c]/15 bg-[#c9a84c]/5 px-4 py-3">
            <p className="text-xs text-[#c9a84c]/80 font-medium">
              {ROLES.find((r) => r.value === role)?.desc}
            </p>
          </div>

          {/* Company */}
          <div className="relative">
            <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-600 pointer-events-none" />
            <input
              id="reg-company"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="Company (optional)"
              autoComplete="organization"
              className={inputCls}
            />
          </div>

          {/* Department */}
          <div className="relative">
            <Briefcase className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-600 pointer-events-none" />
            <input
              id="reg-department"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              placeholder="Department (optional)"
              className={inputCls}
            />
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="h-12 px-5 rounded-xl border border-white/[0.08] bg-white/[0.03] text-sm font-medium text-slate-400 hover:bg-white/[0.07] transition-all"
            >
              Back
            </button>
            <button
              id="reg-submit"
              type="submit"
              disabled={isLoading}
              className="flex-1 h-12 rounded-xl font-bold text-sm text-white disabled:opacity-60 transition-all flex items-center justify-center gap-2"
              style={{ background: "linear-gradient(135deg, #c9a84c, #8a6a1e)" }}
            >
              {isLoading ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Creating account…</>
              ) : (
                <>Create Account <ArrowRight className="h-4 w-4" /></>
              )}
            </button>
          </div>
        </form>
      )}

      <p className="mt-8 text-center text-sm text-slate-600">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-[#c9a84c] hover:text-[#e8c97a] transition-colors">
          Sign in
        </Link>
      </p>
    </div>
  );
}
