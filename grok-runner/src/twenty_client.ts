import type { Config } from "./config.js";
import { MockTwentyStore } from "./store/mock_twenty.js";
import { TwentyHttp } from "./twenty_http.js";
import type { Prospect, ProspectStatus } from "./types.js";

/** Abstraction over mock file store or real Twenty REST API (SuperPagr). */
export class TwentyClient {
  private store: MockTwentyStore | null = null;
  private http: TwentyHttp | null = null;

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
    this.http = new TwentyHttp(this.config.twentyApiUrl, this.config.twentyApiKey);
  }

  async listByStatus(status: ProspectStatus, limit?: number): Promise<Prospect[]> {
    if (this.http) return this.http.listByStatus(status, limit ?? 50);
    if (!this.store) throw new Error("TwentyClient not initialized");
    return this.store.listByStatus(status, limit);
  }

  async get(id: string): Promise<Prospect | undefined> {
    if (this.http) return this.http.get(id);
    if (!this.store) throw new Error("TwentyClient not initialized");
    return this.store.get(id);
  }

  async update(id: string, patch: Partial<Prospect>): Promise<Prospect> {
    if (this.http) return this.http.update(id, patch);
    if (!this.store) throw new Error("TwentyClient not initialized");
    return this.store.update(id, patch);
  }

  async all(): Promise<Prospect[]> {
    if (this.http) return this.http.all();
    if (!this.store) throw new Error("TwentyClient not initialized");
    return this.store.all();
  }
}
