"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sparkles,
  LayoutDashboard,
  UserCheck,
  Wand2,
  Video,
  Share2,
  Settings,
  ChevronRight,
  Flame,
  Layers,
  Activity,
  Menu,
  X,
  Palette,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ShellLayoutProps {
  children: React.ReactNode;
}

export function ShellLayout({ children }: ShellLayoutProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    {
      title: "Dashboard",
      href: "/",
      icon: LayoutDashboard,
      badge: null,
    },
    {
      title: "Brand Profile",
      href: "/onboarding",
      aliases: ["/profile"],
      icon: UserCheck,
      badge: "DNA",
      accent: "text-neon-indigo",
    },
    {
      title: "Script Studio",
      href: "/studio",
      aliases: ["/create"],
      icon: Wand2,
      badge: "AI",
      accent: "text-neon-violet",
    },
    {
      title: "Video Editor",
      href: "/editor",
      aliases: ["/preview"],
      icon: Video,
      badge: "9:16",
      accent: "text-neon-cyan",
    },
    {
      title: "Repurpose Hub",
      href: "/repurpose",
      aliases: [],
      icon: Share2,
      badge: "6x",
      accent: "text-neon-lime",
    },
  ];

  const isActive = (item: (typeof navItems)[number]) => {
    if (pathname === item.href) return true;
    if (item.aliases && item.aliases.some((alias) => pathname.startsWith(alias))) return true;
    return false;
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background">
      {/* Sidebar for Desktop */}
      <aside className="hidden md:flex flex-col w-64 border-r border-border bg-surface-base shrink-0 select-none">
        {/* Brand / Logo */}
        <div className="h-14 px-5 flex items-center justify-between border-b border-border bg-surface-base/80">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-neon-indigo via-neon-violet to-neon-cyan p-[1.5px] shadow-neon-glow-indigo">
              <div className="w-full h-full bg-surface-base rounded-[6px] flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-neon-cyan group-hover:rotate-12 transition-transform" />
              </div>
            </div>
            <div>
              <span className="font-black text-sm tracking-tight text-white block">
                CREATOR<span className="text-neon-indigo">OS</span>
              </span>
              <span className="text-[10px] text-foreground-subtle uppercase tracking-wider block font-mono">
                Remotion 4.0
              </span>
            </div>
          </Link>

          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-neon-lime opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-neon-lime" />
          </span>
        </div>

        {/* Brand Profile Quick Card */}
        <div className="p-3 mx-3 mt-3 rounded-lg border border-border/80 bg-surface-panel/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-neon-indigo/20 border border-neon-indigo/40 flex items-center justify-center text-xs font-bold text-neon-indigo">
              TC
            </div>
            <div className="overflow-hidden">
              <div className="text-xs font-semibold text-white truncate">Tech Contrarian</div>
              <div className="text-[10px] text-foreground-muted flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-neon-violet" />
                Archetype: Contrarian
              </div>
            </div>
          </div>
        </div>

        {/* Main Navigation Links */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          <div className="text-[10px] uppercase font-bold text-foreground-subtle tracking-wider px-3 py-1.5">
            Workspaces
          </div>
          {navItems.map((item) => {
            const active = isActive(item);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all group",
                  active
                    ? "bg-surface-elevated text-white border border-border-interactive/40 shadow-sm"
                    : "text-foreground-muted hover:text-white hover:bg-surface-hover"
                )}
              >
                <div className="flex items-center gap-2.5">
                  <Icon
                    className={cn(
                      "w-4 h-4 transition-colors",
                      active ? item.accent || "text-neon-indigo" : "text-foreground-subtle group-hover:text-white"
                    )}
                  />
                  <span>{item.title}</span>
                </div>
                {item.badge && (
                  <span
                    className={cn(
                      "text-[10px] font-mono px-1.5 py-0.2 rounded border",
                      active
                        ? "bg-surface-base text-neon-cyan border-neon-cyan/30"
                        : "bg-surface-base text-foreground-subtle border-border"
                    )}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}

          <div className="pt-4">
            <div className="text-[10px] uppercase font-bold text-foreground-subtle tracking-wider px-3 py-1.5">
              Pipelines
            </div>
            <div className="px-3 py-2 rounded-lg bg-surface-base border border-border/60 text-[11px] space-y-2">
              <div className="flex items-center justify-between text-foreground-muted">
                <span className="flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-neon-cyan" />
                  Render Queue
                </span>
                <span className="font-mono text-neon-lime">Ready</span>
              </div>
              <div className="flex items-center justify-between text-foreground-muted">
                <span className="flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-neon-violet" />
                  Scene Schema
                </span>
                <span className="font-mono text-foreground-subtle">v0.1.0</span>
              </div>
              <div className="flex items-center justify-between text-foreground-muted">
                <span className="flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-neon-rose" />
                  Target Canvas
                </span>
                <span className="font-mono text-white">9:16 (1080x1920)</span>
              </div>
            </div>
          </div>
        </nav>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-border bg-surface-base/80">
          <Link
            href="/profile"
            className="flex items-center justify-between p-2 rounded-lg text-xs text-foreground-muted hover:text-white hover:bg-surface-hover transition-colors"
          >
            <div className="flex items-center gap-2">
              <Palette className="w-3.5 h-3.5 text-neon-indigo" />
              <span>Theme: Dark Slate Neon</span>
            </div>
            <Settings className="w-3.5 h-3.5 text-foreground-subtle" />
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header Rail */}
        <header className="h-14 border-b border-border bg-surface-base/90 backdrop-blur px-4 lg:px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-1.5 rounded-lg border border-border text-foreground-muted hover:text-white"
              aria-label="Toggle Navigation"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            {/* Breadcrumb / Path indicator */}
            <div className="flex items-center gap-2 text-xs font-medium">
              <span className="text-foreground-subtle">CreatorOS</span>
              <ChevronRight className="w-3.5 h-3.5 text-foreground-subtle" />
              <span className="text-white font-mono capitalize">
                {pathname === "/" ? "Dashboard" : pathname.replace("/", "")}
              </span>
            </div>
          </div>

          {/* Quick Actions & Header Telemetry */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded border border-border bg-surface-panel text-2xs font-mono text-foreground-muted">
              <span className="w-2 h-2 rounded-full bg-neon-indigo" />
              <span>FPS: 30</span>
              <span className="text-border">|</span>
              <span className="text-neon-cyan">Zod Validated</span>
            </div>

            <Link
              href="/studio"
              className="px-3 py-1.5 rounded-md bg-neon-indigo hover:bg-neon-indigo/90 text-white text-xs font-medium flex items-center gap-1.5 shadow-neon-glow-indigo transition-all"
            >
              <Wand2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">New Script</span>
            </Link>

            <Link
              href="/editor"
              className="px-3 py-1.5 rounded-md bg-surface-elevated hover:bg-surface-hover text-white text-xs font-medium border border-border flex items-center gap-1.5 transition-all"
            >
              <Video className="w-3.5 h-3.5 text-neon-cyan" />
              <span className="hidden sm:inline">Preview Video</span>
            </Link>
          </div>
        </header>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-b border-border bg-surface-base p-4 space-y-2 z-50">
            {navItems.map((item) => {
              const active = isActive(item);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium",
                    active
                      ? "bg-surface-elevated text-white border border-border-interactive/40"
                      : "text-foreground-muted hover:text-white hover:bg-surface-hover"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4" />
                    <span>{item.title}</span>
                  </div>
                  {item.badge && (
                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-surface-base text-neon-cyan border border-border">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        )}

        {/* Content Shell */}
        <main className="flex-1 flex overflow-hidden bg-background">{children}</main>
      </div>
    </div>
  );
}
