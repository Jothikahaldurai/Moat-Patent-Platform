import { createAdminClient } from "@/lib/supabase/admin";
import { Alert } from "./types";

export class AlertsRepository {
  private supabase = createAdminClient();

  async findByUserId(userId: string) {
    return await this.supabase
      .from("alerts")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
  }

  async findById(id: string) {
    return await this.supabase
      .from("alerts")
      .select("*")
      .eq("id", id)
      .single();
  }

  async create(data: Partial<Alert>) {
    return await this.supabase
      .from("alerts")
      .insert(data)
      .select()
      .single();
  }

  async update(id: string, data: Partial<Alert>) {
    return await this.supabase
      .from("alerts")
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();
  }

  async delete(id: string) {
    return await this.supabase
      .from("alerts")
      .delete()
      .eq("id", id);
  }
}
