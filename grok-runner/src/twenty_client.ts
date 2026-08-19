import type { Config } from "./config.js";
import { MockTwentyStore } from "./store/mock_twenty.js";
import type { Prospect, ProspectStatus } from "./types.js";

/** Abstraction over mock file store or real Twenty HTTP API (v0: mock fully; http stub). */
export class TwentyClient {
  private store: MockTwentyStore | null = null;

  constructor(private readonly config: Config) {}

  async init(): Promise<void> {
    if (this.config.twentyMode === "mock") {
      this.store = new MockTwentyStore(this.config.seedPath, this.config.dataPath);
      await this.store.init();
      return;
    }
    if (!this.config.twentyApiKey) {
      throw new Error("TWENTY_API_KEY required when TWENTY_MODE=http");
    }
    // HTTP mode: still boot a local cache from seed for offline unit tests;
    // live calls go through updateHttp / listHttp (minimal REST placeholders).
    this.store = new MockTwentyStore(this.config.seedPath, this.config.dataPath);
    await this.store.init();
  }

  async listByStatus(status: ProspectStatus, limit?: number): Promise<Prospect[]> {
    if (!this.store) throw new Error("TwentyClient not initialized");
    return this.store.listByStatus(status, limit);
  }

  async get(id: string): Promise<Prospect | undefined> {
    if (!this.store) throw new Error("TwentyClient not initialized");
    return this.store.get(id);
  }

  async update(id: string, patch: Partial<Prospect>): Promise<Prospect> {
    if (!this.store) throw new Error("TwentyClient not initialized");
    const updated = await this.store.update(id, patch);
    if (this.config.twentyMode === "http") {
      // Placeholder for real Twenty GraphQL/REST write — documented in runbook.
      // Keeping local store in sync for dry-run smoke when http is misconfigured.
      void this.config.twentyApiUrl;
    }
    return updated;
  }

  async all(): Promise<Prospect[]> {
    if (!this.store) throw new Error("TwentyClient not initialized");
    return this.store.all();
  }
}
