"use client";

import { create } from "zustand";

const THEME_ACCENT_KEY = "ambag-theme-accent";
const THEME_MODE_KEY = "ambag-theme-mode";

export type ColorMode = "light" | "dark";

export interface LayoutState {
  isSidebarOpen: boolean;
  setIsSidebarOpen: (isSidebarOpen: boolean) => void;
  accentTheme: string;
  colorMode: ColorMode;
  setAccentTheme: (accentTheme: string) => void;
  setColorMode: (colorMode: ColorMode) => void;
}

function persistAccent(accentTheme: string) {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(THEME_ACCENT_KEY, accentTheme);
  }
}

function persistMode(colorMode: ColorMode) {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(THEME_MODE_KEY, colorMode);
  }
}

export function getStoredTheme(): {
  accentTheme: string;
  colorMode: ColorMode;
} {
  if (typeof window === "undefined") {
    return { accentTheme: "indigo", colorMode: "light" };
  }
  const accent = window.localStorage.getItem(THEME_ACCENT_KEY);
  const mode = window.localStorage.getItem(THEME_MODE_KEY);
  return {
    accentTheme: accent ?? "indigo",
    colorMode: mode === "dark" || mode === "light" ? mode : "light",
  };
}

export const useLayoutStore = create<LayoutState>((set) => ({
  isSidebarOpen: true,
  setIsSidebarOpen: (isSidebarOpen) => set({ isSidebarOpen }),
  accentTheme: "indigo",
  colorMode: "light",
  setAccentTheme: (accentTheme) => {
    persistAccent(accentTheme);
    set({ accentTheme });
  },
  setColorMode: (colorMode) => {
    persistMode(colorMode);
    set({ colorMode });
  },
}));
