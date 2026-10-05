# CreatorOS Timeline Editor & Remotion Engine Architecture

`docs/frontend/03-timeline-editor.md`

## 1. Executive Summary & Component Topology

The CreatorOS Timeline Editor is a high-performance, non-linear video editing environment built with Next.js, `@remotion/player`, Zustand, `@dnd-kit`, and the Web Audio API. It operates deterministically on a centralized data structure: the **Timeline Schema**. 

The architecture guarantees a hard separation between **composition state** (persisted declarative scene graphs), **playback state** (ephemeral transport/scrubbing runtime), and **canvas rendering contexts** (DOM/WebGL overlays).

```
+--------------------------------------------------------------------------------------------------------+
|                                      TimelineEditorRoot Container                                      |
|                                                                                                        |
|  +----------------------------------------------------+  +------------------------------------------+  |
|  |                  Viewport Panel                    |  |              Inspector Panel             |  |
|  |                                                    |  |                                          |  |
|  |  +----------------------------------------------+  |  |  +------------------------------------+  |  |
|  |  |             Remotion Player Core             |  |  |  |       LayerStylePropertiesPanel    |  |  |
|  |  |   - Dynamic Composition Root                 |  |  |  |   - Matrix Transform Visualizer    |  |  |
|  |  |   - Interpolated Spring/Tween Animations     |  |  |  |   - Drop Shadow & Filters (CSS)    |  |  |
|  |  |   - Frame-Locked Canvas Dimensions           |  |  |  |   - Blend Modes & Compositing      |  |  |
|  |  +----------------------------------------------+  |  |  +------------------------------------+  |  |
|  |  +----------------------------------------------+  |  |  +------------------------------------+  |  |
|  |  |       Interactive Transform Canvas           |  |  |  |      CaptionTypographyEditor       |  |  |
|  |  |   - Bounding Box Matrix Engine               |  |  |  |   - Font Weights, Tracking, Kerning|  |  |
|  |  |   - Direct-Manipulation Drag/Rotate Handles  |  |  |  |   - Token-Level Subtitle Splitting |  |  |
|  |  +----------------------------------------------+  |  |  +------------------------------------+  |  |
|  +----------------------------------------------------+  +------------------------------------------+  |
|                                                                                                        |
|  +--------------------------------------------------------------------------------------------------+  |
|  |                                      Transport Toolbar                                           |  |
|  |   [⏮ Skip Back] [⏵ / ⏸ Play/Pause] [⏭ Skip Next]   00:01:24:14 / 00:03:00:00   [Scale Zoom: ---o-]  |
|  +--------------------------------------------------------------------------------------------------+  |
|                                                                                                        |
|  +--------------------------------------------------------------------------------------------------+  |
|  |                                   Multi-Track Timeline Container                                 |  |
|  |                                                                                                  |  |
|  |  +--------------------------------------------------------------------------------------------+  |  |
|  |  | Playhead & Time Ruler (Scale Marker, Custom Scrub RAF Listener, Snap Targets Indicator)    |  |  |
|  |  +--------------------------------------------------------------------------------------------+  |  |
|  |  +--------------------+ +---------------------------------------------------------------------+  |  |
|  |  | Track Headers      | | Track Virtualized Lanes (Dnd-Kit Sortable Canvas)                   |  |  |
|  |  |                    | |                                                                     |  |  |
|  |  | [Track 1: Video]   | | [SceneBlock A (0-150)] --------> [SceneBlock B (151-320)]           |  |  |
|  |  | [Track 2: Captions]| |   [CaptionClip (30-90)]            [CaptionClip (160-240)]             |  |  |
|  |  | [Track 3: Audio]   | | [================ WaveformCanvas (Decoded AudioBuffer) ============] |  |  |
|  |  +--------------------+ +---------------------------------------------------------------------+  |  |
|  +--------------------------------------------------------------------------------------------------+  |
+--------------------------------------------------------------------------------------------------------+
```

---

## 2. Core State Schema & Interfaces

The entire state structure is serialized via immutable TypeScript interfaces. Every composition artifact is indexed by an absolute timeline frame count ($FPS = 30$ default).

