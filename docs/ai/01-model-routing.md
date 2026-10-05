# 01 - Model Routing: CreatorOS

## 1. Routing Matrix & Model Specialization
CreatorOS does not use a single "one-size-fits-all" LLM. Different tasks require fundamentally different balances of reasoning depth, speed, cost, and JSON schema compliance.

| Routing Task | Local Dev Model (Antigravity Gateway) | Production Model (DashScope / Cloud) | Temperature | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| **Strategy** | `antigravity/gemini-3.1-pro-low` | `qwen-max` / `claude-3-7-sonnet` | 0.3 | High-level audience ICP and content pillar mapping. |
| **Brainstorm** | `antigravity/gemini-3.8-flash-high` | `qwen-plus` / `gemini-2.5-flash` | 0.7 | Generating fast, divergent hook variants and angles. |
| **Scriptwriting** | `antigravity/gemini-3.8-flash-high` | `qwen3.7-plus` / `gpt-4o` | 0.4 | Drafting structured 45-second scripts with beat timings. |
| **Multimodal** | `antigravity/gemini-3.8-flash-high` | `qwen-vl-max` | 0.2 | Analyzing raw creator video footage, face position, and B-roll match. |
| **Critique** | `antigravity/gemini-3.1-pro-low` | `claude-3-7-sonnet` / `qwen-max` | 0.2 | Ruthlessly auditing drafts against banned words & retention rules. |
| **Validation** | `antigravity/gemini-3.8-flash-high` | `qwen-turbo` | 0.0 | Enforcing strict JSON parsing against Zod `SceneSpecSchema`. |

## 2. Gateway Client Architecture
Defined in `@creatoros/model-router`:
- In local development (`NODE_ENV=development`), the client targets `http://127.0.0.1:8999/v1` via `ANTIGRAVITY_BASE_URL`.
- In production (`NODE_ENV=production`), the client connects to official cloud endpoints via bearer token authentication.
- Automated fallback arrays ensure that if the primary model fails or times out, secondary candidate models are attempted seamlessly.
