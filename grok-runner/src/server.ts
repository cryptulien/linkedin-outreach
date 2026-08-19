import { pathToFileURL } from "node:url";
import Fastify from "fastify";
import { loadConfig } from "./config.js";
import { assertSubscriptionAuth } from "./grok_oauth.js";
import { runAcceptances } from "./jobs/acceptances.js";
import { runInvites } from "./jobs/invites.js";
import { runPropose, runSend } from "./jobs/messages.js";
import { TwentyClient } from "./twenty_client.js";
import type { Prospect, SendBody } from "./types.js";

export async function buildServer(config = loadConfig()) {
  if (!config.dryRun) {
    assertSubscriptionAuth();
  }
  const app = Fastify({ logger: true });
  const twenty = new TwentyClient(config);
  await twenty.init();

  app.get("/healthz", async () => ({
    ok: true,
    dry_run: config.dryRun,
    twenty_mode: config.twentyMode,
    grok_auth: "oauth_subscription",
  }));

  app.get("/prospects", async () => ({
    ok: true,
    prospects: await twenty.all(),
  }));

  app.get<{ Querystring: { status?: string; limit?: string } }>(
    "/prospects/by-status",
    async (req) => {
      const status = (req.query.status ?? "non_invite") as Prospect["status"];
      const limit = req.query.limit ? Number(req.query.limit) : undefined;
      return {
        ok: true,
        prospects: await twenty.listByStatus(status, limit),
      };
    },
  );

  app.post<{ Body: { prospects?: Prospect[] } }>("/jobs/invites", async (req) => {
    const prospects =
      req.body?.prospects ??
      (await twenty.listByStatus("non_invite", config.maxInvitesPerDay));
    return runInvites(config, twenty, prospects);
  });

  app.post<{ Body: { prospects?: Prospect[] } }>("/jobs/acceptances", async (req) => {
    const prospects =
      req.body?.prospects ?? (await twenty.listByStatus("invite_envoye", 20));
    return runAcceptances(config, twenty, prospects);
  });

  app.post<{ Body: { prospects?: Prospect[] } }>("/jobs/messages/propose", async (req) => {
    let prospects = req.body?.prospects;
    if (!prospects) {
      const enRel = await twenty.listByStatus("en_relation");
      prospects = enRel;
    }
    return runPropose(config, twenty, prospects);
  });

  app.post<{ Body: SendBody }>("/jobs/messages/send", async (req) => {
    return runSend(config, twenty, req.body);
  });

  return { app, twenty, config };
}

async function main() {
  const config = loadConfig();
  const { app } = await buildServer(config);
  await app.listen({ port: config.port, host: "0.0.0.0" });
}

const entry = process.argv[1] ? pathToFileURL(process.argv[1]).href : "";
if (import.meta.url === entry) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