```typescript
// types/timeline.ts

export type TrackType = 'video' | 'audio' | 'caption' | 'graphic';

export type BlendMode = 
  | 'normal' 
  | 'multiply' 
  | 'screen' 
  | 'overlay' 
  | 'darken' 
  | 'lighten' 
  | 'color-dodge' 
  | 'color-burn';

export interface TransformMatrix {
  x: number;          // Translation X in canvas px
  y: number;          // Translation Y in canvas px
  scale: number;      // Scale multiplier (1.0 = 100%)
  rotation: number;   // Angle in degrees (0 - 360)
  opacity: number;    // Normalized opacity [0.0 - 1.0]
}

export interface VisualFilters {
  blur: number;            // Radius in px
  brightness: number;      // Multiplier (1.0 = Default)
  contrast: number;        // Multiplier (1.0 = Default)
  saturate: number;        // Multiplier (1.0 = Default)
  dropShadowColor: string; // Hex/RGBA
  dropShadowBlur: number;  // Radius in px
  dropShadowX: number;     // Offset X in px
  dropShadowY: number;     // Offset Y in px
  blendMode: BlendMode;
}

export interface BaseClip {
  id: string;
  trackId: string;
  name: string;
  startFrame: number;      // Placement in timeline global frames
  durationInFrames: number;// Length of clip in frames
  offsetFrame: number;     // Trim offset within source asset
}

export interface VideoClip extends BaseClip {
  type: 'video';
  mediaUrl: string;
  volume: number;          // Decibel scalar [0.0 - 1.0]
  isMuted: boolean;
  transform: TransformMatrix;
  filters: VisualFilters;
}

export interface WordLevelToken {
  word: string;
  startFrame: number;
  endFrame: number;
  confidence: number;
}

export interface CaptionClip extends BaseClip {
  type: 'caption';
  text: string;
  words: WordLevelToken[];
  style: {
    fontFamily: string;
    fontSize: number;
    fontWeight: number;
    lineHeight: number;
    letterSpacing: number;
    color: string;
    strokeColor: string;
    strokeWidth: number;
    backgroundColor: string;
    highlightColor: string;
    alignment: 'left' | 'center' | 'right';
  };
  transform: TransformMatrix;
}

export interface AudioPeakData {
  peaks: number[];         // Normalized min/max float array [-1.0, 1.0]
  sampleRate: number;
}

export interface AudioClip extends BaseClip {
  type: 'audio';
  mediaUrl: string;
  volume: number;
  fadeInFrames: number;
  fadeOutFrames: number;
  waveformCached?: AudioPeakData;
}

export type TimelineClip = VideoClip | CaptionClip | AudioClip;

export interface TimelineTrack {
  id: string;
  name: string;
  type: TrackType;
  isLocked: boolean;
  isMuted: boolean;
  clips: TimelineClip[];
}

export interface TimelineComposition {
  id: string;
  fps: number;
  width: number;
  height: number;
  totalDurationInFrames: number;
  tracks: TimelineTrack[];
}
```

---

## 3. High-Performance Timeline State Store (Zustand)

Playback scrub position must run decoupled from the React render lifecycle to prevent high-frequency DOM reconciliation bottlenecks. The timeline state uses a split Zustand implementation separating high-frequency state (playback time, scrub RAF updates) from structural state (clips, tracks, style configurations).

