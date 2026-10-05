# 03 - Git Workflow: CreatorOS

## 1. Branching & Commit Discipline
- **Main Branch**: Always deployable and passing CI (`pnpm test && pnpm build`).
- **Feature Branches**: `feat/package-name-feature`, `fix/issue-description`.
- **Commit Format**: Conventional Commits:
  - `feat(scene-schema): add brand watermark configuration`
  - `fix(model-router): correct fallback retry delay`
  - `docs(specs): update retention scoring threshold`
