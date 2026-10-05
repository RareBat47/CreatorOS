"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Wand2,
  Sparkles,
  Zap,
  Check,
  RotateCcw,
  Clock,
  Volume2,
  Copy,
  ChevronRight,
  Flame,
  Scale,
  Film,
  Lightbulb,
  Radio,
  ArrowUpRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AngleOption {
  id: string;
  name: string;
  archetype: string;
  hook: string;
  hookScore: number;
  retentionPrediction: "HIGH" | "MEDIUM" | "VIRAL";
  targetEmotion: string;
  pacingWpm: number;
}

interface HookTemplate {
  id: string;
  category: "Contrarian" | "Data Shock" | "Curiosity Gap" | "Negative Constraint" | "Inversion";
  hook: string;
  score: number;
  rationale: string;
}

interface ScriptSceneItem {
  number: number;
  slug: string;
  durationSec: number;
  visualCue: string;
  narration: string;
  wordCount: number;
}

interface ScriptVariant {
  id: "variant-a" | "variant-b" | "variant-c";
  modelName: string;
  tagline: string;
  totalWords: number;
  totalDurationSec: number;
  pacingWpm: number;
  scenes: ScriptSceneItem[];
}

export function ScriptStudioView() {
  const [topicPrompt, setTopicPrompt] = useState(
    "Enterprise software sales cycles are dead because engineering teams hold the cloud budget."
  );
  const [selectedPillar, setSelectedPillar] = useState("AI Infra Reality Checks");
  const [targetDuration, setTargetDuration] = useState<30 | 60 | 90>(60);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedAngleId, setSelectedAngleId] = useState<string>("angle-1");
  const [activeModelTab, setActiveModelTab] = useState<"variant-a" | "variant-b" | "variant-c">("variant-a");
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [copiedHookId, setCopiedHookId] = useState<string | null>(null);
  const [sidebarTab, setSidebarTab] = useState<"angles" | "hooks">("angles");

  const angles: AngleOption[] = [
    {
      id: "angle-1",
      name: "The Contrarian Budget Cut",
      archetype: "Contrarian Engineer",
      hook: "Your cloud compute invoice isn't high because of traffic. It's high because your engineers are lazy with idle GPU clusters.",
      hookScore: 94,
      retentionPrediction: "VIRAL",
      targetEmotion: "Paranoia & Financial Urgency",
      pacingWpm: 180,
    },
    {
      id: "angle-2",
      name: "The Data Postmortem",
      archetype: "Empirical Researcher",
      hook: "We parsed 1,400 failed enterprise tech pitches. Only one recurring metric destroyed startup margins before Series A.",
      hookScore: 89,
      retentionPrediction: "HIGH",
      targetEmotion: "Intellectual Curiosity",
      pacingWpm: 165,
    },
    {
      id: "angle-3",
      name: "The Tactical Playbook",
      archetype: "Systems Architect",
      hook: "Stop setting up GPU clusters with blind retry loops. 3 simple architectural rules that slashed AWS burn by 68%.",
      hookScore: 86,
      retentionPrediction: "HIGH",
      targetEmotion: "High Pragmatism",
      pacingWpm: 175,
    },
  ];

  const generatedHooks: HookTemplate[] = [
    {
      id: "hook-1",
      category: "Contrarian",
      hook: "Your VP of Engineering didn't blow the Q3 budget. 12 orphaned H100 dev instances did.",
      score: 95,
      rationale: "Accusatory contrast triggers instant defensive curiosity from tech executives.",
    },
    {
      id: "hook-2",
      category: "Data Shock",
      hook: "We audited 4,000 AI deployments. 64% of spent tokens were identical redundant system prompts.",
      score: 92,
      rationale: "Quantified metric establishes empirical authority in the first 2 seconds.",
    },
    {
      id: "hook-3",
      category: "Negative Constraint",
      hook: "Never deploy multi-turn LLM agents without prefix caching. Here is the exact bill shock.",
      score: 88,
      rationale: "Negative imperative ('Never do X') produces 2.3x higher 3-second hold rate.",
    },
    {
      id: "hook-4",
      category: "Curiosity Gap",
      hook: "There's a single config flag in vLLM that cuts AWS bills in half. Almost nobody enables it.",
      score: 91,
      rationale: "Knowledge asymmetry framing drives users to watch past the 15-second drop-off.",
    },
    {
      id: "hook-5",
      category: "Inversion",
      hook: "Startups fail because they optimize for model accuracy before they optimize for memory bandwidth.",
      score: 87,
      rationale: "Challenges conventional engineering consensus with foundational systems truth.",
    },
  ];

  const variants: Record<"variant-a" | "variant-b" | "variant-c", ScriptVariant> = {
    "variant-a": {
      id: "variant-a",
      modelName: "Claude 3.5 Sonnet",
      tagline: "High-density technical reasoning & sharp contrarian rhetoric",
      totalWords: 172,
      totalDurationSec: 58,
      pacingWpm: 178,
      scenes: [
        {
          number: 1,
          slug: "THE HOOK (0 - 5s)",
          durationSec: 4.8,
          visualCue: "Fast-cut terminal recording with red alert GPU billing alerts",
          narration:
            "Your cloud compute invoice isn't high because of traffic. It's high because your engineers are lazy with idle GPU clusters.",
          wordCount: 22,
        },
        {
          number: 2,
          slug: "THE PROBLEM: COGS COLLAPSE (5 - 20s)",
          durationSec: 15.2,
          visualCue: "Split screen showing server utilization gauges flatlining at 4%",
          narration:
            "Last month, over 4,000 H100 clusters sat idle while seed-stage startups burned their runway. A dev goes to sleep at 2 AM, and a four-dollar-an-hour instance runs unchecked all weekend.",
          wordCount: 34,
        },
        {
          number: 3,
          slug: "THE ARCHITECTURE FIX (20 - 45s)",
          durationSec: 25.0,
          visualCue: "Kinetic animated flowchart demonstrating Prefix Caching & vLLM routing",
          narration:
            "Here is the three-step fix: First, install an automated 15-minute idle reaper. Second, route repeated system prompts through prefix caches. Third, offload batch worker jobs to spot instances with fault-tolerant checkpointing.",
          wordCount: 38,
        },
        {
          number: 4,
          slug: "THE RESOLUTION & CTA (45 - 60s)",
          durationSec: 13.0,
          visualCue: "Remotion video preview card showing CreatorOS dashboard",
          narration:
            "One Series B client dropped their bill from 38k down to 12k with zero latency hit. Follow for weekly architecture teardowns.",
          wordCount: 22,
        },
      ],
    },
    "variant-b": {
      id: "variant-b",
      modelName: "GPT-4o",
      tagline: "Direct conversational narrative with accessible analogies",
      totalWords: 158,
      totalDurationSec: 54,
      pacingWpm: 175,
      scenes: [
        {
          number: 1,
          slug: "THE HOOK (0 - 4s)",
          durationSec: 4.0,
          visualCue: "Close-up talking head with kinetic neon cyan subtitles",
          narration:
            "Cloud providers are making record profits on your team's architectural complacency.",
          wordCount: 12,
        },
        {
          number: 2,
          slug: "THE MECHANISM (4 - 22s)",
          durationSec: 18.0,
          visualCue: "B-roll of modern server farm with flashing fiber optic lights",
          narration:
            "When developers spin up generative AI prototypes, they leave reservations on 24/7. Your gross margins evaporate before you even find product-market fit.",
          wordCount: 25,
        },
        {
          number: 3,
          slug: "THE TACTICS (22 - 46s)",
          durationSec: 24.0,
          visualCue: "Three-point numbered checklist overlay with smooth spring transitions",
          narration:
            "You only need three rules: Enforce auto-shutdown timers. Use token deduplication on your LLM gateway. And never run background evaluations on on-demand GPUs.",
          wordCount: 26,
        },
        {
          number: 4,
          slug: "THE TAKEAWAY (46 - 54s)",
          durationSec: 8.0,
          visualCue: "Branded social card CTA with creator handle",
          narration:
            "Treat compute budgets like production code. Save this video before your next AWS billing cycle.",
          wordCount: 16,
        },
      ],
    },
    "variant-c": {
      id: "variant-c",
      modelName: "DeepSeek-V3",
      tagline: "Deep systems breakdown with algorithmic precision",
      totalWords: 185,
      totalDurationSec: 62,
      pacingWpm: 179,
      scenes: [
        {
          number: 1,
          slug: "THE HOOK (0 - 5s)",
          durationSec: 5.0,
          visualCue: "Glitch zoom into CUDA kernel profiling metrics",
          narration:
            "90% of AI engineering startups don't need a distributed cluster. They need an SQLite index and a single warm worker.",
          wordCount: 21,
        },
        {
          number: 2,
          slug: "THE FAILURE STATE (5 - 24s)",
          durationSec: 19.0,
          visualCue: "Interactive memory bandwidth graph showing 80% wasted bandwidth",
          narration:
            "Teams are evaluating 2,500 token system prompts ten thousand times a day without KV caching. You're effectively recomputing the exact same matrix multiplication over and over.",
          wordCount: 27,
        },
        {
          number: 3,
          slug: "THE EXECUTION (24 - 48s)",
          durationSec: 24.0,
          visualCue: "Code snippet terminal showing vLLM prefix cache config flag",
          narration:
            "Enable vLLM continuous batching and prefix cache reuse. Decouple fast-path inference from long batch jobs to slash COGS by two-thirds immediately.",
          wordCount: 24,
        },
        {
          number: 4,
          slug: "CALL TO ACTION (48 - 62s)",
          durationSec: 14.0,
          visualCue: "Full screen summary graphic with key metrics",
          narration:
            "Clean code means clean infrastructure. Check the full schema in CreatorOS.",
          wordCount: 13,
        },
      ],
    },
  };

  const currentVariant = variants[activeModelTab];

  const handleSimulateRegenerate = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
    }, 600);
  };

  const handleCopyScript = (text: string, index: number) => {
    navigator.clipboard?.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleApplyHook = (hookText: string, id: string) => {
    setTopicPrompt(hookText);
    navigator.clipboard?.writeText(hookText);
    setCopiedHookId(id);
    setTimeout(() => setCopiedHookId(null), 2000);
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-background">
      {/* Top Header Rail */}
      <div className="h-14 px-6 border-b border-border bg-surface-panel/70 backdrop-blur flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-surface-base border border-neon-violet/30">
            <Wand2 className="w-5 h-5 text-neon-violet" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white flex items-center gap-2">
              Idea-to-Script Studio
              <span className="text-2xs font-mono px-2 py-0.5 rounded bg-surface-base text-neon-violet border border-neon-violet/30">
                Multi-Model Comparison
              </span>
            </h1>
            <p className="text-xs text-foreground-muted">
              Angle matrix synthesizer, viral hook laboratory, and multi-version script comparison
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/editor"
            className="px-4 py-2 rounded-lg bg-neon-indigo hover:bg-neon-indigo/90 text-white text-xs font-semibold flex items-center gap-2 shadow-neon-glow-indigo transition-all cursor-pointer"
          >
            <Film className="w-4 h-4 text-neon-cyan" />
            <span>Send Script to Video Editor</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Main Studio Body: 2 Columns */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Column: Idea Prompt & Angles / Hooks Generator (Width 440px) */}
        <div className="w-full md:w-[440px] lg:w-[480px] border-r border-border bg-surface-base/60 p-5 overflow-y-auto space-y-5 shrink-0">
          {/* Prompt Box */}
          <div className="p-4 rounded-xl border border-border bg-surface-panel space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-neon-cyan flex items-center gap-1.5">
                <Sparkles className="w-4 h-4" /> Core Idea / Seed Prompt
              </label>
              <span className="text-2xs font-mono text-foreground-subtle">Target: {targetDuration}s</span>
            </div>

            <textarea
              rows={3}
              value={topicPrompt}
              onChange={(e) => setTopicPrompt(e.target.value)}
              placeholder="Enter your rough thought, article URL, or technical observation..."
              className="w-full px-3 py-2.5 rounded-lg bg-surface-base border border-border focus:border-neon-violet text-xs text-white resize-none outline-none leading-relaxed"
            />

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label className="text-2xs font-mono text-foreground-subtle block mb-1">Content Pillar</label>
                <select
                  value={selectedPillar}
                  onChange={(e) => setSelectedPillar(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-surface-base border border-border text-xs text-white outline-none"
                >
                  <option value="AI Infra Reality Checks">AI Infra Reality Checks</option>
                  <option value="Agent Orchestration">Agent Orchestration</option>
                  <option value="Contrarian Career">Contrarian Tech Career</option>
                </select>
              </div>

              <div>
                <label className="text-2xs font-mono text-foreground-subtle block mb-1">Target Duration</label>
                <div className="grid grid-cols-3 gap-1 bg-surface-base p-1 rounded-lg border border-border">
                  {([30, 60, 90] as const).map((sec) => (
                    <button
                      key={sec}
                      type="button"
                      onClick={() => setTargetDuration(sec)}
                      className={cn(
                        "py-1 text-2xs font-mono rounded text-center transition-colors cursor-pointer",
                        targetDuration === sec
                          ? "bg-neon-violet text-white font-bold"
                          : "text-foreground-muted hover:text-white"
                      )}
                    >
                      {sec}s
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={handleSimulateRegenerate}
              disabled={isGenerating}
              className="w-full mt-2 py-2.5 rounded-lg bg-surface-elevated hover:bg-surface-hover border border-border text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <RotateCcw className={cn("w-3.5 h-3.5 text-neon-cyan", isGenerating && "animate-spin")} />
              <span>{isGenerating ? "Synthesizing Variations..." : "Generate Angles & Hooks"}</span>
            </button>
          </div>

          {/* Sub-Tabs: Angles vs Hook Generator */}
          <div className="flex items-center gap-2 border-b border-border pb-2">
            <button
              onClick={() => setSidebarTab("angles")}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer",
                sidebarTab === "angles"
                  ? "bg-neon-violet/20 text-white border border-neon-violet/40"
                  : "text-foreground-muted hover:text-white"
              )}
            >
              <Flame className="w-3.5 h-3.5 text-neon-rose" />
              <span>Angle Generation ({angles.length})</span>
            </button>

            <button
              onClick={() => setSidebarTab("hooks")}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer",
                sidebarTab === "hooks"
                  ? "bg-neon-cyan/20 text-white border border-neon-cyan/40"
                  : "text-foreground-muted hover:text-white"
              )}
            >
              <Lightbulb className="w-3.5 h-3.5 text-neon-cyan" />
              <span>Hook Generator ({generatedHooks.length})</span>
            </button>
          </div>

          {/* Angles Feed */}
          {sidebarTab === "angles" && (
            <div className="space-y-3 animate-fadeIn">
              {angles.map((ang) => {
                const isSelected = selectedAngleId === ang.id;
                return (
                  <div
                    key={ang.id}
                    onClick={() => setSelectedAngleId(ang.id)}
                    className={cn(
                      "p-4 rounded-xl border transition-all cursor-pointer relative",
                      isSelected
                        ? "border-neon-violet/70 bg-surface-panel shadow-neon-glow-violet/30"
                        : "border-border bg-surface-panel/70 hover:border-border-strong hover:bg-surface-panel"
                    )}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-2xs font-semibold px-2 py-0.5 rounded bg-surface-base text-neon-cyan border border-border">
                        {ang.archetype}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-2xs font-mono text-neon-lime flex items-center gap-1">
                          <Zap className="w-3 h-3" /> Hook: {ang.hookScore}/100
                        </span>
                      </div>
                    </div>

                    <h3 className="text-xs font-bold text-white mb-1.5">{ang.name}</h3>

                    <p className="text-xs text-foreground-muted italic leading-relaxed mb-3">
                      &quot;{ang.hook}&quot;
                    </p>

                    <div className="flex items-center justify-between pt-2 border-t border-border/60 text-2xs font-mono text-foreground-subtle">
                      <span>Emotion: {ang.targetEmotion}</span>
                      <span className="text-neon-cyan">Pacing: {ang.pacingWpm} WPM</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Dedicated Hook Generator List */}
          {sidebarTab === "hooks" && (
            <div className="space-y-3 animate-fadeIn">
              <div className="text-2xs text-foreground-muted flex items-center justify-between">
                <span>Click &quot;Use Hook&quot; to inject into prompt</span>
                <span className="font-mono text-neon-cyan">AI Hook Lab</span>
              </div>

              {generatedHooks.map((h) => (
                <div
                  key={h.id}
                  className="p-3.5 rounded-xl border border-border bg-surface-panel space-y-2 hover:border-border-strong transition-all"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-2xs font-mono font-bold px-2 py-0.5 rounded bg-surface-base text-neon-violet border border-neon-violet/30">
                      {h.category}
                    </span>
                    <span className="text-2xs font-mono text-neon-lime font-bold">
                      Viral Score: {h.score}/100
                    </span>
                  </div>

                  <p className="text-xs text-white font-medium italic leading-relaxed">
                    &quot;{h.hook}&quot;
                  </p>

                  <p className="text-2xs text-foreground-subtle">{h.rationale}</p>

                  <div className="pt-2 border-t border-border/50 flex items-center justify-between">
                    <button
                      onClick={() => handleApplyHook(h.hook, h.id)}
                      className="px-2.5 py-1 rounded bg-neon-indigo/20 hover:bg-neon-indigo/40 text-neon-cyan text-2xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      {copiedHookId === h.id ? (
                        <>
                          <Check className="w-3 h-3 text-neon-lime" /> Applied!
                        </>
                      ) : (
                        <>
                          <ArrowUpRight className="w-3 h-3" /> Use Hook in Prompt
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => {
                        navigator.clipboard?.writeText(h.hook);
                        setCopiedHookId(h.id);
                        setTimeout(() => setCopiedHookId(null), 2000);
                      }}
                      className="text-2xs font-mono text-foreground-subtle hover:text-white transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <Copy className="w-3 h-3" /> Copy
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Multi-Version Script Comparison (Width 60%) */}
        <div className="flex-1 flex flex-col overflow-hidden bg-background">
          {/* Model Switcher Tabs (A/B/C variations) */}
          <div className="h-12 px-6 border-b border-border bg-surface-base/80 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-foreground-subtle mr-2 flex items-center gap-1">
                <Scale className="w-4 h-4 text-neon-indigo" /> Compare Versions:
              </span>
              {(["variant-a", "variant-b", "variant-c"] as const).map((key) => {
                const varData = variants[key];
                const active = activeModelTab === key;
                return (
                  <button
                    key={key}
                    onClick={() => setActiveModelTab(key)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer",
                      active
                        ? "bg-surface-elevated text-white border border-neon-indigo/50 shadow-sm"
                        : "text-foreground-muted hover:text-white hover:bg-surface-hover"
                    )}
                  >
                    <span>{varData.modelName}</span>
                    <span className="text-2xs font-mono text-neon-cyan">{varData.totalWords}w</span>
                  </button>
                );
              })}
            </div>

            {/* Pacing Telemetry */}
            <div className="hidden lg:flex items-center gap-4 text-2xs font-mono text-foreground-muted">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-neon-lime" /> {currentVariant.totalDurationSec}s Est
              </span>
              <span className="flex items-center gap-1">
                <Volume2 className="w-3 h-3 text-neon-violet" /> {currentVariant.pacingWpm} WPM
              </span>
            </div>
          </div>

          {/* Script Content Pane */}
          <div className="flex-1 p-6 overflow-y-auto space-y-4">
            <div className="p-3.5 rounded-lg border border-border/80 bg-surface-panel/50 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-white">{currentVariant.modelName} Generation</span>
                <p className="text-2xs text-foreground-muted">{currentVariant.tagline}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xs font-mono text-neon-indigo px-2.5 py-1 rounded bg-surface-base border border-border">
                  {currentVariant.scenes.length} Scenes
                </span>
                <button
                  onClick={() => {
                    const fullText = currentVariant.scenes.map((s) => `[${s.slug}]\n${s.narration}`).join("\n\n");
                    handleCopyScript(fullText, 999);
                  }}
                  className="px-2.5 py-1 rounded bg-surface-elevated hover:bg-surface-hover border border-border text-2xs font-medium text-white flex items-center gap-1 transition-colors cursor-pointer"
                >
                  {copiedIndex === 999 ? (
                    <Check className="w-3 h-3 text-neon-lime" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                  <span>Copy Full Script</span>
                </button>
              </div>
            </div>

            {/* Scene Cards */}
            <div className="space-y-4">
              {currentVariant.scenes.map((sc, i) => (
                <div
                  key={sc.number}
                  className="rounded-xl border border-border bg-surface-panel overflow-hidden transition-all hover:border-border-strong"
                >
                  <div className="h-9 px-4 bg-surface-base border-b border-border flex items-center justify-between text-2xs font-mono">
                    <div className="flex items-center gap-2">
                      <span className="px-1.5 py-0.5 rounded bg-neon-indigo/20 text-neon-indigo font-bold">
                        Scene 0{sc.number}
                      </span>
                      <span className="text-white font-bold">{sc.slug}</span>
                    </div>

                    <div className="flex items-center gap-3 text-foreground-subtle">
                      <span>{sc.durationSec}s</span>
                      <span>•</span>
                      <span>{sc.wordCount} words</span>
                      <button
                        onClick={() => handleCopyScript(sc.narration, i)}
                        className="p-1 hover:text-white transition-colors cursor-pointer"
                        title="Copy Scene Narration"
                      >
                        {copiedIndex === i ? (
                          <Check className="w-3.5 h-3.5 text-neon-lime" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="p-4 space-y-3">
                    {/* Visual Cue */}
                    <div className="flex items-start gap-2.5 text-xs text-neon-cyan/90 bg-neon-cyan/5 border border-neon-cyan/20 p-2.5 rounded-lg">
                      <Radio className="w-4 h-4 text-neon-cyan shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-neon-cyan">Visual Cue: </span>
                        <span>{sc.visualCue}</span>
                      </div>
                    </div>

                    {/* Narration Script */}
                    <div className="space-y-1">
                      <span className="text-2xs font-mono text-foreground-subtle uppercase">Voiceover Narration</span>
                      <p className="text-sm text-foreground leading-relaxed font-sans">{sc.narration}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
