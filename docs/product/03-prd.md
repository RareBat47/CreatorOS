# 03 - Product Requirements Document (PRD): CreatorOS

## 1. Purpose & Objectives
CreatorOS enables creators to generate verified, branded video and multi-platform text assets from a single prompt or thesis statement. The objective of MVP v1 is to achieve full automation from raw concept to rendered Remotion video and repurposing package within 60 seconds.

## 2. Feature Requirements

### 2.1 Creator Brain (Memory Onboarding)
- **FR-1.1**: The system must allow users to input stable brand parameters: creator name, niche, audience ICP, primary tone, visual styling (brand colors, fonts, logo), and banned word lists.
- **FR-1.2**: The system must store episodic memory of all approved scripts, tested hook angles, and past topics.
- **FR-1.3**: The system must record performance data (views, 3s retention, average watch percentage) linked to specific video formats and hooks.

### 2.2 Model Council Ideation & Scripting
- **FR-2.1**: User enters a single topic or thesis statement.
- **FR-2.2**: Brainstormer agent generates at least 3 distinct hook types (Curiosity, Contrarian, Result).
- **FR-2.3**: Scriptwriter agent compiles a 30-60 second retention-optimized script divided into exact timestamped beats: Hook (0-3s), Tension (3-10s), Core Value (10-25s), Reframe (25-35s), CTA (35-45s).
- **FR-2.4**: Critic agent rigorously evaluates the draft against banned words, tone alignment, and retention benchmarks. If rejected, it requests automated revisions.

### 2.3 Scene Specification Compiler
- **FR-3.1**: The pipeline must compile the approved script into a valid JSON conforming strictly to `SceneSpecSchema`.
- **FR-3.2**: The Scene Spec must include layout selection, visual layer bindings, audio tracks, kinetic caption tokens, camera motion cues, and transitions.

### 2.4 Remotion Video Rendering
- **FR-4.1**: Programmatic rendering engine supporting 3 launch templates:
  1. Talking-Head with dynamic kinetic subtitles and B-roll overlays.
  2. Three Tips with animated step cards and counter graphics.
  3. Story Arc with emotional tension pacing and visual zoom emphasis.
- **FR-4.2**: Deterministic output in 9:16 vertical MP4 format at 1080x1920, 30fps.

### 2.5 Omni-Channel Repurposing Package
- **FR-5.1**: Alongside the video, the system must generate:
  - TikTok & YouTube Shorts title variants and hashtag clusters.
  - A 5-7 post Twitter/X thread with an engaging hook tweet.
  - A structured, formatted LinkedIn post with line breaks and CTA.
  - A newsletter section summarizing the core framework.
