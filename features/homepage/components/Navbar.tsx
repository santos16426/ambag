"use client";

import Logo from "@/components/Logo";
import { navLinks } from "../constants";
import { useHomepageStore } from "../store/useHomepageStore";
import { useHomepageScroll } from "../hooks/useHomepageScroll";
import { AnimatePresence, motion } from "framer-motion";
import { Link, Menu, X } from "lucide-react";

const Navbar = () => {
  const isScrolled = useHomepageStore((s) => s.isScrolled);
  const activeSection = useHomepageStore((s) => s.activeSection);
  const isMobileMenuOpen = useHomepageStore((s) => s.isMobileMenuOpen);
  const toggleMobileMenu = useHomepageStore((s) => s.toggleMobileMenu);
  const { scrollToSection } = useHomepageScroll();

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-100 transition-all duration-300 px-6 py-4 ${
        isScrolled ? "pt-4" : "pt-8"
      }`}
    >
      <div
        className={`mx-auto max-w-6xl transition-all duration-300 rounded-[24px] border ${
          isScrolled
            ? "bg-white/70 backdrop-blur-xl border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.05)] py-3 px-6"
            : "bg-transparent border-transparent py-3 px-2"
        }`}
      >
        <div className="flex items-center justify-between">
          <Logo scrollToSection={scrollToSection} />
          <div className="hidden md:flex items-center bg-slate-100/50 p-1 rounded-full border border-slate-200/50">
            {navLinks.map((link) => (
              <a
                key={link.id}
                href={`#${link.id}`}
                onClick={(e) => scrollToSection(e, link.id)}
                className={`relative px-5 py-1.5 text-xs font-black uppercase tracking-widest transition-all rounded-full ${
                  activeSection === link.id
                    ? "text-white"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                {activeSection === link.id && (
                  <motion.div
                    layoutId="nav-pill"
                    className="absolute inset-0 bg-slate-900 rounded-full z-[-1]"
                    transition={{
                      type: "spring",
                      bounce: 0.2,
                      duration: 0.6,
                    }}
                  />
                )}
                {link.name}
              </a>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="hidden lg:block text-xs font-black uppercase tracking-widest text-slate-500 hover:text-slate-900 transition-colors px-4"
            >
              Login
            </Link>
            <motion.a
              href="/login"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="bg-orange-500 text-white px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-widest shadow-lg shadow-orange-200 transition-all hover:bg-orange-600"
            >
              Get Started
            </motion.a>

            {/* Mobile Toggle */}
            <button
              onClick={toggleMobileMenu}
              className="md:hidden p-2 text-slate-900"
            >
              {isMobileMenuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-full left-6 right-6 mt-4 bg-white rounded-[32px] p-8 shadow-2xl border border-slate-100 md:hidden"
          >
            <div className="flex flex-col gap-6">
              {navLinks.map((link) => (
                <a
                  key={link.id}
                  href={`#${link.id}`}
                  onClick={(e) => scrollToSection(e, link.id)}
                  className={`text-2xl font-black ${activeSection === link.id ? "text-orange-500" : "text-slate-900"}`}
                >
                  {link.name}
                </a>
              ))}
              <hr className="border-slate-100" />
              <Link
                href="/login"
                className="text-left text-xl font-black text-slate-400"
              >
                Login
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
