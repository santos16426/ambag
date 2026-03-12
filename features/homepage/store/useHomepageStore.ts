import { create } from "zustand";

export const HOMEPAGE_SECTIONS = ["home", "features", "split-tool", "pricing"] as const;
export type HomepageSectionId = (typeof HOMEPAGE_SECTIONS)[number];

interface HomepageStore {
  isScrolled: boolean;
  activeSection: string;
  isMobileMenuOpen: boolean;
  setScrolled: (value: boolean) => void;
  setActiveSection: (id: string) => void;
  setIsMobileMenuOpen: (value: boolean) => void;
  toggleMobileMenu: () => void;
}

export const useHomepageStore = create<HomepageStore>((set) => ({
  isScrolled: false,
  activeSection: "home",
  isMobileMenuOpen: false,
  setScrolled: (value) => set({ isScrolled: value }),
  setActiveSection: (id) => set({ activeSection: id }),
  setIsMobileMenuOpen: (value) => set({ isMobileMenuOpen: value }),
  toggleMobileMenu: () => set((s) => ({ isMobileMenuOpen: !s.isMobileMenuOpen })),
}));

