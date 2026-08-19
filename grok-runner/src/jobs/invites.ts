import type { Config } from "../config.js";
import { formatAlert, postDiscord } from "../discord.js";
import { planInvite } from "../linkedin/dry_run.js";
import { executeInviteLive } from "../linkedin/live_browser.js";
import type { TwentyClient } from "../twenty_client.js";
import type { JobResponse, JobResult, Prospect } from "../types.js";

export async function runInvites(
  config: Config,
  twenty: TwentyClient,
  incoming: Prospect[],
): Promise<JobResponse> {
  const capped = incoming.slice(0, config.maxInvitesPerDay);
  const results: JobResult[] = [];
  const now = new Date().toISOString();

  for (const raw of capped) {
    const existing = (await twenty.get(raw.id)) ?? raw;
    if (existing.status !== "non_invite") {
      results.push({
        id: existing.id,
        action: "skip",
        status: existing.status,
        error: `expected non_invite, got ${existing.status}`,
      });
      continue;
    }

    if (!config.dryRun) {
      await executeInviteLive(existing);
    }

    const plan = planInvite(existing);
    if (plan.kind === "alert_profil_non_trouve") {
      const updated = await twenty.update(existing.id, {
        status: "alerting_profil_non_trouve",
      });
      const label = `${existing.firstName} ${existing.lastName}`;
      await postDiscord(
        config.discordWebhookUrl,
        formatAlert(
          label,
          plan.reason,
          JSON.stringify({
            title: existing.title,
            establishment: existing.establishment,
            linkedinUrl: existing.linkedinUrl,
          }),
        ),
      );
      results.push({
        id: updated.id,
        action: "alert_profil_non_trouve",
        status: updated.status,
        dryRunDetail: config.dryRun ? plan.reason : undefined,
      });
      continue;
    }

    const updated = await twenty.update(existing.id, {
      status: "invite_envoye",
      inviteSentAt: now,
      linkedinUrl: plan.url,
    });
    results.push({
      id: updated.id,
      action: plan.kind,
      status: updated.status,
      dryRunDetail: config.dryRun
        ? `Would send invite WITHOUT note to ${plan.url}`
        : undefined,
    });
  }

  return { ok: true, dry_run: config.dryRun, results };
}
