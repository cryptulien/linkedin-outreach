import { afterEach, describe, expect, it } from "vitest";
import { assertSubscriptionAuth, GrokAuthError } from "./grok_oauth.js";

describe("assertSubscriptionAuth", () => {
  const prevGrok = process.env.GROK_API_KEY;
  const prevXai = process.env.XAI_API_KEY;

  afterEach(() => {
    if (prevGrok === undefined) delete process.env.GROK_API_KEY;
    else process.env.GROK_API_KEY = prevGrok;
    if (prevXai === undefined) delete process.env.XAI_API_KEY;
    else process.env.XAI_API_KEY = prevXai;
  });

  it("rejects GROK_API_KEY", () => {
    process.env.GROK_API_KEY = "xai-test";
    delete process.env.XAI_API_KEY;
    expect(() => assertSubscriptionAuth()).toThrow(GrokAuthError);
  });

  it("rejects XAI_API_KEY", () => {
    delete process.env.GROK_API_KEY;
    process.env.XAI_API_KEY = "xai-test";
    expect(() => assertSubscriptionAuth()).toThrow(GrokAuthError);
  });

  it("allows OAuth-only env", () => {
    delete process.env.GROK_API_KEY;
    delete process.env.XAI_API_KEY;
    expect(() => assertSubscriptionAuth()).not.toThrow();
  });
});
