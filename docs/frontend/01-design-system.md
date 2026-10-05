# CreatorOS Frontend Design System Specification

**Document ID:** `docs/frontend/01-design-system.md`  
**Status:** Canonical / Production-Ready  
**Domain:** Frontend Infrastructure, UI Architecture, Workbench Canvas Layout  
**Target Engine:** Next.js 14+ (App Router), Tailwind CSS v3.4+, shadcn/ui, Radix UI Primitives, Lucide Icons  

---

## 1. Architectural Philosophy & Principles

CreatorOS is a non-linear video editing, generative workflow, and publishing platform engineered for content creators. Its user interface is structured around a "workstation-first" mental model, prioritizing high-density telemetry, hardware-accelerated canvas surfaces, and low-latency feedback loops.

```
+-----------------------------------------------------------------------------------------+
|                                    CreatorOS Shell                                      |
+--------------------+-----------------------------------------------+--------------------+
|                    |             Primary Viewport / Canvas        |                    |
|                    |  +-----------------------------------------+  |                    |
|    Asset Library   |  |                                         |  |     Inspector      |
|    & Node Graph    |  |       16:9 / 9:16 Video Canvas          |  |     & Metadata     |
|                    |  |       Safe Zone Render Surface          |  |                    |
|    (Dense Tree)    |  |                                         |  |     (Properties)   |
|                    |  +-----------------------------------------+  |                    |
|                    +-----------------------------------------------+                    |
|                    |            Contextual Control Rail            |                    |
+--------------------+-----------------------------------------------+--------------------+
|                               Multi-Track Timeline Engine                               |
|   [Track 01: V1]   [==== Clip A ====] [=========== Clip B ===========] [== Clip C ==]   |
|   [Track 02: A1]   [====================== Audio L/R ===============================]   |
+-----------------------------------------------------------------------------------------+
```

### Core Design Tenets

1. **Dark-Mode Native (OLED Optimized):** Video production interfaces must mitigate eye strain during prolonged sessions and preserve accurate human perception of color grading. True dark grays and neutral blacks (`#0B0C0E`, `#121417`) form the backdrop to prevent chromatic adaptation bias.
2. **Neon Accent Semantics:** High-saturation neon tokens denote interaction states, playheads, rendering nodes, and compute status without visually conflicting with the canvas video layer.
3. **Information Density & Geometric Precision:** Interfaces utilize tight layout padding (2px to 8px base grid increments), zero-radius borders on critical timeline track seams, and sub-pixel alignment for millisecond scrubbing indicators.
4. **Framerate Stability (Zero Layout Shift):** Component variants, tooltips, flyouts, and layout resizers must execute transformations using GPU-accelerated compositing layers (`transform`, `opacity`) without triggering structural reflows within the canvas DOM.

---

## 2. Design Tokens & Color Space

The design system uses CSS Custom Properties calculated in the `HSL` color space with strict fallback maps. Accents are grouped into functional tiers: **Surfaces**, **Borders**, **Semantic Signals**, and **Neon Accelerators**.

