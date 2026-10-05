import type { z } from "zod";
import { ModelClient, cleanJsonString } from "./client.js";
import type {
  RoutingTask,
  TaskRoutingConfig,
  TaskRoutingTable,
  ModelRouterConfig,
  TaskExecutionOptions,
  ChatMessage,
} from "./types.js";

export const DEFAULT_ROUTING_TABLE: TaskRoutingTable = {
  strategy: {
    primaryModel: "qwen/qwen3.8-max:free",
    fallbackModels: [
      "qwen/qwen3.7-max:free",
      "mistralai/mistral-large-2512",
      "qwen/qwen3.6-max-preview:free",
      "qwen/qwen3-max:free",
    ],
    defaultTemperature: 0.7,
    systemPromptRole:
      "You are the chief content strategist for a professional creator. Analyze the creator profile, audience, past content, and business goals. Develop a specific content strategy that is differentiated, measurable, and realistic for the creator's production capacity. Avoid generic advice.",
  },
  brainstorm: {
    primaryModel: "qwen/qwen3.7-flash:free",
    fallbackModels: [
      "qwen/qwen3.5-flash:free",
      "qwen/qwen3.8-omni-flash:free",
      "mistralai/mistral-small-2603",
      "qwen/qwen3-omni-flash:free",
    ],
    defaultTemperature: 0.85,
    systemPromptRole:
      "You are an elite short-form content brainstorming engine specialized in high-converting hooks, audience psychology, angles, and viral mechanics. Generate creative, varied, and arresting options.",
  },
  scriptwriting: {
    primaryModel: "qwen/qwen3.7-plus:free",
    fallbackModels: [
      "mistralai/mistral-medium-3.5",
      "qwen/qwen3.6-plus:free",
      "qwen/qwen3.5-plus:free",
      "mistralai/mistral-large-2512",
    ],
    defaultTemperature: 0.7,
    systemPromptRole:
      "You are an expert short-form video scriptwriter and editor. You craft punchy, natural, conversational narratives with airtight pacing, emotional resonance, and high-retention transitions.",
  },
  multimodal: {
    primaryModel: "qwen/qwen3-vl-plus:free",
    fallbackModels: [
      "qwen/qwen3.5-omni-plus:free",
      "qwen/qwen3.8-omni-flash:free",
      "qwen/qwen3.5-omni-flash:free",
    ],
    defaultTemperature: 0.3,
    systemPromptRole:
      "You are a multimodal video and visual aesthetic analyst reviewing visual composition, framing, pacing, captions, and creator style.",
  },
  critique: {
    primaryModel: "qwen/qwen3.6-max-preview:free",
    fallbackModels: [
      "qwen/qwen3.8-max:free",
      "mistralai/mistral-large-2512",
      "qwen/qwen3.7-plus:free",
      "qwen/qwen3-max:free",
    ],
    defaultTemperature: 0.2,
    systemPromptRole:
      "You are a rigorous content quality reviewer and brand integrity critic. Evaluate retention curve, clarity, originality, voice consistency, forbidden phrase compliance, and brand fit.",
  },
  validation: {
    primaryModel: "qwen/qwen3.6-27b:free",
    fallbackModels: [
      "mistralai/codestral-2508",
      "qwen/qwen3.6-35b-a3b:free",
      "qwen/qwen3.5-flash:free",
      "qwen/qwen3.7-flash:free",
    ],
    defaultTemperature: 0.1,
    systemPromptRole:
      "You are an exacting structured data validator and scene timing engineer. Ensure schema completeness, frame budgets, CTA presence, and strict JSON compliance.",
  },
};

export const DEV_DEFAULT_ROUTING_TABLE: TaskRoutingTable = {
  strategy: {
    primaryModel: "gemini-3.8-flash-high",
    fallbackModels: ["gemini-3.7-flash-medium", "gemini-3.6-flash-medium", "gemini-3.1-pro-low"],
    defaultTemperature: 0.7,
    systemPromptRole:
      "You are the chief content strategist for a professional creator. Analyze the creator profile, audience, past content, and business goals. Develop a specific content strategy that is differentiated, measurable, and realistic for the creator's production capacity. Avoid generic advice.",
  },
  brainstorm: {
    primaryModel: "gemini-3.8-flash-high",
    fallbackModels: ["gemini-3.7-flash-medium", "gemini-3.6-flash-medium"],
    defaultTemperature: 0.85,
    systemPromptRole:
      "You are an elite short-form content brainstorming engine specialized in high-converting hooks, audience psychology, angles, and viral mechanics. Generate creative, varied, and arresting options.",
  },
  scriptwriting: {
    primaryModel: "gemini-3.8-flash-high",
    fallbackModels: ["gemini-3.7-flash-medium", "gemini-3.1-pro-low"],
    defaultTemperature: 0.7,
    systemPromptRole:
      "You are an expert short-form video scriptwriter and editor. You craft punchy, natural, conversational narratives with airtight pacing, emotional resonance, and high-retention transitions.",
  },
  multimodal: {
    primaryModel: "gemini-3.8-flash-high",
    fallbackModels: ["gemini-3.7-flash-medium", "gemini-3.6-flash-medium"],
    defaultTemperature: 0.3,
    systemPromptRole:
      "You are a multimodal video and visual aesthetic analyst reviewing visual composition, framing, pacing, captions, and creator style.",
  },
  critique: {
    primaryModel: "gemini-3.8-flash-high",
    fallbackModels: ["gemini-3.1-pro-low", "gemini-3.7-flash-medium"],
    defaultTemperature: 0.2,
    systemPromptRole:
      "You are a rigorous content quality reviewer and brand integrity critic. Evaluate retention curve, clarity, originality, voice consistency, forbidden phrase compliance, and brand fit.",
  },
  validation: {
    primaryModel: "gemini-3.8-flash-high",
    fallbackModels: ["gemini-3.7-flash-medium", "gemini-3.6-flash-medium"],
    defaultTemperature: 0.1,
    systemPromptRole:
      "You are an exacting structured data validator and scene timing engineer. Ensure schema completeness, frame budgets, CTA presence, and strict JSON compliance.",
  },
};

