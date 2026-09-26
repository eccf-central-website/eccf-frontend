import type { Metadata } from "next";
import localFont from "next/font/local";
import { Belleza, Work_Sans } from "next/font/google";
import { Suspense } from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import ScrollToTop from "@/components/ui/ScrollToTop";
import TheLauncher from "@/components/layout/TheLauncher";
import NavigationProgressBar from "@/components/layout/NavigationProgressBar";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});

const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

const belleza = Belleza({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
});

const workSans = Work_Sans({
  subsets: ["latin"],
  variable: "--font-work-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "ECCF — Edo State University Christian Campus Fellowship",
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
        className={`${geistSans.variable} ${geistMono.variable} ${belleza.variable} ${workSans.variable} antialiased bg-[#fafaf9] text-slate-800 flex min-h-screen flex-col font-sans`}
      >
        <Suspense fallback={null}>
          <NavigationProgressBar />
        </Suspense>
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
        <TheLauncher />
        <ScrollToTop />
      </body>
    </html>
  );
}
