"use client";

import React, { useState } from "react";
import { RepurposingPackage } from "@creatoros/scene-schema";
import { defaultRepurposingPackage } from "@/data/defaultRepurposingPackage";
import {
  Share2,
  Copy,
  Check,
  Calendar,
  Smartphone,
  Video,
  Linkedin,
  Twitter,
  Mail,
  Instagram,
  CheckCircle2,
  Eye,
  Volume2,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function RepurposeView() {
  const [pkg] = useState<RepurposingPackage>(defaultRepurposingPackage);
  const [activePlatform, setActivePlatform] = useState<
    "tiktok" | "shorts" | "reels" | "x" | "linkedin" | "newsletter" | "json"
  >("tiktok");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [scheduledStatus, setScheduledStatus] = useState<string | null>(null);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleSchedule = (platform: string) => {
    setScheduledStatus(platform);
    setTimeout(() => setScheduledStatus(null), 2500);
  };

  const platforms = [
    { id: "tiktok", label: "TikTok", icon: Smartphone, color: "text-neon-cyan", count: "1 Video" },
    { id: "shorts", label: "YouTube Shorts", icon: Video, color: "text-neon-rose", count: "1 Video" },
    { id: "reels", label: "Instagram Reels", icon: Instagram, color: "text-neon-violet", count: "1 Video" },
    { id: "x", label: "X / Twitter Thread", icon: Twitter, color: "text-white", count: "6 Tweets" },
    { id: "linkedin", label: "LinkedIn Post", icon: Linkedin, color: "text-neon-indigo", count: "1 Post" },
    { id: "newsletter", label: "Newsletter", icon: Mail, color: "text-neon-lime", count: "1 Issue" },
    { id: "json", label: "JSON Manifest", icon: Eye, color: "text-foreground-subtle", count: "Schema" },
  ];

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-background">
      {/* Top Header Rail */}
      <div className="h-14 px-6 border-b border-border bg-surface-panel/70 backdrop-blur flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-surface-base border border-neon-lime/30">
            <Share2 className="w-5 h-5 text-neon-lime" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white flex items-center gap-2">
              Multi-Platform Repurposing Package
              <span className="text-2xs font-mono px-2 py-0.5 rounded bg-surface-base text-neon-lime border border-neon-lime/30">
                1 Idea ➔ 6 Native Formats
              </span>
            </h1>
            <p className="text-xs text-foreground-muted">
              Auto-generate channel-native copy, hashtags, sound recommendations, and thread structures
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {scheduledStatus && (
            <span className="text-xs text-neon-lime flex items-center gap-1.5 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4" /> Queued for {scheduledStatus}
            </span>
          )}
          <button
            onClick={() => handleSchedule("All Channels")}
            className="px-4 py-2 rounded-lg bg-neon-indigo hover:bg-neon-indigo/90 text-white text-xs font-semibold flex items-center gap-2 shadow-neon-glow-indigo transition-all"
          >
            <Calendar className="w-4 h-4" />
            Push to Publishing Queue
          </button>
        </div>
      </div>

      {/* Main Repurpose Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Column: Platform Switcher Tabs */}
        <div className="w-56 border-r border-border bg-surface-base/60 p-3 space-y-1 shrink-0">
          <div className="text-[10px] uppercase font-bold text-foreground-subtle tracking-wider px-3 py-1.5">
            Distribution Channels
          </div>

          {platforms.map((p) => {
            const Icon = p.icon;
            const active = activePlatform === p.id;
            return (
              <button
                key={p.id}
                onClick={() => setActivePlatform(p.id as typeof activePlatform)}
                className={cn(
                  "w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all",
                  active
                    ? "bg-surface-elevated text-white border border-border-interactive/40 shadow-sm"
                    : "text-foreground-muted hover:text-white hover:bg-surface-hover"
                )}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={cn("w-4 h-4", active ? p.color : "text-foreground-subtle")} />
                  <span>{p.label}</span>
                </div>
                <span className="text-[10px] font-mono text-foreground-subtle">{p.count}</span>
              </button>
            );
          })}

          <div className="mt-6 p-3 rounded-lg border border-border bg-surface-panel/50 space-y-2 text-2xs">
            <span className="font-bold text-white block">Repurposing Efficiency</span>
            <div className="text-foreground-muted">
              Source script expanded into 6 distinct platform formats with zero manual copywriting.
            </div>
          </div>
        </div>

        {/* Right Column: Platform Content View */}
        <div className="flex-1 p-6 overflow-y-auto max-w-4xl space-y-6">
          {/* TikTok Platform View */}
          {activePlatform === "tiktok" && (
            <div className="p-5 rounded-xl border border-border bg-surface-panel space-y-5 animate-fadeIn">
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <div className="flex items-center gap-2.5">
                  <Smartphone className="w-5 h-5 text-neon-cyan" />
                  <div>
                    <h2 className="text-sm font-bold text-white">TikTok Short-Form Video</h2>
                    <span className="text-2xs text-foreground-muted">Fast-paced, hook-first algorithm copy</span>
                  </div>
                </div>
                <button
                  onClick={() =>
                    handleCopy(pkg.shortFormVideo.platformVariants?.tiktok?.caption || "", "tiktok-cap")
                  }
                  className="px-3 py-1.5 rounded-lg bg-surface-base hover:bg-surface-elevated border border-border text-xs text-white flex items-center gap-1.5 transition-colors"
                >
                  {copiedKey === "tiktok-cap" ? <Check className="w-3.5 h-3.5 text-neon-lime" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>Copy Caption</span>
                </button>
              </div>

              <div>
                <label className="text-2xs font-mono text-foreground-muted block mb-1">Optimized Caption</label>
                <div className="p-3.5 rounded-lg bg-surface-base border border-border text-xs text-white leading-relaxed">
                  {pkg.shortFormVideo.platformVariants?.tiktok?.caption}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-2xs font-mono text-foreground-muted block mb-1">Recommended Audio / Sound</label>
                  <div className="p-3 rounded-lg bg-surface-base border border-border text-xs text-neon-cyan flex items-center gap-2">
                    <Volume2 className="w-4 h-4 shrink-0" />
                    <span>{pkg.shortFormVideo.platformVariants?.tiktok?.soundRecommendation}</span>
                  </div>
                </div>

                <div>
                  <label className="text-2xs font-mono text-foreground-muted block mb-1">Algorithmic Hashtags</label>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {(pkg.shortFormVideo.platformVariants?.tiktok?.hashtags || []).map((tag, i) => (
                      <span
                        key={i}
                        className="text-2xs px-2 py-0.5 rounded bg-surface-base text-neon-cyan border border-border font-mono"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* YouTube Shorts View */}
          {activePlatform === "shorts" && (
            <div className="p-5 rounded-xl border border-border bg-surface-panel space-y-5 animate-fadeIn">
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <div className="flex items-center gap-2.5">
                  <Video className="w-5 h-5 text-neon-rose" />
                  <div>
                    <h2 className="text-sm font-bold text-white">YouTube Shorts Package</h2>
                    <span className="text-2xs text-foreground-muted">High search intent description and title tags</span>
                  </div>
                </div>
                <button
                  onClick={() =>
                    handleCopy(pkg.shortFormVideo.platformVariants?.shorts?.caption || "", "shorts-cap")
                  }
                  className="px-3 py-1.5 rounded-lg bg-surface-base hover:bg-surface-elevated border border-border text-xs text-white flex items-center gap-1.5 transition-colors"
                >
                  {copiedKey === "shorts-cap" ? <Check className="w-3.5 h-3.5 text-neon-lime" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>Copy Title & Caption</span>
                </button>
              </div>

              <div>
                <label className="text-2xs font-mono text-foreground-muted block mb-1">Video Title</label>
                <div className="p-3 rounded-lg bg-surface-base border border-border text-xs font-bold text-white">
                  {pkg.shortFormVideo.title}
                </div>
              </div>

              <div>
                <label className="text-2xs font-mono text-foreground-muted block mb-1">Shorts Caption</label>
                <div className="p-3.5 rounded-lg bg-surface-base border border-border text-xs text-white leading-relaxed">
                  {pkg.shortFormVideo.platformVariants?.shorts?.caption}
                </div>
              </div>

              <div>
                <label className="text-2xs font-mono text-foreground-muted block mb-1">Search Tags</label>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {(pkg.shortFormVideo.platformVariants?.shorts?.hashtags || []).map((tag, i) => (
                    <span
                      key={i}
                      className="text-2xs px-2 py-0.5 rounded bg-surface-base text-neon-rose border border-border font-mono"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Instagram Reels View */}
          {activePlatform === "reels" && (
            <div className="p-5 rounded-xl border border-border bg-surface-panel space-y-5 animate-fadeIn">
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <div className="flex items-center gap-2.5">
                  <Instagram className="w-5 h-5 text-neon-violet" />
                  <div>
                    <h2 className="text-sm font-bold text-white">Instagram Reels Package</h2>
                    <span className="text-2xs text-foreground-muted">Saveable carousel/video caption with engagement hook</span>
                  </div>
                </div>
                <button
                  onClick={() =>
                    handleCopy(pkg.shortFormVideo.platformVariants?.reels?.caption || "", "reels-cap")
                  }
                  className="px-3 py-1.5 rounded-lg bg-surface-base hover:bg-surface-elevated border border-border text-xs text-white flex items-center gap-1.5 transition-colors"
                >
                  {copiedKey === "reels-cap" ? <Check className="w-3.5 h-3.5 text-neon-lime" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>Copy Caption</span>
                </button>
              </div>

              <div>
                <label className="text-2xs font-mono text-foreground-muted block mb-1">Reels Caption</label>
                <div className="p-3.5 rounded-lg bg-surface-base border border-border text-xs text-white leading-relaxed">
                  {pkg.shortFormVideo.platformVariants?.reels?.caption}
                </div>
              </div>

              <div>
                <label className="text-2xs font-mono text-foreground-muted block mb-1">Hashtag Cloud</label>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {(pkg.shortFormVideo.platformVariants?.reels?.hashtags || []).map((tag, i) => (
                    <span
                      key={i}
                      className="text-2xs px-2 py-0.5 rounded bg-surface-base text-neon-violet border border-border font-mono"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* X / Twitter Thread View */}
          {activePlatform === "x" && (
            <div className="p-5 rounded-xl border border-border bg-surface-panel space-y-5 animate-fadeIn">
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <div className="flex items-center gap-2.5">
                  <Twitter className="w-5 h-5 text-white" />
                  <div>
                    <h2 className="text-sm font-bold text-white">X (Twitter) Breakdown Thread</h2>
                    <span className="text-2xs text-foreground-muted">High-retention viral 6-tweet thread</span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    const threadDetails =
                      typeof pkg.twitterThread === "object" && "tweets" in pkg.twitterThread
                        ? [pkg.twitterThread.hookTweet, ...pkg.twitterThread.tweets, pkg.twitterThread.ctaTweet]
                            .filter(Boolean)
                            .join("\n\n---\n\n")
                        : Array.isArray(pkg.twitterThread)
                        ? pkg.twitterThread.join("\n\n---\n\n")
                        : "";
                    handleCopy(threadDetails, "x-thread");
                  }}
                  className="px-3 py-1.5 rounded-lg bg-surface-base hover:bg-surface-elevated border border-border text-xs text-white flex items-center gap-1.5 transition-colors"
                >
                  {copiedKey === "x-thread" ? <Check className="w-3.5 h-3.5 text-neon-lime" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>Copy Entire Thread</span>
                </button>
              </div>

              {/* Thread Posts Feed */}
              <div className="space-y-3">
                {typeof pkg.twitterThread === "object" && "hookTweet" in pkg.twitterThread && (
                  <div className="p-4 rounded-xl border border-neon-indigo/50 bg-surface-base space-y-2">
                    <div className="flex items-center justify-between text-2xs font-mono text-neon-indigo">
                      <span>Tweet 1 / Hook</span>
                      <span>Hook Tweet</span>
                    </div>
                    <p className="text-xs text-white whitespace-pre-line leading-relaxed font-sans">
                      {pkg.twitterThread.hookTweet}
                    </p>
                  </div>
                )}

                {typeof pkg.twitterThread === "object" &&
                  "tweets" in pkg.twitterThread &&
                  pkg.twitterThread.tweets.map((tweet, i) => (
                    <div key={i} className="p-4 rounded-xl border border-border bg-surface-base space-y-2">
                      <div className="flex items-center justify-between text-2xs font-mono text-foreground-subtle">
                        <span>Tweet {i + 2}</span>
                        <span>{tweet.length} chars</span>
                      </div>
                      <p className="text-xs text-foreground leading-relaxed font-sans whitespace-pre-line">
                        {tweet}
                      </p>
                    </div>
                  ))}

                {typeof pkg.twitterThread === "object" && "ctaTweet" in pkg.twitterThread && (
                  <div className="p-4 rounded-xl border border-neon-lime/40 bg-surface-base space-y-2">
                    <div className="flex items-center justify-between text-2xs font-mono text-neon-lime">
                      <span>Final CTA Tweet</span>
                      <span>Conversion</span>
                    </div>
                    <p className="text-xs text-white whitespace-pre-line leading-relaxed font-sans">
                      {pkg.twitterThread.ctaTweet}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* LinkedIn Post View */}
          {activePlatform === "linkedin" && (
            <div className="p-5 rounded-xl border border-border bg-surface-panel space-y-5 animate-fadeIn">
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <div className="flex items-center gap-2.5">
                  <Linkedin className="w-5 h-5 text-neon-indigo" />
                  <div>
                    <h2 className="text-sm font-bold text-white">LinkedIn Thought Leadership Post</h2>
                    <span className="text-2xs text-foreground-muted">Professional B2B narrative structure with bulleted takeaways</span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    const postContent =
                      typeof pkg.linkedinPost === "object" && "content" in pkg.linkedinPost
                        ? `${pkg.linkedinPost.hook || ""}\n\n${pkg.linkedinPost.content}\n\n${(pkg.linkedinPost.takeaways || []).join("\n")}\n\n${pkg.linkedinPost.cta || ""}`
                        : typeof pkg.linkedinPost === "string"
                        ? pkg.linkedinPost
                        : "";
                    handleCopy(postContent, "li-post");
                  }}
                  className="px-3 py-1.5 rounded-lg bg-surface-base hover:bg-surface-elevated border border-border text-xs text-white flex items-center gap-1.5 transition-colors"
                >
                  {copiedKey === "li-post" ? <Check className="w-3.5 h-3.5 text-neon-lime" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>Copy Post</span>
                </button>
              </div>

              {typeof pkg.linkedinPost === "object" && "content" in pkg.linkedinPost && (
                <div className="space-y-4">
                  <div>
                    <label className="text-2xs font-mono text-foreground-muted block mb-1">Hook Line</label>
                    <div className="p-3 rounded-lg bg-surface-base border border-border text-xs font-semibold text-white">
                      {pkg.linkedinPost.hook}
                    </div>
                  </div>

                  <div>
                    <label className="text-2xs font-mono text-foreground-muted block mb-1">Body Text</label>
                    <div className="p-4 rounded-lg bg-surface-base border border-border text-xs text-foreground leading-relaxed whitespace-pre-line font-sans">
                      {pkg.linkedinPost.content}
                    </div>
                  </div>

                  {pkg.linkedinPost.takeaways && (
                    <div>
                      <label className="text-2xs font-mono text-foreground-muted block mb-1">Key Takeaways</label>
                      <div className="p-3.5 rounded-lg bg-surface-base border border-border space-y-1.5 text-xs text-white">
                        {pkg.linkedinPost.takeaways.map((t, idx) => (
                          <div key={idx} className="flex items-start gap-2">
                            <span className="text-neon-indigo font-bold">•</span>
                            <span>{t}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="text-2xs font-mono text-foreground-muted block mb-1">Call to Action (CTA)</label>
                    <div className="p-3 rounded-lg bg-surface-base border border-border text-xs text-neon-cyan font-mono">
                      {pkg.linkedinPost.cta}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Newsletter View */}
          {activePlatform === "newsletter" && (
            <div className="p-5 rounded-xl border border-border bg-surface-panel space-y-5 animate-fadeIn">
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <div className="flex items-center gap-2.5">
                  <Mail className="w-5 h-5 text-neon-lime" />
                  <div>
                    <h2 className="text-sm font-bold text-white">Newsletter Excerpt / Substack Dispatch</h2>
                    <span className="text-2xs text-foreground-muted">Long-form editorial teardown with Markdown headings</span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    const nl =
                      typeof pkg.newsletterExcerpt === "object" && "body" in pkg.newsletterExcerpt
                        ? `${pkg.newsletterExcerpt.subjectLine}\n\n${pkg.newsletterExcerpt.previewText || ""}\n\n${pkg.newsletterExcerpt.body}`
                        : typeof pkg.newsletterExcerpt === "string"
                        ? pkg.newsletterExcerpt
                        : "";
                    handleCopy(nl, "newsletter");
                  }}
                  className="px-3 py-1.5 rounded-lg bg-surface-base hover:bg-surface-elevated border border-border text-xs text-white flex items-center gap-1.5 transition-colors"
                >
                  {copiedKey === "newsletter" ? <Check className="w-3.5 h-3.5 text-neon-lime" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>Copy Markdown</span>
                </button>
              </div>

              {typeof pkg.newsletterExcerpt === "object" && "subjectLine" in pkg.newsletterExcerpt && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-2xs font-mono text-foreground-muted block mb-1">Subject Line</label>
                      <div className="p-3 rounded-lg bg-surface-base border border-border text-xs font-bold text-white">
                        {pkg.newsletterExcerpt.subjectLine}
                      </div>
                    </div>
                    <div>
                      <label className="text-2xs font-mono text-foreground-muted block mb-1">Preview Snippet</label>
                      <div className="p-3 rounded-lg bg-surface-base border border-border text-xs text-foreground-muted">
                        {pkg.newsletterExcerpt.previewText}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="text-2xs font-mono text-foreground-muted block mb-1">Newsletter Body (Markdown)</label>
                    <pre className="p-4 rounded-lg bg-surface-base border border-border text-xs font-mono text-foreground whitespace-pre-wrap leading-relaxed max-h-[360px] overflow-y-auto">
                      {pkg.newsletterExcerpt.body}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* JSON Manifest View */}
          {activePlatform === "json" && (
            <div className="p-5 rounded-xl border border-border bg-surface-panel space-y-3 animate-fadeIn">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-bold uppercase tracking-wider text-neon-lime flex items-center gap-2">
                  <Eye className="w-4 h-4" /> RepurposingPackageSchema JSON Spec
                </h2>
                <span className="text-2xs font-mono text-neon-lime flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Validated Zod Package
                </span>
              </div>
              <pre className="p-4 rounded-lg bg-surface-base border border-border text-2xs font-mono text-neon-cyan/90 overflow-x-auto max-h-[480px]">
                {JSON.stringify(pkg, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
