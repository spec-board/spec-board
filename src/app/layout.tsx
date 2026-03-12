import type { Metadata } from "next";
import Script from "next/script";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { ShortcutsProvider } from "@/components/shortcuts-provider";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "SpecBoard — Visual Dashboard for Software Specs & Docs",
  description:
    "SpecBoard helps non-technical teams create, organize, and manage professional software specifications and documentation. A visual drag-and-drop dashboard that turns ideas into structured specs — no coding required.",
  keywords: [
    "spec management",
    "software specification",
    "documentation tool",
    "visual dashboard",
    "kanban board",
    "project management",
    "non-technical",
    "spec writing",
    "software docs",
    "specboard",
  ],
  authors: [{ name: "SpecBoard" }],
  openGraph: {
    type: "website",
    title: "SpecBoard — Visual Dashboard for Software Specs & Docs",
    description:
      "Create and manage professional software specifications without writing code. A visual dashboard for non-technical teams to organize specs, track features, and ship better software.",
    siteName: "SpecBoard",
  },
  twitter: {
    card: "summary_large_image",
    title: "SpecBoard — Visual Dashboard for Software Specs & Docs",
    description:
      "Create and manage professional software specifications without writing code. A visual dashboard for non-technical teams.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={inter.variable}>
      <head>
        <Script src="/theme-init.js" strategy="beforeInteractive" />
      </head>
      <body className="antialiased min-h-screen font-sans">
        <ThemeProvider>
          <ShortcutsProvider>{children}</ShortcutsProvider>
          <Toaster position="bottom-right" richColors />
        </ThemeProvider>
      </body>
    </html>
  );
}
