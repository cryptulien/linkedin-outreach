import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import { buildServer } from "./server.js";

describe("server", () => {
  it("healthz reports dry_run", async () => {
    const dir = await mkdtemp(join(tmpdir(), "loh-srv-"));
    const seedPath = join(dir, "seed.json");
    const dataPath = join(dir, "data.json");
    await writeFile(seedPath, JSON.stringify([]));
    process.env.DRY_RUN = "true";
    process.env.TWENTY_MODE = "mock";
    process.env.SEED_PATH = seedPath;
    process.env.DATA_PATH = dataPath;
    process.env.PORT = "0";

    const { app } = await buildServer();
    const res = await app.inject({ method: "GET", url: "/healthz" });
    expect(res.statusCode).toBe(200);
    const body = res.json() as { ok: boolean; dry_run: boolean };
    expect(body.ok).toBe(true);
    expect(body.dry_run).toBe(true);
    await app.close();
  });
});

afterAll(() => {
  delete process.env.SEED_PATH;
  delete process.env.DATA_PATH;
});
