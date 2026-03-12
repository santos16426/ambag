"use client";
// import { AnimatePresence, motion } from "framer-motion"; // with group switcher
import {
  // LayoutGrid,
  // ChevronDown,
  // Check,
  Bell,
  User,
  LogOut,
  Palette,
  Menu,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useAuthStore } from "@/features/auth/store/auth.store";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLayoutStore } from "@/store/layoutStore";
const Header = () => {
  const router = useRouter();
  // Group switcher — commented out; revisit in a separate issue (groups feature / RPC).
  // const switcherRef = useRef<HTMLDivElement>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  // const [showSwitcher, setShowSwitcher] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const { profile, logout } = useAuthStore();
  const { isSidebarOpen, setIsSidebarOpen } = useLayoutStore();
  /* Group switcher click-outside — re-enable with switcher UI
  useEffect(() => {
    if (!showSwitcher) return;
    function handleClickOutside(event: MouseEvent) {
      if (
        switcherRef.current &&
        !switcherRef.current.contains(event.target as Node)
      ) {
        setShowSwitcher(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showSwitcher]);
  */

  useEffect(() => {
    if (!showProfileMenu) return;
    function handleClickOutside(event: MouseEvent) {
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(event.target as Node)
      ) {
        setShowProfileMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showProfileMenu]);
  const handleLogout = () => {
    logout();
    router.push("/login");
  };
  return (
    <header className="sticky top-0 z-100 bg-white/80 backdrop-blur-xl border-b border-slate-100 px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-2 hover:bg-muted rounded-full transition-colors"
        >
          <Menu className="w-6 h-6 text-muted-foreground" />
        </button>

        {/*
        GROUP SWITCHER — disabled until groups feature is implemented (separate issue).
        Re-enable: restore switcherRef, showSwitcher, groups/activeGroup/setActiveGroup from store or RPC,
        and uncomment imports (LayoutGrid, ChevronDown, Check).

        <div className="relative" ref={switcherRef}>
          ... Active Group button + AnimatePresence dropdown ...
        </div>
        */}
      </div>

      <div className="flex items-center gap-3 sm:gap-6">
        <div className="flex items-center gap-2">
          <button className="p-2.5 text-slate-400 hover:bg-slate-50 rounded-xl transition-all relative">
            <Bell className="w-5 h-5" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-white" />
          </button>
          <div className="relative" ref={profileMenuRef}>
            <button
              id="profile-menu-trigger"
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-primary text-primary-foreground text-sm font-bold border-2 border-card shadow-sm ml-1 md:ml-2 overflow-hidden hover:scale-105 active:scale-95 transition-all flex items-center justify-center"
            >
              {(
                profile?.fullname?.[0] ||
                profile?.email?.[0] ||
                "A"
              ).toUpperCase()}
            </button>

            {/* Profile Dropdown Menu */}
            {showProfileMenu && (
              <div className="absolute right-0 mt-3 w-64 bg-card rounded-3xl shadow-2xl border border-border py-3 animate-in fade-in zoom-in-95 duration-200 text-left z-100">
                <div className="px-6 py-4 border-b border-border mb-2">
                  <p className="font-bold text-foreground">
                    {profile?.fullname}
                  </p>
                  <span className="text-xs text-muted-foreground">
                    {profile?.email}
                  </span>
                </div>
                <Link
                  href="/settings?tab=profile"
                  onClick={() => setShowProfileMenu(false)}
                  className="w-full flex items-center gap-4 px-6 py-3 hover:bg-muted transition-colors text-muted-foreground"
                >
                  <User className="w-4 h-4" />
                  <span className="text-sm font-medium">My Profile</span>
                </Link>
                <Link
                  href="/settings?tab=appearance"
                  onClick={() => setShowProfileMenu(false)}
                  className="w-full flex items-center gap-4 px-6 py-3 hover:bg-muted transition-colors text-muted-foreground"
                >
                  <Palette className="w-4 h-4" />
                  <span className="text-sm font-medium">Appearance</span>
                </Link>
                <div className="h-px bg-border my-2 mx-6" />
                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    handleLogout();
                  }}
                  className="w-full flex items-center gap-4 px-6 py-3 hover:bg-destructive/10 transition-colors text-destructive"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="text-sm font-bold">Sign Out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
