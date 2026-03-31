"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Check,
  ChevronDown,
  Copy,
  CreditCard,
  Download,
  Loader2,
  QrCode,
} from "lucide-react";

import { copyToClipboard } from "@/lib/clipboard";

import type { RecipientPaymentMethod } from "../hooks/useRecipientPaymentMethods";
import Image from "next/image";

interface SettlementPaymentMethodsProps {
  methods: RecipientPaymentMethod[];
  selectedMethodId: string;
  isLoading: boolean;
  onChangeSelected: (id: string) => void;
}

export function SettlementPaymentMethods({
  methods,
  selectedMethodId,
  isLoading,
  onChangeSelected,
}: SettlementPaymentMethodsProps) {
  const [copyFeedback, setCopyFeedback] = useState<"name" | "number" | null>(
    null,
  );

  if (!methods.length && !isLoading) {
    return null;
  }

  const selectedMethod = methods.find((m) => m.id === selectedMethodId) ?? null;

  function handleCopy(value: string, field: "name" | "number") {
    copyToClipboard(value);
    setCopyFeedback(field);
    window.setTimeout(() => setCopyFeedback(null), 1500);
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-[10px] font-bold uppercase text-slate-400">
          Payment Method
        </label>
        {isLoading && (
          <Loader2 className="w-3 h-3 animate-spin text-indigo-500" />
        )}
      </div>
      <div className="relative">
        <select
          value={selectedMethodId}
          onChange={(e) => onChangeSelected(e.target.value)}
          className="w-full h-12 pl-12 pr-10 bg-slate-50 border-2 border-transparent rounded-2xl text-xs font-bold text-slate-900 outline-none appearance-none focus:border-indigo-500 focus:bg-white"
        >
          <option value="">Cash</option>
          {methods.length > 0 ? (
            methods.map((method) => (
              <option key={method.id} value={method.id}>
                {method.type === "bank"
                  ? `${method.banktype ?? "Bank"} Account`
                  : "Digital QR Code"}
              </option>
            ))
          ) : (
            <option value="">Loading…</option>
          )}
        </select>
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
          {selectedMethod?.type === "bank" ? (
            <CreditCard className="w-4 h-4" />
          ) : (
            <QrCode className="w-4 h-4" />
          )}
        </div>
        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
          <ChevronDown className="w-3 h-3" />
        </div>
      </div>

      <AnimatePresence mode="wait">
        {selectedMethod && (
          <motion.div
            key={selectedMethod.id}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="overflow-hidden"
          >
            {selectedMethod.type === "bank" ? (
              <div className="p-5 bg-slate-900 rounded-[1.5rem] text-white space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">
                      Account Name
                    </p>
                    <p className="text-sm font-bold italic">
                      {selectedMethod.accountname}
                    </p>
                  </div>
                  {selectedMethod.accountname && (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          handleCopy(selectedMethod.accountname ?? "", "name")
                        }
                        className="p-2 bg-white/10 hover:bg-white/20 rounded-lg"
                      >
                        {copyFeedback === "name" ? (
                          <Check className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                      {copyFeedback === "name" && (
                        <span className="text-[9px] font-bold text-emerald-300 uppercase tracking-widest">
                          Copied
                        </span>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-white/5">
                  <div>
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">
                      Account Number
                    </p>
                    <p className="text-sm font-bold italic">
                      {selectedMethod.accountnumber}
                    </p>
                  </div>
                  {selectedMethod.accountnumber && (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          handleCopy(
                            selectedMethod.accountnumber ?? "",
                            "number",
                          )
                        }
                        className="p-2 bg-white/10 hover:bg-white/20 rounded-lg"
                      >
                        {copyFeedback === "number" ? (
                          <Check className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                      {copyFeedback === "number" && (
                        <span className="text-[9px] font-bold text-emerald-300 uppercase tracking-widest">
                          Copied
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-6 bg-slate-50 border border-slate-100 rounded-[1.5rem] flex flex-col items-center">
                <div className="w-full flex justify-between items-center mb-4">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                    Recipient QR Code
                  </span>
                  {selectedMethod.qrcodeurl && (
                    <a
                      href={selectedMethod.qrcodeurl}
                      download="payment-qr.png"
                      className="p-2 bg-white border border-slate-200 rounded-lg text-slate-500 hover:text-indigo-600 hover:border-indigo-100 transition-all flex items-center gap-2 text-[9px] font-black uppercase tracking-tighter"
                    >
                      <Download className="w-3 h-3" />
                      Download
                    </a>
                  )}
                </div>
                {selectedMethod.qrcodeurl && (
                  <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                    <Image
                      width={160}
                      height={160}
                      alt="QR code for payment"
                      src={selectedMethod.qrcodeurl}
                      className="w-40 h-40"
                    />
                  </div>
                )}
                <p className="mt-4 text-[10px] font-bold text-slate-400 italic">
                  Scan directly from this screen to pay
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
