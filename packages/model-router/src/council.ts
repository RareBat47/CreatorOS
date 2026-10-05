import {
  SceneSpecSchema,
  type SceneSpec,
  type CreatorProfile,
} from "@creatoros/scene-schema";
import type { StableMemory, MemoryRetrievalResult } from "@creatoros/creator-memory";
import { ModelRouter } from "./router.js";
import {
  BrainstormCouncilResultSchema,
  DraftNarrativeSchema,
  CouncilCritiqueResultSchema,
  type BrainstormCouncilResult,
  type DraftNarrative,
  type CouncilCritiqueResult,
  type CouncilSceneSpecResult,
  type CouncilPipelineInput,
  type CouncilPipelineOutput,
  type SceneSpecValidationReport,
  type HookVariant,
} from "./types.js";

export interface MemoryContextExtracted {
  name?: string;
  tone?: string[];
  audience?: string;
  pillars?: string[];
  forbiddenPhrases: string[];
  bannedWords: string[];
  brandRules: string[];
  favoriteHooks: string[];
  sampleScripts: string[];
}

export function extractMemoryContext(
  memory?: StableMemory | MemoryRetrievalResult | unknown,
  profile?: CreatorProfile
): MemoryContextExtracted {
  const result: MemoryContextExtracted = {
    forbiddenPhrases: [],
    bannedWords: [],
    brandRules: [],
    favoriteHooks: [],
    sampleScripts: [],
  };

  if (profile) {
    result.name = profile.name;
    if (typeof profile.audience === "string") {
      result.audience = profile.audience;
    } else if (profile.audience && typeof profile.audience === "object") {
      result.audience = profile.audience.target;
    }

    if (profile.tone) {
      result.tone = Array.isArray(profile.tone) ? profile.tone : [profile.tone];
    }
    if (profile.pillars) {
      result.pillars = profile.pillars.map((p: string | { name: string }) =>
        typeof p === "string" ? p : p.name
      );
    }
    if (profile.bannedWords) {
      result.bannedWords.push(...profile.bannedWords);
    }
    if (profile.forbiddenPhrases) {
      result.forbiddenPhrases.push(...profile.forbiddenPhrases);
    }
    if (profile.favoriteHooks) {
      result.favoriteHooks.push(...profile.favoriteHooks);
    }
  }

  if (memory && typeof memory === "object") {
    const mem = memory as Record<string, unknown>;

    // Handle StableMemory identity
    if ("identity" in mem && typeof mem.identity === "object" && mem.identity !== null) {
      const identity = mem.identity as Record<string, unknown>;
      result.name = result.name || (identity.name as string);
      if (identity.audience) {
        if (typeof identity.audience === "string") {
          result.audience = result.audience || identity.audience;
        } else if (typeof identity.audience === "object" && identity.audience !== null) {
          const aud = identity.audience as Record<string, unknown>;
          result.audience = result.audience || (aud.target as string);
        }
      }
    }

    // Handle voice
    if ("voice" in mem && typeof mem.voice === "object" && mem.voice !== null) {
      const voice = mem.voice as Record<string, unknown>;
      if (voice.tone) {
        result.tone = Array.isArray(voice.tone)
          ? (voice.tone as string[])
          : [voice.tone as string];
      }
      if (Array.isArray(voice.forbiddenPhrases)) {
        result.forbiddenPhrases.push(...(voice.forbiddenPhrases as string[]));
      }
    }

    // Handle forbidden phrases & banned words
    if (Array.isArray(mem.bannedWords)) {
      result.bannedWords.push(...(mem.bannedWords as string[]));
    }
    if (Array.isArray(mem.forbiddenPhrases)) {
      result.forbiddenPhrases.push(...(mem.forbiddenPhrases as string[]));
    }

    // Handle brand rules
    if (Array.isArray(mem.brandRules)) {
      for (const rule of mem.brandRules) {
        if (typeof rule === "string") {
          result.brandRules.push(rule);
        } else if (typeof rule === "object" && rule !== null && "rule" in rule) {
          result.brandRules.push((rule as { rule: string }).rule);
        }
      }
    }

    // Handle favorite or approved hooks
    if (Array.isArray(mem.favoriteHooks)) {
      result.favoriteHooks.push(...(mem.favoriteHooks as string[]));
    }
    if (Array.isArray(mem.approvedHooks)) {
      for (const h of mem.approvedHooks) {
        if (typeof h === "string") {
          result.favoriteHooks.push(h);
        } else if (typeof h === "object" && h !== null && "hook" in h) {
          result.favoriteHooks.push((h as { hook: string }).hook);
        }
      }
    }

    // Handle high performing scripts
    if (Array.isArray(mem.highPerformingScripts)) {
      for (const s of mem.highPerformingScripts) {
        if (typeof s === "object" && s !== null && "scriptText" in s) {
          result.sampleScripts.push((s as { scriptText: string }).scriptText);
        }
      }
    }
  }

  // Deduplicate
  result.forbiddenPhrases = Array.from(new Set(result.forbiddenPhrases));
  result.bannedWords = Array.from(new Set(result.bannedWords));
  result.brandRules = Array.from(new Set(result.brandRules));

  return result;
}

