import Link from "next/link";
import { Sparkles, Video, Layers, Wand2, Share2, UserCheck, PlaySquare, ArrowUpRight, CheckCircle2 } from "lucide-react";

export default function HomePage() {
  const features = [
    {
      title: "Creator Onboarding & Brand Profile",
      href: "/onboarding",
      altHref: "/profile",
      icon: UserCheck,
      color: "text-neon-indigo",
      borderColor: "hover:border-neon-indigo/50",
      description: "Define Creator Archetypes, Tone anchors, Visual Styles, and Content Pillars backed by @creatoros/scene-schema validation.",
      badge: "DNA Engine",
    },
    {
      title: "Idea-to-Script Studio",
      href: "/studio",
      altHref: "/create",
      icon: Wand2,
      color: "text-neon-violet",
      borderColor: "hover:border-neon-violet/50",
      description: "Brainstorm high-converting angles, viral hooks, and compare side-by-side script variants (Claude 3.5 vs GPT-4o) with speech pacing metrics.",
      badge: "LLM Orchestrator",
    },
    {
      title: "Video Timeline & Scene Preview",
      href: "/editor",
      altHref: "/preview",
      icon: Video,
      color: "text-neon-cyan",
      borderColor: "hover:border-neon-cyan/50",
      description: "9:16 vertical canvas player, kinetic caption preview, multi-track timeline, camera motion inspector, and scene layer controls.",
      badge: "Remotion Engine",
    },
    {
      title: "Multi-Platform Repurposing Hub",
      href: "/repurpose",
      altHref: "/repurpose",
      icon: Share2,
      color: "text-neon-lime",
      borderColor: "hover:border-neon-lime/50",
      description: "Transform 1 video into 6 native formats: TikTok, YouTube Shorts, LinkedIn Carousel/Post, X/Twitter Threads, and Newsletters.",
      badge: "Omni-Channel",
    },
  ];

  return (
    <div className="flex-1 p-8 overflow-y-auto space-y-8">
      {/* Hero Banner */}
      <div className="relative rounded-2xl border border-border bg-gradient-to-br from-surface-panel via-surface-base to-surface-panel p-8 shadow-2xl overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-neon-indigo/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-neon-cyan/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-neon-indigo/30 bg-neon-indigo/10 text-neon-indigo text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>CreatorOS Monorepo Orchestration</span>
          </div>

          <h1 className="text-3xl lg:text-5xl font-black tracking-tight text-white">
            Programmatic Video Studio & Multi-Platform Engine
          </h1>
          
          <p className="text-foreground-muted text-base lg:text-lg leading-relaxed">
            From raw brain dump to multi-angle scripts, Remotion vertical 9:16 rendering canvas, and omni-channel distribution packages — validated by strict Zod schemas.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-4">
            <Link
              href="/studio"
              className="px-5 py-2.5 rounded-lg bg-neon-indigo hover:bg-neon-indigo/90 text-white font-medium text-sm flex items-center gap-2 shadow-neon-glow-indigo transition-all"
            >
              <Wand2 className="w-4 h-4" />
              Launch Script Studio
            </Link>
            <Link
              href="/editor"
              className="px-5 py-2.5 rounded-lg bg-surface-elevated hover:bg-surface-hover text-white font-medium text-sm border border-border flex items-center gap-2 transition-all"
            >
              <PlaySquare className="w-4 h-4 text-neon-cyan" />
              Open Video Editor (9:16)
            </Link>
            <Link
              href="/onboarding"
              className="px-5 py-2.5 rounded-lg bg-surface-base hover:bg-surface-elevated text-foreground-muted hover:text-white font-medium text-sm border border-border/80 flex items-center gap-2 transition-all"
            >
              <UserCheck className="w-4 h-4 text-neon-lime" />
              Brand Profile
            </Link>
          </div>
        </div>
      </div>

      {/* Grid of Core Modules */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-neon-cyan" />
            Core Workspaces & Pipelines
          </h2>
          <span className="text-xs text-foreground-subtle">4 Integrated Workspaces</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {features.map((feat) => {
            const Icon = feat.icon;
            return (
              <div
                key={feat.title}
                className={`group relative rounded-xl border border-border bg-surface-panel p-6 transition-all duration-200 ${feat.borderColor} hover:bg-surface-elevated flex flex-col justify-between`}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-lg bg-surface-base border border-border">
                        <Icon className={`w-6 h-6 ${feat.color}`} />
                      </div>
                      <span className="text-xs font-mono px-2 py-0.5 rounded bg-surface-base text-foreground-muted border border-border/60">
                        {feat.badge}
                      </span>
                    </div>
                    <Link
                      href={feat.href}
                      className="p-1.5 rounded-lg text-foreground-subtle hover:text-white hover:bg-surface-hover transition-colors"
                    >
                      <ArrowUpRight className="w-5 h-5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                    </Link>
                  </div>

                  <h3 className="text-lg font-bold text-white mb-2 group-hover:text-neon-indigo transition-colors">
                    {feat.title}
                  </h3>
                  <p className="text-sm text-foreground-muted leading-relaxed mb-6">
                    {feat.description}
                  </p>
                </div>

                <div className="flex items-center gap-3 pt-4 border-t border-border/60">
                  <Link
                    href={feat.href}
                    className="text-xs font-medium text-white hover:text-neon-cyan flex items-center gap-1 transition-colors"
                  >
                    Open View <span className="text-foreground-subtle">({feat.href})</span>
                  </Link>
                  {feat.altHref !== feat.href && (
                    <>
                      <span className="text-xs text-foreground-subtle">•</span>
                      <Link
                        href={feat.altHref}
                        className="text-xs font-medium text-foreground-muted hover:text-white transition-colors"
                      >
                        Alias ({feat.altHref})
                      </Link>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Schema Verification Telemetry Banner */}
      <div className="rounded-xl border border-border/80 bg-surface-panel/60 p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-neon-lime shrink-0" />
          <div>
            <div className="text-sm font-semibold text-white">Schema Verification Active</div>
            <div className="text-xs text-foreground-muted font-mono">
              @creatoros/scene-schema: SceneSpecSchema, CreatorProfileSchema, RepurposingPackageSchema
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-neon-lime animate-pulse" />
          <span className="text-xs font-mono text-neon-lime">System Online (30 FPS Render Target)</span>
        </div>
      </div>
    </div>
  );
}
