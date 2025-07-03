import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

// Initialize autonomous system on server startup
if (typeof window === 'undefined') {
  import('@/lib/agents/initialization').then(({ initializeAutonomousSystem }) => {
    // Initialize in background without blocking
    initializeAutonomousSystem().catch(console.error);
  });
}

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AuthorityPilot - Become a Thought Leader in 10 Minutes a Week",
  description: "AI-powered personal brand automation that writes in your voice, engages with your audience, and builds your professional authority while you focus on what matters most.",
  keywords: ["personal branding", "AI content creation", "LinkedIn automation", "thought leadership", "social media management"],
  authors: [{ name: "AuthorityPilot" }],
  creator: "AuthorityPilot",
  publisher: "AuthorityPilot",
  openGraph: {
    title: "AuthorityPilot - AI-Powered Personal Brand Automation",
    description: "Transform into a thought leader with just 10 minutes of work per week. AI that writes in your voice and builds your authority.",
    url: "https://authoritypilot.com",
    siteName: "AuthorityPilot",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "AuthorityPilot - Personal Brand Automation",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AuthorityPilot - AI-Powered Personal Brand Automation",
    description: "Become a thought leader in 10 minutes a week with AI that writes in your voice.",
    images: ["/og-image.png"],
    creator: "@authoritypilot",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon-16x16.png",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}