export class ModelCouncil {
  public readonly router: ModelRouter;

  constructor(router?: ModelRouter) {
    this.router = router ?? new ModelRouter();
  }

  /**
   * Pass 1: Brainstormer generating hook variants
   * Uses routing task 'brainstorm' (qwen3.7-flash)
   */
  public async brainstormHooks(
    input: CouncilPipelineInput
  ): Promise<BrainstormCouncilResult> {
    const memory = extractMemoryContext(input.creatorMemory, input.creatorProfile);
    const count = input.hookCount ?? 5;

    const prompt = `You are the Brainstormer for CreatorOS.
Your goal is to generate ${count} viral, high-converting short-form video hooks for the following topic.

Topic: ${input.topic}
${input.additionalDirectives ? `Directives: ${input.additionalDirectives}\n` : ""}
Target Audience: ${memory.audience || "General digital audience"}
Creator Tone: ${memory.tone?.join(", ") || "Direct, engaging, authentic"}
${memory.pillars?.length ? `Content Pillars: ${memory.pillars.join(", ")}\n` : ""}
${memory.favoriteHooks.length ? `Proven Successful Hooks for Inspiration:\n- ${memory.favoriteHooks.slice(0, 5).join("\n- ")}\n` : ""}

Generate varied hook categories: curiosity, contrarian, result, conflict, pain point, and open loop.

Return JSON in this EXACT structure:
{
  "hooks": [
    {
      "hook": "string (the exact spoken hook text, punchy, under 15 words)",
      "category": "curiosity" | "contrarian" | "result" | "conflict" | "audience_pain" | "open_loop",
      "angle": "string (brief explanation of psychological angle)",
      "estimatedRetentionScore": number (0-100),
      "rationale": "string"
    }
  ],
  "refinedTopic": "string (sharp, clear topic focus)",
  "anglesConsidered": ["string"]
}`;

    return await this.router.executeTaskJson<BrainstormCouncilResult>(
      "brainstorm",
      prompt,
      BrainstormCouncilResultSchema
    );
  }

  /**
   * Pass 2: Scriptwriter drafting the narrative
   * Uses routing task 'scriptwriting' (qwen3.7-plus)
   */
  public async draftScript(
    input: CouncilPipelineInput,
    selectedHook: HookVariant | string
  ): Promise<DraftNarrative> {
    const memory = extractMemoryContext(input.creatorMemory, input.creatorProfile);
    const targetSeconds = input.targetDurationSeconds ?? 45;
    const hookText = typeof selectedHook === "string" ? selectedHook : selectedHook.hook;

    const prompt = `You are the Scriptwriter for CreatorOS.
Draft an elite short-form video narrative script structured for maximum 100% completion rate and retention.

Topic: ${input.topic}
Selected Opening Hook: "${hookText}"
Target Duration: ~${targetSeconds} seconds (roughly ${Math.round(targetSeconds * 2.5)} words spoken at standard pacing).
Tone: ${memory.tone?.join(", ") || "Direct, high-value, fast-paced"}
${memory.forbiddenPhrases.length ? `CRITICAL - NEVER use these forbidden phrases: ${memory.forbiddenPhrases.join(", ")}\n` : ""}
${memory.bannedWords.length ? `CRITICAL - NEVER use these banned words: ${memory.bannedWords.join(", ")}\n` : ""}
${memory.brandRules.length ? `Brand Rules:\n- ${memory.brandRules.join("\n- ")}\n` : ""}

Narrative Structure:
1. Hook: Deliver the selected hook without any fluff.
2. Setup: Immediately state why this matters or why conventional wisdom is wrong.
3. Core Value / Framework: 2-3 actionable, concrete insights with vivid examples.
4. Reframe: Key takeaway or perspective shift.
5. CTA: Clear, punchy call-to-action.

Return JSON in this EXACT structure:
{
  "title": "string",
  "selectedHook": "${hookText.replace(/"/g, '\\"')}",
  "fullScript": "string (the complete spoken script text)",
  "sections": [
    {
      "sectionType": "hook" | "setup" | "core_value" | "reframe" | "cta",
      "spokenText": "string",
      "visualNotes": "string (suggested visuals/b-roll/on-screen graphics)",
      "estimatedDurationSeconds": number
    }
  ],
  "ctaText": "string",
  "estimatedDurationSeconds": number
}`;

    return await this.router.executeTaskJson<DraftNarrative>(
      "scriptwriting",
      prompt,
      DraftNarrativeSchema
    );
  }

