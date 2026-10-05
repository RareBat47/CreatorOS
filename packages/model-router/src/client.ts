import type { z } from "zod";
import type {
  TargetEnvironment,
  ModelClientConfig,
  ChatCompletionRequest,
  ChatCompletionResponse,
  ChatMessage,
} from "./types.js";

export const DEV_ANTIGRAVITY_DEFAULT_URL = "http://127.0.0.1:8999/v1";
export const PROD_DASHSCOPE_DEFAULT_URL = "https://dashscope.aliyuncs.com/compatible-mode/v1";

export class ModelClient {
  private readonly environment: TargetEnvironment;
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly headers: Record<string, string>;
  private readonly timeoutMs: number;
  private readonly fetchFn: typeof fetch;

  constructor(config: ModelClientConfig = {}) {
    this.environment = config.environment ?? "dev";

    // 1. Resolve Base URL
    if (config.baseUrl) {
      this.baseUrl = config.baseUrl.replace(/\/+$/, "");
    } else if (this.environment === "dev") {
      this.baseUrl = (
        process.env.ANTIGRAVITY_BASE_URL || DEV_ANTIGRAVITY_DEFAULT_URL
      ).replace(/\/+$/, "");
    } else {
      this.baseUrl = (
        process.env.DASHSCOPE_BASE_URL ||
        process.env.OPENAI_BASE_URL ||
        PROD_DASHSCOPE_DEFAULT_URL
      ).replace(/\/+$/, "");
    }

    // 2. Resolve API Key
    if (config.apiKey !== undefined) {
      this.apiKey = config.apiKey;
    } else if (this.environment === "dev") {
      this.apiKey = process.env.ANTIGRAVITY_API_KEY || "antigravity-local";
    } else {
      this.apiKey =
        process.env.DASHSCOPE_API_KEY ||
        process.env.OPENAI_API_KEY ||
        process.env.ANTHROPIC_API_KEY ||
        "";
    }

    this.headers = config.headers || {};
    this.timeoutMs = config.timeoutMs ?? 60_000;
    this.fetchFn = config.fetch || globalThis.fetch.bind(globalThis);
  }

  public getEnvironment(): TargetEnvironment {
    return this.environment;
  }

  public getBaseUrl(): string {
    return this.baseUrl;
  }

  public getApiKey(): string {
    return this.apiKey;
  }

  /**
   * Raw OpenAI/DashScope compatible chat completions endpoint
   */
  public async chatCompletion(
    request: ChatCompletionRequest,
    customTimeoutMs?: number
  ): Promise<ChatCompletionResponse> {
    const url = `${this.baseUrl}/chat/completions`;
    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(),
      customTimeoutMs ?? this.timeoutMs
    );

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...this.headers,
    };

    if (this.apiKey) {
      headers["Authorization"] = `Bearer ${this.apiKey}`;
    }

    try {
      const response = await this.fetchFn(url, {
        method: "POST",
        headers,
        body: JSON.stringify(request),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => "");
        throw new Error(
          `ModelClient HTTP error ${response.status} (${response.statusText}): ${errorText}`
        );
      }

      const json = (await response.json()) as ChatCompletionResponse;
      return json;
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") {
        throw new Error(
          `ModelClient request timed out after ${customTimeoutMs ?? this.timeoutMs}ms`
        );
      }
      throw err;
    } finally {
      clearTimeout(timeout);
    }
  }

  /**
   * Helper to send ChatMessages and return the content string of the assistant's response
   */
  public async createChatCompletion(
    model: string,
    messages: ChatMessage[],
    options?: {
      temperature?: number;
      maxTokens?: number;
      jsonMode?: boolean;
      timeoutMs?: number;
    }
  ): Promise<string> {
    const response = await this.chatCompletion(
      {
        model,
        messages,
        temperature: options?.temperature,
        max_tokens: options?.maxTokens,
        response_format: options?.jsonMode ? { type: "json_object" } : undefined,
      },
      options?.timeoutMs
    );

    const choice = response.choices?.[0];
    if (!choice || choice.message.content === null) {
      throw new Error(`Model returned empty completion for model ${model}`);
    }

    return choice.message.content;
  }

  /**
   * Helper to parse JSON output with markdown stripping and optional Zod schema validation
   */
  public async createJsonCompletion<T>(
    model: string,
    messages: ChatMessage[],
    schema?: z.ZodType<T, z.ZodTypeDef, any>,
    options?: {
      temperature?: number;
      maxTokens?: number;
      timeoutMs?: number;
    }
  ): Promise<T> {
    const rawContent = await this.createChatCompletion(model, messages, {
      ...options,
      jsonMode: true,
    });

    const cleaned = cleanJsonString(rawContent);
    let parsed: unknown;
    try {
      parsed = JSON.parse(cleaned);
    } catch (parseErr) {
      throw new Error(
        `Failed to parse model response as JSON: ${parseErr instanceof Error ? parseErr.message : String(parseErr)}\nRaw text:\n${rawContent}`
      );
    }

    if (schema) {
      const validation = schema.safeParse(parsed);
      if (!validation.success) {
        throw new Error(
          `Model response JSON failed schema validation:\n${JSON.stringify(validation.error.format(), null, 2)}\nRaw text:\n${rawContent}`
        );
      }
      return validation.data;
    }

    return parsed as T;
  }
}

/**
 * Strips markdown code block wrappers (e.g. ```json ... ```) from model responses
 */
export function cleanJsonString(raw: string): string {
  const trimmed = raw.trim();
  // Check for ```json ... ``` or ``` ... ```
  const codeBlockRegex = /^```(?:json)?\s*([\s\S]*?)\s*```$/i;
  const match = trimmed.match(codeBlockRegex);
  if (match && match[1]) {
    return match[1].trim();
  }
  return trimmed;
}
