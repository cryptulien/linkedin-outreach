import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import type { Config } from "../config.js";
import { TwentyClient } from "../twenty_client.js";
import type { Prospect } from "../types.js";
import { isEligibleForMessage, runPropose, runSend } from "./messages.js";

async function setup(seed: Prospect[]) {
  const dir = await mkdtemp(join(tmpdir(), "loh-msg-"));
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

describe("messages", () => {
  it("requires ≥3 days since acceptance", () => {
    const recent: Prospect = {
      id: "r",
      firstName: "R",
      lastName: "R",
      title: "t",
      establishment: "e",
      status: "en_relation",
      acceptedAt: new Date().toISOString(),
    };
    expect(isEligibleForMessage(recent)).toBe(false);
    const old: Prospect = {
      ...recent,
      id: "o",
      acceptedAt: "2026-01-01T00:00:00.000Z",
    };
    expect(isEligibleForMessage(old, Date.parse("2026-08-19"))).toBe(true);
  });

  it("propose sets message_a_valider then send ok → message_envoye", async () => {
    const seed: Prospect[] = [
      {
        id: "p12",
        firstName: "Laura",
        lastName: "Simon",
        title: "Cadre",
        establishment: "Orion",
        status: "en_relation",
        acceptedAt: "2026-07-05T10:00:00.000Z",
        profileMatch: true,
      },
    ];
    const { config, twenty } = await setup(seed);
    const proposed = await runPropose(config, twenty, seed);
    expect(proposed.results[0]?.status).toBe("message_a_valider");
    const sent = await runSend(config, twenty, { prospect_id: "p12", decision: "ok" });
    expect(sent.results[0]?.status).toBe("message_envoye");
    const p = await twenty.get("p12");
    expect(p?.messageContent).toBeTruthy();
  });
});
