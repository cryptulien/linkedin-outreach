import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import type { Config } from "../config.js";
import { TwentyClient } from "../twenty_client.js";
import type { Prospect } from "../types.js";
import { runInvites } from "./invites.js";

async function setup(seed: Prospect[]) {
  const dir = await mkdtemp(join(tmpdir(), "loh-"));
  const seedPath = join(dir, "seed.json");
  const dataPath = join(dir, "data.json");
  await writeFile(seedPath, JSON.stringify(seed));
  const config: Config = {
    port: 0,
    dryRun: true,
    twentyMode: "mock",
    twentyApiUrl: "",
    twentyApiKey: "",
    discordWebhookUrl: "",
    seedPath,
    dataPath,
    maxInvitesPerDay: 10,
  };
  const twenty = new TwentyClient(config);
  await twenty.init();
  return { config, twenty };
}

describe("runInvites dry-run", () => {
  it("sends invite and alerts on missing profile", async () => {
    const seed: Prospect[] = [
      {
        id: "ok",
        firstName: "A",
        lastName: "Ok",
        title: "DAM",
        establishment: "CHU",
        status: "non_invite",
        profileMatch: true,
        linkedinUrl: "https://li/ok",
      },
      {
        id: "ko",
        firstName: "B",
        lastName: "Ko",
        title: "DAM",
        establishment: "CHU",
        status: "non_invite",
        profileMatch: false,
        altSearchFinds: false,
      },
    ];
    const { config, twenty } = await setup(seed);
    const res = await runInvites(config, twenty, seed);
    expect(res.dry_run).toBe(true);
    expect(res.results).toHaveLength(2);
    expect(res.results[0]?.status).toBe("invite_envoye");
    expect(res.results[0]?.dryRunDetail).toMatch(/WITHOUT note/);
    expect(res.results[1]?.status).toBe("alerting_profil_non_trouve");
  });
});
