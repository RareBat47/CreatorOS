# 02 - Model Council Pipeline: CreatorOS

## 1. Multi-Stage Council Execution
The Model Council coordinates multiple specialized LLM agents in a sequential deliberation pipeline:

```
[User Prompt] 
      │
      ▼
┌──────────────┐
│ Brainstormer │ ──▶ Generates 3-5 distinct hooks (curiosity, contrarian, result)
└──────┬───────┘
       │ User selects hook (or default top-scoring hook)
       ▼
┌──────────────┐
│ Scriptwriter │ ──▶ Drafts retention-optimized narrative (Hook -> Tension -> Value -> CTA)
└──────┬───────┘
       │
       ▼
┌──────────────┐
│    Critic    │ ──▶ Checks brand rules, forbidden phrases, retention pacing
└──────┬───────┘
       │ Passes or returns revision directives
       ▼
┌──────────────┐
│  Validator   │ ──▶ Assembles and validates strict SceneSpec JSON via Zod
└──────────────┘
```

## 2. Self-Correction & Feedback Loops
If the Critic agent flags a forbidden word or a retention score below 70:
1. The Critic outputs specific rejection reasons and line numbers.
2. The Scriptwriter receives the rejection notes and re-drafts the problematic beat.
3. Maximum 2 revision loops are permitted before escalating or using safe fallback phrasing.
