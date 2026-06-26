"use client";

import { useState, useEffect } from "react";
import { Plus, Search, Filter, MoreVertical, ShieldCheck, X, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function UserManagementPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [rolesList, setRolesList] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Form State
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("Patent Analyst");
  const [department, setDepartment] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/users");
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (err) {
      console.error("Failed to fetch users", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const res = await fetch("/api/roles");
      if (res.ok) {
        const data = await res.json();
        setRolesList(data);
      }
    } catch (err) {
      console.error("Failed to fetch roles", err);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchRoles();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setIsCreating(true);

    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role, department }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.detail || "Failed to create user.");
      } else {
        setIsModalOpen(false);
        // Reset form
        setName("");
        setEmail("");
        setPassword("");
        setRole("Patent Analyst");
        setDepartment("");
        // Refresh users
        fetchUsers();
      }
    } catch (err) {
      setErrorMsg("An unexpected error occurred.");
    } finally {
      setIsCreating(false);
    }
  };

  const filteredUsers = users.filter((u) => 
    u.name.toLowerCase().includes(search.toLowerCase()) || 
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">User Management</h2>
          <p className="text-sm text-muted-foreground">Manage enterprise users and roles.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-[#c9a84c] hover:bg-[#b8921e] text-white px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-lg shadow-[#c9a84c]/20"
        >
          <Plus className="h-4 w-4" /> Create User
        </button>
      </div>

      <div className="flex gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search users by name or email..."
            className="w-full bg-background border border-border rounded-xl pl-10 pr-4 py-2 text-sm text-foreground focus:outline-none focus:border-[#c9a84c]/50 focus:ring-1 focus:ring-[#c9a84c]/50 transition-all"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button className="flex items-center gap-2 bg-background border border-border text-foreground px-4 py-2 rounded-xl text-sm hover:bg-muted transition-all">
          <Filter className="h-4 w-4" /> Filters
        </button>
      </div>

      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-muted/50 border-b border-border text-muted-foreground">
            <tr>
              <th className="px-6 py-4 font-medium">User</th>
              <th className="px-6 py-4 font-medium">Role</th>
              <th className="px-6 py-4 font-medium">Department</th>
              <th className="px-6 py-4 font-medium">Status</th>
              <th className="px-6 py-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? (
              <tr>
                <td colSpan={5} className="py-12 text-center">
                  <Loader2 className="h-8 w-8 animate-spin text-[#c9a84c] mx-auto" />
                </td>
              </tr>
            ) : filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-muted-foreground">
                  No users found matching your search.
                </td>
              </tr>
            ) : (
              filteredUsers.map((u) => (
                <tr key={u.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-[#c9a84c]/10 flex items-center justify-center font-bold text-[#c9a84c] border border-[#c9a84c]/20">
                        {u.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-medium text-foreground">{u.name}</div>
                        <div className="text-xs text-muted-foreground">{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 text-xs font-medium border border-indigo-500/20">
                      <ShieldCheck className="h-3 w-3" /> {u.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">{u.department}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      u.status === "Active" 
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20" 
                        : "bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20"
                    }`}>
                      {u.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="p-2 hover:bg-muted rounded-lg text-muted-foreground hover:text-foreground transition-colors">
                      <MoreVertical className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Create User Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
            >
              <div className="flex justify-between items-center p-6 border-b border-border">
                <h3 className="text-lg font-bold text-foreground">Create Enterprise User</h3>
                <button onClick={() => setIsModalOpen(false)} className="text-muted-foreground hover:text-foreground transition-colors">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleCreateUser} className="p-6 space-y-4">
                {errorMsg && (
                  <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 dark:text-red-400 text-sm">
                    {errorMsg}
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Full Name</label>
                  <input 
                    type="text" 
                    required 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-background border border-border rounded-xl px-4 py-2 text-sm text-foreground focus:outline-none focus:border-[#c9a84c]/50"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Work Email</label>
                  <input 
                    type="email" 
                    required 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-background border border-border rounded-xl px-4 py-2 text-sm text-foreground focus:outline-none focus:border-[#c9a84c]/50"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Password</label>
                  <input 
                    type="text" 
                    required 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-background border border-border rounded-xl px-4 py-2 text-sm text-foreground focus:outline-none focus:border-[#c9a84c]/50"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Assigned Role</label>
                  <select 
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full bg-background border border-border rounded-xl px-4 py-2 text-sm text-foreground focus:outline-none focus:border-[#c9a84c]/50"
                  >
                    {rolesList.length === 0 ? (
                      <option value="Patent Analyst">Patent Analyst (Default)</option>
                    ) : (
                      rolesList.map(r => (
                        <option key={r.id} value={r.name}>{r.name}</option>
                      ))
                    )}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Department (Optional)</label>
                  <input 
                    type="text" 
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full bg-background border border-border rounded-xl px-4 py-2 text-sm text-foreground focus:outline-none focus:border-[#c9a84c]/50"
                  />
                </div>

                <div className="pt-4 flex justify-end gap-3">
                  <button 
                    type="button" 
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={isCreating}
                    className="flex items-center gap-2 bg-[#c9a84c] hover:bg-[#b8921e] text-white px-5 py-2 rounded-xl text-sm font-bold transition-all disabled:opacity-50"
                  >
                    {isCreating ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    Provision User
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
