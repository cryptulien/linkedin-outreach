import type { ProspectStatus } from "./types.js";

/** SuperPagr Twenty `Person.prospectionStage` ↔ kit status */
export const STAGE_TO_STATUS: Record<string, ProspectStatus> = {
  A_CONTACTER: "non_invite",
  INVITATION_ENVOYEE: "invite_envoye",
  CONNEXION_ACCEPTEE: "en_relation",
  CONTACTE: "message_a_valider",
  MAIL_ENVOYE: "message_envoye",
  REPONSE_RECUE: "message_envoye",
  GAGNE: "message_envoye",
  PERDU: "alerting_autre",
};

export const STATUS_TO_STAGE: Record<ProspectStatus, string> = {
  non_invite: "A_CONTACTER",
  invite_envoye: "INVITATION_ENVOYEE",
  en_relation: "CONNEXION_ACCEPTEE",
  message_a_valider: "CONTACTE",
  message_envoye: "MAIL_ENVOYE",
  alerting_profil_non_trouve: "PERDU",
  alerting_autre: "PERDU",
};

export function stageToStatus(stage: string | null | undefined): ProspectStatus {
  if (!stage) return "non_invite";
  return STAGE_TO_STATUS[stage] ?? "non_invite";
}
