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
    "**ALERTING LinkedIn outreach**",
    `Prospect : ${prospectLabel}`,
    `Raison : ${reason}`,
    `Données : ${data}`,
  ].join("\n");
}

export function formatDigest(
  items: Array<{ index: number; label: string; url?: string; acceptedAt?: string; draft: string }>,
): string {
  const lines = [`**Messages à valider aujourd'hui (${items.length})**`, ""];
  for (const it of items) {
    lines.push(
      `${it.index}. ${it.label}`,
      `Lien : ${it.url ?? "—"}`,
      `Date acceptation : ${it.acceptedAt ?? "—"}`,
      `Message proposé :`,
      it.draft,
      `→ Réponds : « ${it.index} ok » / « ${it.index} modifier : … » / « ${it.index} skip »`,
      "",
    );
  }
  return lines.join("\n");
}
