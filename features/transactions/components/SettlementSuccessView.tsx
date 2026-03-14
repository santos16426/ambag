"use client";

import React, { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Banknote, Check, Coins, User } from "lucide-react";
import getInitials from "@/lib/get-initials";
import { FORM_CARD_TRANSITION, SUCCESS_AUTO_CLOSE_SECONDS } from "../constants/forms";

export interface SettlementSuccessData {
  fromUserId: string;
  toUserId: string;
  amount: number;
}

/** Minimal member shape for display (matches SettlementFormMember). */
interface SettlementSuccessMember {
  id: string;
  fullname: string | null;
  email: string;
}

function displayName(
  m: SettlementSuccessMember | undefined,
  id: string,
  currentUserId?: string | null,
): string {
  if (!m) return "—";
  if (id === currentUserId) return "Me";
  return m.fullname ?? m.email ?? "—";
}

export interface SettlementSuccessViewProps {
  data: SettlementSuccessData;
  members: SettlementSuccessMember[];
  currentUserId?: string | null;
  currencySymbol: string;
  onDone: () => void;
}

export function SettlementSuccessView({
  data,
  members,
  currentUserId,
  currencySymbol,
  onDone,
}: SettlementSuccessViewProps) {
  const onDoneRef = useRef(onDone);
  useEffect(() => {
    onDoneRef.current = onDone;
  }, [onDone]);
  useEffect(() => {
    const id = window.setTimeout(() => {
      onDoneRef.current();
    }, SUCCESS_AUTO_CLOSE_SECONDS * 1000);
    return () => window.clearTimeout(id);
  }, []);

  const fromMember = members.find((m) => m.id === data.fromUserId);
  const toMember = members.find((m) => m.id === data.toUserId);

  return (
    <motion.div
      key="settlement-success"
      initial={{ opacity: 0, scale: 0.98, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98, y: 4 }}
      transition={FORM_CARD_TRANSITION}
      className="w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden"
    >
      {/* Sender (left) and Recipient (right) with flying money */}
      <div className="relative w-full h-[280px] flex items-center justify-between px-8 pt-8 bg-slate-50/80">
        <motion.div
          initial={{ x: -30, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.35 }}
          className="flex flex-col items-center gap-3 z-10"
        >
          <div className="w-20 h-20 rounded-full bg-white border-2 border-indigo-200 p-1 shadow-lg flex items-center justify-center overflow-hidden">
            <div className="w-full h-full rounded-full bg-indigo-50 flex items-center justify-center text-indigo-700 font-black text-xl">
              {fromMember ? (
                getInitials(fromMember.fullname, fromMember.email)
              ) : (
                <User className="w-10 h-10 text-slate-300" />
              )}
            </div>
          </div>
          <span className="text-[10px] font-black uppercase tracking-wider bg-indigo-100 text-indigo-700 px-3 py-1.5 rounded-full">
            {displayName(fromMember, data.fromUserId, currentUserId)}
          </span>
        </motion.div>

        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {[...Array(12)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ x: -120, y: 0, opacity: 0, scale: 0.5, rotate: 0 }}
              animate={{
                x: 120,
                y: [0, -32, 32, -16, 0][i % 5],
                opacity: [0, 1, 1, 0],
                scale: [0.5, 1.1, 1.1, 0.8],
                rotate: 360 * (i + 1),
              }}
              transition={{
                duration: 1.2,
                repeat: Infinity,
                delay: i * 0.15,
                ease: "easeInOut",
              }}
              className="absolute text-emerald-500/90"
            >
              {i % 2 === 0 ? (
                <Banknote className="w-7 h-7 drop-shadow-md" />
              ) : (
                <Coins className="w-5 h-5 drop-shadow-md" />
              )}
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ x: 30, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.35 }}
          className="flex flex-col items-center gap-3 z-10"
        >
          <div className="w-20 h-20 rounded-full bg-white border-2 border-emerald-200 p-1 shadow-lg flex items-center justify-center overflow-hidden">
            <motion.div
              animate={{ scale: [1, 1.08, 1] }}
              transition={{ repeat: Infinity, duration: 0.6 }}
              className="w-full h-full rounded-full bg-emerald-50 flex items-center justify-center text-emerald-700 font-black text-xl"
            >
              {toMember ? (
                getInitials(toMember.fullname, toMember.email)
              ) : (
                <User className="w-10 h-10 text-slate-300" />
              )}
            </motion.div>
          </div>
          <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-full">
            {displayName(toMember, data.toUserId, currentUserId)}
          </span>
        </motion.div>
      </div>

      {/* Status */}
      <motion.div
        initial={{ y: 12, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.25 }}
        className="px-8 pb-8 pt-6 text-center flex flex-col items-center bg-white"
      >
        <div className="w-14 h-14 bg-emerald-500 rounded-full flex items-center justify-center mb-4 shadow-lg shadow-emerald-200">
          <Check className="text-white w-7 h-7 stroke-[2.5px]" />
        </div>
        <h3 className="text-slate-900 text-3xl font-black italic uppercase tracking-tighter leading-none mb-1">
          {currencySymbol}
          {data.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
        </h3>
        <p className="text-emerald-600 text-[10px] font-black uppercase tracking-[0.3em] mb-6">
          Sent Successfully
        </p>

        <button
          type="button"
          onClick={onDone}
          className="relative px-12 py-5 bg-emerald-500 rounded-full shadow-2xl transition-all active:scale-[0.98] overflow-hidden"
        >
          {/* Timer Overlay (Inside Button) */}
          <motion.div
            className="absolute inset-0 bg-emerald-100/20 origin-left"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: SUCCESS_AUTO_CLOSE_SECONDS, ease: "linear" }}
          />

          <span className="relative flex items-center gap-3 text-white font-black text-[11px] uppercase tracking-[0.4em]">
            Done
          </span>
        </button>
      </motion.div>
    </motion.div>
  );
}
