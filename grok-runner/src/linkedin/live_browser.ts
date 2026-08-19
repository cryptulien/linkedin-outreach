import type { Prospect } from "../types.js";
import { planInvite, type InvitePlan } from "./dry_run.js";

/**
 * LIVE LinkedIn actions via Grok computer use.
 * v0: not implemented — throws if called while DRY_RUN=false without wiring.
 */
export async function executeInviteLive(_prospect: Prospect): Promise<InvitePlan> {
  throw new Error(
    "LIVE LinkedIn invite not implemented in v0 — keep DRY_RUN=true or wire Grok computer use (see docs/runbook.md)",
  );
}

export async function executeAcceptanceLive(prospect: Prospect): Promise<"accepted" | "pending"> {
  void prospect;
  throw new Error(
    "LIVE LinkedIn acceptance check not implemented in v0 — keep DRY_RUN=true (see docs/runbook.md)",
  );
}

export async function executeDmLive(_prospect: Prospect, _text: string): Promise<void> {
  throw new Error(
    "LIVE LinkedIn DM not implemented in v0 — keep DRY_RUN=true (see docs/runbook.md)",
  );
}

/** Exported for tests that assert LIVE path refuses silently in dry planning. */
export function previewInvitePlan(prospect: Prospect): InvitePlan {
  return planInvite(prospect);
}
