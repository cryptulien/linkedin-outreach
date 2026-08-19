import type { Config } from "../config.js";
import { formatDigest, postDiscord } from "../discord.js";
import { defaultDmTemplate } from "../linkedin/dry_run.js";
import { executeDmLive } from "../linkedin/live_browser.js";
import type { TwentyClient } from "../twenty_client.js";
import type { JobResponse, JobResult, Prospect, SendBody } from "../types.js";

const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;

export function isEligibleForMessage(p: Prospect, now = Date.now()): boolean {
  if (p.status !== "en_relation" && p.status !== "message_a_valider") return false;
  if (!p.acceptedAt) return false;
  const accepted = Date.parse(p.acceptedAt);
  if (Number.isNaN(accepted)) return false;
  return now - accepted >= THREE_DAYS_MS;
}

export async function runPropose(
  config: Config,
  twenty: TwentyClient,
  incoming: Prospect[],
): Promise<JobResponse> {
  const results: JobResult[] = [];
  const digestItems: Array<{
    index: number;
    label: string;
    url?: string;
    acceptedAt?: string;
    draft: string;
  }> = [];
  let index = 0;

  for (const raw of incoming) {
    const existing = (await twenty.get(raw.id)) ?? raw;
    if (!isEligibleForMessage(existing)) {
      results.push({
        id: existing.id,
        action: "skip",
        status: existing.status,
        error: "not eligible (≥3j en_relation without sent message)",
      });
      continue;
    }
    index += 1;
    const draft = existing.messageDraft ?? defaultDmTemplate(existing);
    const updated = await twenty.update(existing.id, {
      status: "message_a_valider",
      messageDraft: draft,
    });
    digestItems.push({
      index,
      label: `${existing.firstName} ${existing.lastName} – ${existing.title} – ${existing.establishment}`,
      url: existing.linkedinUrl,
      acceptedAt: existing.acceptedAt,
      draft,
    });
    results.push({
      id: updated.id,
      action: "propose",
      status: updated.status,
      dryRunDetail: config.dryRun ? "Draft stored; awaiting human validation" : undefined,
    });
  }

  if (digestItems.length > 0) {
    await postDiscord(config.discordWebhookUrl, formatDigest(digestItems));
  }

  return { ok: true, dry_run: config.dryRun, results };
}

export async function runSend(
  config: Config,
  twenty: TwentyClient,
  body: SendBody,
): Promise<JobResponse> {
  const existing = await twenty.get(body.prospect_id);
  if (!existing) {
    return {
      ok: false,
      dry_run: config.dryRun,
      results: [
        {
          id: body.prospect_id,
          action: "send",
          status: "alerting_autre",
          error: "prospect not found",
        },
      ],
    };
  }

  if (body.decision === "skip") {
    return {
      ok: true,
      dry_run: config.dryRun,
      results: [
        {
          id: existing.id,
          action: "skip",
          status: existing.status,
          dryRunDetail: "Human skipped — left message_a_valider",
        },
      ],
    };
  }

  const text =
    body.decision === "modifier" && body.text
      ? body.text
      : (existing.messageDraft ?? defaultDmTemplate(existing));

  if (body.decision === "modifier" && body.text) {
    await twenty.update(existing.id, { messageDraft: body.text });
  }

  if (body.decision === "ok" || (body.decision === "modifier" && body.text)) {
    if (!config.dryRun) {
      await executeDmLive(existing, text);
    }
    const now = new Date().toISOString();
    const updated = await twenty.update(existing.id, {
      status: "message_envoye",
      messageContent: text,
      messageSentAt: now,
    });
    return {
      ok: true,
      dry_run: config.dryRun,
      results: [
        {
          id: updated.id,
          action: "send",
          status: updated.status,
          dryRunDetail: config.dryRun ? `Would send DM: ${text.slice(0, 80)}…` : undefined,
        },
      ],
    };
  }

  return {
    ok: false,
    dry_run: config.dryRun,
    results: [
      {
        id: existing.id,
        action: "send",
        status: existing.status,
        error: "modifier requires text",
      },
    ],
  };
}
