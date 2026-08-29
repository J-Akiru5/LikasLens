/**
 * AI Gateway — orchestrates communication between the Backend API and AI providers.
 *
 * This module is SERVER-SIDE ONLY. It must never be imported by client components.
 *
 * Architecture:
 *   Backend API  →  AI Gateway  →  Primary AI (e.g. Render)
 *                                →  Fallback AI (e.g. Local)
 *
 * The gateway handles:
 * - Automatic failover (primary → fallback)
 * - Health checks with configurable TTL caching
 * - Request timeouts
 * - Transparent provider switching (frontend never knows which AI responded)
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AIGatewayConfig {
  /** Primary AI service URL (e.g. Render deployment) */
  primaryUrl: string;
  /** Fallback AI service URL (e.g. local instance) */
  fallbackUrl: string;
  /** Request timeout in milliseconds */
  timeoutMs: number;
  /** Health check cache TTL in milliseconds */
  healthCacheTtlMs: number;
  /** Optional service-to-service API key (sent as X-API-Key) */
  apiKey?: string;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ChatRequest {
  message: string;
  locale?: string;
  ticket_id?: string;
  conversation_id?: string;
  messages?: ChatMessage[];
  /** Supabase access token — forwarded as Authorization: Bearer <token> */
  authToken?: string;
}

export interface ChatResponse {
  reply: string;
  success: boolean;
  context_mode?: string;
  conversation_id?: string;
  error?: string;
}

export interface HealthStatus {
  healthy: boolean;
  lastChecked: number;
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

/**
 * Create an AIGateway instance from environment variables.
 * Reads: RENDER_AI_URL, LOCAL_AI_URL, AI_TIMEOUT_MS, AI_HEALTH_CACHE_TTL
 */
export function createAIGatewayFromEnv(): AIGateway {
  const primaryUrl = process.env.RENDER_AI_URL || "";
  const fallbackUrl = process.env.LOCAL_AI_URL || "http://127.0.0.1:8001";
  const timeoutMs = parseInt(process.env.AI_TIMEOUT_MS || "5000", 10);
  const healthCacheTtlMs = parseInt(
    process.env.AI_HEALTH_CACHE_TTL || "30000",
    10
  );
  const apiKey = process.env.AI_SERVICE_API_KEY || undefined;

  return new AIGateway({
    primaryUrl,
    fallbackUrl,
    timeoutMs,
    healthCacheTtlMs,
    apiKey,
  });
}

// ---------------------------------------------------------------------------
// AIGateway class
// ---------------------------------------------------------------------------

export class AIGateway {
  private config: AIGatewayConfig;
  private healthCache: Map<string, HealthStatus> = new Map();

  constructor(config: AIGatewayConfig) {
    this.config = config;
  }

  /**
   * Send a chat request through the gateway.
   * Tries primary first, falls back to secondary on failure.
   */
  async chat(request: ChatRequest): Promise<ChatResponse> {
    const primaryHealthy = await this.isHealthy(this.config.primaryUrl);

    if (primaryHealthy) {
      try {
        return await this.forwardRequest(this.config.primaryUrl, request);
      } catch (err) {
        console.warn("[ai-gateway] Primary failed, trying fallback:", err);
        this.markUnhealthy(this.config.primaryUrl);
      }
    }

    // Fallback
    return this.forwardRequest(this.config.fallbackUrl, request);
  }

  /**
   * Check health of a specific AI endpoint.
   * Results are cached for healthCacheTtlMs.
   */
  async isHealthy(url: string): Promise<boolean> {
    if (!url) return false;

    const cached = this.healthCache.get(url);
    if (cached) {
      const age = Date.now() - cached.lastChecked;
      if (age < this.config.healthCacheTtlMs) {
        return cached.healthy;
      }
    }

    const healthy = await this.pingHealth(url);
    this.healthCache.set(url, { healthy, lastChecked: Date.now() });
    return healthy;
  }

  /**
   * Force-refresh health status for a URL (used after a failed request).
   */
  markUnhealthy(url: string): void {
    this.healthCache.set(url, { healthy: false, lastChecked: Date.now() });
  }

  /**
   * Get current health status for all configured endpoints.
   */
  async getHealthReport(): Promise<
    Record<string, { healthy: boolean; url: string }>
  > {
    return {
      primary: {
        healthy: await this.isHealthy(this.config.primaryUrl),
        url: this.config.primaryUrl,
      },
      fallback: {
        healthy: await this.isHealthy(this.config.fallbackUrl),
        url: this.config.fallbackUrl,
      },
    };
  }

  // ---------------------------------------------------------------------------
  // Private
  // ---------------------------------------------------------------------------

  private async pingHealth(url: string): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 3000);

      const headers: Record<string, string> = {};
      if (this.config.apiKey) {
        headers["X-API-Key"] = this.config.apiKey;
      }

      const res = await fetch(`${url}/health`, {
        signal: controller.signal,
        method: "GET",
        headers,
      });
      clearTimeout(timer);
      return res.ok;
    } catch {
      return false;
    }
  }

  private async forwardRequest(
    url: string,
    request: ChatRequest
  ): Promise<ChatResponse> {
    const controller = new AbortController();
    const timer = setTimeout(
      () => controller.abort(),
      this.config.timeoutMs
    );

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    // User identity — forwarded from Supabase session in the calling route
    if (request.authToken) {
      headers["Authorization"] = `Bearer ${request.authToken}`;
    }

    // Service-to-service authentication
    if (this.config.apiKey) {
      headers["X-API-Key"] = this.config.apiKey;
    }

    try {
      const { authToken: _authToken, ...body } = request;
      const res = await fetch(`${url}/api/v1/liksi/chat`, {
        method: "POST",
        headers,
        signal: controller.signal,
        body: JSON.stringify(body),
      });

      clearTimeout(timer);

      if (!res.ok) {
        throw new Error(`AI service returned ${res.status}`);
      }

      const data = await res.json();
      return {
        reply: data.reply || "No response from AI service.",
        success: data.success ?? true,
        context_mode: data.context_mode,
        conversation_id: data.conversation_id,
      };
    } catch (err) {
      clearTimeout(timer);
      throw err;
    }
  }
}
