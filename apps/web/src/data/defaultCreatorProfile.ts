import { CreatorProfile } from "@creatoros/scene-schema";

export const initialCreatorProfile: CreatorProfile = {
  creatorId: "creator_tech_contrarian_01",
  name: "Alex Vance",
  niche: "AI Engineering & Systems Architecture",
  bio: "Pragmatic software engineer dissecting AI agent trends, GPU infrastructure hype, and distributed systems reality.",
  avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
  audience: {
    target: "Senior Software Engineers, Tech Leads, and AI Builders",
    demographics: "Ages 25-45, Global tech hubs, high technical literacy",
    painPoints: [
      "Overpriced cloud GPU bills",
      "Brittle agent frameworks with zero determinism",
      "Hype without real benchmark metrics",
    ],
    desires: [
      "High-throughput resilient architectures",
      "Cost-optimized inference strategies",
      "No-nonsense code breakdowns",
    ],
  },
  tone: "contrarian",
  bannedWords: ["synergy", "paradigm shift", "revolutionary gamechanger", "guaranteed 10x"],
  forbiddenPhrases: ["in today's digital age", "without further ado"],
  visualStyle: {
    primaryColor: "#685AFF", // Neon Indigo
    secondaryColor: "#06DCFB", // Neon Cyan
    accentColor: "#A855F7", // Neon Violet
    backgroundColor: "#030712",
    colors: ["#685AFF", "#06DCFB", "#A855F7", "#4ADE80", "#F43F5E"],
    fontFamily: "Inter, sans-serif",
    fonts: ["Inter", "JetBrains Mono", "Syne"],
    layout: "talking-head",
    captionStyle: "karaoke",
    introStyle: "high-contrast-glitch",
    outroStyle: "minimal-card-cta",
  },
  pillars: [
    {
      id: "pillar-1",
      name: "AI Infra Reality Checks",
      description: "Deconstructing actual compute costs, GPU idle states, and inference latency.",
      keywords: ["CUDA", "vLLM", "H100", "Latency", "TCO"],
      targetAudience: "Staff & Lead Engineers",
    },
    {
      id: "pillar-2",
      name: "Agent Orchestration & Reliability",
      description: "State machines, retry budgets, and schema enforcement vs blind prompting.",
      keywords: ["Zod", "State Machines", "Evaluations", "Guardrails"],
      targetAudience: "AI App Developers",
    },
    {
      id: "pillar-3",
      name: "Contrarian Tech Career Advice",
      description: "Focusing on fundamentals, memory layouts, and business leverage over chasing every weekly framework.",
      keywords: ["Career", "Seniority", "Leverage", "Engineering Discipline"],
      targetAudience: "Mid to Senior Engineers",
    },
  ],
  recurringSeries: ["The GPU Squeeze", "Framework Graveyard", "30-Second Architecture Audits"],
  favoriteHooks: [
    "Your cloud compute invoice isn't high because of traffic. It's high because your engineers are lazy.",
    "Stop deploying AI agents with blind retries. Here's what breaks first.",
    "We parsed 1,400 failed tech architecture seed pitches. Only one metric mattered.",
  ],
  opinions: [
    "Type-safety is not optional for LLM workflows.",
    "Most startups need an SQLite file and an index, not a distributed vector cluster.",
  ],
  personalStories: [
    "Cut our GPU bill by 68% after caching token prefixes.",
  ],
  primaryPlatforms: ["TikTok", "YouTube Shorts", "LinkedIn", "X/Twitter", "Substack"],
};