  /**
   * Pass 3: Critic evaluating against brand memory & retention rules
   * Uses routing task 'critique' (qwen3.6-max-preview)
   */
  public async critiqueScript(
    narrative: DraftNarrative,
    input: CouncilPipelineInput
  ): Promise<CouncilCritiqueResult> {
    const memory = extractMemoryContext(input.creatorMemory, input.creatorProfile);

    // 1. Programmatic rule checking
    const fullTextLower = narrative.fullScript.toLowerCase();
    const forbiddenWordsFound: string[] = [];
    for (const phrase of [...memory.forbiddenPhrases, ...memory.bannedWords]) {
      if (phrase && fullTextLower.includes(phrase.toLowerCase())) {
        forbiddenWordsFound.push(phrase);
      }
    }

    const prompt = `You are the Lead Critic & Brand Integrity Reviewer for CreatorOS.
Evaluate the following short-form video draft for retention curve, brand consistency, clarity, and production feasibility.

Script Title: ${narrative.title}
Hook: "${narrative.selectedHook}"
Full Script:
${narrative.fullScript}

Target Duration: ~${input.targetDurationSeconds ?? 45} seconds
Actual Estimated: ${narrative.estimatedDurationSeconds} seconds

Creator Guidelines & Memory:
- Target Audience: ${memory.audience || "General short-form video viewer"}
- Required Tone: ${memory.tone?.join(", ") || "Punchy, authoritative, clear"}
- Brand Rules: ${memory.brandRules.join("; ") || "None specified"}
- Forbidden Terms: ${[...memory.forbiddenPhrases, ...memory.bannedWords].join(", ") || "None"}

Evaluate thoroughly:
1. Retention prediction (0-100): Will the first 3 seconds stop the scroll? Are there lulls?
2. Brand consistency (0-100): Does it sound natural and follow voice guidelines?
3. Clarity score (0-100): Is the message easily grasped on first listen?
4. Production feasibility (0-100): Can this be cleanly visualized and timed in Remotion?
5. Composite score (0-100).
6. Brand rule violations and approval status (approve if compositeScore >= 75 and no major violations).

Return JSON in this EXACT structure:
{
  "scores": {
    "retentionPrediction": number,
    "brandConsistencyScore": number,
    "clarityScore": number,
    "productionFeasibilityScore": number,
    "compositeScore": number
  },
  "strengths": ["string"],
  "weaknesses": ["string"],
  "recommendations": ["string"],
  "brandRuleViolations": ["string"],
  "approved": boolean,
  "critiqueSummary": "string"
}`;

    const modelCritique = await this.router.executeTaskJson<CouncilCritiqueResult>(
      "critique",
      prompt,
      CouncilCritiqueResultSchema
    );

    // Merge programmatic checks
    const mergedForbidden = Array.from(
      new Set([...forbiddenWordsFound, ...modelCritique.forbiddenWordsFound])
    );
    const approved =
      modelCritique.approved &&
      mergedForbidden.length === 0 &&
      modelCritique.scores.compositeScore >= 70;

    return {
      ...modelCritique,
      forbiddenWordsFound: mergedForbidden,
      approved,
      weaknesses:
        mergedForbidden.length > 0
          ? [
              ...modelCritique.weaknesses,
              `Contains forbidden phrases: ${mergedForbidden.join(", ")}`,
            ]
          : modelCritique.weaknesses,
    };
  }

