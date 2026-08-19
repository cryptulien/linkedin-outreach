export type ProspectStatus =
  | "non_invite"
  | "invite_envoye"
  | "en_relation"
  | "message_a_valider"
  | "message_envoye"
  | "alerting_profil_non_trouve"
  | "alerting_autre";

export interface Prospect {
  id: string;
  firstName: string;
  lastName: string;
  title: string;
  establishment: string;
  linkedinUrl?: string;
  status: ProspectStatus;
  inviteSentAt?: string;
  acceptedAt?: string;
  messageDraft?: string;
  messageSentAt?: string;
  messageContent?: string;
  /** When false, dry-run simulates profile-not-found path */
  profileMatch?: boolean;
  /** When true with profileMatch false, alt search finds a profile */
  altSearchFinds?: boolean;
}

export interface JobResult {
  id: string;
  action: string;
  status: ProspectStatus;
  error?: string;
  dryRunDetail?: string;
}

export interface JobResponse {
  ok: boolean;
  dry_run: boolean;
  results: JobResult[];
}

export interface ProposeBody {
  prospects: Prospect[];
}

export interface SendBody {
  prospect_id: string;
  decision: "ok" | "skip" | "modifier";
  text?: string;
}