```typescript
// stores/timelineStore.ts
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { TimelineComposition, TimelineClip, TimelineTrack } from '@/types/timeline';

interface EphemeralPlaybackSlice {
  currentFrame: number;
  isPlaying: boolean;
  timelineScale: number; // Pixels per frame
  isScrubbing: boolean;
  setCurrentFrame: (frame: number) => void;
  setIsPlaying: (isPlaying: boolean) => void;
  setTimelineScale: (scale: number) => void;
  setIsScrubbing: (isScrubbing: boolean) => void;
}

interface StructuralCompositionSlice {
  composition: TimelineComposition;
  selectedClipIds: string[];
  activeTrackId: string | null;
  history: {
    past: TimelineComposition[];
    future: TimelineComposition[];
  };
  
  // Actions
  selectClip: (clipId: string, exclusive?: boolean) => void;
  clearSelection: () => void;
  updateClipTransform: (clipId: string, transform: Partial<TimelineClip['transform']>) => void;
  updateClipPositions: (trackId: string, reorderedClips: TimelineClip[]) => void;
  trimClip: (clipId: string, edge: 'start' | 'end', deltaFrames: number) => void;
  commitToHistory: () => void;
  undo: () => void;
  redo: () => void;
}

export const usePlaybackStore = create<EphemeralPlaybackSlice>()((set) => ({
  currentFrame: 0,
  isPlaying: false,
  timelineScale: 0.5, // 1 frame = 0.5px default
  isScrubbing: false,
  setCurrentFrame: (frame) => set({ currentFrame: Math.max(0, frame) }),
  setIsPlaying: (isPlaying) => set({ isPlaying }),
  setTimelineScale: (timelineScale) => set({ timelineScale }),
  setIsScrubbing: (isScrubbing) => set({ isScrubbing }),
}));

export const useCompositionStore = create<StructuralCompositionSlice>()(
  devtools((set, get) => ({
    composition: {
      id: 'default-comp',
      fps: 30,
      width: 1920,
      height: 1080,
      totalDurationInFrames: 1800,
      tracks: [],
    },
    selectedClipIds: [],
    activeTrackId: null,
    history: {
      past: [],
      future: [],
    },

    commitToHistory: () => {
      const { composition, history } = get();
      set({
        history: {
          past: [...history.past.slice(-50), JSON.parse(JSON.stringify(composition))],
          future: [],
        },
      });
    },

    selectClip: (clipId, exclusive = true) => {
      set((state) => ({
        selectedClipIds: exclusive 
          ? [clipId] 
          : Array.from(new Set([...state.selectedClipIds, clipId])),
      }));
    },

    clearSelection: () => set({ selectedClipIds: [] }),

    updateClipTransform: (clipId, newTransforms) => {
      get().commitToHistory();
      set((state) => {
        const tracks = state.composition.tracks.map((track) => ({
          ...track,
          clips: track.clips.map((clip) => {
            if (clip.id !== clipId || !('transform' in clip)) return clip;
            return {
              ...clip,
              transform: { ...clip.transform, ...newTransforms },
            };
          }),
        }));
        return { composition: { ...state.composition, tracks } };
      });
    },

    updateClipPositions: (trackId, reorderedClips) => {
      get().commitToHistory();
      set((state) => ({
        composition: {
          ...state.composition,
          tracks: state.composition.tracks.map((t) => 
            t.id === trackId ? { ...t, clips: reorderedClips } : t
          ),
        },
      }));
    },

    trimClip: (clipId, edge, deltaFrames) => {
      get().commitToHistory();
      set((state) => {
        const tracks = state.composition.tracks.map((track) => ({
          ...track,
          clips: track.clips.map((clip) => {
            if (clip.id !== clipId) return clip;
            if (edge === 'start') {
              const boundedDelta = Math.min(
                deltaFrames, 
                clip.durationInFrames - 1
              );
              return {
                ...clip,
                startFrame: clip.startFrame + boundedDelta,
                durationInFrames: clip.durationInFrames - boundedDelta,
                offsetFrame: clip.offsetFrame + boundedDelta,
              };
            } else {
              const newDuration = Math.max(1, clip.durationInFrames + deltaFrames);
              return {
                ...clip,
                durationInFrames: newDuration,
              };
            }
          }),
        }));
        return { composition: { ...state.composition, tracks } };
      });
    },

    undo: () => {
      const { history, composition } = get();
      if (history.past.length === 0) return;
      const previous = history.past[history.past.length - 1];
      const newPast = history.past.slice(0, history.past.length - 1);
      set({
        composition: previous,
        history: {
          past: newPast,
          future: [composition, ...history.future],
        },
      });
    },

    redo: () => {
      const { history, composition } = get();
      if (history.future.length === 0) return;
      const next = history.future[0];
      const newFuture = history.future.slice(1);
      set({
        composition: next,
        history: {
          past: [...history.past, composition],
          future: newFuture,
        },
      });
    },
  }))
);
```

---

## 4. Remotion Dynamic Player Engine

The Remotion integration compiles the timeline schema into a parameterized composition graph utilizing `<Series>`, `<Sequence>`, and `<OffthreadVideo>`.

