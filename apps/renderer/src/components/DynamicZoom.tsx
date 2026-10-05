import React, { useMemo } from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import type { ZoomKeyframe } from "../types/index";

export interface DynamicZoomProps {
  keyframes?: ZoomKeyframe[];
  defaultScale?: number;
  children: React.ReactNode;
}

export const DynamicZoom: React.FC<DynamicZoomProps> = ({
  keyframes = [],
  defaultScale = 1.0,
  children,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const sortedKeyframes = useMemo(
    () => [...keyframes].sort((a, b) => a.frame - b.frame),
    [keyframes]
  );

  const { currentScale, currentFocalX, currentFocalY } = useMemo(() => {
    if (sortedKeyframes.length === 0) {
      return { currentScale: defaultScale, currentFocalX: 50, currentFocalY: 50 };
    }

    const firstKf = sortedKeyframes[0];
    if (!firstKf) {
      return { currentScale: defaultScale, currentFocalX: 50, currentFocalY: 50 };
    }

    // Before first keyframe
    if (frame < firstKf.frame) {
      return {
        currentScale: defaultScale,
        currentFocalX: firstKf.focalPoint.x,
        currentFocalY: firstKf.focalPoint.y,
      };
    }

    // Find the slot
    let targetIndex = sortedKeyframes.length - 1;
    for (let i = 0; i < sortedKeyframes.length; i++) {
      const kf = sortedKeyframes[i];
      if (kf && frame < kf.frame) {
        targetIndex = i - 1;
        break;
      }
    }

    const currentKf = sortedKeyframes[targetIndex] ?? firstKf;
    const nextKf = sortedKeyframes[targetIndex + 1];

    if (!nextKf) {
      return {
        currentScale: currentKf.scale,
        currentFocalX: currentKf.focalPoint.x,
        currentFocalY: currentKf.focalPoint.y,
      };
    }

    const transitionDuration = nextKf.durationInFrames;
    const progressStartFrame = nextKf.frame - transitionDuration;

    if (frame < progressStartFrame) {
      return {
        currentScale: currentKf.scale,
        currentFocalX: currentKf.focalPoint.x,
        currentFocalY: currentKf.focalPoint.y,
      };
    }

    const localProgressFrame = frame - progressStartFrame;

    let progression = 0;
    if (nextKf.easing === "spring") {
      progression = spring({
        frame: localProgressFrame,
        fps,
        config: {
          damping: 18,
          mass: 0.8,
          stiffness: 140,
          overshootClamping: false,
        },
      });
    } else {
      progression = interpolate(
        localProgressFrame,
        [0, transitionDuration],
        [0, 1],
        { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
      );
    }

    const scale = interpolate(progression, [0, 1], [currentKf.scale, nextKf.scale]);
    const focalX = interpolate(progression, [0, 1], [currentKf.focalPoint.x, nextKf.focalPoint.x]);
    const focalY = interpolate(progression, [0, 1], [currentKf.focalPoint.y, nextKf.focalPoint.y]);

    return {
      currentScale: scale,
      currentFocalX: focalX,
      currentFocalY: focalY,
    };
  }, [frame, fps, sortedKeyframes, defaultScale]);

  return (
    <AbsoluteFill
      style={{
        overflow: "hidden",
        transformOrigin: `${currentFocalX}% ${currentFocalY}%`,
        transform: `scale(${currentScale})`,
        willChange: "transform",
      }}
    >
      {children}
    </AbsoluteFill>
  );
};
