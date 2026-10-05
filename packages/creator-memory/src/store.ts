import {
  StableMemory,
  StableMemorySchema,
  BrandRule,
  BrandRuleSchema,
  EpisodicMemoryItem,
  EpisodicMemoryItemSchema,
  PerformanceMemoryItem,
  PerformanceMemoryItemSchema,
  BestPerformingHook,
  SearchCriteria,
  SearchCriteriaSchema,
  MemoryRetrievalResult,
  ICreatorMemoryStore,
  IVectorRetrievalAdapter,
  RelevantHook,
  FormatAffinity,
} from "./types.js";

/**
 * Default TF-IDF / keyword similarity adapter for in-memory vector retrieval.
 * Provides cosine-like overlap scoring without requiring external native dependencies.
 */
export class InMemoryVectorRetrievalAdapter implements IVectorRetrievalAdapter {
  private documents: Map<string, { text: string; tokens: Set<string>; metadata?: Record<string, unknown> }> =
    new Map();

  private tokenize(text: string): Set<string> {
    return new Set(
      text
        .toLowerCase()
        .replace(/[^\w\s]/g, " ")
        .split(/\s+/)
        .filter((word) => word.length > 2)
    );
  }

  async index(id: string, text: string, metadata?: Record<string, unknown>): Promise<void> {
    const tokens = this.tokenize(text);
    this.documents.set(id, { text, tokens, metadata });
  }

  async search(
    query: string,
    limit: number = 5,
    minScore: number = 0.01
  ): Promise<Array<{ id: string; score: number; metadata?: Record<string, unknown> }>> {
    const queryTokens = this.tokenize(query);
    if (queryTokens.size === 0) {
      return [];
    }

    const results: Array<{ id: string; score: number; metadata?: Record<string, unknown> }> = [];

    for (const [id, doc] of this.documents.entries()) {
      let intersectionCount = 0;
      for (const token of queryTokens) {
        if (doc.tokens.has(token)) {
          intersectionCount++;
        }
      }

      // Jaccard similarity index as vector score approximation
      const unionCount = new Set([...queryTokens, ...doc.tokens]).size;
      const score = unionCount === 0 ? 0 : intersectionCount / unionCount;

      if (score >= minScore) {
        results.push({ id, score, metadata: doc.metadata });
      }
    }

    results.sort((a, b) => b.score - a.score);
    return results.slice(0, limit);
  }

  async delete(id: string): Promise<void> {
    this.documents.delete(id);
  }

  clear(): void {
    this.documents.clear();
  }
}

/**
 * InMemoryCreatorMemoryStore:
 * Production-ready in-memory implementation of ICreatorMemoryStore with vector adapter support.
 * Complies with Section 3 and Section 11 of docs/product/00-original-plan.md.
 */
export class InMemoryCreatorMemoryStore implements ICreatorMemoryStore {
  private stableMemories: Map<string, StableMemory> = new Map();
  private episodicMemories: Map<string, Map<string, EpisodicMemoryItem>> = new Map();
  private performanceMemories: Map<string, Map<string, PerformanceMemoryItem>> = new Map();
  private vectorAdapter: IVectorRetrievalAdapter;

  constructor(vectorAdapter?: IVectorRetrievalAdapter) {
    this.vectorAdapter = vectorAdapter ?? new InMemoryVectorRetrievalAdapter();
  }

  // ==========================================================================
  // Stable Memory Operations
  // ==========================================================================

  async getStableMemory(creatorId: string): Promise<StableMemory | null> {
    const memory = this.stableMemories.get(creatorId);
    return memory ? JSON.parse(JSON.stringify(memory)) : null;
  }

  async setStableMemory(creatorId: string, memory: StableMemory): Promise<void> {
    const validated = StableMemorySchema.parse({
      ...memory,
      creatorId,
      updatedAt: new Date().toISOString(),
    });
    this.stableMemories.set(creatorId, validated);
  }

  async updateStableMemory(creatorId: string, patch: Partial<StableMemory>): Promise<StableMemory> {
    const existing = this.stableMemories.get(creatorId);
    if (!existing) {
      throw new Error(`Cannot update stable memory: Creator '${creatorId}' does not exist.`);
    }

    const merged: StableMemory = {
      ...existing,
      ...patch,
      creatorId,
      identity: {
        ...existing.identity,
        ...(patch.identity || {}),
      },
      voice: {
        ...existing.voice,
        ...(patch.voice || {}),
      },
      visualStyle: {
        ...existing.visualStyle,
        ...(patch.visualStyle || {}),
      },
      bannedWords: patch.bannedWords ?? existing.bannedWords,
      forbiddenPhrases: patch.forbiddenPhrases ?? existing.forbiddenPhrases,
      brandRules: patch.brandRules ?? existing.brandRules,
      updatedAt: new Date().toISOString(),
    };

    const validated = StableMemorySchema.parse(merged);
    this.stableMemories.set(creatorId, validated);
    return validated;
  }

