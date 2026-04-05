"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, LogOut, Settings, UtensilsCrossed, X } from "lucide-react";
import { useAuthStore } from "@/features/auth/store/auth.store";
import { useLayoutStore } from "@/store/layoutStore";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

/** Matches `lg:` breakpoint — sidebar is overlay below this width. */
const MOBILE_SIDEBAR_MAX_WIDTH_PX = 1024;

function isMobileSidebarViewport(): boolean {
  if (typeof window === "undefined") return false;
  return window.innerWidth < MOBILE_SIDEBAR_MAX_WIDTH_PX;
}

export default function Sidebar() {
  const [isMobile, setIsMobile] = useState(false);
  const router = useRouter();
  const { logout } = useAuthStore();
  const { isSidebarOpen, setIsSidebarOpen } = useLayoutStore();
  const pathname = usePathname();

  function closeSidebarIfMobile() {
    if (isMobileSidebarViewport()) setIsSidebarOpen(false);
  }

  const handleLogout = async () => {
    closeSidebarIfMobile();
    await logout();
    router.push("/login");
  };
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < MOBILE_SIDEBAR_MAX_WIDTH_PX;
      setIsMobile(mobile);
      if (mobile) setIsSidebarOpen(false);
      else setIsSidebarOpen(true);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [setIsSidebarOpen]);
  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutGrid },
    { name: "Settings", href: "/settings", icon: Settings },
  ];
  return (
    <>
      <aside
        className={`
            h-full bg-muted shrink-0
            flex flex-col py-6 px-3 gap-1 text-left
            transition-all duration-500 ease-in-out z-90 overflow-hidden
            ${
              isSidebarOpen
                ? "w-full translate-x-0 md:w-72 lg:w-72 text-center md:text-left lg:text-left"
                : "w-0 -translate-x-full -mr-6 opacity-0 pointer-events-none "
            }`}
      >
        <div className="px-4 mb-4">
          <div className="flex items-center gap-4 mb-10 relative">
            <div>
              <Link
                href="/dashboard"
                onClick={closeSidebarIfMobile}
                className="flex items-center gap-2 group"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-500 text-white shadow-orange-200 shadow-lg group-hover:rotate-12 transition-transform">
                  <UtensilsCrossed className="h-5 w-5" />
                </div>
                <span className="text-xl font-black tracking-tighter">
                  Ambag<span className="text-orange-500">.</span>
                </span>
              </Link>
            </div>
            {isMobile && (
              <button
                onClick={() => setIsSidebarOpen(false)}
                className="p-2 text-muted-foreground hover:bg-muted rounded-full absolute top-0 right-0"
              >
                <X size={20} />
              </button>
            )}
          </div>

          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
            Main Menu
          </p>
        </div>
        {navigation.map((item) => {
          const Icon = item.icon;
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.name}
              id={`nav-${item.name}`}
              href={item.href}
              onClick={closeSidebarIfMobile}
              className={`w-full flex items-center gap-4 px-4 py-3 rounded-2xl transition-all ${
                isActive
                  ? "bg-card shadow-sm font-bold text-primary"
                  : "hover:bg-secondary text-muted-foreground"
              }`}
            >
              <Icon
                className={`w-5 h-5 ${
                  isActive ? "text-primary" : "text-muted-foreground"
                }`}
              />
              <span
                className={`text-sm whitespace-nowrap transition-opacity duration-300 ${
                  isSidebarOpen ? "opacity-100" : "opacity-0"
                }`}
              >
                {item.name}
              </span>
            </Link>
          );
        })}
        <div className="mt-auto px-4 py-4 border-t border-border">
          <button
            onClick={handleLogout}
            className="flex items-center gap-4 text-muted-foreground hover:text-destructive transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="text-sm font-bold">Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