  /**
   * Pass 4: Scene Planner & Structured JSON Validator
   * Converts the approved narrative into a valid Remotion SceneSpec conforming to @creatoros/scene-schema
   */
  public async generateAndValidateSceneSpec(
    narrative: DraftNarrative,
    critique: CouncilCritiqueResult,
    input: CouncilPipelineInput
  ): Promise<CouncilSceneSpecResult> {
    const fps = input.fps ?? 30;
    const targetDurationSeconds =
      input.targetDurationSeconds ?? narrative.estimatedDurationSeconds;
    const totalDurationFrames = Math.round(targetDurationSeconds * fps);
    const format = input.format ?? "short_vertical";
    const layout = input.preferredLayout ?? "talking-head";

    const prompt = `You are the Scene Planner & Remotion Engineer for CreatorOS.
Convert the approved short-form script into a complete, valid SceneSpec JSON contract.

Script Title: ${narrative.title}
Hook: "${narrative.selectedHook}"
Full Script:
${narrative.fullScript}
CTA: "${narrative.ctaText}"
Critique Context: Composite score ${critique.scores.compositeScore}/100. ${critique.critiqueSummary}

Target Specifications:
- Layout: "${layout}"
- FPS: ${fps}
- Total Duration in Frames: ${totalDurationFrames} (${targetDurationSeconds}s)
- Format: "${format}" (${format === "short_vertical" ? "1080x1920" : format === "square" ? "1080x1080" : "1920x1080"})

Requirements:
- sceneId: unique string
- layout: "${layout}"
- durationInFrames: ${totalDurationFrames}
- fps: ${fps}
- hook: "${narrative.selectedHook.replace(/"/g, '\\"')}"
- scenes: Array of scenes (hook, talking_head, broll, quote, list, cta) with startFrame and durationInFrames covering the full duration (startFrame must increment correctly up to ${totalDurationFrames}). Must end with a "cta" scene.
- captions: array or config
- audioTrack: { "voiceoverText": "${narrative.fullScript.replace(/"/g, '\\"').replace(/\n/g, ' ')}" }
- metadata: { "title": "${narrative.title.replace(/"/g, '\\"')}", "cta": "${narrative.ctaText.replace(/"/g, '\\"')}", "caption": "string", "hashtags": ["string"] }

Return valid SceneSpec JSON matching this schema:
{
  "sceneId": "scene_${Date.now()}",
  "layout": "${layout}",
  "durationInFrames": ${totalDurationFrames},
  "fps": ${fps},
  "hook": "${narrative.selectedHook.replace(/"/g, '\\"')}",
  "format": "${format}",
  "width": ${format === "short_vertical" ? 1080 : format === "square" ? 1080 : 1920},
  "height": ${format === "short_vertical" ? 1920 : format === "square" ? 1080 : 1080},
  "audioTrack": {
    "voiceoverText": "${narrative.fullScript.replace(/"/g, '\\"').replace(/\n/g, ' ')}"
  },
  "cameraMotion": {
    "type": "zoom-in"
  },
  "transition": {
    "type": "cut"
  },
  "scenes": [
    {
      "id": "scene_1_hook",
      "startFrame": 0,
      "durationInFrames": ${Math.round(totalDurationFrames * 0.15)},
      "type": "hook",
      "text": "${narrative.selectedHook.replace(/"/g, '\\"')}"
    },
    {
      "id": "scene_2_body",
      "startFrame": ${Math.round(totalDurationFrames * 0.15)},
      "durationInFrames": ${Math.round(totalDurationFrames * 0.7)},
      "type": "talking_head"
    },
    {
      "id": "scene_3_cta",
      "startFrame": ${Math.round(totalDurationFrames * 0.85)},
      "durationInFrames": ${totalDurationFrames - Math.round(totalDurationFrames * 0.85)},
      "type": "cta",
      "text": "${narrative.ctaText.replace(/"/g, '\\"')}"
    }
  ],
  "metadata": {
    "title": "${narrative.title.replace(/"/g, '\\"')}",
    "caption": "string",
    "hashtags": ["#creator", "#growth"],
    "cta": "${narrative.ctaText.replace(/"/g, '\\"')}"
  }
}`;

    const rawSceneSpec = await this.router.executeTaskJson<SceneSpec>(
      "scriptwriting",
      prompt
    );

    const validationReport = this.validateSceneSpec(
      rawSceneSpec,
      targetDurationSeconds,
      fps
    );

    return {
      sceneSpec: rawSceneSpec,
      validationReport,
    };
  }

