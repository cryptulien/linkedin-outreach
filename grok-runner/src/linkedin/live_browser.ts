import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { runGrokHeadless } from "../grok_oauth.js";
import type { Prospect } from "../types.js";
import { planInvite, type InvitePlan } from "./dry_run.js";

function promptsDir(): string {
  return process.env.PROMPTS_DIR ?? join(process.cwd(), "..", "prompts");
}

async function loadPrompt(name: string): Promise<string> {
  return readFile(join(promptsDir(), name), "utf8");
}

function extractJsonBlock(text: string): unknown {
  const fenced = text.match(/```json\s*([\s\S]*?)```/i);
  const raw = fenced?.[1]?.trim() ?? text.trim();
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start < 0 || end <= start) {
    throw new Error(`Grok response missing JSON object: ${text.slice(0, 400)}`);
  }
  return JSON.parse(raw.slice(start, end + 1));
}

/**
 * LIVE LinkedIn actions via headless Grok (`grok -p`) on the host,
 * authenticated with OAuth subscription (`~/.grok/auth.json`).
 * Never uses GROK_API_KEY / XAI_API_KEY.
 */
export async function executeInviteLive(prospect: Prospect): Promise<InvitePlan> {
  const guide = await loadPrompt("invite-batch.md");
  const prompt = [
    guide,
    "",
    "Execute LIVE for this single prospect. Use browser / computer-use tools as needed.",
    "Invitation must be sent WITH NO NOTE.",
    "When done, reply with ONLY a JSON object:",
    '{"kind":"invite"|"invite_alt"|"alert_profil_non_trouve","url":"...optional...","reason":"...if alert..."}',
    "",
    "Prospect JSON:",
    JSON.stringify(prospect, null, 2),
  ].join("\n");

  const { text } = await runGrokHeadless({ prompt, maxTurns: 50 });
  const parsed = extractJsonBlock(text) as {
    kind?: string;
    url?: string;
    reason?: string;
  };

  if (parsed.kind === "alert_profil_non_trouve") {
    return {
      kind: "alert_profil_non_trouve",
      reason: parsed.reason ?? "Profile not found",
    };
  }
  if (parsed.kind === "invite" || parsed.kind === "invite_alt") {
    return {
      kind: parsed.kind,
      note: "none",
      url:
        parsed.url ??
        prospect.linkedinUrl ??
        `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(prospect.lastName)}`,
    };
  }
  throw new Error(`Unexpected invite result from Grok: ${text.slice(0, 400)}`);
}

export async function executeAcceptanceLive(
  prospect: Prospect,
): Promise<"accepted" | "pending"> {
  const guide = await loadPrompt("acceptance-batch.md");
  const prompt = [
    guide,
    "",
    "Check LIVE whether this prospect accepted the LinkedIn invitation.",
    'Reply with ONLY JSON: {"outcome":"accepted"|"pending"}',
    "",
    "Prospect JSON:",
    JSON.stringify(prospect, null, 2),
  ].join("\n");

  const { text } = await runGrokHeadless({ prompt, maxTurns: 40 });
  const parsed = extractJsonBlock(text) as { outcome?: string };
  if (parsed.outcome === "accepted" || parsed.outcome === "pending") {
    return parsed.outcome;
  }
  throw new Error(`Unexpected acceptance result from Grok: ${text.slice(0, 400)}`);
}

export async function executeDmLive(prospect: Prospect, text: string): Promise<void> {
  const guide = await loadPrompt("message-propose.md");
  const prompt = [
    guide,
    "",
    "The human already validated this DM. Send it LIVE on LinkedIn now.",
    "Do not modify the text unless LinkedIn UI forces a trivial wrap.",
    'When done, reply with ONLY JSON: {"sent":true}',
    "",
    "Prospect JSON:",
    JSON.stringify(prospect, null, 2),
    "",
    "Message to send:",
    text,
  ].join("\n");

  const { text: out } = await runGrokHeadless({ prompt, maxTurns: 40 });
  const parsed = extractJsonBlock(out) as { sent?: boolean };
  if (!parsed.sent) {
    throw new Error(`Grok did not confirm DM send: ${out.slice(0, 400)}`);
  }
}

/** Exported for tests that assert dry planning still works offline. */
export function previewInvitePlan(prospect: Prospect): InvitePlan {
  return planInvite(prospect);
}
