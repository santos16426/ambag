"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  CheckCircle2,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  UtensilsCrossed,
  Zap,
} from "lucide-react";

import {
  desktopFormVariants,
  formVariants,
  showcaseVariants,
} from "../constants";
import { useAuthForm } from "../hooks/useAuthForm";
import { LoginForm } from "./LoginForm";
import { SignupForm } from "./SignupForm";

export function AuthPage() {
  const {
    mode,
    isLogin,
    isDesktop,
    redirectPath,
    toggleMode,
  } = useAuthForm();

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#FFF8F4] p-0 font-sans selection:bg-orange-100 selection:text-orange-900 sm:p-4">
      <div className="relative flex min-h-screen w-full max-w-[1100px] items-stretch overflow-hidden bg-white shadow-[0_40px_100px_rgba(255,107,0,0.08)] sm:min-h-0 sm:rounded-[3rem] sm:border sm:border-orange-50 lg:h-[780px]">
        <motion.div
          initial={false}
          animate={isLogin ? "login" : "signup"}
          variants={showcaseVariants}
          transition={{ type: "spring", stiffness: 100, damping: 22 }}
          className="absolute left-0 top-0 z-20 hidden h-full w-1/2 flex-col items-center justify-center bg-[#FFFBF9] p-12 lg:flex"
        >
          <div className="absolute right-[-10%] top-[-10%] h-72 w-72 rounded-full bg-orange-100 opacity-60 blur-3xl" />
          <div className="absolute bottom-[-10%] left-[-10%] h-80 w-80 rounded-full bg-rose-100 opacity-40 blur-3xl" />

          <AnimatePresence mode="wait">
            {isLogin ? (
              <motion.div
                key="login-showcase"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="relative flex h-full w-full flex-col items-center justify-center"
              >
                <div className="flex w-full max-w-[380px] flex-col items-center">
                  <motion.div
                    animate={{ y: [0, -10, 0] }}
                    transition={{ duration: 4, repeat: Infinity }}
                    className="mb-8 w-full rounded-[2.5rem] border border-orange-50 bg-white p-6 shadow-2xl shadow-orange-500/10"
                  >
                    <div className="mb-5 flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50">
                        <ShieldCheck className="h-6 w-6 text-orange-500" />
                      </div>
                      <div>
                        <h4 className="font-black text-slate-800">
                          Secure Access
                        </h4>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                          Protected by Ambag
                        </p>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-slate-600">
                          Encrypted
                        </span>
                        <CheckCircle2 className="h-4 w-4 text-orange-400" />
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-50">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: "100%" }}
                          className="h-full bg-orange-400"
                        />
                      </div>
                    </div>
                  </motion.div>
                  <div className="text-center">
                    <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-orange-100/50 px-4 py-2">
                      <Sparkles className="h-4 w-4 text-orange-600" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-orange-700">
                        Smart Settlement
                      </span>
                    </div>
                    <h3 className="mb-2 text-3xl font-black text-slate-900">
                      Welcome Back!
                    </h3>
                    <p className="text-sm font-bold uppercase tracking-widest text-slate-400">
                      Your balances are waiting.
                    </p>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="signup-showcase"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="relative flex h-full w-full flex-col items-center justify-center"
              >
                <div className="relative h-[420px] w-full max-w-[400px]">
                  <motion.div
                    animate={{ y: [0, -12, 0] }}
                    transition={{ duration: 5, repeat: Infinity }}
                    className="absolute right-0 top-0 z-10 w-56 rounded-[2.5rem] border border-orange-50 bg-white p-6 shadow-2xl shadow-orange-500/5"
                  >
                    <div className="mb-4 flex items-start justify-between">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                        Efficiency
                      </p>
                      <TrendingUp className="h-4 w-4 text-orange-500" />
                    </div>
                    <p className="text-2xl font-black tracking-tight text-slate-800">
                      ₱12,400
                    </p>
                    <div className="mt-4 flex h-12 w-full items-end gap-1.5 rounded-2xl bg-orange-50/50 px-2 py-1.5">
                      {[4, 7, 5, 9, 6, 8, 7].map((height, index) => (
                        <div
                          key={index}
                          className="w-full rounded-full bg-orange-400"
                          style={{ height: `${height * 10}%` }}
                        />
                      ))}
                    </div>
                  </motion.div>
                  <motion.div
                    animate={{ y: [0, 12, 0] }}
                    transition={{ duration: 6, repeat: Infinity, delay: 0.5 }}
                    className="absolute bottom-4 left-0 z-20 w-72 rounded-[3rem] border border-orange-50 bg-white p-7 shadow-2xl shadow-orange-500/10"
                  >
                    <div className="mb-6 flex items-center justify-between">
                      <h4 className="text-base font-black tracking-tight text-slate-800">
                        New Ambag
                      </h4>
                      <Zap className="h-4 w-4 text-orange-400" />
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-center gap-4 rounded-2xl border border-orange-100/50 bg-orange-50/30 p-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500 text-white">
                          <span className="font-black">A</span>
                        </div>
                        <span className="text-sm font-black text-slate-700">
                          Invite Members
                        </span>
                      </div>
                      <button className="w-full rounded-2xl bg-orange-500 py-4 text-center font-black text-[10px] uppercase tracking-[0.2em] text-white shadow-lg shadow-orange-500/20 transition-transform active:scale-95">
                        Start Splitting
                      </button>
                    </div>
                  </motion.div>
                </div>
                <div className="relative z-10 mt-8 text-center">
                  <div className="mb-2 flex items-center justify-center gap-3">
                    <UtensilsCrossed className="h-6 w-6 text-orange-500" />
                    <h3 className="text-2xl font-black tracking-tight text-slate-900">
                      Ambag.io
                    </h3>
                  </div>
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
                    Built for fair communities.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        <motion.div
          initial={false}
          animate={isLogin ? "login" : "signup"}
          variants={isDesktop ? desktopFormVariants : formVariants}
          transition={{ type: "spring", stiffness: 100, damping: 22 }}
          className="relative z-10 flex min-h-full w-full flex-col justify-center bg-white px-6 py-12 lg:ml-auto lg:w-1/2 lg:py-0 sm:px-12 lg:px-20"
        >
          <div className="mx-auto w-full max-w-[400px]">
            <header className="mb-8 text-center lg:mb-10 lg:text-left">
              <h2 className="mb-3 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
                {isLogin ? "Welcome Back" : "Create Account"}
              </h2>
              <p className="text-sm font-semibold leading-relaxed text-slate-400">
                {isLogin
                  ? "Access your group dashboard and settle debts."
                  : "Join thousands of users splitting bills fairly."}
              </p>
            </header>

            <div className="mx-auto mb-8 flex w-fit rounded-full border border-slate-100 bg-slate-50 p-1.5 sm:mb-10 lg:mx-0">
              <button
                onClick={() => toggleMode("login")}
                className={`px-6 sm:px-8 py-2.5 sm:py-3 rounded-full text-[11px] sm:text-xs font-black transition-all duration-300 ${mode === "login" ? "bg-white shadow-sm text-orange-500" : "text-slate-400 hover:text-slate-600"}`}
              >
                Login
              </button>
              <button
                onClick={() => toggleMode("signup")}
                className={`px-6 sm:px-8 py-2.5 sm:py-3 rounded-full text-[11px] sm:text-xs font-black transition-all duration-300 ${mode === "signup" ? "bg-orange-500 shadow-md text-white" : "text-slate-400 hover:text-slate-600"}`}
              >
                SignUp
              </button>
            </div>
            {isLogin ? (
              <LoginForm redirectPath={redirectPath} />
            ) : (
              <SignupForm redirectPath={redirectPath} />
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
