export interface Config {
  port: number;
  dryRun: boolean;
  twentyMode: "mock" | "http";
  twentyApiUrl: string;
  twentyApiKey: string;
  discordWebhookUrl: string;
  seedPath: string;
  dataPath: string;
  maxInvitesPerDay: number;
}

function boolEnv(name: string, fallback: boolean): boolean {
  const v = process.env[name];
  if (v === undefined || v === "") return fallback;
  return ["1", "true", "yes", "on"].includes(v.toLowerCase());
}

export function loadConfig(): Config {
  const twentyMode = (process.env.TWENTY_MODE ?? "mock") as "mock" | "http";
  if (twentyMode !== "mock" && twentyMode !== "http") {
    throw new Error(`Invalid TWENTY_MODE: ${twentyMode}`);
  }
  return {
    port: Number(process.env.PORT ?? "8090"),
    dryRun: boolEnv("DRY_RUN", true),
    twentyMode,
    twentyApiUrl: process.env.TWENTY_API_URL ?? "http://localhost:3000",
    twentyApiKey: process.env.TWENTY_API_KEY ?? "",
    discordWebhookUrl: process.env.DISCORD_WEBHOOK_URL ?? "",
    seedPath: process.env.SEED_PATH ?? "/app/twenty/seed-demo.json",
    dataPath: process.env.DATA_PATH ?? "/app/data/prospects.json",
    maxInvitesPerDay: Number(process.env.MAX_INVITES_PER_DAY ?? "10"),
  };
}
