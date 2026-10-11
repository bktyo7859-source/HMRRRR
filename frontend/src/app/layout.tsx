import type { Metadata } from "next";
import { Inter, Space_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "MedSync — IPC Smart Hospital Emergency Command Center",
  description: "Operating Systems Inter-Process Communication & Concurrency Command Center",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable} dark h-full`}
    >
      <body className="min-h-full bg-[#101113] text-[#F1F2F3] antialiased selection:bg-[rgba(230,233,237,0.20)] selection:text-white">
        {children}
      </body>
    </html>
  );
}
