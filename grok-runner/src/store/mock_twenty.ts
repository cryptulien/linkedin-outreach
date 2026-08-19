import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import type { Prospect, ProspectStatus } from "../types.js";

export class MockTwentyStore {
  private prospects = new Map<string, Prospect>();

  constructor(
    private readonly seedPath: string,
    private readonly dataPath: string,
  ) {}

  async init(): Promise<void> {
    try {
      const raw = await readFile(this.dataPath, "utf8");
      const list = JSON.parse(raw) as Prospect[];
      this.prospects = new Map(list.map((p) => [p.id, p]));
      return;
    } catch {
      // fall through to seed
    }
    const seedRaw = await readFile(this.seedPath, "utf8");
    const seed = JSON.parse(seedRaw) as Prospect[];
    this.prospects = new Map(seed.map((p) => [p.id, structuredClone(p)]));
    await this.persist();
  }

  async listByStatus(status: ProspectStatus, limit?: number): Promise<Prospect[]> {
    const all = [...this.prospects.values()].filter((p) => p.status === status);
    // FIFO: order as in seed / map insertion = array order preserved from seed
    return limit === undefined ? all : all.slice(0, limit);
  }

  async get(id: string): Promise<Prospect | undefined> {
    const p = this.prospects.get(id);
    return p ? structuredClone(p) : undefined;
  }

  async update(id: string, patch: Partial<Prospect>): Promise<Prospect> {
    const current = this.prospects.get(id);
    if (!current) throw new Error(`Prospect not found: ${id}`);
    const next = { ...current, ...patch, id };
    this.prospects.set(id, next);
    await this.persist();
    return structuredClone(next);
  }

  async all(): Promise<Prospect[]> {
    return [...this.prospects.values()].map((p) => structuredClone(p));
  }

  private async persist(): Promise<void> {
    await mkdir(dirname(this.dataPath), { recursive: true });
    const list = [...this.prospects.values()];
    await writeFile(this.dataPath, JSON.stringify(list, null, 2), "utf8");
  }
}
