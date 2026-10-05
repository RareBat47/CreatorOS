# 03 - Creator Memory System: CreatorOS

## 1. Tripartite Memory Architecture
The Creator Memory System maintains three distinct tiers of durable intelligence:

### 1.1 Stable Memory (Invariable Brand Truths)
- **Identity**: Creator name, handle, bio, niche.
- **Voice & Tone**: High-energy, direct, humorous, authoritative, concise.
- **Content Pillars**: Core topics, sub-themes, audience pain points.
- **Visual Style**: Hex color palette, primary/accent fonts, watermark/logo rules.
- **Banned Words & Guardrails**: Absolute forbidden phrases (e.g., "synergy", "paradigm shift", "delve").

### 1.2 Episodic Memory (Narrative History)
- Records every past video topic, approved script, and tested hook angle.
- Enables semantic retrieval (`pgvector`) to prevent topic duplication and allow sequel/callback videos.

### 1.3 Performance Memory (Empirical Benchmarks)
- Tracks 3-second hook retention rates, average percentage viewed (APV), and view counts.
- Identifies which hook categories and video layouts perform best for each specific creator.

## 2. Memory Retrieval Pipeline
Before the Model Council begins ideation, `@creatoros/creator-memory` compiles a condensed context package containing:
1. Stable voice directives and forbidden word arrays.
2. Top 3 highest-performing past hooks.
3. Recent topics covered to avoid repetitive ideation.