  async addBrandRule(
    creatorId: string,
    ruleInput: Omit<BrandRule, "id" | "createdAt">
  ): Promise<BrandRule> {
    const existing = this.stableMemories.get(creatorId);
    if (!existing) {
      throw new Error(`Cannot add brand rule: Creator '${creatorId}' does not exist.`);
    }

    const newRule: BrandRule = BrandRuleSchema.parse({
      ...ruleInput,
      id: `rule-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      createdAt: new Date().toISOString(),
    });

    existing.brandRules.push(newRule);
    existing.updatedAt = new Date().toISOString();
    this.stableMemories.set(creatorId, existing);
    return newRule;
  }

  // ==========================================================================
  // Episodic Memory Operations
  // ==========================================================================

  async addEpisodicMemory(creatorId: string, item: EpisodicMemoryItem): Promise<void> {
    const validated = EpisodicMemoryItemSchema.parse({
      ...item,
      creatorId,
    });

    let creatorEpisodes = this.episodicMemories.get(creatorId);
    if (!creatorEpisodes) {
      creatorEpisodes = new Map();
      this.episodicMemories.set(creatorId, creatorEpisodes);
    }

    creatorEpisodes.set(validated.id, validated);

    // Index episode in vector retrieval adapter for semantic retrieval
    const indexableText = [
      validated.title,
      validated.pillar ?? "",
      validated.topicsCovered.join(" "),
      validated.scriptText,
      validated.approvedHook ?? "",
      ...validated.hooksTested.map((h) => h.hook),
    ].join(" ");

    await this.vectorAdapter.index(validated.id, indexableText, {
      creatorId,
      pillar: validated.pillar,
      format: validated.format,
      status: validated.status,
    });
  }

  async getEpisodicMemories(
    creatorId: string,
    filter?: Partial<EpisodicMemoryItem>
  ): Promise<EpisodicMemoryItem[]> {
    const creatorEpisodes = this.episodicMemories.get(creatorId);
    if (!creatorEpisodes) {
      return [];
    }

    const items = Array.from(creatorEpisodes.values());
    if (!filter) {
      return items;
    }

    return items.filter((ep) => {
      if (filter.pillar && ep.pillar !== filter.pillar) return false;
      if (filter.format && ep.format !== filter.format) return false;
      if (filter.status && ep.status !== filter.status) return false;
      if (filter.platform && ep.platform !== filter.platform) return false;
      return true;
    });
  }

  async getEpisodicMemory(creatorId: string, episodeId: string): Promise<EpisodicMemoryItem | null> {
    const creatorEpisodes = this.episodicMemories.get(creatorId);
    if (!creatorEpisodes) {
      return null;
    }
    const item = creatorEpisodes.get(episodeId);
    return item ? JSON.parse(JSON.stringify(item)) : null;
  }

  // ==========================================================================
  // Performance Memory Operations
  // ==========================================================================

  async recordPerformanceMemory(creatorId: string, item: PerformanceMemoryItem): Promise<void> {
    const validated = PerformanceMemoryItemSchema.parse({
      ...item,
      creatorId,
    });

    let creatorPerf = this.performanceMemories.get(creatorId);
    if (!creatorPerf) {
      creatorPerf = new Map();
      this.performanceMemories.set(creatorId, creatorPerf);
    }

    creatorPerf.set(validated.id, validated);
  }

  async getPerformanceMemories(
    creatorId: string,
    filter?: Partial<PerformanceMemoryItem>
  ): Promise<PerformanceMemoryItem[]> {
    const creatorPerf = this.performanceMemories.get(creatorId);
    if (!creatorPerf) {
      return [];
    }

    const items = Array.from(creatorPerf.values());
    if (!filter) {
      return items;
    }

    return items.filter((p) => {
      if (filter.contentId && p.contentId !== filter.contentId) return false;
      if (filter.platform && p.platform !== filter.platform) return false;
      return true;
    });
  }

  async getTopPerformingHooks(creatorId: string, limit: number = 5): Promise<BestPerformingHook[]> {
    const perfRecords = await this.getPerformanceMemories(creatorId);
    const hooks: BestPerformingHook[] = [];

    for (const perf of perfRecords) {
      for (const hook of perf.bestPerformingHooks) {
        hooks.push(hook);
      }
    }

    // Sort by retentionRate descending, then views descending
    hooks.sort((a, b) => {
      if (b.retentionRate !== a.retentionRate) {
        return b.retentionRate - a.retentionRate;
      }
      return b.views - a.views;
    });

    return hooks.slice(0, limit);
  }

  // ==========================================================================
  // Retrieval Pipeline (Section 11)
  // ==========================================================================

  /**
   * Section 11 Memory Retrieval Example:
   * When writing a new script, retrieve:
   * 1. Preferred tone
   * 2. Five previously approved hooks
   * 3. Three high-performing scripts
   * 4. Forbidden phrases & banned words
   * 5. Relevant content pillar
   * 6. Similar content performance & format affinities
   */
  async retrieve(criteria: SearchCriteria): Promise<MemoryRetrievalResult> {
    const parsedCriteria = SearchCriteriaSchema.parse(criteria);
    const { creatorId, query, pillar, format, limit = 5 } = parsedCriteria;

    const stable = await this.getStableMemory(creatorId);
    const allEpisodes = await this.getEpisodicMemories(creatorId);
    const allPerf = await this.getPerformanceMemories(creatorId);

    // 1. Preferred Tone & Forbidden phrases
    const preferredTone = stable?.voice.tone ?? "authoritative";
    const forbiddenPhrases = Array.from(
      new Set([...(stable?.forbiddenPhrases ?? []), ...(stable?.voice.forbiddenPhrases ?? [])])
    );
    const bannedWords = stable?.bannedWords ?? [];

    // 2. Content Pillars
    const relevantPillars: string[] = [];
    if (pillar) {
      relevantPillars.push(pillar);
    } else if (stable?.pillars) {
      if (Array.isArray(stable.pillars)) {
        for (const p of stable.pillars) {
          if (typeof p === "string") {
            relevantPillars.push(p);
          } else if (p && typeof p === "object" && "name" in p) {
            relevantPillars.push(p.name);
          }
        }
      }
    }

    // 3. Five previously approved hooks
    const approvedHooksMap: Map<string, RelevantHook> = new Map();

    // From stable favoriteHooks
    if (stable?.favoriteHooks) {
      for (const hook of stable.favoriteHooks) {
        approvedHooksMap.set(hook, {
          hook,
          source: "stable_favorite",
        });
      }
    }

    // From top performance hooks
    const topHooks = await this.getTopPerformingHooks(creatorId, 10);
    for (const h of topHooks) {
      approvedHooksMap.set(h.hook, {
        hook: h.hook,
        source: "top_performance",
        retentionRate: h.retentionRate,
        views: h.views,
      });
    }

    // From episodic approved hooks
    for (const ep of allEpisodes) {
      if (ep.approvedHook) {
        if (!approvedHooksMap.has(ep.approvedHook)) {
          approvedHooksMap.set(ep.approvedHook, {
            hook: ep.approvedHook,
            source: "episodic_approved",
          });
        }
      }
      for (const tested of ep.hooksTested) {
        if (tested.wasApproved && !approvedHooksMap.has(tested.hook)) {
          approvedHooksMap.set(tested.hook, {
            hook: tested.hook,
            source: "episodic_approved",
            retentionRate: tested.retentionFirst3s,
          });
        }
      }
    }

    const approvedHooks = Array.from(approvedHooksMap.values()).slice(0, 5);

    // 4. Vector / Semantic search for similar episodes
    let similarEpisodes: EpisodicMemoryItem[] = [];
    if (query) {
      const searchHits = await this.vectorAdapter.search(
        query,
        limit,
        parsedCriteria.minSimilarity
      );
      const hitIds = new Set(searchHits.map((h) => h.id));
      similarEpisodes = allEpisodes.filter((ep) => hitIds.has(ep.id));
    } else {
      similarEpisodes = allEpisodes
        .filter((ep) => (!pillar || ep.pillar === pillar) && (!format || ep.format === format))
        .slice(0, limit);
    }

    // 5. Three high-performing scripts
    // Match performance metrics to episode scripts
    const performanceByContentId = new Map<string, PerformanceMemoryItem>();
    for (const p of allPerf) {
      performanceByContentId.set(p.contentId, p);
    }

    const scoredEpisodes = allEpisodes.map((ep) => {
      const perf = performanceByContentId.get(ep.id);
      const retentionScore = perf?.retention.averagePercentage ?? 0;
      const viewsScore = perf?.views ?? 0;
      return {
        episode: ep,
        score: retentionScore * 0.7 + Math.min(viewsScore / 1000, 30),
      };
    });

    scoredEpisodes.sort((a, b) => b.score - a.score);
    const highPerformingScripts = scoredEpisodes.slice(0, 3).map((s) => s.episode);

    // 6. Format Affinities & Summary
    const formatAffinitiesMap = new Map<string, FormatAffinity>();
    let totalRetention = 0;
    let retentionCount = 0;
    let totalViews = 0;

    for (const perf of allPerf) {
      totalViews += perf.views;
      if (perf.retention.averagePercentage) {
        totalRetention += perf.retention.averagePercentage;
        retentionCount++;
      }
      for (const aff of perf.formatAffinities) {
        const existing = formatAffinitiesMap.get(aff.format);
        if (!existing) {
          formatAffinitiesMap.set(aff.format, aff);
        } else {
          existing.affinityScore = (existing.affinityScore + aff.affinityScore) / 2;
          existing.sampleCount += aff.sampleCount;
        }
      }
    }

    const formatAffinities = Array.from(formatAffinitiesMap.values());
    const averageRetention = retentionCount > 0 ? totalRetention / retentionCount : undefined;
    const topPerformingHook = topHooks[0]?.hook;

    return {
      creatorId,
      preferredTone,
      forbiddenPhrases,
      bannedWords,
      brandRules: stable?.brandRules ?? [],
      relevantPillars,
      approvedHooks,
      highPerformingScripts,
      similarEpisodes,
      formatAffinities,
      performanceSummary: {
        averageRetention,
        totalViews,
        topPerformingHook,
      },
      insights: [],
    };
  }
}
