/**
 * Public Site Layout — wraps every marketing/content page in the shared
 * site chrome (Navbar, Footer, launcher). The Exco Dashboard lives in the
 * (dashboard) route group and does not inherit any of this.
 */

import { Suspense } from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import ScrollToTop from "@/components/ui/ScrollToTop";
import TheLauncher from "@/components/layout/TheLauncher";
import NavigationProgressBar from "@/components/layout/NavigationProgressBar";
import PwaPromptSuppressor from "@/components/common/PwaPromptSuppressor";
import { isDraftPreview } from "@/lib/preview";
import { getSanityClient } from "@/lib/sanity";
import { SITE_SETTINGS_QUERY } from "@/lib/queries";
import type { SiteSettingsData } from "@/components/home/HeroSection";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Only signed Draft Mode counts (enabled via the secret-checked /api/preview).
  const isPreview = isDraftPreview();

  const client = getSanityClient(Boolean(isPreview));
  const settings = await client
    .fetch<SiteSettingsData>(SITE_SETTINGS_QUERY)
    .catch((err) => {
      console.error('[PublicLayout] Failed to fetch settings for footer:', err);
      return null;
    });

  return (
    <>
      <PwaPromptSuppressor />
      <Suspense fallback={null}>
        <NavigationProgressBar />
      </Suspense>
      <Navbar />
      <main className="flex-1 w-full max-w-full overflow-x-hidden">{children}</main>
      <Footer settings={settings} />
      <TheLauncher />
      <ScrollToTop />
    </>
  );
}
