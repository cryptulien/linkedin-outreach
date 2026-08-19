import { describe, expect, it } from "vitest";
import type { Prospect } from "../types.js";
import { planInvite } from "./dry_run.js";

const base: Prospect = {
  id: "x",
  firstName: "A",
  lastName: "B",
  title: "CEO",
  establishment: "Acme",
  status: "non_invite",
};

describe("planInvite", () => {
  it("invites without note on match", () => {
    const plan = planInvite({ ...base, profileMatch: true, linkedinUrl: "https://li/a" });
    expect(plan).toEqual({ kind: "invite", note: "none", url: "https://li/a" });
  });

  it("uses alt search when match fails but alt finds", () => {
    const plan = planInvite({ ...base, profileMatch: false, altSearchFinds: true });
    expect(plan.kind).toBe("invite_alt");
    if (plan.kind === "invite_alt") expect(plan.note).toBe("none");
  });

  it("alerts when profile not found", () => {
    const plan = planInvite({ ...base, profileMatch: false, altSearchFinds: false });
    expect(plan.kind).toBe("alert_profil_non_trouve");
  });
});
