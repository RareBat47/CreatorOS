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
import type { ThreeTipsProps, TipItem } from "../../types/index";
import {
  BrandHeader,
  CTACard,
  KineticCaptions,
  ProgressBar,
} from "../../components/index";

interface TipCardProps {
  tip: TipItem;
  primaryColor: string;
  accentColor: string;
  fontFamily: string;
}

const TipCard: React.FC<TipCardProps> = ({
  tip,
  primaryColor,
  accentColor: _accentColor,
  fontFamily,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const entrance = spring({
    frame,
    fps,
    config: { damping: 14, stiffness: 120, mass: 0.8 },
  });

  const badgeSpring = spring({
    frame: frame - 6,
    fps,
    config: { damping: 12, stiffness: 180, mass: 0.5 },
  });

  const cardScale = interpolate(entrance, [0, 1], [0.85, 1.0]);
  const cardTranslateY = interpolate(entrance, [0, 1], [100, 0]);
  const cardOpacity = interpolate(entrance, [0, 1], [0, 1]);

  const tipColor = tip.accentColor || primaryColor;

  return (
    <AbsoluteFill
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        padding: "0 54px",
      }}
    >
      {/* Floating Number Badge */}
      <div
        style={{
          transform: `scale(${interpolate(badgeSpring, [0, 1], [0, 1])})`,
          opacity: Math.max(0, interpolate(badgeSpring, [0, 1], [0, 1])),
          width: 104,
          height: 104,
          borderRadius: "50%",
          backgroundColor: tipColor,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          fontSize: 52,
          fontWeight: 900,
          color: "#08090C",
          marginBottom: -52,
          zIndex: 5,
          boxShadow: `0 12px 36px ${tipColor}88`,
          fontFamily,
        }}
      >
        {tip.tipNumber}
      </div>

      {/* Glassmorphic Content Card */}
      <div
        style={{
          transform: `scale(${cardScale}) translateY(${cardTranslateY}px)`,
          opacity: cardOpacity,
          width: "100%",
          backgroundColor: "rgba(18, 22, 32, 0.85)",
          backdropFilter: "blur(28px)",
          WebkitBackdropFilter: "blur(28px)",
          border: "1px solid rgba(255, 255, 255, 0.15)",
          borderRadius: "36px",
          padding: "84px 52px 64px 52px",
          boxShadow: "0 30px 80px rgba(0, 0, 0, 0.6)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
        }}
      >
        <span
          style={{
            fontFamily,
            fontSize: "20px",
            fontWeight: 800,
            color: tipColor,
            textTransform: "uppercase",
            letterSpacing: "0.15em",
            marginBottom: "16px",
          }}
        >
          {tip.badgeLabel}
        </span>

        <h2
          style={{
            fontFamily,
            fontSize: "56px",
            fontWeight: 900,
            color: "#FFFFFF",
            lineHeight: 1.15,
            margin: "0 0 28px 0",
            textShadow: "0 4px 20px rgba(0,0,0,0.6)",
          }}
        >
          {tip.headline}
        </h2>

        <p
          style={{
            fontFamily,
            fontSize: "32px",
            fontWeight: 500,
            color: "rgba(255, 255, 255, 0.8)",
            lineHeight: 1.4,
            margin: 0,
            maxWidth: "840px",
          }}
        >
          {tip.bodyText}
        </p>
      </div>
    </AbsoluteFill>
  );
};

const TransitionBlade: React.FC<{ color: string }> = ({ color }) => {
  const frame = useCurrentFrame();
  const DURATION = 16;

  const leftBladeX = interpolate(
    frame,
    [0, DURATION / 2, DURATION],
    [-100, 0, 100],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  const opacity = interpolate(
    frame,
    [0, DURATION * 0.3, DURATION * 0.7, DURATION],
    [0, 1, 1, 0]
  );

  return (
    <AbsoluteFill style={{ overflow: "hidden", zIndex: 30, pointerEvents: "none" }}>
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "52%",
          backgroundColor: color,
          transform: `translateX(${leftBladeX}%) skewX(-12deg)`,
          opacity,
          boxShadow: "0 0 60px rgba(0,0,0,0.7)",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          width: "100%",
          height: "52%",
          backgroundColor: "#FFFFFF",
          transform: `translateX(${-leftBladeX}%) skewX(-12deg)`,
          opacity,
          boxShadow: "0 0 60px rgba(0,0,0,0.7)",
        }}
      />
    </AbsoluteFill>
  );
};

