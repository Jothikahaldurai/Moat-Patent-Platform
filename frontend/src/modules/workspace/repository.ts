import { createAdminClient } from "@/lib/supabase/admin";
import { WorkspaceDocument, WorkspaceFile, Invention, InventionMemory } from "./types";

export class WorkspaceRepository {
  private supabase = createAdminClient();

  async findDocument(id: string) {
    return await this.supabase
      .from("workspace_documents")
      .select("*")
      .eq("id", id)
      .single();
  }

  async listDocuments() {
    return await this.supabase
      .from("workspace_documents")
      .select("*")
      .order("created_at", { ascending: false });
  }

  async createDocument(data: Partial<WorkspaceDocument>) {
    return await this.supabase
      .from("workspace_documents")
      .insert({ ...data, updated_at: new Date().toISOString() })
      .select()
      .single();
  }

  async updateDocument(id: string, data: Partial<WorkspaceDocument>) {
    return await this.supabase
      .from("workspace_documents")
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();
  }

  async deleteDocument(id: string) {
    return await this.supabase
      .from("workspace_documents")
      .delete()
      .eq("id", id);
  }

  // Inventions
  async findInvention(id: string) {
    return await this.supabase
      .from("inventions")
      .select("*")
      .eq("id", id)
      .single();
  }

  async listInventions() {
    return await this.supabase
      .from("inventions")
      .select("*")
      .order("created_at", { ascending: false });
  }

  async createInvention(data: Partial<Invention>) {
    return await this.supabase
      .from("inventions")
      .insert({ ...data, updated_at: new Date().toISOString() })
      .select()
      .single();
  }

  async updateInvention(id: string, data: Partial<Invention>) {
    return await this.supabase
      .from("inventions")
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();
  }

  async deleteInvention(id: string) {
    return await this.supabase
      .from("inventions")
      .delete()
      .eq("id", id);
  }
}
