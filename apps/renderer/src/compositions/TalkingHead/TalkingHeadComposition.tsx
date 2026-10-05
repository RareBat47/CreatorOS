import React, { useMemo } from "react";
import {
  AbsoluteFill,
  Audio,
  OffthreadVideo,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import type { TalkingHeadProps } from "../../types/index";
import {
  BrandHeader,
  CTACard,
  DynamicZoom,
  KineticCaptions,
  ProgressBar,
} from "../../components/index";

export const TalkingHeadComposition: React.FC<TalkingHeadProps> = ({
  videoSrc,
  audioSrc,
  backgroundMusicSrc,
  backgroundMusicVolume = 0.12,
  brand = {},
  captions = [],
  captionStyle = "karaoke",
  zoomKeyframes = [],
  progressBarPosition = "top",
  patternInterruptInterval = 90,
  showBrandWatermark = true,
  showOutroCard = true,
  headline = "Master Creator Production with Remotion",
  ctaText = "Follow for More",
  ctaHandle = "@creatoros",
  totalDurationInFrames = 900,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const primaryColor = brand.primaryColor || "#00F0FF";
  const secondaryColor = brand.secondaryColor || "#FFFFFF";
  const fontFamily = brand.fontFamily || "Inter, sans-serif";

  // Outro transition timing (last 60 frames default)
  const outroDuration = brand.outroDurationInFrames || 60;
  const outroStartFrame = Math.max(0, totalDurationInFrames - outroDuration);
  const isOutroActive = frame >= outroStartFrame;

  const outroProgress = spring({
    frame: Math.max(0, frame - outroStartFrame),
    fps,
    config: { damping: 16, mass: 0.9, stiffness: 180 },
  });

  // Pattern interrupt subtle flash/scale trigger every N frames
  const patternInterruptTrigger =
    patternInterruptInterval > 0 &&
    frame > 0 &&
    frame < outroStartFrame &&
    frame % patternInterruptInterval < 4;

  const interruptScale = patternInterruptTrigger ? 1.03 : 1.0;

  // Background subtle gradient animation
  const bgHue = interpolate(frame, [0, totalDurationInFrames], [210, 260], {
    extrapolateRight: "clamp",
  });

  // Default zoom keyframes if none provided
  const activeZoomKeyframes = useMemo(() => {
    if (zoomKeyframes && zoomKeyframes.length > 0) return zoomKeyframes;
    return [
      { frame: 0, scale: 1.0, focalPoint: { x: 50, y: 40 }, easing: "spring" as const, durationInFrames: 15 },
      { frame: 90, scale: 1.15, focalPoint: { x: 50, y: 35 }, easing: "spring" as const, durationInFrames: 15 },
      { frame: 240, scale: 1.0, focalPoint: { x: 50, y: 45 }, easing: "spring" as const, durationInFrames: 18 },
      { frame: 360, scale: 1.2, focalPoint: { x: 50, y: 35 }, easing: "spring" as const, durationInFrames: 15 },
      { frame: 540, scale: 1.05, focalPoint: { x: 50, y: 40 }, easing: "spring" as const, durationInFrames: 15 },
    ];
  }, [zoomKeyframes]);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#08090C",
        overflow: "hidden",
        fontFamily,
      }}
    >
      {/* 1. Procedural Ambient Background Layer */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle at 50% 30%, hsl(${bgHue}, 60%, 14%) 0%, #050608 80%)`,
          zIndex: 0,
        }}
      >
        {/* Subtle geometric pattern interrupts / grid lines */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            opacity: 0.15,
            backgroundImage: `radial-gradient(rgba(255, 255, 255, 0.4) 1px, transparent 1px)`,
            backgroundSize: "48px 48px",
          }}
        />
        {/* Neon corner glow */}
        <div
          style={{
            position: "absolute",
            top: -200,
            right: -200,
            width: 600,
            height: 600,
            borderRadius: "50%",
            backgroundColor: primaryColor,
            filter: "blur(180px)",
            opacity: 0.18,
          }}
        />
      </AbsoluteFill>

      {/* 2. Talking Head Video Container with Dynamic Zooms */}
      <AbsoluteFill
        style={{
          zIndex: 10,
          transform: `scale(${interruptScale})`,
          transition: "transform 0.05s ease-out",
        }}
      >
        <DynamicZoom keyframes={activeZoomKeyframes} defaultScale={1.0}>
          {videoSrc ? (
            <OffthreadVideo
              src={videoSrc}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
              volume={0} // Managed via audio tracks below
            />
          ) : (
            <AbsoluteFill
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                backgroundColor: "#11141A",
              }}
            >
              <div
                style={{
                  width: 280,
                  height: 280,
                  borderRadius: "50%",
                  border: `4px solid ${primaryColor}`,
                  boxShadow: `0 0 50px ${primaryColor}66`,
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <span
                  style={{
                    color: secondaryColor,
                    fontSize: "36px",
                    fontWeight: 900,
                  }}
                >
                  TALKING HEAD
                </span>
              </div>
            </AbsoluteFill>
          )}
        </DynamicZoom>
      </AbsoluteFill>

      {/* 3. Dark Vignette overlay to keep captions and headers crisp */}
      <AbsoluteFill
        style={{
          zIndex: 20,
          pointerEvents: "none",
          background:
            "linear-gradient(180deg, rgba(0,0,0,0.5) 0%, transparent 20%, transparent 65%, rgba(0,0,0,0.75) 100%)",
        }}
      />

      {/* 4. Top/Bottom Progress Bar */}
      <ProgressBar
        totalDurationInFrames={totalDurationInFrames}
        barColor={primaryColor}
        position={progressBarPosition}
        offsetPx={progressBarPosition === "top" ? 140 : 160}
      />

      {/* 5. Brand Watermark Header */}
      {showBrandWatermark && <BrandHeader brand={brand} topOffset={180} />}

      {/* 6. Kinetic Word-by-Word Captions */}
      {captions.length > 0 && !isOutroActive && (
        <KineticCaptions
          tokens={captions}
          styleMode={captionStyle}
          brand={brand}
          bottomOffsetPx={340}
        />
      )}

      {/* 7. Outro CTA Card Layer */}
      {showOutroCard && isOutroActive && (
        <AbsoluteFill
          style={{
            zIndex: 45,
            backgroundColor: `rgba(5, 7, 10, ${0.88 * outroProgress})`,
            backdropFilter: `blur(${16 * outroProgress}px)`,
            WebkitBackdropFilter: `blur(${16 * outroProgress}px)`,
          }}
        >
          <CTACard
            headline={headline}
            subheadline="Automate High-Impact Short-Form Video"
            actionText={ctaText}
            handle={ctaHandle}
            brand={brand}
          />
        </AbsoluteFill>
      )}

      {/* 8. Audio Layer */}
      {audioSrc ? (
        <Audio src={audioSrc} volume={1.0} />
      ) : videoSrc ? (
        <Audio src={videoSrc} volume={1.0} />
      ) : null}

      {backgroundMusicSrc && (
        <Audio
          src={backgroundMusicSrc}
          volume={backgroundMusicVolume}
          loop
        />
      )}
    </AbsoluteFill>
  );
};
