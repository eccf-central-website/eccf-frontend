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

export default function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <Suspense fallback={null}>
        <NavigationProgressBar />
      </Suspense>
      <Navbar />
      <main className="flex-1 w-full max-w-full overflow-x-hidden">{children}</main>
      <Footer />
      <TheLauncher />
      <ScrollToTop />
    </>
  );
}