  /**
   * Deterministic structured JSON validator with schema enforcement
   * Validates against SceneSpecSchema from @creatoros/scene-schema
   */
  public validateSceneSpec(
    spec: unknown,
    targetDurationSeconds?: number,
    fps?: number
  ): SceneSpecValidationReport {
    const parseResult = SceneSpecSchema.safeParse(spec);
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!parseResult.success) {
      for (const issue of parseResult.error.issues) {
        errors.push(`[${issue.path.join(".")}] ${issue.message}`);
      }
    }

    const sceneSpec = parseResult.success ? parseResult.data : (spec as Partial<SceneSpec>);
    const resolvedFps = sceneSpec?.fps ?? fps ?? 30;
    const totalFrames = sceneSpec?.durationInFrames ?? 0;
    const actualSeconds = totalFrames > 0 ? totalFrames / resolvedFps : 0;
    const expectedSeconds = targetDurationSeconds ?? actualSeconds;

    // Duration tolerance check (within ±20%)
    const tolerance = 0.2;
    const diff = Math.abs(actualSeconds - expectedSeconds);
    const withinTolerance = expectedSeconds === 0 || diff <= expectedSeconds * tolerance;

    if (!withinTolerance && expectedSeconds > 0) {
      warnings.push(
        `Duration discrepancy: target was ${expectedSeconds}s, but totalFrames calculate to ${actualSeconds.toFixed(1)}s`
      );
    }

    // Check scenes continuity & CTA
    let hasCta = false;
    let sceneCount = 0;

    if (sceneSpec?.scenes && Array.isArray(sceneSpec.scenes)) {
      sceneCount = sceneSpec.scenes.length;
      let lastEndFrame = 0;

      for (let i = 0; i < sceneSpec.scenes.length; i++) {
        const sc = sceneSpec.scenes[i];
        if (!sc) continue;

        if (sc.type === "cta") {
          hasCta = true;
        }

        if (sc.startFrame < lastEndFrame) {
          warnings.push(
            `Scene ${sc.id || i} starts at frame ${sc.startFrame} before previous scene ended at frame ${lastEndFrame}`
          );
        }
        lastEndFrame = Math.max(lastEndFrame, sc.startFrame + sc.durationInFrames);
      }
    } else {
      // Check metadata or hook for CTA if scenes array is not used
      if (sceneSpec?.metadata?.cta) {
        hasCta = true;
      }
    }

    if (!hasCta) {
      warnings.push("No explicit CTA found in scene list or metadata");
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      durationCheck: {
        targetSeconds: expectedSeconds,
        actualSeconds,
        fps: resolvedFps,
        totalFrames,
        withinTolerance,
      },
      hasCta,
      sceneCount,
    };
  }

  /**
   * Coordinates the full 4-pass Model Council Pipeline:
   * 1. Brainstormer
   * 2. Scriptwriter
   * 3. Critic
   * 4. Scene Planner & JSON Validator
   */
  public async runCouncilPipeline(
    input: CouncilPipelineInput
  ): Promise<CouncilPipelineOutput> {
    const startTime = Date.now();

    // Pass 1: Brainstormer
    const brainstorm = await this.brainstormHooks(input);

    // Select hook (either specified index or first hook)
    const selectedHookIndex = input.selectedHookIndex ?? 0;
    const selectedHook =
      brainstorm.hooks[selectedHookIndex] || brainstorm.hooks[0] || {
        hook: input.topic,
        category: "curiosity",
      };

    // Pass 2: Scriptwriter
    const draft = await this.draftScript(input, selectedHook);

    // Pass 3: Critic
    const critique = await this.critiqueScript(draft, input);

    // Pass 4: Scene Planner & JSON Validator
    const sceneResult = await this.generateAndValidateSceneSpec(
      draft,
      critique,
      input
    );

    const executionTimeMs = Date.now() - startTime;
    const environment = this.router.client.getEnvironment();

    return {
      brainstorm,
      draft,
      critique,
      sceneSpec: sceneResult.sceneSpec,
      validation: sceneResult.validationReport,
      metadata: {
        executionTimeMs,
        environment,
        modelsUsed: {
          strategy: this.router.getModelForTask("strategy"),
          brainstorm: this.router.getModelForTask("brainstorm"),
          scriptwriting: this.router.getModelForTask("scriptwriting"),
          multimodal: this.router.getModelForTask("multimodal"),
          critique: this.router.getModelForTask("critique"),
          validation: this.router.getModelForTask("validation"),
        },
      },
    };
  }
}
