import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { cn } from "@/lib/utils";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-sans",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "TripSense AI — Plan your India trip",
  description:
    "AI-powered travel planning for Indian destinations — attractions, temples, stays, budgets, and itineraries.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f2801f",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn("font-sans", geistSans.variable)}>
      <body className="antialiased">{children}</body>
    </html>
  );
}