### 2.1 Base & Functional Tokens (`globals.css`)

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    /* CreatorOS Core Surface System - Dark Mode Primary */
    --background: 224 71% 4%;            /* #030712 - Canvas Deep Void */
    --surface-base: 220 26% 8%;          /* #0F1319 - Root Application Shell */
    --surface-panel: 222 22% 11%;        /* #151921 - Default Docked Panel */
    --surface-elevated: 220 20% 14%;     /* #1C222C - Flyouts, Menus, Modals */
    --surface-hover: 223 18% 18%;        /* #262D3B - Interactive Surface State */
    --surface-active: 224 20% 22%;       /* #2D3545 - Active Segment / Drag State */
    
    /* Foreground / Typography Systems */
    --foreground: 210 20% 98%;          /* #F8FAFC - Primary High-Contrast Text */
    --foreground-muted: 215 16% 65%;    /* #94A3B8 - Secondary Metadata, Labels */
    --foreground-subtle: 215 12% 44%;   /* #64748B - Disabled, Placeholders */
    
    /* Structural Framing */
    --border-subtle: 220 18% 15%;       /* #1E242F - Panel Separation */
    --border-strong: 220 16% 24%;       /* #333C4D - Focus Outlines, Seams */
    --border-interactive: 250 84% 67%;  /* Indigo highlight ring */

    /* CreatorOS Neon Accelerators (Accents) */
    --neon-indigo: 246 80% 65%;         /* #685AFF - Primary Action, Keyframing */
    --neon-violet: 271 91% 65%;         /* #A855F7 - Magic AI / Generative Pipeline */
    --neon-cyan: 189 94% 53%;           /* #06DCFB - Audio Tracks, Vectors */
    --neon-lime: 135 94% 65%;           /* #4ADE80 - Safe Status, Active Timeline Run */
    --neon-amber: 38 92% 50%;           /* #F59E0B - Warning, Cache Miss, Render Hold */
    --neon-rose: 343 88% 60%;           /* #F43F5E - Recording State, Drop-Frame Alert */

    /* Timeline Specific Colorways */
    --timeline-track-video: 246 80% 65%;
    --timeline-track-audio: 189 94% 53%;
    --timeline-track-fx: 271 91% 65%;
    --timeline-playhead: 343 88% 60%;
    --timeline-in-out: 135 94% 65%;
    --timeline-ruler: 215 12% 44%;

    /* Standardized shadcn Mappings */
    --card: var(--surface-panel);
    --card-foreground: var(--foreground);
    --popover: var(--surface-elevated);
    --popover-foreground: var(--foreground);
    --primary: var(--neon-indigo);
    --primary-foreground: 210 20% 98%;
    --secondary: var(--surface-hover);
    --secondary-foreground: var(--foreground);
    --muted: var(--surface-elevated);
    --muted-foreground: var(--foreground-muted);
    --accent: var(--surface-hover);
    --accent-foreground: var(--foreground);
    --destructive: var(--neon-rose);
    --destructive-foreground: 210 20% 98%;
    --border: var(--border-subtle);
    --input: var(--border-strong);
    --ring: var(--neon-indigo);
    --radius: 0.375rem; /* 6px */
  }

  /* Force Dark Shell even if browser specifies light mode */
  .light {
    --background: 210 20% 98%;
    --surface-base: 220 14% 96%;
    --surface-panel: 0 0% 100%;
    --surface-elevated: 220 13% 91%;
    --surface-hover: 220 13% 86%;
    --surface-active: 220 14% 80%;
    --foreground: 224 71% 4%;
    --foreground-muted: 215 16% 47%;
    --foreground-subtle: 215 12% 60%;
    --border-subtle: 220 13% 91%;
    --border-strong: 220 13% 80%;
    --border-interactive: 246 80% 65%;
    --neon-indigo: 246 80% 60%;
    --neon-violet: 271 91% 60%;
    --neon-cyan: 189 94% 42%;
    --neon-lime: 135 94% 40%;
    --neon-amber: 38 92% 50%;
    --neon-rose: 343 88% 55%;
    --card: var(--surface-panel);
    --card-foreground: var(--foreground);
    --popover: var(--surface-panel);
    --popover-foreground: var(--foreground);
    --primary: var(--neon-indigo);
    --primary-foreground: 0 0% 100%;
    --secondary: var(--surface-hover);
    --secondary-foreground: var(--foreground);
    --muted: var(--surface-elevated);
    --muted-foreground: var(--foreground-muted);
    --accent: var(--surface-hover);
    --accent-foreground: var(--foreground);
    --destructive: var(--neon-rose);
    --destructive-foreground: 0 0% 100%;
    --border: var(--border-subtle);
    --input: var(--border-strong);
    --ring: var(--neon-indigo);
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground antialiased selection:bg-neon-indigo/30 selection:text-neon-cyan;
    font-feature-settings: "cv02", "cv03", "cv04", "cv11";
    text-rendering: optimizeLegibility;
  }
}
```

### 2.2 Token Semantics & Neon Accent Palette

| Token Identifier | Hex Equivalent | Visual Weight | System Application |
| :--- | :--- | :--- | :--- |
| `neon-indigo` | `#685AFF` | High Luminance | Primary active playhead, keyframe paths, primary CTAs |
| `neon-violet` | `#A855F7` | Mid-High Luminance | Generative AI models, neural filters, script-to-video tracks |
| `neon-cyan` | `#06DCFB` | Intense Spectral | Audio waveforms, audio scrubbers, peak visualizer meters |
| `neon-lime` | `#4ADE80` | High Contrast | Timeline render cached zone, export ready, lossless stream |
| `neon-amber` | `#F59E0B` | Mid Attention | Dropped frames indicator, GPU memory threshold warnings |
| `neon-rose` | `#F43F5E` | Critical Alarm | Live recording indicator, destructive action, stream interrupt |