```tsx
// components/player/RootComposition.tsx
import React from 'react';
import { AbsoluteFill, Sequence, Video, Audio } from 'remotion';
import { TimelineComposition, VideoClip, CaptionClip, AudioClip } from '@/types/timeline';

export interface RootCompositionProps {
  composition: TimelineComposition;
}

export const RootComposition: React.FC<RootCompositionProps> = ({ composition }) => {
  return (
    <AbsoluteFill style={{ backgroundColor: '#000000', overflow: 'hidden' }}>
      {composition.tracks.map((track) => {
        if (track.isMuted) return null;
        return (
          <AbsoluteFill key={track.id} id={`track-${track.id}`}>
            {track.clips.map((clip) => {
              return (
                <Sequence
                  key={clip.id}
                  from={clip.startFrame}
                  durationInFrames={clip.durationInFrames}
                  layout="none"
                >
                  <ClipDispatcher clip={clip} />
                </Sequence>
              );
            })}
          </AbsoluteFill>
        );
      })}
    </AbsoluteFill>
  );
};

interface ClipDispatcherProps {
  clip: VideoClip | CaptionClip | AudioClip;
}

const ClipDispatcher: React.FC<ClipDispatcherProps> = ({ clip }) => {
  switch (clip.type) {
    case 'video':
      return (
        <AbsoluteFill
          style={{
            transform: `translate3d(${clip.transform.x}px, ${clip.transform.y}px, 0px) ` +
                       `rotate(${clip.transform.rotation}deg) ` +
                       `scale(${clip.transform.scale})`,
            opacity: clip.transform.opacity,
            filter: `blur(${clip.filters.blur}px) ` +
                    `brightness(${clip.filters.brightness}) ` +
                    `contrast(${clip.filters.contrast}) ` +
                    `saturate(${clip.filters.saturate}) ` +
                    `drop-shadow(${clip.filters.dropShadowX}px ${clip.filters.dropShadowY}px ${clip.filters.dropShadowBlur}px ${clip.filters.dropShadowColor})`,
            mixBlendMode: clip.filters.blendMode,
            transformOrigin: 'center center',
          }}
        >
          <Video
            src={clip.mediaUrl}
            volume={clip.volume}
            muted={clip.isMuted}
            startFrom={clip.offsetFrame}
            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
          />
        </AbsoluteFill>
      );

    case 'caption':
      return (
        <AbsoluteFill
          style={{
            transform: `translate3d(${clip.transform.x}px, ${clip.transform.y}px, 0px) ` +
                       `rotate(${clip.transform.rotation}deg) ` +
                       `scale(${clip.transform.scale})`,
            opacity: clip.transform.opacity,
            justifyContent: 'center',
            alignItems: 'center',
            pointerEvents: 'none',
          }}
        >
          <div
            style={{
              fontFamily: clip.style.fontFamily,
              fontSize: `${clip.style.fontSize}px`,
              fontWeight: clip.style.fontWeight,
              lineHeight: clip.style.lineHeight,
              letterSpacing: `${clip.style.letterSpacing}px`,
              color: clip.style.color,
              WebkitTextStroke: `${clip.style.strokeWidth}px ${clip.style.strokeColor}`,
              backgroundColor: clip.style.backgroundColor,
              textAlign: clip.style.alignment,
              padding: '8px 16px',
              borderRadius: '4px',
              display: 'inline-block',
            }}
          >
            {clip.text}
          </div>
        </AbsoluteFill>
      );

    case 'audio':
      return (
        <Audio
          src={clip.mediaUrl}
          volume={clip.volume}
          startFrom={clip.offsetFrame}
        />
      );

    default:
      return null;
  }
};
```

