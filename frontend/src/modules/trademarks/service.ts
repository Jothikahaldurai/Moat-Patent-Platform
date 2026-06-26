import { TrademarksRepository } from "./repository";
import { Trademark, TrademarkFile } from "./types";

export class TrademarksService {
  private repo = new TrademarksRepository();

  async getTrademarks(filters: { type?: string; status?: string; search?: string }): Promise<Trademark[]> {
    const { data } = await this.repo.findAll(filters);
    return data || [];
  }

  async getTrademark(id: string): Promise<Trademark> {
    const { data } = await this.repo.findById(id);
    if (!data) throw new Error("Trademark not found");
    return data;
  }

  async createTrademark(payload: Partial<Trademark>, user: string): Promise<Trademark> {
    const { data } = await this.repo.create(payload);
    if (!data) throw new Error("Failed to create trademark");
    await this.repo.logHistory(data.id, "Created trademark", user);
    return data;
  }

  async updateTrademark(id: string, payload: Partial<Trademark>, user: string): Promise<Trademark> {
    const { data } = await this.repo.update(id, payload);
    if (!data) throw new Error("Failed to update trademark");
    await this.repo.logHistory(id, `Updated trademark fields: ${Object.keys(payload).join(", ")}`, user);
    return data;
  }

  async deleteTrademark(id: string, user: string): Promise<void> {
    await this.repo.delete(id);
  }

  async addAttachment(trademarkId: string, name: string, url: string, size?: number, fileType?: string): Promise<TrademarkFile> {
    const { data } = await this.repo.addFile({
      trademark_id: trademarkId,
      name,
      url,
      size,
      type: fileType
    });
    if (!data) throw new Error("Failed to add file attachment");
    await this.repo.logHistory(trademarkId, `Attached file: ${name}`, "User");
    return data;
  }

  async removeAttachment(trademarkId: string, fileId: string, fileName: string): Promise<void> {
    await this.repo.deleteFile(fileId);
    await this.repo.logHistory(trademarkId, `Deleted attachment: ${fileName}`, "User");
  }
}
