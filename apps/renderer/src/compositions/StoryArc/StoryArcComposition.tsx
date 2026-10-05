import React from "react";
import {
  AbsoluteFill,
  Audio,
  Sequence,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import type { StoryArcBeat, StoryArcProps } from "../../types/index";
import {
  BrandHeader,
  CTACard,
  KineticCaptions,
  ProgressBar,
} from "../../components/index";

const ProblemBeat: React.FC<{ beat: StoryArcBeat; fontFamily: string }> = ({
  beat,
  fontFamily,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const entrance = spring({
    frame,
    fps,
    config: { damping: 10, stiffness: 180, mass: 0.6 },
  });

  const accent = beat.accentColor || "#FF2E54";
  const jitter = interpolate(Math.sin(frame * 0.8), [-1, 1], [-2, 2]);

  return (
    <AbsoluteFill
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        padding: "0 64px",
        textAlign: "center",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(circle at 50% 50%, ${accent}26 0%, transparent 70%)`,
        }}
      />
      <div
        style={{
          transform: `translateY(${(1 - entrance) * 60}px) translateX(${jitter}px)`,
          opacity: Math.max(0, entrance),
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <span
          style={{
            fontFamily,
            fontSize: "22px",
            letterSpacing: "0.2em",
            fontWeight: 800,
            color: accent,
            marginBottom: "20px",
            textTransform: "uppercase",
          }}
        >
          {beat.tag}
        </span>
        <h1
          style={{
            fontFamily,
            fontSize: "72px",
            fontWeight: 900,
            lineHeight: 1.1,
            color: "#FFFFFF",
            margin: "0 0 24px 0",
            maxWidth: "960px",
            textShadow: `0 8px 32px ${accent}55`,
          }}
        >
          {beat.headline}
        </h1>
        {beat.description && (
          <p
            style={{
              fontFamily,
              fontSize: "30px",
              color: "#A0A0B2",
              margin: 0,
              maxWidth: "760px",
              lineHeight: 1.4,
            }}
          >
            {beat.description}
          </p>
        )}
      </div>
    </AbsoluteFill>
  );
};

const MistakeBeat: React.FC<{ beat: StoryArcBeat; fontFamily: string }> = ({
  beat,
  fontFamily,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const accent = beat.accentColor || "#FF8A00";

  return (
    <AbsoluteFill
      style={{
        padding: "80px 72px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
      }}
    >
      <span
        style={{
          fontFamily,
          fontSize: "20px",
          fontWeight: 800,
          color: accent,
          letterSpacing: "0.15em",
          textTransform: "uppercase",
          marginBottom: "16px",
        }}
      >
        {beat.tag}
      </span>
      <h2
        style={{
          fontFamily,
          fontSize: "58px",
          color: "#FFFFFF",
          fontWeight: 900,
          margin: "0 0 36px 0",
          lineHeight: 1.15,
        }}
      >
        {beat.headline}
      </h2>

      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        {(beat.bulletPoints || []).map((attempt, idx) => {
          const itemSpring = spring({
            frame: frame - idx * 12,
            fps,
            config: { mass: 0.8, damping: 14, stiffness: 140 },
          });

          return (
            <div
              key={idx}
              style={{
                display: "flex",
                alignItems: "center",
                backgroundColor: "rgba(22, 27, 34, 0.8)",
                border: "1px solid rgba(255, 255, 255, 0.12)",
                borderRadius: "16px",
                padding: "20px 24px",
                transform: `translateX(${(1 - itemSpring) * -40}px)`,
                opacity: Math.max(0, itemSpring),
              }}
            >
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "50%",
                  backgroundColor: "rgba(255, 68, 68, 0.2)",
                  color: "#FF4444",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 900,
                  fontSize: "20px",
                  marginRight: "20px",
                  flexShrink: 0,
                }}
              >
                ✕
              </div>
              <span
                style={{
                  fontFamily,
                  fontSize: "28px",
                  color: "#94A3B8",
                  textDecoration: "line-through",
                  fontWeight: 600,
                }}
              >
                {attempt}
              </span>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

const RealizationBeat: React.FC<{ beat: StoryArcBeat; fontFamily: string }> = ({
  beat,
  fontFamily,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const accent = beat.accentColor || "#00FFA3";

  const pop = spring({
    frame,
    fps,
    config: { mass: 0.5, damping: 12, stiffness: 220 },
  });

  const glowSize = interpolate(Math.sin(frame * 0.1), [-1, 1], [300, 380]);

  return (
    <AbsoluteFill
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        padding: "0 64px",
        textAlign: "center",
      }}
    >
      <div
        style={{
          position: "absolute",
          width: glowSize,
          height: glowSize,
          borderRadius: "50%",
          backgroundColor: accent,
          filter: "blur(130px)",
          opacity: 0.25,
        }}
      />
      <span
        style={{
          fontFamily,
          fontSize: "22px",
          letterSpacing: "0.2em",
          fontWeight: 800,
          color: accent,
          textTransform: "uppercase",
          marginBottom: "16px",
        }}
      >
        {beat.tag}
      </span>
      {beat.metric && (
        <h1
          style={{
            fontFamily,
            fontSize: "100px",
            fontWeight: 900,
            color: "#FFFFFF",
            margin: "0 0 16px 0",
            transform: `scale(${pop})`,
            letterSpacing: "-0.02em",
            textShadow: `0 0 40px ${accent}88`,
          }}
        >
          {beat.metric}
        </h1>
      )}
      <p
        style={{
          fontFamily,
          fontSize: "34px",
          color: "#E2E8F0",
          margin: 0,
          maxWidth: "800px",
          lineHeight: 1.35,
          fontWeight: 600,
        }}
      >
        {beat.headline}
      </p>
    </AbsoluteFill>
  );
};

const LessonBeat: React.FC<{ beat: StoryArcBeat; fontFamily: string }> = ({
  beat,
  fontFamily,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const accent = beat.accentColor || "#00F0FF";

  return (
    <AbsoluteFill
      style={{
        padding: "80px 72px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
      }}
    >
      <span
        style={{
          fontFamily,
          fontSize: "20px",
          fontWeight: 800,
          color: accent,
          letterSpacing: "0.15em",
          textTransform: "uppercase",
          marginBottom: "16px",
        }}
      >
        {beat.tag}
      </span>
      <h2
        style={{
          fontFamily,
          fontSize: "52px",
          color: "#FFFFFF",
          fontWeight: 900,
          marginBottom: "36px",
          lineHeight: 1.15,
        }}
      >
        {beat.headline}
      </h2>

      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        {(beat.bulletPoints || []).map((point, idx) => {
          const itemAnim = spring({
            frame: frame - idx * 12,
            fps,
            config: { mass: 0.7, damping: 14, stiffness: 140 },
          });

          return (
            <div
              key={idx}
              style={{
                display: "flex",
                alignItems: "center",
                backgroundColor: "rgba(16, 20, 28, 0.8)",
                border: "1px solid rgba(255, 255, 255, 0.12)",
                borderRadius: "16px",
                padding: "20px 24px",
                opacity: Math.max(0, itemAnim),
                transform: `translateY(${(1 - itemAnim) * 20}px)`,
              }}
            >
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "10px",
                  backgroundColor: `${accent}22`,
                  color: accent,
                  border: `1px solid ${accent}55`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "18px",
                  fontWeight: 900,
                  marginRight: "20px",
                  flexShrink: 0,
                }}
              >
                0{idx + 1}
              </div>
              <span
                style={{
                  fontFamily,
                  fontSize: "28px",
                  color: "#FFFFFF",
                  fontWeight: 700,
                }}
              >
                {point}
              </span>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

export const StoryArcComposition: React.FC<StoryArcProps> = ({
  title: _title,
  beats,
  brand = {},
  captions = [],
  backgroundMusicSrc,
  voiceoverUrl,
  totalDurationInFrames = 900,
}) => {
  const frame = useCurrentFrame();

  const primaryColor = brand.primaryColor || "#00F0FF";
  const fontFamily = brand.fontFamily || "Inter, sans-serif";

  // Find CTA beat to know when to disable captions
  const ctaBeat = beats.find((b) => b.type === "cta");
  const isCtaActive = ctaBeat ? frame >= ctaBeat.startFrame : false;

  const renderBeat = (beat: StoryArcBeat) => {
    switch (beat.type) {
      case "problem":
        return <ProblemBeat beat={beat} fontFamily={fontFamily} />;
      case "mistake":
        return <MistakeBeat beat={beat} fontFamily={fontFamily} />;
      case "realization":
        return <RealizationBeat beat={beat} fontFamily={fontFamily} />;
      case "lesson":
        return <LessonBeat beat={beat} fontFamily={fontFamily} />;
      case "cta":
        return (
          <CTACard
            headline={beat.headline}
            subheadline={beat.description || "Deploy with CreatorOS"}
            actionText="Join The Movement"
            handle={brand.handle || "@creatoros"}
            brand={brand}
          />
        );
      default:
        return null;
    }
  };

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#07080B",
        fontFamily,
        color: "#FFFFFF",
        overflow: "hidden",
      }}
    >
      {/* 1. Procedural Noise / Glow Canvas */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(at 10% 10%, #FF005515 0px, transparent 50%),
                       radial-gradient(at 90% 90%, #00F0FF15 0px, transparent 50%),
                       #07080B`,
        }}
      />

      {/* 2. Top Segmented Progress Bar across 5 narrative beats */}
      <ProgressBar
        totalDurationInFrames={totalDurationInFrames}
        segmentsCount={beats.length}
        barColor={primaryColor}
        position="top"
        offsetPx={140}
      />

      {/* 3. Brand Header */}
      <BrandHeader brand={brand} topOffset={180} />

      {/* 4. Beat Sequences */}
      {beats.map((beat, idx) => (
        <Sequence
          key={`beat-${beat.type}-${idx}`}
          from={beat.startFrame}
          durationInFrames={beat.durationInFrames}
          name={`Beat: ${beat.type}`}
        >
          {renderBeat(beat)}
        </Sequence>
      ))}

      {/* 5. Kinetic Captions */}
      {captions.length > 0 && !isCtaActive && (
        <KineticCaptions
          tokens={captions}
          styleMode="karaoke"
          brand={brand}
          bottomOffsetPx={320}
        />
      )}

      {/* 6. Audio Architecture */}
      {voiceoverUrl && <Audio src={voiceoverUrl} volume={1.0} />}
      {backgroundMusicSrc && (
        <Audio
          src={backgroundMusicSrc}
          volume={0.12}
          loop
        />
      )}
    </AbsoluteFill>
  );
};
