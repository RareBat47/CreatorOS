"use client";

import React, { useState, useEffect, useRef } from "react";
import { SceneSpec, SceneSpecSchema } from "@creatoros/scene-schema";
import { defaultSceneSpec } from "@/data/defaultSceneSpec";
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Layers,
  Type,
  Video,
  Music,
  Camera,
  CheckCircle2,
  Smartphone,
  Eye,
  Film,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function VideoEditorView() {
  const [sceneSpec, setSceneSpec] = useState<SceneSpec>(() => {
    try {
      return SceneSpecSchema.parse(defaultSceneSpec);
    } catch {
      return defaultSceneSpec;
    }
  });
  const [currentFrame, setCurrentFrame] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [activeTab, setActiveTab] = useState<"layers" | "timeline" | "captions" | "audio" | "camera" | "json">("layers");
  const [selectedLayerId, setSelectedLayerId] = useState<string>("layer-video-main");
  const [safeZoneEnabled, setSafeZoneEnabled] = useState(true);

  const totalFrames = sceneSpec.durationInFrames || 180;
  const fps = sceneSpec.fps || 30;
  const durationSec = (totalFrames / fps).toFixed(1);
  const currentSec = (currentFrame / fps).toFixed(1);

  // Playback timer loop
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        setCurrentFrame((prev) => {
          if (prev >= totalFrames - 1) {
            return 0;
          }
          return prev + 1;
        });
      }, 1000 / fps);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, totalFrames, fps]);

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleRestart = () => {
    setCurrentFrame(0);
  };

  const handleSeek = (frame: number) => {
    setCurrentFrame(Math.min(Math.max(0, frame), totalFrames - 1));
  };

  const handleResetSpec = () => {
    setSceneSpec(defaultSceneSpec);
    setCurrentFrame(0);
  };

  // Find active caption word based on current frame
  const captionWords =
    typeof sceneSpec.captions === "object" && "words" in sceneSpec.captions
      ? sceneSpec.captions.words || []
      : [];

  const activeCaptionWord = captionWords.find(
    (w) => currentFrame >= w.startFrame && currentFrame <= w.endFrame
  );

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-background">
      {/* Top Header Rail */}
      <div className="h-14 px-6 border-b border-border bg-surface-panel/70 backdrop-blur flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-surface-base border border-neon-cyan/30">
            <Video className="w-5 h-5 text-neon-cyan" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white flex items-center gap-2">
              Video Timeline & Scene Preview
              <span className="text-2xs font-mono px-2 py-0.5 rounded bg-surface-base text-neon-cyan border border-neon-cyan/30">
                Vertical 9:16 (1080x1920)
              </span>
            </h1>
            <p className="text-xs text-foreground-muted">
              Interactive 30 FPS playback canvas, kinetic caption preview, and scene layer track list
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setSafeZoneEnabled(!safeZoneEnabled)}
            className={cn(
              "px-3 py-1.5 rounded-lg border text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer",
              safeZoneEnabled
                ? "bg-neon-indigo/15 text-neon-cyan border-neon-cyan/40"
                : "bg-surface-base text-foreground-muted border-border"
            )}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Safe Zones: {safeZoneEnabled ? "ON" : "OFF"}</span>
          </button>
          <div className="text-2xs font-mono px-3 py-1.5 rounded-lg bg-surface-base border border-border text-foreground-muted">
            <span className="text-neon-lime">Frame: {currentFrame}</span> / {totalFrames} ({currentSec}s / {durationSec}s)
          </div>
        </div>
      </div>

      {/* Main Workspace Body */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Center: Vertical 9:16 Preview Canvas Player */}
        <div className="flex-1 flex flex-col items-center justify-center p-4 lg:p-6 bg-surface-base/30 relative overflow-hidden">
          {/* Ambient Studio Backlight */}
          <div className="absolute w-[450px] h-[450px] bg-neon-indigo/10 rounded-full blur-3xl pointer-events-none" />

          {/* 9:16 Canvas Phone Container */}
          <div className="relative w-full max-w-[320px] sm:max-w-[340px] aspect-[9/16] rounded-[32px] border-[3px] border-border-strong bg-[#030712] shadow-2xl overflow-hidden flex flex-col justify-between select-none">
            {/* Top Device Notch / Safe Area Indicator */}
            <div className="absolute top-0 inset-x-0 h-8 flex items-center justify-between px-6 z-30 pointer-events-none">
              <span className="text-[10px] font-mono text-white/40">9:16 Canvas</span>
              <div className="w-16 h-3.5 rounded-full bg-white/10" />
              <span className="text-[10px] font-mono text-white/40">{fps} FPS</span>
            </div>

            {/* Video Canvas Layers Surface */}
            <div className="relative flex-1 w-full h-full overflow-hidden flex items-center justify-center">
              {/* Layer 1: Background Ambient Mesh */}
              <div className="absolute inset-0 bg-gradient-to-b from-[#151921] via-[#090D14] to-[#030712]" />

              {/* Layer 2: Simulated Talking Head / Video Visual Layer */}
              <div
                className={cn(
                  "relative w-[86%] aspect-[9/13] rounded-2xl overflow-hidden border-2 shadow-2xl transition-all duration-300 flex items-center justify-center",
                  selectedLayerId === "layer-video-main" ? "border-neon-indigo" : "border-border"
                )}
                style={{
                  transform: `scale(${
                    sceneSpec.cameraMotion?.type === "zoom-in"
                      ? 1 + (currentFrame / totalFrames) * 0.08
                      : 1
                  })`,
                }}
              >
                {/* Simulated Video Stream Frame */}
                <div className="absolute inset-0 bg-gradient-to-tr from-slate-900 via-indigo-950/40 to-slate-800 flex flex-col items-center justify-center p-4 text-center">
                  <div className="w-16 h-16 rounded-full bg-neon-indigo/20 border border-neon-indigo/40 flex items-center justify-center mb-3">
                    <Video className="w-8 h-8 text-neon-cyan" />
                  </div>
                  <span className="text-xs font-bold text-white tracking-wide">
                    Alex Vance • Talking Head
                  </span>
                  <span className="text-[10px] font-mono text-neon-cyan/80 mt-1">
                    Layout: {sceneSpec.layout}
                  </span>
                </div>

                {/* Camera Motion Overlay Badge */}
                <div className="absolute top-3 left-3 px-2 py-0.5 rounded bg-black/60 backdrop-blur border border-white/20 text-[9px] font-mono text-neon-lime flex items-center gap-1">
                  <Camera className="w-3 h-3" />
                  {sceneSpec.cameraMotion?.type || "static"}
                </div>
              </div>

              {/* Layer 3: Hook Overlay Badge (Frames 0 - 90) */}
              {currentFrame < 90 && (
                <div className="absolute top-12 inset-x-6 z-20 flex justify-center animate-fadeIn">
                  <div className="px-3 py-1 rounded-full bg-neon-cyan/20 border border-neon-cyan text-neon-cyan text-[11px] font-bold tracking-wider uppercase backdrop-blur shadow-neon-glow-cyan flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3" />
                    <span>CONTRARIAN BREAKDOWN</span>
                  </div>
                </div>
              )}

              {/* Layer 4: Kinetic Captions Overlay */}
              <div className="absolute bottom-20 inset-x-4 z-20 flex flex-col items-center text-center pointer-events-none">
                <div className="bg-black/75 backdrop-blur-md px-4 py-2.5 rounded-xl border border-white/10 max-w-[90%] shadow-2xl">
                  <p className="text-sm font-black tracking-wide leading-relaxed text-white">
                    {captionWords.map((word, idx) => {
                      const isCurrent = activeCaptionWord?.text === word.text;
                      return (
                        <span
                          key={idx}
                          className={cn(
                            "inline-block mx-0.5 transition-all duration-100",
                            isCurrent
                              ? "text-neon-cyan scale-110 drop-shadow-[0_0_8px_#06DCFB]"
                              : "text-white/80"
                          )}
                        >
                          {word.text}
                        </span>
                      );
                    })}
                  </p>
                </div>
              </div>

              {/* TikTok / Reels Native Safe Zone Overlay Lines */}
              {safeZoneEnabled && (
                <div className="absolute inset-0 pointer-events-none z-30">
                  {/* Top Safe Area Margin (12%) */}
                  <div className="absolute top-0 inset-x-0 h-[12%] border-b border-dashed border-neon-rose/40 bg-neon-rose/5 flex items-end px-3 pb-1">
                    <span className="text-[9px] font-mono text-neon-rose">Top UI Cutout Safe Limit</span>
                  </div>
                  {/* Right Social Action Rail (Like, Comment, Share) */}
                  <div className="absolute right-0 top-[20%] bottom-[25%] w-14 border-l border-dashed border-neon-rose/40 bg-neon-rose/5 flex flex-col items-center justify-around py-2">
                    <span className="text-[8px] font-mono text-neon-rose -rotate-90">TikTok Rail</span>
                  </div>
                  {/* Bottom Caption Safe Margin (18%) */}
                  <div className="absolute bottom-0 inset-x-0 h-[18%] border-t border-dashed border-neon-rose/40 bg-neon-rose/5 flex items-start px-3 pt-1">
                    <span className="text-[9px] font-mono text-neon-rose">Bottom Title Safe Limit</span>
                  </div>
                </div>
              )}
            </div>

            {/* In-Canvas Playback Mini Transport Rail */}
            <div className="p-3 bg-surface-panel border-t border-border flex items-center justify-between z-30">
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePlayPause}
                  className="w-8 h-8 rounded-full bg-neon-indigo hover:bg-neon-indigo/90 text-white flex items-center justify-center transition-colors cursor-pointer"
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                </button>
                <button
                  onClick={handleRestart}
                  className="p-1.5 rounded-lg text-foreground-subtle hover:text-white cursor-pointer"
                  title="Restart"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>

              {/* Scrubbing Slider */}
              <input
                type="range"
                min={0}
                max={totalFrames - 1}
                value={currentFrame}
                onChange={(e) => handleSeek(Number(e.target.value))}
                className="w-36 accent-neon-cyan h-1.5 bg-surface-base rounded cursor-pointer"
              />

              <button
                onClick={() => setIsMuted(!isMuted)}
                className="p-1.5 rounded-lg text-foreground-subtle hover:text-white cursor-pointer"
              >
                {isMuted ? <VolumeX className="w-4 h-4 text-neon-rose" /> : <Volume2 className="w-4 h-4 text-neon-lime" />}
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Layer Inspector & Timeline Specs (Width 420px) */}
        <div className="w-full lg:w-[440px] border-t lg:border-t-0 lg:border-l border-border bg-surface-base/80 flex flex-col overflow-hidden shrink-0">
          {/* Tabs */}
          <div className="h-11 px-4 border-b border-border bg-surface-base flex items-center gap-1.5 overflow-x-auto shrink-0">
            {[
              { id: "layers", label: "Layers", icon: Layers },
              { id: "timeline", label: "Timeline", icon: Film },
              { id: "captions", label: "Captions", icon: Type },
              { id: "audio", label: "Audio", icon: Music },
              { id: "camera", label: "Camera", icon: Camera },
              { id: "json", label: "Spec", icon: Eye },
            ].map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className={cn(
                    "px-2.5 py-1 rounded text-2xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0",
                    active
                      ? "bg-surface-elevated text-white border border-neon-cyan/40"
                      : "text-foreground-muted hover:text-white hover:bg-surface-hover"
                  )}
                >
                  <Icon className={`w-3.5 h-3.5 ${active ? "text-neon-cyan" : "text-foreground-subtle"}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Inspector Content */}
          <div className="flex-1 p-5 overflow-y-auto space-y-4">
            {/* Visual Layers Tab */}
            {activeTab === "layers" && (
              <div className="space-y-3 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-neon-cyan flex items-center gap-1.5">
                    <Layers className="w-4 h-4" /> Visual Layer Stack
                  </h3>
                  <span className="text-2xs font-mono text-foreground-subtle">
                    {sceneSpec.visualLayers.length} Layers
                  </span>
                </div>

                <div className="space-y-2">
                  {sceneSpec.visualLayers.map((layer) => {
                    const isSelected = selectedLayerId === layer.id;
                    return (
                      <div
                        key={layer.id}
                        onClick={() => setSelectedLayerId(layer.id)}
                        className={cn(
                          "p-3 rounded-xl border transition-all cursor-pointer",
                          isSelected
                            ? "border-neon-cyan/80 bg-surface-panel shadow-sm"
                            : "border-border bg-surface-panel/70 hover:border-border-strong hover:bg-surface-panel"
                        )}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold text-white flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-neon-cyan" />
                            {layer.id}
                          </span>
                          <span className="text-2xs font-mono px-1.5 py-0.5 rounded bg-surface-base text-neon-indigo border border-border">
                            Type: {layer.type}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-2xs font-mono text-foreground-subtle pt-1">
                          <span>Start: {layer.startFrame || 0}f</span>
                          <span>Duration: {layer.durationInFrames || totalFrames}f</span>
                          <span>z-index: {layer.zIndex || 1}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Timeline Track View */}
            {activeTab === "timeline" && (
              <div className="space-y-4 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-neon-lime flex items-center gap-1.5">
                    <Film className="w-4 h-4" /> Layer Track List & Timeline
                  </h3>
                  <span className="text-2xs font-mono text-foreground-subtle">
                    {currentFrame}f / {totalFrames}f
                  </span>
                </div>

                {/* Visual Track Bars */}
                <div className="space-y-3">
                  <div className="space-y-1">
                    <div className="flex justify-between text-2xs font-mono text-foreground-muted">
                      <span>Track 1: Video (Talking Head)</span>
                      <span>0f - 180f</span>
                    </div>
                    <div className="h-6 w-full bg-surface-base rounded-md border border-border relative overflow-hidden">
                      <div className="absolute inset-y-0 left-0 right-0 bg-neon-indigo/30 border border-neon-indigo/60 rounded-md flex items-center px-2 text-[10px] font-mono text-neon-indigo">
                        layer-video-main
                      </div>
                      <div
                        className="absolute top-0 bottom-0 w-0.5 bg-neon-rose z-10"
                        style={{ left: `${(currentFrame / totalFrames) * 100}%` }}
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-2xs font-mono text-foreground-muted">
                      <span>Track 2: Hook Badge Overlay</span>
                      <span>0f - 90f</span>
                    </div>
                    <div className="h-6 w-full bg-surface-base rounded-md border border-border relative overflow-hidden">
                      <div className="absolute inset-y-0 left-0 w-1/2 bg-neon-cyan/30 border border-neon-cyan/60 rounded-md flex items-center px-2 text-[10px] font-mono text-neon-cyan">
                        layer-badge-hook
                      </div>
                      <div
                        className="absolute top-0 bottom-0 w-0.5 bg-neon-rose z-10"
                        style={{ left: `${(currentFrame / totalFrames) * 100}%` }}
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-2xs font-mono text-foreground-muted">
                      <span>Track 3: Kinetic Captions</span>
                      <span>0f - 180f</span>
                    </div>
                    <div className="h-6 w-full bg-surface-base rounded-md border border-border relative overflow-hidden">
                      <div className="absolute inset-y-0 left-0 right-0 bg-neon-violet/30 border border-neon-violet/60 rounded-md flex items-center px-2 text-[10px] font-mono text-neon-violet">
                        captions-karaoke (9 tokens)
                      </div>
                      <div
                        className="absolute top-0 bottom-0 w-0.5 bg-neon-rose z-10"
                        style={{ left: `${(currentFrame / totalFrames) * 100}%` }}
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-2xs font-mono text-foreground-muted">
                      <span>Track 4: Audio Bed</span>
                      <span>0f - 180f</span>
                    </div>
                    <div className="h-6 w-full bg-surface-base rounded-md border border-border relative overflow-hidden">
                      <div className="absolute inset-y-0 left-0 right-0 bg-neon-lime/20 border border-neon-lime/40 rounded-md flex items-center px-2 text-[10px] font-mono text-neon-lime">
                        Cyberpunk Undercurrent (Ducked)
                      </div>
                      <div
                        className="absolute top-0 bottom-0 w-0.5 bg-neon-rose z-10"
                        style={{ left: `${(currentFrame / totalFrames) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-surface-base border border-border flex items-center justify-between text-2xs">
                  <span className="text-foreground-muted">Scrub playhead:</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleSeek(0)}
                      className="px-2 py-0.5 rounded bg-surface-elevated text-white hover:bg-surface-hover"
                    >
                      Start
                    </button>
                    <button
                      onClick={() => handleSeek(90)}
                      className="px-2 py-0.5 rounded bg-surface-elevated text-white hover:bg-surface-hover"
                    >
                      Mid (3s)
                    </button>
                    <button
                      onClick={() => handleSeek(179)}
                      className="px-2 py-0.5 rounded bg-surface-elevated text-white hover:bg-surface-hover"
                    >
                      End
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Captions Tab */}
            {activeTab === "captions" && (
              <div className="space-y-4 animate-fadeIn">
                <h3 className="text-xs font-bold uppercase tracking-wider text-neon-cyan flex items-center gap-1.5">
                  <Type className="w-4 h-4" /> Kinetic Captions Configuration
                </h3>

                <div className="p-3 rounded-lg border border-border bg-surface-panel space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-foreground-muted">Style:</span>
                    <span className="font-mono text-neon-cyan capitalize">
                      {typeof sceneSpec.captions === "object" && "style" in sceneSpec.captions
                        ? sceneSpec.captions.style
                        : "karaoke"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-foreground-muted">Font Size:</span>
                    <span className="font-mono text-white">54px</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-foreground-muted">Highlight Color:</span>
                    <span className="font-mono text-neon-indigo">#685AFF</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <span className="text-2xs font-mono text-foreground-subtle uppercase">
                    Word-by-Word Timing ({captionWords.length} tokens)
                  </span>
                  <div className="max-h-60 overflow-y-auto space-y-1 pr-1">
                    {captionWords.map((word, idx) => {
                      const isActive = currentFrame >= word.startFrame && currentFrame <= word.endFrame;
                      return (
                        <div
                          key={idx}
                          className={cn(
                            "px-2.5 py-1.5 rounded-lg border flex items-center justify-between text-2xs font-mono transition-colors",
                            isActive
                              ? "border-neon-cyan bg-neon-cyan/10 text-neon-cyan font-bold"
                              : "border-border bg-surface-base text-foreground-muted"
                          )}
                        >
                          <span>&quot;{word.text}&quot;</span>
                          <span>
                            {word.startFrame}f - {word.endFrame}f
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Audio Track Tab */}
            {activeTab === "audio" && (
              <div className="space-y-4 animate-fadeIn">
                <h3 className="text-xs font-bold uppercase tracking-wider text-neon-violet flex items-center gap-1.5">
                  <Music className="w-4 h-4" /> Multi-Track Audio Engine
                </h3>

                <div className="p-4 rounded-xl border border-border bg-surface-panel space-y-3">
                  <div>
                    <label className="text-2xs font-mono text-foreground-muted block mb-1">
                      Background Music
                    </label>
                    <div className="text-xs font-bold text-white">
                      {sceneSpec.audioTrack?.musicTrack || "Cyberpunk Undercurrent 120BPM"}
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-2xs font-mono text-foreground-muted mb-1">
                      <span>Music Volume</span>
                      <span>20%</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      defaultValue={20}
                      className="w-full accent-neon-violet"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-2xs font-mono text-foreground-muted mb-1">
                      <span>Voiceover Volume</span>
                      <span>95%</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      defaultValue={95}
                      className="w-full accent-neon-violet"
                    />
                  </div>

                  <div className="pt-2 border-t border-border flex items-center justify-between text-2xs">
                    <span className="text-foreground-muted">Auto-Ducking:</span>
                    <span className="font-mono text-neon-lime">ENABLED</span>
                  </div>
                </div>
              </div>
            )}

            {/* Camera Motion Tab */}
            {activeTab === "camera" && (
              <div className="space-y-4 animate-fadeIn">
                <h3 className="text-xs font-bold uppercase tracking-wider text-neon-lime flex items-center gap-1.5">
                  <Camera className="w-4 h-4" /> Camera Motion & Transitions
                </h3>

                <div className="p-4 rounded-xl border border-border bg-surface-panel space-y-3">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-foreground-muted">Camera Motion Type:</span>
                    <span className="font-mono text-neon-lime font-bold">
                      {sceneSpec.cameraMotion?.type || "zoom-in"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-foreground-muted">Motion Intensity:</span>
                    <span className="font-mono text-white">moderate (1.08x)</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-foreground-muted">Transition:</span>
                    <span className="font-mono text-white">cut</span>
                  </div>
                </div>
              </div>
            )}

            {/* JSON Spec Tab */}
            {activeTab === "json" && (
              <div className="space-y-3 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-neon-cyan flex items-center gap-1.5">
                    <Eye className="w-4 h-4" /> SceneSpec Schema JSON
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="text-2xs font-mono text-neon-lime flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Validated
                    </span>
                    <button
                      onClick={handleResetSpec}
                      className="px-2 py-0.5 rounded bg-surface-base border border-border text-2xs font-mono text-foreground-muted hover:text-white"
                    >
                      Reset
                    </button>
                  </div>
                </div>
                <pre className="p-3 rounded-lg bg-surface-base border border-border text-2xs font-mono text-neon-cyan/90 overflow-x-auto max-h-[460px]">
                  {JSON.stringify(sceneSpec, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