```tsx
// components/player/PlayerContainer.tsx
import React, { useRef, useEffect } from 'react';
import { Player, PlayerRef } from '@remotion/player';
import { useCompositionStore, usePlaybackStore } from '@/stores/timelineStore';
import { RootComposition } from './RootComposition';

export const PlayerContainer: React.FC = () => {
  const playerRef = useRef<PlayerRef>(null);
  const composition = useCompositionStore((s) => s.composition);
  const { currentFrame, setCurrentFrame, isPlaying, setIsPlaying, isScrubbing } = usePlaybackStore();

  // Playhead frame synchronization listener
  useEffect(() => {
    const player = playerRef.current;
    if (!player) return;

    const onFrameUpdate = () => {
      if (!isScrubbing) {
        setCurrentFrame(player.getCurrentFrame());
      }
    };

    player.addEventListener('frameupdate', onFrameUpdate);
    player.addEventListener('play', () => setIsPlaying(true));
    player.addEventListener('pause', () => setIsPlaying(false));

    return () => {
      player.removeEventListener('frameupdate', onFrameUpdate);
      player.removeEventListener('play', () => setIsPlaying(true));
      player.removeEventListener('pause', () => setIsPlaying(false));
    };
  }, [setCurrentFrame, setIsPlaying, isScrubbing]);

  // Scrub imperative binding
  useEffect(() => {
    const player = playerRef.current;
    if (!player) return;

    if (Math.abs(player.getCurrentFrame() - currentFrame) > 0.5) {
      player.seekTo(currentFrame);
    }
  }, [currentFrame]);

  // Transport state synchronization
  useEffect(() => {
    const player = playerRef.current;
    if (!player) return;

    if (isPlaying && !player.isPlaying()) {
      player.play();
    } else if (!isPlaying && player.isPlaying()) {
      player.pause();
    }
  }, [isPlaying]);

  return (
    <div className="relative flex items-center justify-center w-full h-[55vh] bg-neutral-950 border-b border-neutral-800 select-none">
      <Player
        ref={playerRef}
        component={RootComposition}
        inputProps={{ composition }}
        durationInFrames={Math.max(1, composition.totalDurationInFrames)}
        fps={composition.fps}
        compositionWidth={composition.width}
        compositionHeight={composition.height}
        style={{
          width: '100%',
          maxHeight: '100%',
          aspectRatio: `${composition.width} / ${composition.height}`,
        }}
        controls={false}
        autoPlay={false}
        loop
      />
    </div>
  );
};
```

---

## 5. Timeline Track & Clip Canvas Engine

The interactive scrubbing timeline calculates its dynamic horizontal axis using native linear interpolation. Rendering blocks leverage `@dnd-kit/core` with coordinate collision handlers for structural timeline modifications.

```tsx
// components/timeline/TimelineRuler.tsx
import React, { useRef, useCallback, useEffect } from 'react';
import { usePlaybackStore, useCompositionStore } from '@/stores/timelineStore';

export const TimelineRuler: React.FC = () => {
  const rulerRef = useRef<HTMLDivElement>(null);
  const { currentFrame, setCurrentFrame, timelineScale, setIsScrubbing } = usePlaybackStore();
  const totalFrames = useCompositionStore((s) => s.composition.totalDurationInFrames);
  const fps = useCompositionStore((s) => s.composition.fps);

  const calculateFrameFromMouseEvent = useCallback(
    (e: MouseEvent): number => {
      if (!rulerRef.current) return 0;
      const rect = rulerRef.current.getBoundingClientRect();
      const scrollOffset = rulerRef.current.scrollLeft;
      const offsetX = e.clientX - rect.left + scrollOffset;
      const computedFrame = Math.round(offsetX / timelineScale);
      return Math.max(0, Math.min(computedFrame, totalFrames));
    },
    [timelineScale, totalFrames]
  );

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsScrubbing(true);
    setCurrentFrame(calculateFrameFromMouseEvent(e.nativeEvent));

    const onMouseMove = (ev: MouseEvent) => {
      requestAnimationFrame(() => {
        setCurrentFrame(calculateFrameFromMouseEvent(ev));
      });
    };

    const onMouseUp = () => {
      setIsScrubbing(false);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  const totalWidth = totalFrames * timelineScale;
  const majorInterval = fps; // Tick mark every second
  const minorInterval = Math.max(1, Math.round(fps / 5));

  return (
    <div
      ref={rulerRef}
      onMouseDown={handleMouseDown}
      className="relative h-7 w-full bg-neutral-900 border-b border-neutral-800 cursor-ew-resize select-none overflow-hidden"
    >
      <div style={{ width: `${totalWidth}px` }} className="h-full relative">
        {Array.from({ length: Math.ceil(totalFrames / minorInterval) }).map((_, index) => {
          const frame = index * minorInterval;
          const isMajor = frame % majorInterval === 0;
          const left = frame * timelineScale;

          return (
            <div
              key={frame}
              className={`absolute bottom-0 border-l ${
                isMajor ? 'h-4 border-neutral-400' : 'h-2 border-neutral-700'
              }`}
              style={{ left: `${left}px` }}
            >
              {isMajor && (
                <span className="absolute -top-3.5 left-1 text-[9px] font-mono text-neutral-400">
                  {Math.floor(frame / fps)}s
                </span>
              )}
            </div>
          );
        })}

        {/* Global Playhead Needle */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-50 pointer-events-none"
          style={{ transform: `translateX(${currentFrame * timelineScale}px)` }}
        >
          <div className="w-2.5 h-2.5 bg-red-500 transform -translate-x-[4px] rotate-45" />
        </div>
      </div>
    </div>
  );
};
```

