import React from "react";
import { AbsoluteFill, spring, useCurrentFrame, useVideoConfig } from "remotion";
import type { BrandTheme } from "../types/index";

export interface CTACardProps {
  headline?: string;
  subheadline?: string;
  actionText?: string;
  handle?: string;
  brand?: Partial<BrandTheme>;
  avatarUrl?: string;
}

export const CTACard: React.FC<CTACardProps> = ({
  headline = "Level Up Your Creative Flow",
  subheadline = "Automated Rendering Powered by CreatorOS",
  actionText = "Follow & Subscribe",
  handle = "@creatoros",
  brand = {},
  avatarUrl,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const primaryColor = brand.primaryColor || "#00F0FF";
  const secondaryColor = brand.secondaryColor || "#FFFFFF";
  const accentColor = brand.accentColor || "#FF0055";
  const fontFamily = brand.fontFamily || "Inter, sans-serif";

  const entrance = spring({
    frame,
    fps,
    config: { damping: 14, stiffness: 130, mass: 0.8 },
  });

  // Smooth continuous pulse loop for CTA button
  const pulse = Math.sin(frame / 6) * 0.03 + 1.0;

  return (
    <AbsoluteFill
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        padding: "0 64px",
        textAlign: "center",
        pointerEvents: "none",
        zIndex: 45,
      }}
    >
      {/* Avatar or Brand Icon */}
      <div
        style={{
          transform: `scale(${entrance})`,
          opacity: Math.max(0, Math.min(1, entrance)),
          width: 110,
          height: 110,
          borderRadius: "50%",
          backgroundColor: "rgba(255, 255, 255, 0.08)",
          border: `3px solid ${primaryColor}`,
          boxShadow: `0 0 32px ${primaryColor}66`,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          marginBottom: 32,
          overflow: "hidden",
        }}
      >
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt="Avatar"
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          <svg
            width="54"
            height="54"
            viewBox="0 0 24 24"
            fill="none"
            stroke={primaryColor}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polygon points="5 3 19 12 5 21 5 3" />
          </svg>
        )}
      </div>

      {/* Main Headline */}
      <h1
        style={{
          fontFamily,
          fontSize: "72px",
          fontWeight: 900,
          color: secondaryColor,
          lineHeight: 1.1,
          margin: "0 0 20px 0",
          textTransform: "uppercase",
          letterSpacing: "-0.02em",
          transform: `scale(${entrance}) translateY(${(1 - entrance) * 30}px)`,
          textShadow: `0 8px 30px rgba(0, 0, 0, 0.9)`,
        }}
      >
        {headline}
      </h1>

      {/* Subheadline */}
      <p
        style={{
          fontFamily,
          fontSize: "30px",
          fontWeight: 500,
          color: "rgba(255, 255, 255, 0.75)",
          margin: "0 0 44px 0",
          maxWidth: "800px",
          lineHeight: 1.35,
          opacity: Math.max(0, Math.min(1, entrance)),
        }}
      >
        {subheadline}
      </p>

      {/* Pulsing Action Button */}
      <div
        style={{
          transform: `scale(${entrance * pulse})`,
          backgroundColor: accentColor,
          padding: "24px 56px",
          borderRadius: "999px",
          boxShadow: `0 16px 48px ${accentColor}88`,
          display: "flex",
          alignItems: "center",
          gap: "16px",
        }}
      >
        <span
          style={{
            fontFamily,
            fontSize: "34px",
            fontWeight: 900,
            color: "#FFFFFF",
            letterSpacing: "0.02em",
            textTransform: "uppercase",
          }}
        >
          {actionText}
        </span>
        <svg
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M5 12h14M12 5l7 7-7 7" />
        </svg>
      </div>

      {/* Handle tag */}
      <span
        style={{
          fontFamily,
          fontSize: "24px",
          fontWeight: 700,
          color: primaryColor,
          marginTop: "24px",
          letterSpacing: "0.05em",
          opacity: Math.max(0, Math.min(1, entrance)),
        }}
      >
        {handle}
      </span>
    </AbsoluteFill>
  );
};