---

## 3. Tailwind CSS Engine Configuration

The configuration file integrates the dynamic token layer, defines custom geometry variables for video-editing interfaces, and implements custom animations for the timeline scrubbing indicators and frame inspectors.

```typescript
// tailwind.config.ts
import type { Config } from "tailwindcss";
import plugin from "tailwindcss/plugin";

const config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1920px",
        "3xl": "2560px",
      },
    },
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
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      fontFamily: {
        sans: ["var(--font-satoshi)", "system-ui", "sans-serif"],
        display: ["var(--font-syne)", "sans-serif"],
        mono: ["var(--font-jetbrains-mono)", "monospace"],
      },
      fontSize: {
        "2xs": ["0.625rem", { lineHeight: "0.75rem", letterSpacing: "0.02em" }],
        "timeline-tick": ["0.5625rem", { lineHeight: "0.625rem", letterSpacing: "0.04em" }],
      },
      spacing: {
        "header-height": "48px",
        "dock-rail-width": "56px",
        "panel-min-width": "280px",
        "timeline-track-sm": "28px",
        "timeline-track-md": "44px",
        "timeline-track-lg": "64px",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "playhead-pulse": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.4" },
        },
        "border-glow": {
          "0%, 100%": { borderColor: "hsl(var(--neon-indigo) / 0.8)" },
          "50%": { borderColor: "hsl(var(--neon-violet) / 0.4)" },
        },
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "playhead-pulse": "playhead-pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "border-glow": "border-glow 3s ease-in-out infinite",
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
      boxShadow: {
        "neon-glow-indigo": "0 0 15px -3px hsl(var(--neon-indigo) / 0.45)",
        "neon-glow-violet": "0 0 15px -3px hsl(var(--neon-violet) / 0.45)",
        "neon-glow-cyan": "0 0 15px -3px hsl(var(--neon-cyan) / 0.45)",
        "canvas-drop": "0 10px 30px -10px rgba(0, 0, 0, 0.8)",
      },
    },
  },
  plugins: [
    require("tailwindcss-animate"),
    plugin(({ addUtilities }) => {
      addUtilities({
        ".scrollbar-none": {
          "-ms-overflow-style": "none",
          "scrollbar-width": "none",
          "&::-webkit-scrollbar": {
            display: "none",
          },
        },
        ".scrollbar-subtle": {
          "&::-webkit-scrollbar": {
            width: "4px",
            height: "4px",
          },
          "&::-webkit-scrollbar-track": {
            background: "hsl(var(--surface-base))",
          },
          "&::-webkit-scrollbar-thumb": {
            background: "hsl(var(--surface-hover))",
            borderRadius: "2px",
          },
          "&::-webkit-scrollbar-thumb:hover": {
            background: "hsl(var(--border-strong))",
          },
        },
      });
    }),
  ],
} satisfies Config;

export default config;
```

---

## 4. Typography Hierarchy & Font Loading Strategy

CreatorOS relies on three font layers to differentiate structural UI labels, creative headings, and timeline metrics.

1. **Display Layer: `Syne`**  
   Geometric, expressive, dynamic personality. Deployed exclusively for workspace headings, modal titles, export banners, and marketing engine cross-surfaces.
2. **Interface Layer: `Satoshi`**  
   Clean, high-legibility sans-serif with geometric curves and clear metrics. Optimized for dense component trees, inspector fields, context menus, and small-size input grids.
3. **Data & Timecode Layer: `JetBrains Mono`**  
   Monospaced typeface with tabular numerals enabled by default. Guarantees zero horizontal frame drift during high-frequency timecode rendering (e.g., `01:23:45:18`).

### 4.1 Next.js 14 Font Optimization Loader

