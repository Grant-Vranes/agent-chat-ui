import type { Metadata } from "next";
import "./globals.css";
import { Instrument_Serif, Plus_Jakarta_Sans } from "next/font/google";
import React from "react";

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: ["400"],
  style: ["normal", "italic"],
  preload: true,
  display: "swap",
  variable: "--font-display",
});

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  preload: true,
  display: "swap",
  variable: "--font-body",
});

export const metadata: Metadata = {
  title: "Logistics Consultant",
  description: "AI-powered logistics proposal analyst",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${instrumentSerif.variable} ${plusJakartaSans.variable}`}>
      <body className="font-body antialiased">{children}</body>
    </html>
  );
}