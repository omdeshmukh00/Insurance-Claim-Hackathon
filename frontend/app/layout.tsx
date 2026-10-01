import type { Metadata } from "next";
import "./globals.css";
import { AppLayout } from "@/components/layout";
import { AuthProvider as UpstreamAuthProvider } from "@/lib/auth";
import { AuthProvider } from "@/lib/authContext";

export const metadata: Metadata = {
  title: {
    default: "InsuredYou — AI Insurance Claims Intelligence",
    template: "%s | InsuredYou",
  },
  description:
    "Autonomous AI-powered insurance claims intelligence platform with multi-agent investigation, evidence grounding, and human-in-the-loop review.",
  keywords: ["insurance", "claims", "AI", "InsuredYou", "claims intelligence"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* Preconnect for Google Fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      </head>
      <body>
        <UpstreamAuthProvider>
          <AuthProvider>
            <AppLayout>{children}</AppLayout>
          </AuthProvider>
        </UpstreamAuthProvider>
      </body>
    </html>
  );
}
