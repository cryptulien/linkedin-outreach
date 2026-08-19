import type { Prospect } from "../types.js";

export type InvitePlan =
  | { kind: "invite"; note: "none"; url: string }
  | { kind: "invite_alt"; note: "none"; url: string }
  | { kind: "alert_profil_non_trouve"; reason: string };

/** Pure decision tree for étape A — no LinkedIn I/O. */
export function planInvite(prospect: Prospect): InvitePlan {
  const match = prospect.profileMatch !== false;
  if (match) {
    return {
      kind: "invite",
      note: "none",
      url: prospect.linkedinUrl ?? `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(prospect.lastName)}`,
    };
  }
  if (prospect.altSearchFinds) {
    return {
      kind: "invite_alt",
      note: "none",
      url: `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(`${prospect.firstName} ${prospect.lastName} ${prospect.establishment}`)}`,
    };
  }
  return {
    kind: "alert_profil_non_trouve",
    reason: `Profil non trouvé pour ${prospect.firstName} ${prospect.lastName} / ${prospect.establishment}`,
  };
}

export function defaultDmTemplate(p: Prospect): string {
  const product =
    process.env.OUTREACH_PRODUCT_BLURB ??
    "Nous aidons les équipes à gagner du temps sur leur organisation au quotidien.";
  return [
    `Bonjour ${p.firstName},`,
    "",
    `Je me permets de vous écrire au sujet de ${p.establishment} (${p.title}).`,
    product,
    "",
    "Seriez-vous ouvert(e) à un échange de 15 minutes ?",
    "",
    "Bien cordialement",
  ].join("\n");
}
