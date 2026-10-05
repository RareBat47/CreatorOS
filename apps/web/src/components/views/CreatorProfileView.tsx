"use client";

import React, { useState, useEffect } from "react";
import {
  CreatorProfileSchema,
  CreatorProfile,
  AudienceDetails,
} from "@creatoros/scene-schema";
import { initialCreatorProfile } from "@/data/defaultCreatorProfile";
import {
  UserCheck,
  Palette,
  ShieldAlert,
  Save,
  CheckCircle2,
  Layers,
  Flame,
  Radio,
  Eye,
  AtSign,
} from "lucide-react";

export function CreatorProfileView() {
  const [profile, setProfile] = useState<CreatorProfile>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("creatoros_brand_profile");
      if (saved) {
        try {
          return JSON.parse(saved) as CreatorProfile;
        } catch {
          // fallback to initial
        }
      }
    }
    return initialCreatorProfile;
  });

  const [saveStatus, setSaveStatus] = useState<"idle" | "saved" | "error">("idle");
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<"identity" | "audience" | "style" | "pillars" | "preview">("identity");

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("creatoros_brand_profile", JSON.stringify(profile));
      } catch {
        // ignore localStorage quota errors
      }
    }
  }, [profile]);

  // Validate profile against Zod schema and persist
  const handleValidateAndSave = () => {
    try {
      const parsed = CreatorProfileSchema.parse(profile);
      setProfile(parsed);
      if (typeof window !== "undefined") {
        localStorage.setItem("creatoros_brand_profile", JSON.stringify(parsed));
      }
      setValidationErrors([]);
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 3000);
    } catch (err: unknown) {
      if (err && typeof err === "object" && "errors" in err) {
        const zodErr = err as { errors: Array<{ path: (string | number)[]; message: string }> };
        setValidationErrors(zodErr.errors.map((e) => `${e.path.join(".")}: ${e.message}`));
      } else {
        setValidationErrors(["Failed to validate Creator Profile schema."]);
      }
      setSaveStatus("error");
    }
  };

  const audienceDetails = typeof profile.audience === "object" ? (profile.audience as AudienceDetails) : null;

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-background">
      {/* Top Header Rail */}
      <div className="h-14 px-6 border-b border-border bg-surface-panel/70 backdrop-blur flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-surface-base border border-neon-indigo/30">
            <UserCheck className="w-5 h-5 text-neon-indigo" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white flex items-center gap-2">
              Creator Onboarding & Brand Profile
              <span className="text-2xs font-mono px-2 py-0.5 rounded bg-surface-base text-neon-cyan border border-neon-cyan/30">
                @creatoros/scene-schema
              </span>
            </h1>
            <p className="text-xs text-foreground-muted">
              Define Creator DNA, Brand Handle, Tone of Voice, Visual Style, and Content Pillars
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {saveStatus === "saved" && (
            <span className="text-xs text-neon-lime flex items-center gap-1.5 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4" /> Validated & Saved Locally
            </span>
          )}
          {saveStatus === "error" && (
            <span className="text-xs text-neon-rose flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4" /> Schema Validation Failed
            </span>
          )}
          <button
            onClick={handleValidateAndSave}
            className="px-4 py-2 rounded-lg bg-neon-indigo hover:bg-neon-indigo/90 text-white text-xs font-semibold flex items-center gap-2 shadow-neon-glow-indigo transition-all cursor-pointer"
          >
            <Save className="w-4 h-4" />
            Validate & Save Profile
          </button>
        </div>
      </div>

      {/* Workspace Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Navigation Tabs */}
        <div className="w-56 border-r border-border bg-surface-base/50 p-3 space-y-1 shrink-0">
          {[
            { id: "identity", label: "Identity & Tone", icon: Radio },
            { id: "audience", label: "Audience Target", icon: Layers },
            { id: "style", label: "Visual Style & Colors", icon: Palette },
            { id: "pillars", label: "Content Pillars", icon: Flame },
            { id: "preview", label: "JSON Spec Preview", icon: Eye },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  active
                    ? "bg-surface-elevated text-white border border-neon-indigo/40 shadow-sm"
                    : "text-foreground-muted hover:text-white hover:bg-surface-hover"
                }`}
              >
                <Icon className={`w-4 h-4 ${active ? "text-neon-indigo" : "text-foreground-subtle"}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}

          {validationErrors.length > 0 && (
            <div className="mt-6 p-3 rounded-lg border border-neon-rose/40 bg-neon-rose/10 text-2xs text-neon-rose space-y-1">
              <div className="font-bold flex items-center gap-1">
                <ShieldAlert className="w-3.5 h-3.5" /> Schema Errors:
              </div>
              <ul className="list-disc pl-4 space-y-0.5">
                {validationErrors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Form Content Area */}
        <div className="flex-1 overflow-y-auto p-6 max-w-4xl space-y-6">
          {/* Identity & Tone */}
          {activeTab === "identity" && (
            <div className="space-y-5 animate-fadeIn">
              <div className="p-4 rounded-xl border border-border bg-surface-panel space-y-4">
                <h2 className="text-xs font-bold uppercase tracking-wider text-neon-cyan flex items-center gap-2">
                  <Radio className="w-4 h-4" /> Core Identity & Handle
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-2xs font-mono text-foreground-muted block mb-1">Creator Name</label>
                    <input
                      type="text"
                      value={profile.name}
                      onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-surface-base border border-border focus:border-neon-indigo text-xs text-white outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-2xs font-mono text-foreground-muted block mb-1 flex items-center gap-1">
                      <AtSign className="w-3 h-3 text-neon-cyan" /> Creator Handle / ID
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-xs font-mono text-neon-cyan">@</span>
                      <input
                        type="text"
                        value={profile.creatorId.replace(/^@/, "")}
                        onChange={(e) => setProfile({ ...profile, creatorId: e.target.value.trim() })}
                        placeholder="yourhandle"
                        className="w-full pl-7 pr-3 py-2 rounded-lg bg-surface-base border border-border focus:border-neon-indigo text-xs font-mono text-white outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-2xs font-mono text-foreground-muted block mb-1">Niche / Topic Focus</label>
                    <input
                      type="text"
                      value={profile.niche}
                      onChange={(e) => setProfile({ ...profile, niche: e.target.value })}
                      placeholder="e.g. AI Engineering & Cloud Infrastructure"
                      className="w-full px-3 py-2 rounded-lg bg-surface-base border border-border focus:border-neon-indigo text-xs text-white outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-2xs font-mono text-foreground-muted block mb-1">Tone of Voice</label>
                    <select
                      value={typeof profile.tone === "string" ? profile.tone : profile.tone[0]}
                      onChange={(e) => setProfile({ ...profile, tone: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-surface-base border border-border focus:border-neon-indigo text-xs text-white outline-none"
                    >
                      <option value="contrarian">Contrarian & Analytical</option>
                      <option value="authoritative">Authoritative Engineering</option>
                      <option value="storyteller">Narrative Storyteller</option>
                      <option value="cynical">Cynical Breakdown</option>
                      <option value="tactician">Tactical Operator</option>
                      <option value="casual-expert">Casual Expert</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-2xs font-mono text-foreground-muted block mb-1">Creator Bio / Premise</label>
                  <textarea
                    rows={3}
                    value={profile.bio || ""}
                    onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-surface-base border border-border focus:border-neon-indigo text-xs text-white outline-none"
                  />
                </div>
              </div>

              {/* Banned Words & Guardrails */}
              <div className="p-4 rounded-xl border border-border bg-surface-panel space-y-4">
                <h2 className="text-xs font-bold uppercase tracking-wider text-neon-rose flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4" /> Guardrails & Banned Terms
                </h2>
                <p className="text-2xs text-foreground-muted">
                  These terms will trigger validation rejections across idea generation and multi-model script prompts.
                </p>

                <div>
                  <label className="text-2xs font-mono text-foreground-muted block mb-1">
                    Banned Words (comma separated)
                  </label>
                  <input
                    type="text"
                    value={profile.bannedWords.join(", ")}
                    onChange={(e) =>
                      setProfile({
                        ...profile,
                        bannedWords: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg bg-surface-base border border-border focus:border-neon-rose text-xs text-white outline-none"
                  />
                </div>

                <div>
                  <label className="text-2xs font-mono text-foreground-muted block mb-1">
                    Forbidden Opening Clichés (comma separated)
                  </label>
                  <input
                    type="text"
                    value={(profile.forbiddenPhrases || []).join(", ")}
                    onChange={(e) =>
                      setProfile({
                        ...profile,
                        forbiddenPhrases: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg bg-surface-base border border-border focus:border-neon-rose text-xs text-white outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Audience Target */}
          {activeTab === "audience" && (
            <div className="p-4 rounded-xl border border-border bg-surface-panel space-y-4 animate-fadeIn">
              <h2 className="text-xs font-bold uppercase tracking-wider text-neon-indigo flex items-center gap-2">
                <Layers className="w-4 h-4" /> Audience Calibration
              </h2>

              <div>
                <label className="text-2xs font-mono text-foreground-muted block mb-1">Target Persona</label>
                <input
                  type="text"
                  value={audienceDetails ? audienceDetails.target : (profile.audience as string)}
                  onChange={(e) => {
                    if (audienceDetails) {
                      setProfile({
                        ...profile,
                        audience: { ...audienceDetails, target: e.target.value },
                      });
                    } else {
                      setProfile({ ...profile, audience: e.target.value });
                    }
                  }}
                  className="w-full px-3 py-2 rounded-lg bg-surface-base border border-border focus:border-neon-indigo text-xs text-white outline-none"
                />
              </div>

              {audienceDetails && (
                <>
                  <div>
                    <label className="text-2xs font-mono text-foreground-muted block mb-1">Demographics</label>
                    <input
                      type="text"
                      value={audienceDetails.demographics || ""}
                      onChange={(e) =>
                        setProfile({
                          ...profile,
                          audience: { ...audienceDetails, demographics: e.target.value },
                        })
                      }
                      className="w-full px-3 py-2 rounded-lg bg-surface-base border border-border focus:border-neon-indigo text-xs text-white outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-2xs font-mono text-foreground-muted block mb-1">
                      Pain Points (comma separated)
                    </label>
                    <textarea
                      rows={2}
                      value={(audienceDetails.painPoints || []).join(", ")}
                      onChange={(e) =>
                        setProfile({
                          ...profile,
                          audience: {
                            ...audienceDetails,
                            painPoints: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
                          },
                        })
                      }
                      className="w-full px-3 py-2 rounded-lg bg-surface-base border border-border focus:border-neon-indigo text-xs text-white outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-2xs font-mono text-foreground-muted block mb-1">
                      Desires & Aspirational Goals (comma separated)
                    </label>
                    <textarea
                      rows={2}
                      value={(audienceDetails.desires || []).join(", ")}
                      onChange={(e) =>
                        setProfile({
                          ...profile,
                          audience: {
                            ...audienceDetails,
                            desires: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
                          },
                        })
                      }
                      className="w-full px-3 py-2 rounded-lg bg-surface-base border border-border focus:border-neon-indigo text-xs text-white outline-none"
                    />
                  </div>
                </>
              )}
            </div>
          )}

          {/* Visual Style & Colors */}
          {activeTab === "style" && (
            <div className="p-4 rounded-xl border border-border bg-surface-panel space-y-5 animate-fadeIn">
              <h2 className="text-xs font-bold uppercase tracking-wider text-neon-cyan flex items-center gap-2">
                <Palette className="w-4 h-4" /> Remotion Brand Colors & Visual Style
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-2xs font-mono text-foreground-muted block mb-1">Primary Brand Color</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={profile.visualStyle.primaryColor || "#685AFF"}
                      onChange={(e) =>
                        setProfile({
                          ...profile,
                          visualStyle: { ...profile.visualStyle, primaryColor: e.target.value },
                        })
                      }
                      className="w-9 h-9 rounded bg-transparent border-0 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={profile.visualStyle.primaryColor || "#685AFF"}
                      onChange={(e) =>
                        setProfile({
                          ...profile,
                          visualStyle: { ...profile.visualStyle, primaryColor: e.target.value },
                        })
                      }
                      className="flex-1 px-2.5 py-1.5 rounded-lg bg-surface-base border border-border text-xs font-mono text-white outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-2xs font-mono text-foreground-muted block mb-1">Secondary Accent</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={profile.visualStyle.secondaryColor || "#06DCFB"}
                      onChange={(e) =>
                        setProfile({
                          ...profile,
                          visualStyle: { ...profile.visualStyle, secondaryColor: e.target.value },
                        })
                      }
                      className="w-9 h-9 rounded bg-transparent border-0 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={profile.visualStyle.secondaryColor || "#06DCFB"}
                      onChange={(e) =>
                        setProfile({
                          ...profile,
                          visualStyle: { ...profile.visualStyle, secondaryColor: e.target.value },
                        })
                      }
                      className="flex-1 px-2.5 py-1.5 rounded-lg bg-surface-base border border-border text-xs font-mono text-white outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-2xs font-mono text-foreground-muted block mb-1">Tertiary Accent</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={profile.visualStyle.accentColor || "#A855F7"}
                      onChange={(e) =>
                        setProfile({
                          ...profile,
                          visualStyle: { ...profile.visualStyle, accentColor: e.target.value },
                        })
                      }
                      className="w-9 h-9 rounded bg-transparent border-0 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={profile.visualStyle.accentColor || "#A855F7"}
                      onChange={(e) =>
                        setProfile({
                          ...profile,
                          visualStyle: { ...profile.visualStyle, accentColor: e.target.value },
                        })
                      }
                      className="flex-1 px-2.5 py-1.5 rounded-lg bg-surface-base border border-border text-xs font-mono text-white outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-2xs font-mono text-foreground-muted block mb-1">Typography Font Family</label>
                  <select
                    value={profile.visualStyle.fontFamily || "Inter, sans-serif"}
                    onChange={(e) =>
                      setProfile({
                        ...profile,
                        visualStyle: { ...profile.visualStyle, fontFamily: e.target.value },
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg bg-surface-base border border-border focus:border-neon-indigo text-xs text-white outline-none"
                  >
                    <option value="Inter, sans-serif">Inter (High-Legibility Geometric)</option>
                    <option value="JetBrains Mono, monospace">JetBrains Mono (Tabular Code)</option>
                    <option value="Syne, sans-serif">Syne (Bold Display Dynamic)</option>
                  </select>
                </div>

                <div>
                  <label className="text-2xs font-mono text-foreground-muted block mb-1">Kinetic Caption Style</label>
                  <select
                    value={profile.visualStyle.captionStyle || "karaoke"}
                    onChange={(e) =>
                      setProfile({
                        ...profile,
                        visualStyle: {
                          ...profile.visualStyle,
                          captionStyle: e.target.value as "karaoke" | "bold" | "minimal" | "highlight" | "glitch",
                        },
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg bg-surface-base border border-border focus:border-neon-indigo text-xs text-white outline-none"
                  >
                    <option value="karaoke">Karaoke Word-by-Word Highlight</option>
                    <option value="bold">High Impact Heavy Block</option>
                    <option value="minimal">Minimal Clean Line</option>
                    <option value="highlight">Accent Word Pop</option>
                    <option value="glitch">Cybernetic Glitch Fade</option>
                  </select>
                </div>
              </div>

              {/* Color Swatch Preview Card */}
              <div className="p-4 rounded-lg bg-surface-base border border-border flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-white block">Live Brand Palette Preview</span>
                  <span className="text-2xs text-foreground-muted">Applied to Remotion 9:16 Canvas rendering</span>
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className="w-8 h-8 rounded-full shadow-neon-glow-indigo border border-white/20 flex items-center justify-center text-2xs font-mono text-white"
                    style={{ backgroundColor: profile.visualStyle.primaryColor }}
                    title="Primary"
                  >
                    P
                  </div>
                  <div
                    className="w-8 h-8 rounded-full shadow-neon-glow-cyan border border-white/20 flex items-center justify-center text-2xs font-mono text-white"
                    style={{ backgroundColor: profile.visualStyle.secondaryColor }}
                    title="Secondary"
                  >
                    S
                  </div>
                  <div
                    className="w-8 h-8 rounded-full shadow-neon-glow-violet border border-white/20 flex items-center justify-center text-2xs font-mono text-white"
                    style={{ backgroundColor: profile.visualStyle.accentColor }}
                    title="Accent"
                  >
                    A
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Content Pillars */}
          {activeTab === "pillars" && (
            <div className="p-4 rounded-xl border border-border bg-surface-panel space-y-4 animate-fadeIn">
              <h2 className="text-xs font-bold uppercase tracking-wider text-neon-lime flex items-center gap-2">
                <Flame className="w-4 h-4" /> Content Pillars (Strategic Focus)
              </h2>

              <div className="space-y-3">
                {Array.isArray(profile.pillars) &&
                  profile.pillars.map((pillar, idx) => {
                    const isObj = typeof pillar === "object";
                    return (
                      <div key={idx} className="p-3 rounded-lg border border-border/80 bg-surface-base space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-white">
                            {isObj ? pillar.name : pillar}
                          </span>
                          <span className="text-2xs font-mono text-neon-cyan">Pillar #{idx + 1}</span>
                        </div>
                        {isObj && pillar.description && (
                          <p className="text-xs text-foreground-muted">{pillar.description}</p>
                        )}
                        {isObj && pillar.keywords && (
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {pillar.keywords.map((kw, ki) => (
                              <span
                                key={ki}
                                className="text-2xs px-2 py-0.5 rounded bg-surface-elevated text-foreground-muted border border-border/60"
                              >
                                #{kw}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* JSON Spec Preview */}
          {activeTab === "preview" && (
            <div className="p-4 rounded-xl border border-border bg-surface-panel space-y-3 animate-fadeIn">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-bold uppercase tracking-wider text-neon-cyan flex items-center gap-2">
                  <Eye className="w-4 h-4" /> Serialized Creator Profile JSON
                </h2>
                <span className="text-2xs font-mono text-foreground-subtle">
                  Validates against CreatorProfileSchema
                </span>
              </div>
              <pre className="p-4 rounded-lg bg-surface-base border border-border text-2xs font-mono text-neon-cyan/90 overflow-x-auto max-h-[480px]">
                {JSON.stringify(profile, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

