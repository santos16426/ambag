"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  Heart,
  UtensilsCrossed,
  ShieldCheck,
  Minus,
  History,
  Plus,
} from "lucide-react";
import { useState } from "react";

const CalculatorTool = () => {
  const [activeTab, setActiveTab] = useState("equal");
  const [billAmount, setBillAmount] = useState(2450);
  const [people, setPeople] = useState(4);

  const calculateSplit = () => {
    if (activeTab === "equal") {
      return (billAmount / people).toLocaleString("en-PH", {
        minimumFractionDigits: 2,
      });
    }
  };
  return (
    <section id="split-tool" className="py-24 bg-orange-50/30">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Interactive <br />
              <span className="text-orange-500">Ambag Tool</span>
            </h2>
            <p className="text-gray-600 text-lg mb-10 font-medium">
              Experience how easy it is to switch between splitting modes based
              on your group dynamics.
            </p>

            <div className="flex flex-wrap gap-3 mb-12">
              {[
                { id: "equal", label: "Equal Split", icon: Users },
                { id: "couple", label: "Couple Share", icon: Heart },
                {
                  id: "host",
                  label: "Host Premium",
                  icon: UtensilsCrossed,
                },
              ].map((tab) => (
                <motion.button
                  key={tab.id}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-3 rounded-full font-bold text-sm transition-all ${activeTab === tab.id ? "bg-[#1A1A1A] text-white shadow-lg" : "bg-white text-gray-500 shadow-sm"}`}
                >
                  <tab.icon className="h-4 w-4" />
                  {tab.label}
                </motion.button>
              ))}
            </div>

            <div className="space-y-6">
              <div className="flex items-start gap-4 p-5 bg-white rounded-2xl border border-slate-100 shadow-sm">
                <div className="h-10 w-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <span className="font-bold text-sm block">
                    Precision Math
                  </span>
                  <p className="text-xs text-slate-400 mt-1 font-medium">
                    Calculations are rounded to ensure the total always matches
                    the receipt.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-5 bg-white rounded-2xl border border-slate-100 shadow-sm">
                <div className="h-10 w-10 bg-green-50 text-green-600 rounded-xl flex items-center justify-center shrink-0">
                  <History className="h-5 w-5" />
                </div>
                <div>
                  <span className="font-bold text-sm block">
                    Persistent History
                  </span>
                  <p className="text-xs text-slate-400 mt-1 font-medium">
                    Save your bill history to refer back to it anytime (Premium
                    feature).
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="bg-[#1A1A1A] text-white rounded-[3rem] p-8 md:p-14 shadow-2xl relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-48 h-48 bg-orange-500/10 rounded-full blur-[80px]"></div>

            <div className="relative z-10 space-y-10">
              <div>
                <label className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] block mb-4">
                  Total Receipt Amount
                </label>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-orange-500">₱</span>
                  <input
                    type="number"
                    value={billAmount}
                    onChange={(e) => setBillAmount(Number(e.target.value))}
                    className="bg-transparent text-6xl font-bold w-full focus:outline-none border-b border-white/10 pb-4"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between py-8 border-b border-white/5">
                <span className="font-bold text-slate-400">Participants</span>
                <div className="flex items-center gap-6">
                  <motion.button
                    whileTap={{ scale: 0.8 }}
                    onClick={() => setPeople(Math.max(1, people - 1))}
                    className="h-12 w-12 rounded-2xl border border-white/20 flex items-center justify-center hover:bg-white/10"
                  >
                    <Minus className="h-5 w-5" />
                  </motion.button>
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={people}
                      initial={{ y: 10, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: -10, opacity: 0 }}
                      className="text-3xl font-bold min-w-[30px] text-center"
                    >
                      {people}
                    </motion.span>
                  </AnimatePresence>
                  <motion.button
                    whileTap={{ scale: 0.8 }}
                    onClick={() => setPeople(people + 1)}
                    className="h-12 w-12 rounded-2xl border border-white/20 flex items-center justify-center hover:bg-white/10"
                  >
                    <Plus className="h-5 w-5" />
                  </motion.button>
                </div>
              </div>

              <div>
                <div className="text-orange-500 text-[10px] font-black uppercase tracking-[0.2em] mb-4">
                  Per Person Share
                </div>
                <div className="flex items-baseline gap-2">
                  <motion.span
                    key={calculateSplit()}
                    initial={{ scale: 1.1, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-6xl font-black"
                  >
                    ₱{calculateSplit()}
                  </motion.span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default CalculatorTool;
