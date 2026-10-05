import type { Metadata } from "next";
import "./globals.css";
import { ShellLayout } from "@/components/layout/ShellLayout";

export const metadata: Metadata = {
  title: "CreatorOS | Video Production & Repurposing Platform",
  description: "Non-linear AI video creation, script studio, Remotion video editor, and multi-platform repurposing engine.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-background text-foreground antialiased selection:bg-neon-indigo/30 selection:text-neon-cyan">
        <ShellLayout>{children}</ShellLayout>
      </body>
    </html>
  );
}
