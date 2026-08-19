import type { Config } from "../config.js";
import { executeAcceptanceLive } from "../linkedin/live_browser.js";
import type { TwentyClient } from "../twenty_client.js";
import type { JobResponse, JobResult, Prospect } from "../types.js";

const BATCH_SIZE = 20;

export async function runAcceptances(
  config: Config,
  twenty: TwentyClient,
  incoming: Prospect[],
): Promise<JobResponse> {
  const batch = incoming.slice(0, BATCH_SIZE);
  const results: JobResult[] = [];
  const now = new Date().toISOString();

  for (const raw of batch) {
    const existing = (await twenty.get(raw.id)) ?? raw;
    if (existing.status !== "invite_envoye") {
      results.push({
        id: existing.id,
        action: "skip",
        status: existing.status,
        error: `expected invite_envoye, got ${existing.status}`,
      });
      continue;
    }

    let outcome: "accepted" | "pending" = "pending";
    if (config.dryRun) {
      // Deterministic dry-run: accept if acceptedAt already set on payload, else pending
      outcome = raw.acceptedAt || existing.acceptedAt ? "accepted" : "pending";
    } else {
      outcome = await executeAcceptanceLive(existing);
    }

    if (outcome === "accepted") {
      const updated = await twenty.update(existing.id, {
        status: "en_relation",
        acceptedAt: existing.acceptedAt ?? raw.acceptedAt ?? now,
      });
      results.push({
        id: updated.id,
        action: "accepted",
        status: updated.status,
        dryRunDetail: config.dryRun ? "Would mark en_relation" : undefined,
      });
    } else {
      results.push({
        id: existing.id,
        action: "still_pending",
        status: "invite_envoye",
        dryRunDetail: config.dryRun ? "Would leave invite_envoye" : undefined,
      });
    }
  }

  return { ok: true, dry_run: config.dryRun, results };
}
