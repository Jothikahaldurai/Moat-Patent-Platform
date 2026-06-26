import { create } from "zustand";
import { fetchApi } from "@/lib/apiClient";

export type WorkspaceRole = "owner" | "admin" | "editor" | "viewer";
export type WorkspaceProjectStatus = "active" | "on_hold" | "completed" | "archived";

export interface WorkspaceMember {
  id: string;
  workspace_id: string;
  user_id: string;
  role: WorkspaceRole;
  joined_at: string;
  user_name?: string | null;
  user_email?: string | null;
}

export interface WorkspaceProject {
  id: string;
  workspace_id: string;
  name: string;
  description: string | null;
  status: WorkspaceProjectStatus;
  owner_id?: string | null;
  owner_name?: string | null;
  due_date?: string | null;
  created_at: string;
  updated_at: string;
}

export interface WorkspaceActivity {
  id: string;
  workspace_id: string;
  actor_id?: string | null;
  actor_name?: string | null;
  action: string;
  entity_type: string;
  entity_id?: string | null;
  message: string;
  created_at: string;
}

export interface WorkspaceAuditLog {
  id: string;
  user_id?: string | null;
  user_name?: string | null;
  action: string;
  resource_type: string;
  resource_id?: string | null;
  details?: Record<string, unknown> | null;
  ip_address?: string | null;
  created_at?: string | null;
}

export interface Workspace {
  id: string;
  name: string;
  description: string | null;
  notes: string | null;
  owner_id: string;
  created_at: string;
  updated_at: string;
  role: WorkspaceRole;
  member_count: number;
  project_count: number;
  collections?: unknown[];
  members?: WorkspaceMember[];
  projects?: WorkspaceProject[];
  activity?: WorkspaceActivity[];
  audit_logs?: WorkspaceAuditLog[];
}

interface WorkspaceState {
  workspaces: Workspace[];
  activeWorkspace: Workspace | null;
  isLoading: boolean;
  isDetailLoading: boolean;
  error: string | null;

  fetchWorkspaces: () => Promise<void>;
  fetchWorkspaceDetail: (id: string) => Promise<Workspace>;
  setActiveWorkspace: (workspace: Workspace) => Promise<void>;
  createWorkspace: (name: string, description?: string, notes?: string) => Promise<Workspace>;
  updateWorkspace: (id: string, name: string, description?: string, notes?: string) => Promise<Workspace>;
  deleteWorkspace: (id: string) => Promise<void>;

  createProject: (workspaceId: string, payload: { name: string; description?: string; status?: WorkspaceProjectStatus; owner_id?: string | null; due_date?: string | null }) => Promise<WorkspaceProject>;
  updateProject: (workspaceId: string, projectId: string, payload: Partial<Pick<WorkspaceProject, "name" | "description" | "status" | "owner_id" | "due_date">>) => Promise<WorkspaceProject>;
  deleteProject: (workspaceId: string, projectId: string) => Promise<void>;

  addMember: (workspaceId: string, payload: { email?: string; user_id?: string; role: WorkspaceRole }) => Promise<WorkspaceMember>;
  updateMember: (workspaceId: string, memberId: string, role: WorkspaceRole) => Promise<WorkspaceMember>;
  removeMember: (workspaceId: string, memberId: string) => Promise<void>;
  fetchActivity: (workspaceId: string) => Promise<WorkspaceActivity[]>;
  fetchAuditLogs: (workspaceId: string) => Promise<WorkspaceAuditLog[]>;
}


function isApiUnavailable(error: unknown) {
  return error instanceof Error && (
    error.message.includes("404") ||
    error.message.includes("Failed to fetch") ||
    error.message.includes("Unauthorized") ||
    error.message.includes("User not found") ||
    error.message.includes("An error occurred")
  );
}

function now() {
  return new Date().toISOString();
}

