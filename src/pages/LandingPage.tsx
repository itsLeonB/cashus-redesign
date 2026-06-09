import { lazy, Suspense } from "react";
import { LandingHeader } from "./landing/LandingHeader";
import { HeroSection } from "./landing/HeroSection";
import { FeaturesSection } from "./landing/FeaturesSection";
import { FooterSection } from "./landing/FooterSection";
import { subscriptionPurchaseEnabled } from "@/lib/flags";

const PricingSection = subscriptionPurchaseEnabled
  ? lazy(() =>
      import("./landing/PricingSection").then((m) => ({
        default: m.PricingSection,
      }))
    )
  : () => null;

export default function LandingPage() {
  return (
    <div className="min-h-dvh bg-background">
      <LandingHeader />
      <main>
        <HeroSection />
        <FeaturesSection />
        {subscriptionPurchaseEnabled && (
          <Suspense fallback={null}>
            <PricingSection />
          </Suspense>
        )}
      </main>
      <FooterSection />
    </div>
  );
}