export class ModelRouter {
  public readonly client: ModelClient;
  private readonly routingTable: TaskRoutingTable;

  constructor(config: ModelRouterConfig = {}, client?: ModelClient) {
    this.client = client ?? new ModelClient(config.clientConfig);

    // Initialize routing table with defaults based on environment
    const isDev = this.client.getEnvironment() === "dev";
    this.routingTable = isDev
      ? { ...DEV_DEFAULT_ROUTING_TABLE }
      : { ...DEFAULT_ROUTING_TABLE };

    if (config.customRouting) {
      for (const [taskKey, customConfig] of Object.entries(config.customRouting) as Array<[RoutingTask, Partial<TaskRoutingConfig>]>) {
        const base = this.routingTable[taskKey];
        if (base && customConfig) {
          this.routingTable[taskKey] = {
            ...base,
            ...customConfig,
          };
        }
      }
    }

    if (config.modelOverrides) {
      for (const [taskKey, modelOverride] of Object.entries(config.modelOverrides) as Array<[RoutingTask, string]>) {
        if (modelOverride && this.routingTable[taskKey]) {
          this.routingTable[taskKey] = {
            ...this.routingTable[taskKey],
            primaryModel: modelOverride,
          };
        }
      }
    }
  }

  public getRoutingConfig(task: RoutingTask): TaskRoutingConfig {
    return this.routingTable[task];
  }

  public getModelForTask(task: RoutingTask): string {
    return this.routingTable[task].primaryModel;
  }

  public getAllRoutingConfigs(): TaskRoutingTable {
    return { ...this.routingTable };
  }

  /**
   * Executes a task by routing to the appropriate model, with fallback support on failure.
   */
  public async executeTask(
    task: RoutingTask,
    promptOrMessages: string | ChatMessage[],
    options?: TaskExecutionOptions
  ): Promise<string> {
    const config = this.getRoutingConfig(task);
    const primaryModel = options?.model || config.primaryModel;
    const candidateModels = [
      primaryModel,
      ...config.fallbackModels.filter((m) => m !== primaryModel),
    ];

    const temperature = options?.temperature ?? config.defaultTemperature;
    const maxTokens = options?.maxTokens ?? config.maxTokens;
    const systemPrompt = options?.systemPromptOverride || config.systemPromptRole;

    const messages: ChatMessage[] = Array.isArray(promptOrMessages)
      ? promptOrMessages
      : [
          { role: "system", content: systemPrompt },
          { role: "user", content: promptOrMessages },
        ];

    let lastError: unknown = null;

    for (const model of candidateModels) {
      try {
        const result = await this.client.createChatCompletion(model, messages, {
          temperature,
          maxTokens,
          jsonMode: options?.jsonMode,
          timeoutMs: options?.timeoutMs,
        });
        return result;
      } catch (err) {
        lastError = err;
        // Proceed to next fallback model
      }
    }

    throw new Error(
      `Failed to execute task '${task}' across all models [${candidateModels.join(", ")}]. Last error: ${lastError instanceof Error ? lastError.message : String(lastError)}`
    );
  }

  /**
   * Executes a task and enforces JSON parsing and optional Zod schema validation.
   */
  public async executeTaskJson<T>(
    task: RoutingTask,
    promptOrMessages: string | ChatMessage[],
    schema?: z.ZodType<T, z.ZodTypeDef, any>,
    options?: TaskExecutionOptions
  ): Promise<T> {
    const rawContent = await this.executeTask(task, promptOrMessages, {
      ...options,
      jsonMode: true,
    });

    const cleaned = cleanJsonString(rawContent);
    let parsed: unknown;
    try {
      parsed = JSON.parse(cleaned);
    } catch (parseErr) {
      throw new Error(
        `Failed to parse response of task '${task}' as JSON: ${parseErr instanceof Error ? parseErr.message : String(parseErr)}\nRaw text:\n${rawContent}`
      );
    }

    if (schema) {
      const validation = schema.safeParse(parsed);
      if (!validation.success) {
        throw new Error(
          `Response for task '${task}' failed schema validation:\n${JSON.stringify(validation.error.format(), null, 2)}\nRaw text:\n${rawContent}`
        );
      }
      return validation.data;
    }

    return parsed as T;
  }
}