```typescript
// app/fonts.ts
import { JetBrains_Mono } from "next/font/google";
import localFont from "next/font/local";

export const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const syne = localFont({
  src: [
    {
      path: "../public/fonts/Syne-Bold.woff2",
      weight: "700",
      style: "normal",
    },
    {
      path: "../public/fonts/Syne-ExtraBold.woff2",
      weight: "800",
      style: "normal",
    },
  ],
  variable: "--font-syne",
  display: "swap",
});

export const satoshi = localFont({
  src: [
    {
      path: "../public/fonts/Satoshi-Regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../public/fonts/Satoshi-Medium.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "../public/fonts/Satoshi-Bold.woff2",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-satoshi",
  display: "swap",
});
```

### 4.2 Type Hierarchy Specification Matrix

| Scale Identifier | Target Font | Weight | Size (rem / px) | Line Height | Tracking | Application |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `display-lg` | Syne | 800 | 2.25rem / 36px | 1.15 | -0.03em | Primary project headlines, export dashboards |
| `display-sm` | Syne | 700 | 1.25rem / 20px | 1.25 | -0.02em | Panel titles, workspace setup wizards |
| `ui-lg` | Satoshi | 700 | 0.875rem / 14px | 1.35 | -0.01em | Inspector Section Headers, Dialog Titles |
| `ui-base` | Satoshi | 500 | 0.8125rem / 13px | 1.4 | 0.00em | Property fields, labels, contextual buttons |
| `ui-xs` | Satoshi | 400 | 0.6875rem / 11px | 1.3 | +0.01em | Tooltips, asset meta tags, badge indicators |
| `mono-time` | JetBrains | 500 | 0.75rem / 12px | 1.0 | +0.02em | Primary SMPTE Playhead Timecode display |
| `mono-scrub` | JetBrains | 400 | 0.5625rem / 9px | 1.0 | +0.04em | Timeline ruler frame indexes (`00:00:15`) |

---

## 5. Icon System & Behavioral Guidelines

The CreatorOS iconography architecture wraps `lucide-react`. Every icon instance conforms to unified sizing brackets and optical weights.

### 5.1 Standardized Icon Wrapper Component

```typescript
// components/ui/icon.tsx
import * as React from "react";
import { LucideIcon, LucideProps } from "lucide-react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const iconVariants = cva("shrink-0 transition-colors duration-150 select-none", {
  variants: {
    size: {
      xs: "w-3 h-3 stroke-[1.75]",       // Track inline tools
      sm: "w-3.5 h-3.5 stroke-[1.75]",   // Inspector parameters
      default: "w-4 h-4 stroke-[1.5]",  // Core utility bars
      lg: "w-5 h-5 stroke-[1.5]",       // Media panel navigation
      xl: "w-6 h-6 stroke-[1.25]",      // Top-level modal icons
    },
    tone: {
      default: "text-foreground-muted hover:text-foreground",
      subtle: "text-foreground-subtle",
      active: "text-foreground",
      neonIndigo: "text-neon-indigo drop-shadow-[0_0_6px_hsl(var(--neon-indigo)/0.6)]",
      neonViolet: "text-neon-violet drop-shadow-[0_0_6px_hsl(var(--neon-violet)/0.6)]",
      neonCyan: "text-neon-cyan drop-shadow-[0_0_6px_hsl(var(--neon-cyan)/0.6)]",
      neonLime: "text-neon-lime drop-shadow-[0_0_6px_hsl(var(--neon-lime)/0.6)]",
      neonRose: "text-neon-rose drop-shadow-[0_0_6px_hsl(var(--neon-rose)/0.6)]",
      destructive: "text-neon-rose",
    },
  },
  defaultVariants: {
    size: "default",
    tone: "default",
  },
});

export interface IconComponentProps extends Omit<LucideProps, "size">, VariantProps<typeof iconVariants> {
  icon: LucideIcon;
  className?: string;
  "aria-label"?: string;
}

export const Icon = React.forwardRef<SVGSVGElement, IconComponentProps>(
  ({ icon: IconPrimitive, size, tone, className, "aria-label": ariaLabel, ...props }, ref) => {
    return (
      <IconPrimitive
        ref={ref}
        aria-hidden={!ariaLabel}
        aria-label={ariaLabel}
        role={ariaLabel ? "img" : "presentation"}
        className={cn(iconVariants({ size, tone }), className)}
        {...props}
      />
    );
  }
);
Icon.displayName = "Icon";
```

### 5.2 Iconography System Mappings