function demoWorkspaces(): Workspace[] {
  const created = now();
  const workspaceId = "demo-workspace-1";
  const landscapeId = "demo-workspace-2";
  return [
    {
      id: workspaceId,
      name: "Wearable Sensor FTO",
      description: "Freedom-to-operate review for biometric wearable sensor claims and adjacent prior art.",
      notes: "Track claim language around optical sensing, low-power sampling, and data fusion. Flag crowded assignees before counsel review.",
      owner_id: "demo-user",
      created_at: created,
      updated_at: created,
      role: "owner",
      member_count: 3,
      project_count: 3,
      collections: [],
      members: [
        { id: "demo-member-1", workspace_id: workspaceId, user_id: "demo-user", role: "owner", joined_at: created, user_name: "Demo User", user_email: "demo@patentai.local" },
        { id: "demo-member-2", workspace_id: workspaceId, user_id: "demo-analyst", role: "editor", joined_at: created, user_name: "Asha Rao", user_email: "asha@patentai.local" },
        { id: "demo-member-3", workspace_id: workspaceId, user_id: "demo-viewer", role: "viewer", joined_at: created, user_name: "Legal Review", user_email: "legal@patentai.local" },
      ],
      projects: [
        { id: "demo-project-1", workspace_id: workspaceId, name: "Prior Art Sweep", description: "Search wearable sensing families and classify by claim overlap.", status: "active", owner_id: "demo-analyst", owner_name: "Asha Rao", due_date: created, created_at: created, updated_at: created },
        { id: "demo-project-2", workspace_id: workspaceId, name: "Assignee Landscape", description: "Map filings by Apple, Fitbit, Samsung, and emerging diagnostics startups.", status: "on_hold", owner_id: "demo-user", owner_name: "Demo User", due_date: null, created_at: created, updated_at: created },
        { id: "demo-project-3", workspace_id: workspaceId, name: "Counsel Packet", description: "Prepare final evidence list and notes for external review.", status: "completed", owner_id: null, owner_name: null, due_date: null, created_at: created, updated_at: created },
      ],
      activity: [
        { id: "demo-activity-1", workspace_id: workspaceId, actor_id: "demo-user", actor_name: "Demo User", action: "created", entity_type: "workspace", entity_id: workspaceId, message: "Created workspace Wearable Sensor FTO", created_at: created },
        { id: "demo-activity-2", workspace_id: workspaceId, actor_id: "demo-analyst", actor_name: "Asha Rao", action: "project_updated", entity_type: "project", entity_id: "demo-project-1", message: "Updated project Prior Art Sweep", created_at: created },
      ],
      audit_logs: [
        { id: "demo-audit-1", user_id: "demo-user", user_name: "Demo User", action: "workspace.created", resource_type: "workspace", resource_id: workspaceId, details: { workspace_id: workspaceId, name: "Wearable Sensor FTO" }, created_at: created },
        { id: "demo-audit-2", user_id: "demo-user", user_name: "Demo User", action: "workspace.member_added", resource_type: "workspace_member", resource_id: "demo-analyst", details: { workspace_id: workspaceId, role: "editor" }, created_at: created },
      ],
    },
    {
      id: landscapeId,
      name: "Battery Separator Landscape",
      description: "Technology landscape for ceramic-coated separators, thermal shutdown behavior, and high-cycle EV battery durability.",
      notes: "Prioritize Japanese and Korean assignees. Compare coating composition claims against in-house separator roadmap.",
      owner_id: "demo-user",
      created_at: created,
      updated_at: created,
      role: "admin",
      member_count: 2,
      project_count: 2,
      collections: [],
      members: [
        { id: "demo-member-4", workspace_id: landscapeId, user_id: "demo-user", role: "admin", joined_at: created, user_name: "Demo User", user_email: "demo@patentai.local" },
        { id: "demo-member-5", workspace_id: landscapeId, user_id: "demo-viewer-2", role: "viewer", joined_at: created, user_name: "Materials Team", user_email: "materials@patentai.local" },
      ],
      projects: [
        { id: "demo-project-4", workspace_id: landscapeId, name: "CPC Cluster Review", description: "Group separator patents by CPC class, polymer substrate, and coating material.", status: "active", owner_id: "demo-user", owner_name: "Demo User", due_date: null, created_at: created, updated_at: created },
        { id: "demo-project-5", workspace_id: landscapeId, name: "Competitor Watchlist", description: "Track LG, Panasonic, CATL, and SK On continuation activity.", status: "active", owner_id: null, owner_name: null, due_date: null, created_at: created, updated_at: created },
      ],
      activity: [
        { id: "demo-activity-3", workspace_id: landscapeId, actor_id: "demo-user", actor_name: "Demo User", action: "created", entity_type: "workspace", entity_id: landscapeId, message: "Created workspace Battery Separator Landscape", created_at: created },
        { id: "demo-activity-4", workspace_id: landscapeId, actor_id: "demo-user", actor_name: "Demo User", action: "project_created", entity_type: "project", entity_id: "demo-project-5", message: "Created project Competitor Watchlist", created_at: created },
      ],
      audit_logs: [
        { id: "demo-audit-3", user_id: "demo-user", user_name: "Demo User", action: "workspace.created", resource_type: "workspace", resource_id: landscapeId, details: { workspace_id: landscapeId, name: "Battery Separator Landscape" }, created_at: created },
      ],
    },
  ];
}

