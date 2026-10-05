# 02 - Monorepo Structure: CreatorOS

## 1. Directory Tree
```
creatoros/
├── .github/
│   └── workflows/              # CI/CD pipelines (test, lint, build)
├── .kilocode/
│   └── rules/memory-bank/      # Kilo Code context and memory bank files
├── .vscode/                    # VS Code editor settings, tasks, and recommended extensions
├── apps/
│   ├── web/                    # Next.js 15 Web application (App router, Studio UI)
│   └── renderer/               # Headless Remotion rendering worker and composition library
├── packages/
│   ├── scene-schema/           # Zod schemas & TypeScript types for SceneSpec & profiles
│   ├── creator-memory/         # Vector memory store & retrieval adapters
│   └── model-router/           # Model routing client & 4-stage Model Council pipeline
├── docs/                       # Comprehensive specifications, ADRs, and plans
├── scripts/                    # Developer tooling and automation scripts
├── package.json                # Root package manifest (pnpm workspaces)
├── pnpm-workspace.yaml         # Workspace definition
├── turbo.json                  # Turborepo task pipeline configuration
├── tsconfig.base.json          # Shared TypeScript base configuration
├── tsconfig.json               # Root composite TypeScript project configuration
├── .gitignore                  # Git ignore definitions
├── .editorconfig               # Code style and formatting rules
└── opencode.json               # OpenCode CLI configuration
```

## 2. Workspace Dependency Graph
- `@creatoros/scene-schema`: Zero internal dependencies. Defines foundational types.
- `@creatoros/creator-memory`: Depends on `@creatoros/scene-schema`.
- `@creatoros/model-router`: Depends on `@creatoros/scene-schema` and `@creatoros/creator-memory`.
- `apps/web`: Depends on all three packages for studio management and scene generation.
- `apps/renderer`: Depends strictly on `@creatoros/scene-schema` for deterministic rendering.
