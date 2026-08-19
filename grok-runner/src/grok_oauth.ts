import { spawn } from "node:child_process";
import { access } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";

export class GrokAuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GrokAuthError";
  }
}

/** Subscription / OAuth only — refuse paid API-key auth. */
export function assertSubscriptionAuth(): void {
  if (process.env.GROK_API_KEY || process.env.XAI_API_KEY) {
    throw new GrokAuthError(
      "Do not set GROK_API_KEY or XAI_API_KEY. Authenticate with OAuth subscription: `grok login` or `grok login --device-auth`. Credentials live in ~/.grok/auth.json (never commit).",
    );
  }
}

export function grokHome(): string {
  return process.env.GROK_HOME ?? join(homedir(), ".grok");
}

export async function assertGrokOAuthSession(): Promise<void> {
  assertSubscriptionAuth();
  const authPath = join(grokHome(), "auth.json");
  try {
    await access(authPath);
  } catch {
    throw new GrokAuthError(
      `Missing ${authPath}. Run on this host: \`grok login\` (browser) or \`grok login --device-auth\` (headless). Uses your Grok subscription, not an API key.`,
    );
  }
}

export interface GrokHeadlessResult {
  text: string;
  sessionId?: string;
  raw: unknown;
}

/**
 * Run a headless Grok session billed against the OAuth subscription
 * (`~/.grok/auth.json`), not console API keys.
 */
export async function runGrokHeadless(options: {
  prompt: string;
  cwd?: string;
  maxTurns?: number;
  timeoutMs?: number;
}): Promise<GrokHeadlessResult> {
  await assertGrokOAuthSession();
  const bin = process.env.GROK_BIN ?? "grok";
  const maxTurns = String(options.maxTurns ?? 40);
  const args = [
    "-p",
    options.prompt,
    "--output-format",
    "json",
    "--max-turns",
    maxTurns,
  ];

  const env = { ...process.env };
  delete env.GROK_API_KEY;
  delete env.XAI_API_KEY;

  const { stdout, stderr, code } = await spawnCapture(
    bin,
    args,
    {
      cwd: options.cwd,
      env,
      timeoutMs: options.timeoutMs ?? 15 * 60_000,
    },
  );

  if (code !== 0) {
    throw new Error(
      `grok headless exited ${code}: ${stderr.slice(0, 800) || stdout.slice(0, 800)}`,
    );
  }

  const parsed = parseJsonObject(stdout);
  if (parsed && typeof parsed === "object" && "type" in parsed && (parsed as { type: string }).type === "error") {
    const msg = (parsed as { message?: string }).message ?? stdout;
    throw new Error(`grok headless error: ${msg}`);
  }

  const text =
    parsed && typeof parsed === "object" && "text" in parsed
      ? String((parsed as { text: unknown }).text ?? "")
      : stdout.trim();
  const sessionId =
    parsed && typeof parsed === "object" && "sessionId" in parsed
      ? String((parsed as { sessionId: unknown }).sessionId ?? "")
      : undefined;

  return { text, sessionId: sessionId || undefined, raw: parsed ?? stdout };
}

function parseJsonObject(stdout: string): unknown {
  const trimmed = stdout.trim();
  if (!trimmed) return null;
  try {
    return JSON.parse(trimmed);
  } catch {
    // Sometimes logs precede JSON — take last {...} block
    const start = trimmed.lastIndexOf("{");
    const end = trimmed.lastIndexOf("}");
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(trimmed.slice(start, end + 1));
      } catch {
        return null;
      }
    }
    return null;
  }
}

function spawnCapture(
  bin: string,
  args: string[],
  opts: { cwd?: string; env: NodeJS.ProcessEnv; timeoutMs: number },
): Promise<{ stdout: string; stderr: string; code: number | null }> {
  return new Promise((resolve, reject) => {
    const child = spawn(bin, args, {
      cwd: opts.cwd,
      env: opts.env,
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    const timer = setTimeout(() => {
      child.kill("SIGTERM");
      reject(new Error(`grok headless timed out after ${opts.timeoutMs}ms`));
    }, opts.timeoutMs);
    child.stdout.on("data", (c: Buffer) => {
      stdout += c.toString("utf8");
    });
    child.stderr.on("data", (c: Buffer) => {
      stderr += c.toString("utf8");
    });
    child.on("error", (err) => {
      clearTimeout(timer);
      reject(err);
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      resolve({ stdout, stderr, code });
    });
  });
}