function addLocalActivity(workspace: Workspace, message: string, action: string, entity_type: string, entity_id?: string): Workspace {
  const item: WorkspaceActivity = {
    id: `local-activity-${Date.now()}`,
    workspace_id: workspace.id,
    actor_id: "demo-user",
    actor_name: "Demo User",
    action,
    entity_type,
    entity_id,
    message,
    created_at: now(),
  };
  return { ...workspace, activity: [item, ...(workspace.activity ?? [])], updated_at: now() };
}

function replaceWorkspace(workspaces: Workspace[], workspace: Workspace) {
  return workspaces.map((item) => (item.id === workspace.id ? { ...item, ...workspace } : item));
}

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  workspaces: [],
  activeWorkspace: null,
  isLoading: false,
  isDetailLoading: false,
  error: null,

  fetchWorkspaces: async () => {
    set({ isLoading: true, error: null });
    try {
      const workspaces = await fetchApi<Workspace[]>("/workspaces");
      set({ workspaces, isLoading: false });
      const active = get().activeWorkspace;
      if (!active && workspaces.length > 0) {
        await get().fetchWorkspaceDetail(workspaces[0].id);
      } else if (active) {
        const latest = workspaces.find((workspace) => workspace.id === active.id);
        if (!latest) set({ activeWorkspace: workspaces[0] ?? null });
      }
    } catch (err: unknown) {
      if (isApiUnavailable(err)) {
        const workspaces = get().workspaces.length > 0 ? get().workspaces : demoWorkspaces();
        const savedId = typeof window !== "undefined" ? localStorage.getItem("active_workspace_id") : null;
        const active = get().activeWorkspace ?? workspaces.find((workspace) => workspace.id === savedId) ?? workspaces[0] ?? null;
        set({ workspaces, activeWorkspace: active, isLoading: false, error: null });
        return;
      }
      const message = err instanceof Error ? err.message : "Failed to fetch workspaces";
      set({ error: message, isLoading: false });
    }
  },

  fetchWorkspaceDetail: async (id) => {
    set({ isDetailLoading: true, error: null });
    try {
      const workspace = await fetchApi<Workspace>(`/workspaces/${id}`);
      set((state) => ({
        workspaces: state.workspaces.some((item) => item.id === workspace.id)
          ? replaceWorkspace(state.workspaces, workspace)
          : [workspace, ...state.workspaces],
        activeWorkspace: workspace,
        isDetailLoading: false,
      }));
      return workspace;
    } catch (err: unknown) {
      if (isApiUnavailable(err)) {
        const workspaces = get().workspaces.length > 0 ? get().workspaces : demoWorkspaces();
        const workspace = workspaces.find((item) => item.id === id) ?? workspaces[0];
        set({ workspaces, activeWorkspace: workspace ?? null, isDetailLoading: false, error: null });
        return workspace;
      }
      const message = err instanceof Error ? err.message : "Failed to fetch workspace detail";
      set({ error: message, isDetailLoading: false });
      throw err;
    }
  },

  setActiveWorkspace: async (workspace) => {
    if (typeof window !== "undefined") localStorage.setItem("active_workspace_id", workspace.id);
    await get().fetchWorkspaceDetail(workspace.id);
  },

  createWorkspace: async (name, description, notes) => {
    try {
      const workspace = await fetchApi<Workspace>("/workspaces", {
        method: "POST",
        body: JSON.stringify({ name, description: description ?? null, notes: notes ?? null }),
      });
      set((state) => ({ workspaces: [workspace, ...state.workspaces], activeWorkspace: workspace }));
      await get().fetchWorkspaceDetail(workspace.id);
      return workspace;
    } catch (err) {
      if (!isApiUnavailable(err)) throw err;
      const created = now();
      const workspace: Workspace = {
        id: `local-workspace-${Date.now()}`,
        name,
        description: description ?? null,
        notes: notes ?? null,
        owner_id: "demo-user",
        created_at: created,
        updated_at: created,
        role: "owner",
        member_count: 1,
        project_count: 0,
        collections: [],
        members: [{ id: `local-member-${Date.now()}`, workspace_id: `local-workspace-${Date.now()}`, user_id: "demo-user", role: "owner", joined_at: created, user_name: "Demo User", user_email: "demo@patentai.local" }],
        projects: [],
        activity: [],
        audit_logs: [],
      };
      workspace.members = [{ ...workspace.members![0], workspace_id: workspace.id }];
      const withActivity = addLocalActivity(workspace, `Created workspace ${name}`, "created", "workspace", workspace.id);
      if (typeof window !== "undefined") localStorage.setItem("active_workspace_id", withActivity.id);
      set((state) => ({ workspaces: [withActivity, ...state.workspaces], activeWorkspace: withActivity, error: null }));
      return withActivity;
    }
  },

  updateWorkspace: async (id, name, description, notes) => {
    try {
      const updated = await fetchApi<Workspace>(`/workspaces/${id}`, {
        method: "PUT",
        body: JSON.stringify({ name, description: description ?? null, notes: notes ?? null }),
      });
      set((state) => ({
        workspaces: replaceWorkspace(state.workspaces, updated),
        activeWorkspace: state.activeWorkspace?.id === id ? { ...state.activeWorkspace, ...updated } : state.activeWorkspace,
      }));
      if (get().activeWorkspace?.id === id) await get().fetchWorkspaceDetail(id);
      return updated;
    } catch (err) {
      if (!isApiUnavailable(err)) throw err;
      const current = get().activeWorkspace ?? get().workspaces.find((workspace) => workspace.id === id);
      if (!current) throw err;
      const updated = addLocalActivity({ ...current, name, description: description ?? null, notes: notes ?? null }, `Updated workspace ${name}`, "updated", "workspace", id);
      set((state) => ({ workspaces: replaceWorkspace(state.workspaces, updated), activeWorkspace: updated, error: null }));
      return updated;
    }
  },

  deleteWorkspace: async (id) => {
    try {
      await fetchApi<void>(`/workspaces/${id}`, { method: "DELETE" });
    } catch (err) {
      if (!isApiUnavailable(err)) throw err;
    }
    set((state) => {
      const remaining = state.workspaces.filter((workspace) => workspace.id !== id);
      return {
        workspaces: remaining,
        activeWorkspace: state.activeWorkspace?.id === id ? (remaining[0] ?? null) : state.activeWorkspace,
        error: null,
      };
    });
  },

  createProject: async (workspaceId, payload) => {
    try {
      const project = await fetchApi<WorkspaceProject>(`/workspaces/${workspaceId}/projects`, {
        method: "POST",
        body: JSON.stringify(payload),
      });
      await get().fetchWorkspaceDetail(workspaceId);
      return project;
    } catch (err) {
      if (!isApiUnavailable(err)) throw err;
      const workspace = get().activeWorkspace;
      if (!workspace) throw err;
      const created = now();
      const owner = workspace.members?.find((member) => member.user_id === payload.owner_id);
      const project: WorkspaceProject = {
        id: `local-project-${Date.now()}`,
        workspace_id: workspaceId,
        name: payload.name,
        description: payload.description ?? null,
        status: payload.status ?? "active",
        owner_id: payload.owner_id ?? null,
        owner_name: owner?.user_name ?? null,
        due_date: payload.due_date ?? null,
        created_at: created,
        updated_at: created,
      };
      const updated = addLocalActivity({ ...workspace, projects: [project, ...(workspace.projects ?? [])], project_count: (workspace.projects?.length ?? 0) + 1 }, `Created project ${project.name}`, "project_created", "project", project.id);
      set((state) => ({ workspaces: replaceWorkspace(state.workspaces, updated), activeWorkspace: updated, error: null }));
      return project;
    }
  },

  updateProject: async (workspaceId, projectId, payload) => {
    try {
      const project = await fetchApi<WorkspaceProject>(`/workspaces/${workspaceId}/projects/${projectId}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
      await get().fetchWorkspaceDetail(workspaceId);
      return project;
    } catch (err) {
      if (!isApiUnavailable(err)) throw err;
      const workspace = get().activeWorkspace;
      const existing = workspace?.projects?.find((project) => project.id === projectId);
      if (!workspace || !existing) throw err;
      const owner = workspace.members?.find((member) => member.user_id === payload.owner_id);
      const project = { ...existing, ...payload, owner_name: payload.owner_id ? owner?.user_name ?? null : existing.owner_name, updated_at: now() } as WorkspaceProject;
      const updated = addLocalActivity({ ...workspace, projects: (workspace.projects ?? []).map((item) => item.id === projectId ? project : item) }, `Updated project ${project.name}`, "project_updated", "project", project.id);
      set((state) => ({ workspaces: replaceWorkspace(state.workspaces, updated), activeWorkspace: updated, error: null }));
      return project;
    }
  },

  deleteProject: async (workspaceId, projectId) => {
    try {
      await fetchApi<void>(`/workspaces/${workspaceId}/projects/${projectId}`, { method: "DELETE" });
      await get().fetchWorkspaceDetail(workspaceId);
    } catch (err) {
      if (!isApiUnavailable(err)) throw err;
      const workspace = get().activeWorkspace;
      if (!workspace) return;
      const project = workspace.projects?.find((item) => item.id === projectId);
      const projects = (workspace.projects ?? []).filter((item) => item.id !== projectId);
      const updated = addLocalActivity({ ...workspace, projects, project_count: projects.length }, `Deleted project ${project?.name ?? "project"}`, "project_deleted", "project", projectId);
      set((state) => ({ workspaces: replaceWorkspace(state.workspaces, updated), activeWorkspace: updated, error: null }));
    }
  },

  addMember: async (workspaceId, payload) => {
    try {
      const member = await fetchApi<WorkspaceMember>(`/workspaces/${workspaceId}/members`, {
        method: "POST",
        body: JSON.stringify(payload),
      });
      await get().fetchWorkspaceDetail(workspaceId);
      return member;
    } catch (err) {
      if (!isApiUnavailable(err)) throw err;
      const workspace = get().activeWorkspace;
      if (!workspace) throw err;
      const member: WorkspaceMember = { id: `local-member-${Date.now()}`, workspace_id: workspaceId, user_id: payload.user_id ?? `local-user-${Date.now()}`, role: payload.role, joined_at: now(), user_name: payload.email?.split("@")[0] ?? "New Member", user_email: payload.email ?? null };
      const updated = addLocalActivity({ ...workspace, members: [...(workspace.members ?? []), member], member_count: (workspace.members?.length ?? 0) + 1 }, `Added ${member.user_email ?? member.user_name} as ${payload.role}`, "member_added", "member", member.user_id);
      set((state) => ({ workspaces: replaceWorkspace(state.workspaces, updated), activeWorkspace: updated, error: null }));
      return member;
    }
  },

  updateMember: async (workspaceId, memberId, role) => {
    try {
      const member = await fetchApi<WorkspaceMember>(`/workspaces/${workspaceId}/members/${memberId}`, {
        method: "PATCH",
        body: JSON.stringify({ role }),
      });
      await get().fetchWorkspaceDetail(workspaceId);
      return member;
    } catch (err) {
      if (!isApiUnavailable(err)) throw err;
      const workspace = get().activeWorkspace;
      const existing = workspace?.members?.find((member) => member.id === memberId);
      if (!workspace || !existing) throw err;
      const member = { ...existing, role };
      const updated = addLocalActivity({ ...workspace, members: (workspace.members ?? []).map((item) => item.id === memberId ? member : item) }, `Changed ${member.user_name ?? member.user_email}'s role to ${role}`, "member_updated", "member", member.user_id);
      set((state) => ({ workspaces: replaceWorkspace(state.workspaces, updated), activeWorkspace: updated, error: null }));
      return member;
    }
  },

  removeMember: async (workspaceId, memberId) => {
    try {
      await fetchApi<void>(`/workspaces/${workspaceId}/members/${memberId}`, { method: "DELETE" });
      await get().fetchWorkspaceDetail(workspaceId);
    } catch (err) {
      if (!isApiUnavailable(err)) throw err;
      const workspace = get().activeWorkspace;
      if (!workspace) return;
      const member = workspace.members?.find((item) => item.id === memberId);
      const members = (workspace.members ?? []).filter((item) => item.id !== memberId);
      const updated = addLocalActivity({ ...workspace, members, member_count: members.length }, `Removed ${member?.user_name ?? "member"}`, "member_removed", "member", member?.user_id);
      set((state) => ({ workspaces: replaceWorkspace(state.workspaces, updated), activeWorkspace: updated, error: null }));
    }
  },

  fetchActivity: async (workspaceId) => {
    try {
      const activity = await fetchApi<WorkspaceActivity[]>(`/workspaces/${workspaceId}/activity`);
      set((state) => ({
        activeWorkspace: state.activeWorkspace?.id === workspaceId ? { ...state.activeWorkspace, activity } : state.activeWorkspace,
      }));
      return activity;
    } catch (err) {
      if (!isApiUnavailable(err)) throw err;
      return get().activeWorkspace?.activity ?? [];
    }
  },

  fetchAuditLogs: async (workspaceId) => {
    try {
      const audit_logs = await fetchApi<WorkspaceAuditLog[]>(`/workspaces/${workspaceId}/audit-logs`);
      set((state) => ({
        activeWorkspace: state.activeWorkspace?.id === workspaceId ? { ...state.activeWorkspace, audit_logs } : state.activeWorkspace,
      }));
      return audit_logs;
    } catch (err) {
      if (!isApiUnavailable(err)) throw err;
      return get().activeWorkspace?.audit_logs ?? [];
    }
  },
}));
