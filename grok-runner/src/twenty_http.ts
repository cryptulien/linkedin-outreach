import type { Prospect, ProspectStatus } from "./types.js";
import { STATUS_TO_STAGE, stageToStatus } from "./twenty_mapping.js";

interface TwentyPerson {
  id: string;
  name?: { firstName?: string; lastName?: string };
  jobTitle?: string;
  linkedinLink?: { primaryLinkUrl?: string };
  companyId?: string;
  prospectionStage?: string;
  company?: { name?: string };
}

export class TwentyHttp {
  constructor(
    private readonly baseUrl: string,
    private readonly apiKey: string,
  ) {}

  private headers(): Record<string, string> {
    return {
      Authorization: `Bearer ${this.apiKey}`,
      "Content-Type": "application/json",
    };
  }

  async listByStatus(status: ProspectStatus, limit = 50): Promise<Prospect[]> {
    const stage = STATUS_TO_STAGE[status];
    // REST filter
    const url = new URL(`${this.baseUrl.replace(/\/$/, "")}/rest/people`);
    url.searchParams.set("filter", `prospectionStage[eq]:${stage}`);
    url.searchParams.set("limit", String(limit));
    url.searchParams.set("order_by", "createdAt[AscNullsLast]");

    const res = await fetch(url, { headers: this.headers() });
    if (!res.ok) {
      throw new Error(`Twenty list people failed: ${res.status} ${await res.text()}`);
    }
    const body = (await res.json()) as { data?: { people?: TwentyPerson[] } };
    const people = body.data?.people ?? [];
    const out: Prospect[] = [];
    for (const p of people) {
      out.push(await this.toProspect(p));
    }
    return out;
  }

  async get(id: string): Promise<Prospect | undefined> {
    const res = await fetch(`${this.baseUrl.replace(/\/$/, "")}/rest/people/${id}`, {
      headers: this.headers(),
    });
    if (res.status === 404) return undefined;
    if (!res.ok) {
      throw new Error(`Twenty get person failed: ${res.status} ${await res.text()}`);
    }
    const body = (await res.json()) as {
      data?: TwentyPerson | { person?: TwentyPerson };
    };
    const raw = body.data;
    const person =
      raw && "person" in raw ? raw.person : (raw as TwentyPerson | undefined);
    if (!person?.id) return undefined;
    return this.toProspect(person);
  }

  async update(id: string, patch: Partial<Prospect>): Promise<Prospect> {
    if (!id || id === "undefined") {
      throw new Error(`Twenty update called with invalid id: ${id}`);
    }
    const payload: Record<string, unknown> = {};
    if (patch.status) {
      payload.prospectionStage = STATUS_TO_STAGE[patch.status];
    }
    // Only update LinkedIn URL when explicitly provided and non-empty
    if (patch.linkedinUrl && patch.linkedinUrl.startsWith("http")) {
      payload.linkedinLink = {
        primaryLinkUrl: patch.linkedinUrl,
        primaryLinkLabel: "",
        secondaryLinks: [],
      };
    }

    if (Object.keys(payload).length > 0) {
      const res = await fetch(`${this.baseUrl.replace(/\/$/, "")}/rest/people/${id}`, {
        method: "PATCH",
        headers: this.headers(),
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        throw new Error(
          `Twenty patch person failed: ${res.status} ${await res.text()} body=${JSON.stringify(payload)} id=${id}`,
        );
      }
    }

    // Persist DM draft / content as a note when present
    if (patch.messageDraft || patch.messageContent) {
      const markdown = [
        patch.messageDraft ? `## DM draft\n\n${patch.messageDraft}` : "",
        patch.messageContent ? `## DM sent\n\n${patch.messageContent}` : "",
        patch.messageSentAt ? `\n_sentAt: ${patch.messageSentAt}_` : "",
      ]
        .filter(Boolean)
        .join("\n\n");
      await this.upsertOutreachNote(id, markdown);
    }

    const updated = await this.get(id);
    if (!updated) throw new Error(`Person missing after update: ${id}`);
    return {
      ...updated,
      ...patch,
      id,
      status: patch.status ?? updated.status,
    };
  }

  async all(): Promise<Prospect[]> {
    const url = new URL(`${this.baseUrl.replace(/\/$/, "")}/rest/people`);
    url.searchParams.set("limit", "100");
    const res = await fetch(url, { headers: this.headers() });
    if (!res.ok) throw new Error(`Twenty list all failed: ${res.status}`);
    const body = (await res.json()) as { data?: { people?: TwentyPerson[] } };
    const people = body.data?.people ?? [];
    const out: Prospect[] = [];
    for (const p of people) out.push(await this.toProspect(p));
    return out;
  }

  private async toProspect(p: TwentyPerson): Promise<Prospect> {
    let establishment = "";
    if (p.company?.name) {
      establishment = p.company.name;
    } else if (p.companyId) {
      establishment = await this.companyName(p.companyId);
    }
    return {
      id: p.id,
      firstName: p.name?.firstName ?? "",
      lastName: p.name?.lastName ?? "",
      title: p.jobTitle ?? "",
      establishment,
      linkedinUrl: p.linkedinLink?.primaryLinkUrl || undefined,
      status: stageToStatus(p.prospectionStage),
      profileMatch: true,
    };
  }

  private async companyName(companyId: string): Promise<string> {
    const res = await fetch(
      `${this.baseUrl.replace(/\/$/, "")}/rest/companies/${companyId}`,
      { headers: this.headers() },
    );
    if (!res.ok) return "";
    const body = (await res.json()) as { data?: { name?: string } };
    return body.data?.name ?? "";
  }

  private async upsertOutreachNote(personId: string, markdown: string): Promise<void> {
    const res = await fetch(`${this.baseUrl.replace(/\/$/, "")}/rest/notes`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify({
        title: "LinkedIn outreach",
        bodyV2: { markdown },
      }),
    });
    if (!res.ok) {
      // Non-fatal: stage update already applied
      console.warn("Twenty note create failed", res.status, await res.text());
      return;
    }
    const body = (await res.json()) as {
      data?: { id?: string; createNote?: { id?: string }; note?: { id?: string } };
    };
    const noteId =
      body.data?.id ?? body.data?.createNote?.id ?? body.data?.note?.id;
    if (!noteId) return;
    await fetch(`${this.baseUrl.replace(/\/$/, "")}/rest/noteTargets`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify({ noteId, personId }),
    });
  }
}
