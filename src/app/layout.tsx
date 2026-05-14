import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Wanderlust - Travel Social",
  description: "Share your travel adventures, plan itineraries, and connect with fellow travelers worldwide.",
  keywords: ["travel", "social", "itinerary", "wanderlust", "adventure"],
  authors: [{ name: "Wanderlust" }],
  openGraph: {
    title: "Wanderlust - Travel Social",
    description: "Share your travel adventures, plan itineraries, and connect with fellow travelers.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Wanderlust - Travel Social",
    description: "Share your travel adventures, plan itineraries, and connect with fellow travelers.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
        <SonnerToaster position="top-center" richColors />
      </body>
    </html>
  );
}
