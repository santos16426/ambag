import { motion } from "framer-motion";
import { ArrowRight, Zap, CheckCircle2 } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

const CTA = () => {
  const ctaRef = useRef(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", handleMouseMove);
  }, []);
  return (
    <section className="py-24 px-4 md:px-6 relative overflow-hidden bg-[#FDFDFD]">
      <motion.div
        ref={ctaRef}
        initial={{ y: 100, opacity: 0 }}
        whileInView={{ y: 0, opacity: 1 }}
        viewport={{ once: true, margin: "-100px" }}
        className="mx-auto max-w-6xl rounded-[3rem] md:rounded-[5rem] bg-[#020617] p-8 md:p-24 text-center text-white relative overflow-hidden shadow-[0_100px_100px_-50px_rgba(0,0,0,0.5)] border border-white/5"
      >
        {/* Background Kinetic Text */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-[0.03] select-none">
          <div className="whitespace-nowrap text-[15rem] font-black leading-none uppercase italic">
            SETTLE UP SETTLE UP SETTLE UP SETTLE UP
          </div>
          <div className="whitespace-nowrap text-[15rem] font-black leading-none uppercase italic ml-[-20%]">
            SPLIT WISELY SPLIT WISELY SPLIT WISELY
          </div>
        </div>

        {/* Glowing Orbs */}
        <motion.div
          animate={{ x: mousePos.x * 100, y: mousePos.y * 100 }}
          className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-orange-600/20 rounded-full blur-[120px] pointer-events-none"
        />
        <motion.div
          animate={{ x: mousePos.x * -150, y: mousePos.y * -150 }}
          className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none"
        />

        <div className="relative z-10 flex flex-col items-center">
          {/* Badge */}
          <motion.div
            initial={{ scale: 0 }}
            whileInView={{ scale: 1 }}
            className="mb-10 flex items-center gap-3 px-5 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md"
          >
            <div className="flex -space-x-1.5">
              {[1, 2, 3].map((i) => (
                <Image
                  key={i}
                  width={24}
                  height={24}
                  src={`https://i.pravatar.cc/60?u=${i + 10}`}
                  alt={`User ${i + 10}`}
                  className="w-6 h-6 rounded-full border border-slate-900"
                />
              ))}
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-400">
              Join the movement
            </span>
          </motion.div>

          <h2 className="text-5xl md:text-9xl font-black mb-8 leading-[0.85] tracking-tighter">
            Settle bills,
            <br />
            <span className="relative">
              <span className="text-transparent bg-clip-text bg-linear-to-b from-orange-400 to-orange-600">
                save vibes.
              </span>
              <motion.svg
                viewBox="0 0 400 20"
                className="absolute -bottom-2 left-0 w-full h-4 text-orange-500/30"
                initial={{ pathLength: 0 }}
                whileInView={{ pathLength: 1 }}
                transition={{ duration: 1, delay: 0.5 }}
              >
                <path
                  d="M0 10 Q 100 0 200 10 T 400 10"
                  fill="transparent"
                  stroke="currentColor"
                  strokeWidth="8"
                  strokeLinecap="round"
                />
              </motion.svg>
            </span>
          </h2>

          <p className="max-w-2xl mx-auto text-slate-400 text-lg md:text-2xl font-medium mb-16 leading-tight">
            Stop the manual math. <span className="text-white">Ambag</span>{" "}
            automates the awkward part of dining so you can focus on the
            dessert.
          </p>

          <div className="flex flex-col sm:flex-row gap-6 justify-center w-full max-w-lg">
            <motion.a
              href="/login?mode=signup"
              whileHover={{ scale: 1.02, y: -5 }}
              whileTap={{ scale: 0.98 }}
              className="flex-1 group relative px-10 py-7 bg-orange-500 text-white font-black text-2xl rounded-[32px] overflow-hidden transition-shadow hover:shadow-[0_20px_60px_-10px_rgba(249,115,22,0.5)]"
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
              <span className="relative flex items-center justify-center gap-3">
                Try it now
                <ArrowRight className="w-7 h-7" />
              </span>
            </motion.a>

            <motion.a
              href="/login?mode=signup?plan=lifetime"
              whileHover={{
                scale: 1.02,
                backgroundColor: "rgba(255,255,255,0.1)",
              }}
              whileTap={{ scale: 0.98 }}
              className="flex-1 px-10 py-7 bg-white/5 border-2 border-white/10 text-white font-black text-2xl rounded-[32px] backdrop-blur-sm"
            >
              See Pro
            </motion.a>
          </div>

          {/* Live Ticker Social Proof */}
          <div className="mt-20 w-full overflow-hidden relative">
            <div className="flex items-center gap-12 animate-marquee whitespace-nowrap opacity-30">
              {[
                "Equal Split: ₱4,500.00 - SM Megamall",
                "Itemized: ₱2,120.50 - BGC High St.",
                "Couple Mode: ₱1,200.00 - Cubao Expo",
                "Equal Split: ₱8,900.00 - Makati Ave",
                "Itemized: ₱550.00 - Katipunan",
              ].map((text, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 text-xs font-black uppercase tracking-widest"
                >
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  {text}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* FLOATING INTERACTIVE CARDS (Parallax) */}
        <motion.div
          style={{ x: mousePos.x * 40, y: mousePos.y * 40, rotate: 12 }}
          className="absolute top-20 -right-8 md:right-20 hidden lg:block"
        >
          <div className="bg-white/3 backdrop-blur-2xl border border-white/10 p-6 rounded-[2.5rem] shadow-2xl w-64 text-left">
            <div className="flex items-center justify-between mb-6">
              <div className="h-10 w-10 bg-orange-500 rounded-2xl flex items-center justify-center">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <span className="text-[10px] font-black text-orange-400 uppercase">
                Live Split
              </span>
            </div>
            <div className="space-y-4">
              <div className="h-2 w-3/4 bg-white/10 rounded-full" />
              <div className="h-2 w-full bg-white/10 rounded-full" />
              <div className="pt-4 border-t border-white/5 flex items-end justify-between">
                <span className="text-[10px] font-bold text-slate-500 uppercase">
                  Total
                </span>
                <span className="text-2xl font-black">₱3,450</span>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          style={{ x: mousePos.x * -60, y: mousePos.y * -60, rotate: -15 }}
          className="absolute bottom-20 -left-8 md:left-20 hidden lg:block"
        >
          <div className="bg-white/10 backdrop-blur-3xl border border-white/20 p-6 rounded-[2.5rem] shadow-2xl w-56 text-left">
            <div className="flex -space-x-3 mb-4">
              {[1, 2, 3, 4].map((i) => (
                <Image
                  width={80}
                  height={80}
                  key={i}
                  alt={`User ${i + 40}`}
                  src={`https://i.pravatar.cc/80?u=${i + 40}`}
                  className="w-10 h-10 rounded-full border-4 border-slate-900"
                />
              ))}
            </div>
            <p className="text-sm font-black text-white leading-tight">
              4 friends just settled up at{" "}
              <span className="text-orange-400">Manam</span>
            </p>
            <div className="mt-4 flex items-center gap-2 text-green-400">
              <CheckCircle2 className="w-4 h-4" />
              <span className="text-[10px] font-black uppercase">Success</span>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
};

export default CTA;
