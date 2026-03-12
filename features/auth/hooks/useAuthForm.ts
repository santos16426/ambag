import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

import { authModeSchema, type AuthMode } from "../schema";
import { useAuthStore } from "../store/auth.store";

interface UseAuthFormState {
  mode: AuthMode;
  isLogin: boolean;
  isDesktop: boolean;
  redirectPath: string;
}

interface UseAuthFormActions {
  toggleMode: (nextMode: AuthMode) => void;
}

export function useAuthForm(): UseAuthFormState & UseAuthFormActions {
  const searchParams = useSearchParams();

  const [isDesktop, setIsDesktop] = useState(false);

  const redirectPath = searchParams.get("redirect") || "/dashboard";

  const initialModeFromParams = useMemo<AuthMode>(() => {
    const fromParams = searchParams.get("mode") || "login";
    const parsed = authModeSchema.safeParse(fromParams);
    return parsed.success ? parsed.data : "login";
  }, [searchParams]);

  const mode = useAuthStore((state) => state.mode);
  const setMode = useAuthStore((state) => state.setMode);

  useEffect(() => {
    setMode(initialModeFromParams);
  }, [initialModeFromParams, setMode]);

  useEffect(() => {
    const updateIsDesktop = () => {
      if (typeof window === "undefined") {
        return;
      }

      setIsDesktop(window.innerWidth >= 1024);
    };

    updateIsDesktop();
    window.addEventListener("resize", updateIsDesktop);

    return () => window.removeEventListener("resize", updateIsDesktop);
  }, []);

  const isLogin = mode === "login";

  const toggleMode = (nextMode: AuthMode) => {
    setMode(nextMode);
  };

  return {
    mode,
    isLogin,
    isDesktop,
    redirectPath,
    toggleMode,
  };
}