```
Edit Utilities:
  Selection Tool     --> MousePointer (size: sm)
  Razor / Blade Tool --> Scissors (size: sm, tone: neonRose on hover)
  Slip Tool          --> MoveHorizontal (size: sm)
  Keyframe Node      --> Diamond (size: xs, tone: neonIndigo)
  Snapping Engine    --> Magnet (size: sm)

Transport Utilities:
  Play / Pause       --> Play / Pause (size: default)
  Loop Playback      --> Repeat (size: sm)
  Frame Step         --> StepForward / StepBack (size: sm)
  Record Buffer      --> CircleDot (size: default, tone: neonRose)
```

---

## 6. shadcn/ui Component Customization Engine

The following components are customized to meet the high visual density, dark backgrounds, and neon states needed for audio-visual editing.

### 6.1 Button Component (`components/ui/button.tsx`)

```typescript
import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-xs font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-neon-indigo disabled:pointer-events-none disabled:opacity-40 active:scale-[0.98] select-none",
  {
    variants: {
      variant: {
        default:
          "bg-surface-elevated text-foreground hover:bg-surface-hover hover:text-white border border-border shadow-sm",
        primary:
          "bg-neon-indigo text-white hover:bg-neon-indigo/90 shadow-neon-glow-indigo border border-neon-indigo/30",
        magic:
          "bg-gradient-to-r from-neon-indigo via-neon-violet to-neon-indigo bg-[length:200%_auto] text-white hover:bg-right transition-all duration-300 shadow-neon-glow-violet border border-white/20",
        outline:
          "border border-border bg-transparent text-foreground-muted hover:bg-surface-hover hover:text-foreground",
        ghost:
          "text-foreground-muted hover:bg-surface-hover hover:text-foreground",
        destructive:
          "bg-neon-rose/10 text-neon-rose border border-neon-rose/20 hover:bg-neon-rose/20",
        toolbar:
          "bg-transparent text-foreground-muted hover:bg-surface-hover hover:text-foreground data-[active=true]:bg-surface-active data-[active=true]:text-neon-indigo data-[active=true]:border-b-2 data-[active=true]:border-neon-indigo rounded-none h-full",
      },
      size: {
        default: "h-8 px-3 py-1.5",
        xs: "h-6 px-2 text-2xs rounded-sm",
        sm: "h-7 px-2.5",
        lg: "h-10 px-6 text-sm",
        icon: "h-7 w-7 p-0",
        "icon-xs": "h-5 w-5 p-0 rounded-sm",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
```

### 6.2 Scrubbable Slider Component (`components/ui/slider.tsx`)

A custom implementation of the Radix Slider configured for sub-millisecond parameter adjustment and neon accent feedback.

```typescript
import * as React from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";
import { cn } from "@/lib/utils";

export interface SliderProps
  extends React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root> {
  neonTone?: "indigo" | "cyan" | "violet" | "rose" | "lime";
}

export const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  SliderProps
>(({ className, neonTone = "indigo", ...props }, ref) => {
  const toneMap = {
    indigo: "bg-neon-indigo shadow-[0_0_8px_hsl(var(--neon-indigo))]",
    cyan: "bg-neon-cyan shadow-[0_0_8px_hsl(var(--neon-cyan))]",
    violet: "bg-neon-violet shadow-[0_0_8px_hsl(var(--neon-violet))]",
    rose: "bg-neon-rose shadow-[0_0_8px_hsl(var(--neon-rose))]",
    lime: "bg-neon-lime shadow-[0_0_8px_hsl(var(--neon-lime))]",
  };

  return (
    <SliderPrimitive.Root
      ref={ref}
      className={cn(
        "relative flex w-full touch-none select-none items-center py-1 group cursor-ew-resize",
        className
      )}
      {...props}
    >
      <SliderPrimitive.Track className="relative h-1 w-full grow overflow-hidden rounded-full bg-surface-elevated group-hover:bg-surface-active transition-colors">
        <SliderPrimitive.Range className={cn("absolute h-full transition-all", toneMap[neonTone])} />
      </SliderPrimitive.Track>
      <SliderPrimitive.Thumb
        className={cn(
          "block h-3.5 w-3.5 rounded-full border border-white/60 bg-surface-base shadow-sm ring-offset-background transition-transform focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 group-hover:scale-125"
        )}
      />
    </SliderPrimitive.Root>
  );
});
Slider.displayName = SliderPrimitive.Root.displayName;
```

