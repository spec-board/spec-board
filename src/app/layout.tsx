import type { Metadata } from "next";
import Script from "next/script";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { ShortcutsProvider } from "@/components/shortcuts-provider";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "SpecBoard - Kanban for Spec-Kit",
  description: "Visual dashboard for spec-kit task management",
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
        </ThemeProvider>
      </body>
    </html>
  );
}