```tsx
// components/timeline/ClipBlock.tsx
import React, { useState } from 'react';
import { TimelineClip } from '@/types/timeline';
import { usePlaybackStore, useCompositionStore } from '@/stores/timelineStore';

interface ClipBlockProps {
  clip: TimelineClip;
}

export const ClipBlock: React.FC<ClipBlockProps> = ({ clip }) => {
  const timelineScale = usePlaybackStore((s) => s.timelineScale);
  const selectedClipIds = useCompositionStore((s) => s.selectedClipIds);
  const selectClip = useCompositionStore((s) => s.selectClip);
  const trimClip = useCompositionStore((s) => s.trimClip);

  const [isTrimming, setIsTrimming] = useState<'start' | 'end' | null>(null);

  const isSelected = selectedClipIds.includes(clip.id);
  const left = clip.startFrame * timelineScale;
  const width = clip.durationInFrames * timelineScale;

  const handleTrimMouseDown = (e: React.MouseEvent, edge: 'start' | 'end') => {
    e.stopPropagation();
    setIsTrimming(edge);
    const startX = e.clientX;

    const onMouseMove = (ev: MouseEvent) => {
      const deltaPx = ev.clientX - startX;
      const deltaFrames = Math.round(deltaPx / timelineScale);
      if (deltaFrames !== 0) {
        trimClip(clip.id, edge, deltaFrames);
      }
    };

    const onMouseUp = () => {
      setIsTrimming(null);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  const getBadgeColor = () => {
    switch (clip.type) {
      case 'video': return 'bg-blue-600/20 border-blue-500 text-blue-200';
      case 'caption': return 'bg-amber-600/20 border-amber-500 text-amber-200';
      case 'audio': return 'bg-emerald-600/20 border-emerald-500 text-emerald-200';
    }
  };

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        selectClip(clip.id, !e.shiftKey);
      }}
      className={`absolute top-1 bottom-1 rounded border overflow-hidden select-none cursor-pointer ${getBadgeColor()} ${
        isSelected ? 'ring-2 ring-white ring-offset-1 ring-offset-neutral-900 z-10' : ''
      }`}
      style={{
        left: `${left}px`,
        width: `${width}px`,
      }}
    >
      <div className="px-2 py-0.5 text-xs font-medium font-sans truncate pointer-events-none">
        {clip.name}
      </div>

      {/* Edge Trimming Grippers */}
      <div
        onMouseDown={(e) => handleTrimMouseDown(e, 'start')}
        className="absolute top-0 bottom-0 left-0 w-2 hover:bg-white/40 cursor-w-resize"
      />
      <div
        onMouseDown={(e) => handleTrimMouseDown(e, 'end')}
        className="absolute top-0 bottom-0 right-0 w-2 hover:bg-white/40 cursor-e-resize"
      />
    </div>
  );
};
```

---

## 6. Text & Caption Inspector Component

The inline Caption Editor exposes controls to modify typography, transform configurations, and apply time-sliced adjustments down to individual tokens.