### 6.3 Surface Panel (Container Architecture)

```typescript
// components/ui/panel.tsx
import * as React from "react";
import { cn } from "@/lib/utils";

interface PanelProps extends React.HTMLAttributes<HTMLDivElement> {
  header?: React.ReactNode;
  actions?: React.ReactNode;
  noBorder?: boolean;
}

export const Panel = React.forwardRef<HTMLDivElement, PanelProps>(
  ({ className, header, actions, children, noBorder = false, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "flex flex-col h-full bg-surface-panel overflow-hidden",
          !noBorder && "border border-border",
          className
        )}
        {...props}
      >
        {header && (
          <div className="flex items-center justify-between h-9 px-3 border-b border-border bg-surface-base/50 shrink-0">
            <div className="text-ui-lg font-medium text-foreground tracking-tight select-none">
              {header}
            </div>
            {actions && <div className="flex items-center gap-1">{actions}</div>}
          </div>
        )}
        <div className="relative flex-1 overflow-auto scrollbar-subtle min-h-0">
          {children}
        </div>
      </div>
    );
  }
);
Panel.displayName = "Panel";
```

---

## 7. Video Canvas Layout Guidelines

The video canvas viewport is the central editing hub. It hosts the real-time compositor layer, transform bounds, and device-safe overlays.

```
+-----------------------------------------------------------------------------------------+
| [Viewport Root: Flex Centered Canvas Layer]                                             |
|                                                                                         |
|       +----------------- Virtual Aspect Frame (e.g. 16:9) -----------------+            |
|       |                                                                     |            |
|       |     +........... Action Safe Perimeter (93%) .............+         |            |
|       |     :                                                     :         |            |
|       |     :     +--------- Title Safe Perimeter (90%) --------+ :         |            |
|       |     :     |                                             | :         |            |
|       |     :     |                                             | :         |            |
|       |     :     |            Active Composition Layer         | :         |            |
|       |     :     |                                             | :         |            |
|       |     :     |                                             | :         |            |
|       |     :     +---------------------------------------------+ :         |            |
|       |     :.....................................................:         |            |
|       |                                                                     |            |
|       +---------------------------------------------------------------------+            |
|                                                                                         |
| [Sub-Canvas Floating Scrub HUD: Resolution, Zoom, Timecode, Safe Zone Toggles]          |
+-----------------------------------------------------------------------------------------+
```

### 7.1 Coordinate System & Aspect Framing

1. **Root Centering:** The target playback container sits within a flexible container (`flex items-center justify-center relative`) with overflow hidden.
2. **Aspect Preservation:** The video node avoids hardcoded dimensions in pixels. It operates via dynamic bounding computations using CSS `aspect-ratio` combined with inline max-width/max-height constraints based on container dimensions.
3. **Hardware Acceleration Context:** Canvas layers must be isolated via `transform: translateZ(0)` or `will-change: transform` to prevent canvas recalculations during timeline scrubs from invalidating the surrounding UI panels.

### 7.2 Aspect Ratio Presets Matrix

| Identifier | Aspect Expression | Target Output Channel | Nominal Safe Margins (H / V) |
| :--- | :--- | :--- | :--- |
| `16:9` | `aspect-video` (`16 / 9`) | YouTube / Desktop Landscape | 90% Title Safe / 93% Action Safe |
| `9:16` | `aspect-[9/16]` | TikTok / Instagram Reels / Shorts | Vertical Top Safe: 82%, Bottom Safe: 68% |
| `1:1` | `aspect-square` (`1 / 1`) | Social Media Stream Feeds | 90% Universal Margin |
| `4:5` | `aspect-[4/5]` | Instagram Feed Portrait | 85% Action Safe |
| `2.39:1` | `aspect-[2.39/1]` | Cinematic Anamorphic Delivery | 95% Action Safe |

---

## 8. Viewport Canvas & Safe Zone Implementation

This production component dynamically scales within any panel dimension, handles zooming, and renders safe zones, including mobile platform interaction cutouts (such as TikTok HUD profiles and buttons).

```typescript
// components/canvas/video-canvas.tsx
"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/ui/icon";
import { Maximize, ZoomIn, ZoomOut, Eye, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

export type AspectRatioType = "