export const ThreeTipsComposition: React.FC<ThreeTipsProps> = ({
  headline,
  subheadline,
  tips = [],
  captions = [],
  brand = {},
  backgroundMusicSrc,
  voiceoverUrl,
  totalDurationInFrames = 900,
}) => {
  const frame = useCurrentFrame();

  const primaryColor = brand.primaryColor || "#00FF88";
  const accentColor = brand.accentColor || "#FFE600";
  const fontFamily = brand.fontFamily || "Inter, sans-serif";

  // Intro scene duration (first 90 frames = 3s)
  const introDuration = tips[0]?.startFrame || 90;

  // Outro CTA starts after last tip
  const lastTip = tips[tips.length - 1];
  const ctaStartFrame = lastTip ? lastTip.startFrame + lastTip.durationInFrames : 810;
  const isCtaActive = frame >= ctaStartFrame;

  // Background Ken Burns pan/zoom
  const bgScale = interpolate(frame, [0, totalDurationInFrames], [1.0, 1.15], {
    extrapolateRight: "clamp",
  });
  const bgPan = interpolate(frame, [0, totalDurationInFrames], [0, -50], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#0B0C10",
        fontFamily,
        color: "#FFFFFF",
        overflow: "hidden",
      }}
    >
      {/* 1. Procedural Ambient Background Layer */}
      <AbsoluteFill
        style={{
          transform: `scale(${bgScale}) translateY(${bgPan}px)`,
          background: `radial-gradient(at 20% 20%, ${primaryColor}26 0px, transparent 50%),
                       radial-gradient(at 80% 80%, #0066FF26 0px, transparent 50%),
                       #0A0B0E`,
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            opacity: 0.12,
            backgroundImage: `radial-gradient(rgba(255, 255, 255, 0.4) 1px, transparent 1px)`,
            backgroundSize: "40px 40px",
          }}
        />
      </AbsoluteFill>

      {/* 2. Top Segmented Progress Bar */}
      <ProgressBar
        totalDurationInFrames={totalDurationInFrames}
        segmentsCount={tips.length + 2} // Intro + tips + CTA
        barColor={primaryColor}
        position="top"
        offsetPx={140}
      />

      {/* 3. Brand Watermark Header */}
      <BrandHeader brand={brand} topOffset={180} />

      {/* 4. Sequence Engine: Intro Hook */}
      <Sequence from={0} durationInFrames={introDuration} name="Scene: Intro Hook">
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
              backgroundColor: primaryColor,
              color: "#08090C",
              padding: "10px 24px",
              borderRadius: "999px",
              fontWeight: 900,
              fontSize: "24px",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              marginBottom: "32px",
              boxShadow: `0 8px 30px ${primaryColor}66`,
            }}
          >
            TOP 3 SECRETS
          </div>
          <h1
            style={{
              fontFamily,
              fontSize: "76px",
              lineHeight: 1.1,
              fontWeight: 900,
              margin: "0 0 24px 0",
              textShadow: "0 8px 32px rgba(0,0,0,0.8)",
            }}
          >
            {headline}
          </h1>
          {subheadline && (
            <p
              style={{
                fontFamily,
                fontSize: "30px",
                fontWeight: 500,
                color: "rgba(255, 255, 255, 0.75)",
                margin: 0,
                maxWidth: "760px",
              }}
            >
              {subheadline}
            </p>
          )}
        </AbsoluteFill>
      </Sequence>

      {/* 5. Sequence Engine: Tip Sections */}
      {tips.map((tip) => (
        <Sequence
          key={`tip-${tip.tipNumber}`}
          from={tip.startFrame}
          durationInFrames={tip.durationInFrames}
          name={`Scene: Tip ${tip.tipNumber}`}
        >
          <TipCard
            tip={tip}
            primaryColor={primaryColor}
            accentColor={accentColor}
            fontFamily={fontFamily}
          />
        </Sequence>
      ))}

      {/* 6. Transitions Between Tips */}
      {tips.map((tip, idx) => {
        if (tip.startFrame <= 0) return null;
        return (
          <Sequence
            key={`transition-${idx}`}
            from={tip.startFrame - 8}
            durationInFrames={16}
            name={`Transition: Tip ${tip.tipNumber}`}
          >
            <TransitionBlade color={primaryColor} />
          </Sequence>
        );
      })}

      {/* 7. Outro CTA Scene */}
      <Sequence
        from={ctaStartFrame}
        durationInFrames={totalDurationInFrames - ctaStartFrame}
        name="Scene: Outro CTA"
      >
        <CTACard
          headline="Save This For Later"
          subheadline="Follow for daily creator growth blueprints"
          actionText="Follow & Bookmark"
          handle={brand.handle || "@creatoros"}
          brand={brand}
        />
      </Sequence>

      {/* 8. Kinetic Captions if transcription tokens present */}
      {captions.length > 0 && !isCtaActive && (
        <KineticCaptions
          tokens={captions}
          styleMode="karaoke"
          brand={brand}
          bottomOffsetPx={320}
        />
      )}

      {/* 9. Audio Architecture */}
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