```tsx
// components/inspector/CaptionInspector.tsx
import React from 'react';
import { useCompositionStore } from '@/stores/timelineStore';
import { CaptionClip } from '@/types/timeline';

export const CaptionInspector: React.FC = () => {
  const { composition, selectedClipIds, commitToHistory } = useCompositionStore();
  
  // Resolve primary selected caption clip
  const activeClip = composition.tracks
    .flatMap((t) => t.clips)
    .find((c): c is CaptionClip => c.id === selectedClipIds[0] && c.type === 'caption');

  if (!activeClip) {
    return (
      <div className="p-4 text-xs text-neutral-500 uppercase tracking-wider font-mono">
        No Caption Track Selected
      </div>
    );
  }

  const updateStyle = (key: keyof CaptionClip['style'], value: any) => {
    commitToHistory();
    useCompositionStore.setState((state) => ({
      composition: {
        ...state.composition,
        tracks: state.composition.tracks.map((track) => ({
          ...track,
          clips: track.clips.map((clip) => {
            if (clip.id !== activeClip.id) return clip;
            return {
              ...clip,
              style: { ...(clip as CaptionClip).style, [key]: value },
            };
          }),
        })),
      },
    }));
  };

  const updateText = (text: string) => {
    commitToHistory();
    useCompositionStore.setState((state) => ({
      composition: {
        ...state.composition,
        tracks: state.composition.tracks.map((track) => ({
          ...track,
          clips: track.clips.map((clip) => {
            if (clip.id !== activeClip.id) return clip;
            return { ...clip, text };
          }),
        })),
      },
    }));
  };

  return (
    <div className="flex flex-col gap-4 p-4 text-neutral-200 border-l border-neutral-800 w-80 bg-neutral-900/50">
      <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400">Typography Inspector</h3>
      
      <div className="flex flex-col gap-1.5">
        <label className="text-xs text-neutral-400">Caption Content</label>
        <textarea
          value={activeClip.text}
          onChange={(e) => updateText(e.target.value)}
          className="w-full h-20 p-2 bg-neutral-950 border border-neutral-700 rounded text-sm text-white resize-none focus:outline-none focus:border-blue-500"
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-neutral-400">Font Family</label>
          <select
            value={activeClip.style.fontFamily}
            onChange={(e) => updateStyle('fontFamily', e.target.value)}
            className="p-1.5 bg-neutral-950 border border-neutral-700 rounded text-xs text-white focus:outline-none"
          >
            <option value="Inter">Inter</option>
            <option value="Roboto">Roboto</option>
            <option value="Montserrat">Montserrat</option>
            <option value="Cabinet Grotesk">Cabinet Grotesk</option>
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs text-neutral-400">Font Size (px)</label>
          <input
            type="number"
            value={activeClip.style.fontSize}
            onChange={(e) => updateStyle('fontSize', Number(e.target.value))}
            className="p-1.5 bg-neutral-950 border border-neutral-700 rounded text-xs text-white focus:outline-none"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-neutral-400">Text Color</label>
          <input
            type="color"
            value={activeClip.style.color}
            onChange={(e) => updateStyle('color', e.target.value)}
            className="w-full h-8 bg-transparent border-0 rounded cursor-pointer"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-neutral-400">Stroke Color</label>
          <input
            type="color"
            value={activeClip.style.strokeColor}
            onChange={(e) => updateStyle('strokeColor', e.target.value)}
            className="w-full h-8 bg-transparent border-0 rounded cursor-pointer"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs text-neutral-400">Stroke Thickness: {activeClip.style.strokeWidth}px</label>
        <input
          type="range"
          min="0"
          max="12"
          step="0.5"
          value={activeClip.style.strokeWidth}
          onChange={(e) => updateStyle('strokeWidth', parseFloat(e.target.value))}
          className="w-full"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs text-neutral-400">Text Alignment</label>
        <div className="grid grid-cols-3 gap-1 bg-neutral-950 p-1 border border-neutral-700 rounded">
          {(['left', 'center', 'right'] as const).map((alignment) => (
            <button
              key={alignment}
              type="button"
              onClick={() => updateStyle('alignment', alignment)}
              className={`py-1 text-xs capitalize rounded ${
                activeClip.style.alignment === alignment ? 'bg-neutral-800 text-white font-bold' : 'text-neutral-400'
              }`}
            >
              {alignment}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
```

---

## 7. Visual Layer Styling Panel

This panel handles absolute transformations (translation, uniform scale, rotation around standard origins), canvas filters, and layer compositing for selected video tracks.

