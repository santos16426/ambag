import { useCallback } from "react";
import { useHomepageStore } from "../store/useHomepageStore";

export function useHomepageScroll() {
  const setIsMobileMenuOpen = useHomepageStore((s) => s.setIsMobileMenuOpen);

  const scrollToSection = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
      e.preventDefault();
      const element = document.getElementById(id);
      if (element) {
        const offset = 80;
        const bodyRect = document.body.getBoundingClientRect().top;
        const elementRect = element.getBoundingClientRect().top;
        const elementPosition = elementRect - bodyRect;
        const offsetPosition = elementPosition - offset;
        window.scrollTo({
          top: offsetPosition,
          behavior: "smooth",
        });
      }
      setIsMobileMenuOpen(false);
    },
    [setIsMobileMenuOpen],
  );

  return { scrollToSection };
}

