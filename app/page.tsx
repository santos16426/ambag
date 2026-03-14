"use client";

import { useEffect } from "react";
import {
  Hero,
  Features,
  CalculatorTool,
  Pricing,
  CTA,
  Navbar,
  Footer,
} from "@/features/homepage/components";
import {
  useHomepageStore,
  HOMEPAGE_SECTIONS,
} from "@/features/homepage/store/useHomepageStore";

export default function Home() {
  const setScrolled = useHomepageStore((s) => s.setScrolled);
  const setActiveSection = useHomepageStore((s) => s.setActiveSection);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
      const current = HOMEPAGE_SECTIONS.find((section) => {
        const element = document.getElementById(section);
        if (element) {
          const rect = element.getBoundingClientRect();
          return rect.top <= 100 && rect.bottom >= 100;
        }
        return false;
      });
      if (current) setActiveSection(current);
    };
    window.addEventListener("scroll", handleScroll);
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [setScrolled, setActiveSection]);

  return (
    <div className="min-h-screen bg-[#FDFDFD] font-sans text-[#1A1A1A] selection:bg-orange-100 overflow-x-hidden">
      <Navbar />
      <main>
        <Hero />
        <Features />
        <CalculatorTool />
        {/* <Pricing /> */}
        <CTA />
      </main>
      <Footer />
      <style
        dangerouslySetInnerHTML={{
          __html: `
        input[type=number]::-webkit-inner-spin-button,
        input[type=number]::-webkit-outer-spin-button {
          -webkit-appearance: none; margin: 0;
        }
        html {
          scroll-behavior: smooth;
        }
      `,
        }}
      />
    </div>
  );
}