```tsx
// components/inspector/VisualLayerInspector.tsx
import React from 'react';
import { useCompositionStore } from '@/stores/timelineStore';
import { VideoClip, BlendMode } from '@/types/timeline';

export const VisualLayerInspector: React.FC = () => {
  const { composition, selectedClipIds, updateClipTransform, commitToHistory } = useCompositionStore();

  const activeClip = composition.tracks
    .flatMap((t) => t.clips)
    .find((c): c is VideoClip => c.id === selectedClipIds[0] && c.type === 'video');

  if (!activeClip) return null;

  const updateFilters = (key: keyof VideoClip['filters'], value: any) => {
    commitToHistory();
    useCompositionStore.setState((state) => ({
      composition: {
        ...state.composition,
        tracks: state.composition.tracks.map((track) => ({
          ...track,
          clips: track.clips.map((clip) => {
            if (clip.id !== activeClip.id) return clip;
            return {
              ...clip,
              filters: { ...(clip as VideoClip).filters, [key]: value },
            };
          }),
        })),
      },
    }));
  };

  const blendModes: BlendMode[] = [
    'normal',
    'multiply',
    'screen',
    'overlay',
    'darken',
    'lighten',
    'color-dodge',
    'color-burn',
  ];

  return (
    <div className="flex flex-col gap-4 p-4 text-neutral-200 border-l border-neutral-800 w-80 bg-neutral-900/50">
      <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400">Layer Style Properties</h3>

      {/* Spatial Transforms */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-[10px] text-neutral-400">Position X (px)</label>
          <input
            type="number"
            value={activeClip.transform.x}
            onChange={(e) => updateClipTransform(activeClip.id, { x: Number(e.target.value) })}
            className="w-full p-1 bg-neutral-950 border border-neutral-700 rounded text-xs text-white"
          />
        </div>
        <div>
          <label className="text-[10px] text-neutral-400">Position Y (px)</label>
          <input
            type="number"
            value={activeClip.transform.y}
            onChange={(e) => updateClipTransform(activeClip.id, { y: Number(e.target.value) })}
            className="w-full p-1 bg-neutral-950 border border-neutral-700 rounded text-xs text-white"
          />
        </div>
        <div>
          <label className="text-[10px] text-neutral-400">Scale Factor</label>
          <input
            type="number"
            step="0.05"
            value={activeClip.transform.scale}
            onChange={(e) => updateClipTransform(activeClip.id, { scale: parseFloat(e.target.value) })}
            className="w-full p-1 bg-neutral-950 border border-neutral-700 rounded text-xs text-white"
          />
        </div>
        <div>
          <label className="text-[10px] text-neutral-400">Rotation (deg)</label>
          <input
            type="number"
            value={activeClip.transform.rotation}
            onChange={(e) => updateClipTransform(activeClip.id, { rotation: Number(e.target.value) })}
            className="w-full p-1 bg-neutral-950 border border-neutral-700 rounded text-xs text-white"
          />
        </div>
      </div>

      <hr className="border-neutral-800" />

      {/* Compositing Controls */}
      <div className="flex flex-col gap-2">
        <label className="text-xs text-neutral-400">Blend Mode</label>
        <select
          value={activeClip.filters.blendMode}
          onChange={(e) => updateFilters('blendMode', e.target.value as BlendMode)}
          className="p-1.5 bg-neutral-950 border border-neutral-700 rounded text-xs text-white uppercase tracking-wider"
        >
          {blendModes.map((mode) => (
            <option key={mode} value={mode}>
              {mode}
            </option>
          ))}
        </select>
      </div>

      {/* Visual Sliders */}
      <div className="space-y-3">
        <div>
          <div className="flex justify-between text-xs text-neutral-400 mb-1">
            <span>Opacity</span>
            <span>{Math.round(activeClip.transform.opacity * 100)}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={activeClip.transform.opacity}
            onChange={(e) => updateClipTransform(activeClip.id, { opacity: parseFloat(e.target.value) })}
            className="w-full"
          />
        </div>

        <div>
          <div className="flex justify-between text-xs text-neutral-400 mb-1">
            <span>Blur</span>
            <span>{activeClip.filters.blur}px</span>
          </div>
          <input
            type="range"
            min="0"
            max="32"
            value={activeClip.filters.blur}
            onChange={(e) => updateFilters('blur', Number(e.target.value))}
            className="w-full"
          />
        </div>

        <div>
          <div className="flex justify-between text-xs text-neutral-400 mb-1">
            <span>Brightness</span>
            <span>{Math.round(activeClip.filters.brightness * 100)}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="2"
            step="0.05"
            value={activeClip.filters.brightness}
            onChange={(e) => updateFilters('brightness', parseFloat
