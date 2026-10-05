import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        surface: {
          base: "hsl(var(--surface-base))",
          panel: "hsl(var(--surface-panel))",
          elevated: "hsl(var(--surface-elevated))",
          hover: "hsl(var(--surface-hover))",
          active: "hsl(var(--surface-active))",
        },
        border: {
          DEFAULT: "hsl(var(--border-subtle))",
          subtle: "hsl(var(--border-subtle))",
          strong: "hsl(var(--border-strong))",
          interactive: "hsl(var(--border-interactive))",
        },
        neon: {
          indigo: "hsl(var(--neon-indigo))",
          violet: "hsl(var(--neon-violet))",
          cyan: "hsl(var(--neon-cyan))",
          lime: "hsl(var(--neon-lime))",
          amber: "hsl(var(--neon-amber))",
          rose: "hsl(var(--neon-rose))",
        },
        timeline: {
          track: {
            video: "hsl(var(--timeline-track-video))",
            audio: "hsl(var(--timeline-track-audio))",
            fx: "hsl(var(--timeline-track-fx))",
          },
          playhead: "hsl(var(--timeline-playhead))",
          inout: "hsl(var(--timeline-inout))",
          ruler: "hsl(var(--timeline-ruler))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "monospace"],
      },
      boxShadow: {
        "neon-glow-indigo": "0 0 15px -3px hsl(var(--neon-indigo) / 0.45)",
        "neon-glow-violet": "0 0 15px -3px hsl(var(--neon-violet) / 0.45)",
        "neon-glow-cyan": "0 0 15px -3px hsl(var(--neon-cyan) / 0.45)",
        "canvas-drop": "0 10px 30px -10px rgba(0, 0, 0, 0.8)",
      },
    },
  },
  plugins: [],
};

export default config;
