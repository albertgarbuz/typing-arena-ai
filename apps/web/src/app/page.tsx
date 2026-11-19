import { LandingPage } from "@/components/landing-page";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export default function HomePage() {
  return (
    <>
      <SiteHeader />
      <main id="main-content" className="landing" tabIndex={-1}>
        <LandingPage />
      </main>
      <SiteFooter />
    </>
  );
}
