import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth";

export const metadata: Metadata = {
  title: {
    default: "ClaimIntel AI — Insurance Claims Intelligence",
    template: "%s | ClaimIntel AI",
  },
  description:
    "Enterprise AI platform for autonomous insurance claim intake, fraud investigation, damage assessment, and multi-agent orchestration.",
  keywords: ["insurance", "claims", "AI", "fraud detection", "adjusters"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      </head>
      <body className="antialiased min-h-screen" style={{ backgroundColor: "var(--bg-page)" }}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
