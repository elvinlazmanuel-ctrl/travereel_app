import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "sonner";
import { QueryProvider } from "@/lib/query-provider";
import { ThemeProvider } from "@/components/ThemeProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Travereel - Travel Social",
  description: "Share your travel adventures, plan itineraries, and connect with fellow travelers worldwide.",
  keywords: ["travel", "social", "itinerary", "travereel", "adventure"],
  authors: [{ name: "Travereel" }],
  openGraph: {
    title: "Travereel - Travel Social",
    description: "Share your travel adventures, plan itineraries, and connect with fellow travelers.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Travereel - Travel Social",
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
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <QueryProvider>
            {children}
            <Toaster />
            <SonnerToaster position="top-center" richColors />
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
