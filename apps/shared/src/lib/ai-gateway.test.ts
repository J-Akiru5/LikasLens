/**
 * AI Gateway header construction tests.
 *
 * Verifies that forwardRequest() correctly sets:
 * - Authorization header when authToken is provided
 * - X-API-Key header when apiKey is configured
 * - Neither header when neither is configured
 * - authToken is stripped from the JSON body before sending
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { AIGateway, type AIGatewayConfig } from "./ai-gateway";

describe("AIGateway header construction", () => {
  const mockConfig: AIGatewayConfig = {
    primaryUrl: "http://localhost:8001",
    fallbackUrl: "http://localhost:8002",
    timeoutMs: 5000,
    healthCacheTtlMs: 30000,
    apiKey: "test-api-key-123",
  };

  let fetchSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    // Mock fetch to capture the call options
    fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ reply: "ok", success: true }),
    });
    vi.stubGlobal("fetch", fetchSpy);

    // Also mock the health check to return healthy so we hit forwardRequest
    // We need the primary to be healthy, so mock fetch to return ok for health checks too
    // The gateway caches health, so we need to handle both health and chat calls
    fetchSpy.mockImplementation(async (url: string) => {
      if (url.endsWith("/health")) {
        return { ok: true };
      }
      // For chat requests, return success
      return {
        ok: true,
        json: () => Promise.resolve({ reply: "ok", success: true, context_mode: "citizen" }),
      };
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("sends both X-API-Key and Authorization when both are configured", async () => {
    const gateway = new AIGateway(mockConfig);

    await gateway.chat({
      message: "hello",
      authToken: "my-supabase-token",
    });

    // Find the chat request call (not the health check)
    const chatCall = fetchSpy.mock.calls.find(
      ([url]: [string]) => url.includes("/api/v1/liksi/chat")
    );
    expect(chatCall).toBeDefined();

    const [, options] = chatCall;
    expect(options.headers["X-API-Key"]).toBe("test-api-key-123");
    expect(options.headers["Authorization"]).toBe("Bearer my-supabase-token");
  });

  it("sends only X-API-Key when no authToken is passed", async () => {
    const gateway = new AIGateway(mockConfig);

    await gateway.chat({
      message: "hello",
    });

    const chatCall = fetchSpy.mock.calls.find(
      ([url]: [string]) => url.includes("/api/v1/liksi/chat")
    );
    expect(chatCall).toBeDefined();

    const [, options] = chatCall;
    expect(options.headers["X-API-Key"]).toBe("test-api-key-123");
    expect(options.headers["Authorization"]).toBeUndefined();
  });

  it("sends only Authorization when no apiKey is configured", async () => {
    const configWithoutKey: AIGatewayConfig = {
      primaryUrl: "http://localhost:8001",
      fallbackUrl: "http://localhost:8002",
      timeoutMs: 5000,
      healthCacheTtlMs: 30000,
      // no apiKey
    };
    const gateway = new AIGateway(configWithoutKey);

    await gateway.chat({
      message: "hello",
      authToken: "my-token",
    });

    const chatCall = fetchSpy.mock.calls.find(
      ([url]: [string]) => url.includes("/api/v1/liksi/chat")
    );
    expect(chatCall).toBeDefined();

    const [, options] = chatCall;
    expect(options.headers["X-API-Key"]).toBeUndefined();
    expect(options.headers["Authorization"]).toBe("Bearer my-token");
  });

  it("strips authToken from the JSON body before sending", async () => {
    const gateway = new AIGateway(mockConfig);

    await gateway.chat({
      message: "hello",
      locale: "fil",
      authToken: "secret-token",
    });

    const chatCall = fetchSpy.mock.calls.find(
      ([url]: [string]) => url.includes("/api/v1/liksi/chat")
    );
    expect(chatCall).toBeDefined();

    const [, options] = chatCall;
    const body = JSON.parse(options.body);

    // authToken must NOT be in the body
    expect(body.authToken).toBeUndefined();
    // But other fields must be present
    expect(body.message).toBe("hello");
    expect(body.locale).toBe("fil");
  });

  it("sends neither header when no apiKey and no authToken", async () => {
    const configWithoutKey: AIGatewayConfig = {
      primaryUrl: "http://localhost:8001",
      fallbackUrl: "http://localhost:8002",
      timeoutMs: 5000,
      healthCacheTtlMs: 30000,
    };
    const gateway = new AIGateway(configWithoutKey);

    await gateway.chat({
      message: "hello",
    });

    const chatCall = fetchSpy.mock.calls.find(
      ([url]: [string]) => url.includes("/api/v1/liksi/chat")
    );
    expect(chatCall).toBeDefined();

    const [, options] = chatCall;
    expect(options.headers["X-API-Key"]).toBeUndefined();
    expect(options.headers["Authorization"]).toBeUndefined();
  });
});
