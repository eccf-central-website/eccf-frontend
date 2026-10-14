import type { Metadata } from "next";
import localFont from "next/font/local";
import { Belleza, Work_Sans } from "next/font/google";
import "./globals.css";

/**
 * 3-Font System Architecture:
 * 1. Headings: Belleza (Humanist high-fashion display typeface) -> var(--font-belleza)
 * 2. Body: Work Sans (Clean, highly legible grotesque sans) -> var(--font-work-sans)
 * 3. Styling / Accents: Geist Mono (Pills, overlines, timestamps, codes) -> var(--font-geist-mono)
 */
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

const belleza = Belleza({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-belleza",
  display: "swap",
});

const workSans = Work_Sans({
  subsets: ["latin"],
  variable: "--font-work-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "ESUI Christian Campus Fellowship: Raising Spiritual Dynamites and Academic Giants",
  description:
    "Official Website & Management Portal for Edo State University Christian Campus Fellowship (ECCF). Raising leaders for God's kingdom on campus and beyond.",
  icons: {
    icon: [
      { url: "/logos/ECCF LOGO.png", type: "image/png" },
      { url: "/icon.png", type: "image/png" },
    ],
    shortcut: "/logos/ECCF LOGO.png",
    apple: "/logos/ECCF LOGO.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${belleza.variable} ${workSans.variable} ${geistMono.variable} antialiased bg-[#fafaf9] text-slate-800 flex min-h-screen flex-col font-sans`}
      >
        {children}
      </body>
    </html>
  );
}
