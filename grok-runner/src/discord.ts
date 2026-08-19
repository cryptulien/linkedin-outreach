export async function postDiscord(
  webhookUrl: string,
  content: string,
): Promise<{ sent: boolean; skipped: boolean }> {
  if (!webhookUrl) {
    return { sent: false, skipped: true };
  }
  const res = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content: content.slice(0, 1900) }),
  });
  if (!res.ok) {
    throw new Error(`Discord webhook failed: ${res.status}`);
  }
  return { sent: true, skipped: false };
}

export function formatAlert(prospectLabel: string, reason: string, data: string): string {
  return [
    "**ALERT — LinkedIn outreach**",
    `Prospect: ${prospectLabel}`,
    `Reason: ${reason}`,
    `Data: ${data}`,
  ].join("\n");
}

export function formatDigest(
  items: Array<{ index: number; label: string; url?: string; acceptedAt?: string; draft: string }>,
): string {
  const lines = [`**Messages to validate today (${items.length})**`, ""];
  for (const it of items) {
    lines.push(
      `${it.index}. ${it.label}`,
      `Link: ${it.url ?? "—"}`,
      `Accepted on: ${it.acceptedAt ?? "—"}`,
      `Proposed message:`,
      it.draft,
      `→ Reply: « ${it.index} ok » / « ${it.index} modifier: … » / « ${it.index} skip »`,
      "",
    );
  }
  return lines.join("\n");
}
