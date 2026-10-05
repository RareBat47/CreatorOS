# 04 - OpenCode & Gemini Workflow: CreatorOS

## 1. Autonomous Agent Execution
When delegating engineering tasks to OpenCode CLI:
- Primary Model: `antigravity/gemini-3.8-flash-high`
- Fallback Model: `antigravity/gemini-3.1-pro-low`
- Command Invocation:
  ```bash
  opencode run "<task specification>" --model antigravity/gemini-3.8-flash-high
  ```
- All generated code must immediately be tested with `pnpm test`.
