/**
 * OpenRouter API client for AI analysis.
 * Minimal logging: request_id, timestamp, model, latency, success, token counts.
 * No storage of full prompts/responses in production.
 */

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

export interface OpenRouterMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface OpenRouterUsage {
  prompt_tokens?: number;
  completion_tokens?: number;
  total_tokens?: number;
}

export interface OpenRouterResult {
  content: string;
  usage?: OpenRouterUsage;
  model?: string;
  requestId: string;
  latencyMs: number;
  success: boolean;
  error?: string;
}

function getModel(): string {
  return process.env.OPENROUTER_MODEL || "openai/gpt-4o-mini";
}

function logRequest(result: OpenRouterResult): void {
  const payload = {
    request_id: result.requestId,
    timestamp: new Date().toISOString(),
    model: result.model ?? getModel(),
    latency_ms: result.latencyMs,
    success: result.success,
    ...(result.usage && {
      prompt_tokens: result.usage.prompt_tokens,
      completion_tokens: result.usage.completion_tokens,
      total_tokens: result.usage.total_tokens,
    }),
    ...(result.error && { error: result.error }),
  };
  if (process.env.NODE_ENV !== "test") {
    console.info("[OpenRouter]", JSON.stringify(payload));
  }
}

export async function chat(
  messages: OpenRouterMessage[],
  options?: { model?: string }
): Promise<OpenRouterResult> {
  const requestId = crypto.randomUUID();
  const start = Date.now();
  const apiKey = process.env.OPENROUTER_API_KEY;
  const model = options?.model ?? getModel();

  if (!apiKey) {
    const result: OpenRouterResult = {
      content: "",
      requestId,
      latencyMs: Date.now() - start,
      success: false,
      error: "OPENROUTER_API_KEY is not set",
    };
    logRequest(result);
    return result;
  }

  try {
    const res = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
      },
      body: JSON.stringify({
        model,
        messages,
        max_tokens: 4096,
        temperature: 0.4,
      }),
    });

    const latencyMs = Date.now() - start;
    const data = await res.json();

    if (!res.ok) {
      const error = data?.error?.message || res.statusText || "Request failed";
      const result: OpenRouterResult = {
        content: "",
        requestId,
        latencyMs,
        success: false,
        error,
      };
      logRequest(result);
      return result;
    }

    const content = data?.choices?.[0]?.message?.content ?? "";
    const usage = data?.usage
      ? {
          prompt_tokens: data.usage.prompt_tokens,
          completion_tokens: data.usage.completion_tokens,
          total_tokens: data.usage.total_tokens,
        }
      : undefined;

    const result: OpenRouterResult = {
      content,
      usage,
      model: data?.model ?? model,
      requestId,
      latencyMs,
      success: true,
    };
    logRequest(result);
    return result;
  } catch (e) {
    const latencyMs = Date.now() - start;
    const error = e instanceof Error ? e.message : String(e);
    const result: OpenRouterResult = {
      content: "",
      requestId,
      latencyMs,
      success: false,
      error,
    };
    logRequest(result);
    return result;
  }
}
