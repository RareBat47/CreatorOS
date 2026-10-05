# System Architecture: CreatorOS

## 1. Monorepo Topology
```
creatoros/
├── apps/
│   ├── web/                 # Next.js 15 UI, Timeline Editor, Brand Settings
│   └── renderer/            # Isolated Remotion video rendering pipeline
├── packages/
│   ├── scene-schema/        # Canonical Zod contracts & TS definitions
│   ├── creator-memory/      # Memory store (Stable, Episodic, Performance)
│   └── model-router/        # AI gateway & 4-stage Model Council
├── docs/                    # Exhaustive engineering & product specifications
└── .kilocode/               # Memory bank & developer rules
```

## 2. Architectural Principles
1. **Zod-First Validation**: Boundary data is validated through Zod before entering application code or video rendering pipelines.
2. **Renderer Isolation**: Remotion requires heavy dependencies (Chromium/Puppeteer). It is strictly quarantined in `apps/renderer` and never imported into web server routes.
3. **Gateway Abstraction**: Application code never interacts directly with third-party LLM SDKs. All AI traffic passes through `ModelRouter`.
4. **Three-Tier Creator Memory**:
   - **Stable Memory**: Durable identity, tone, pillars, banned words, visual style.
   - **Episodic Memory**: History of produced scripts, narrative arcs, tested angles.
   - **Performance Memory**: Retention metrics, drop-off curves, winning formats.
