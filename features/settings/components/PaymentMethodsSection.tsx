import React, { useState } from "react";
import { Building2, CreditCard, QrCode, Trash2 } from "lucide-react";
import Image from "next/image";

import type { PayoutMethod } from "../types";

interface PaymentMethodsSectionProps {
  loading: boolean;
  payoutMethods: PayoutMethod[];
  onAddBank: () => void;
  onAddQr: () => void;
  onRemoveMethod: (id: string) => void;
}

export function PaymentMethodsSection({
  loading,
  payoutMethods,
  onAddBank,
  onAddQr,
  onRemoveMethod,
}: PaymentMethodsSectionProps) {
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
          Payment Methods
        </h3>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onAddBank}
            className="text-[11px] font-bold text-slate-600 bg-white border border-slate-200 px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-slate-50 transition-all active:scale-95"
          >
            <Building2 size={14} /> Add Bank
          </button>
          <button
            type="button"
            onClick={onAddQr}
            className="text-[11px] font-bold text-slate-600 bg-white border border-slate-200 px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-slate-50 transition-all active:scale-95"
          >
            <QrCode size={14} /> Add QR
          </button>
        </div>
      </div>

      {loading ? (
        <div className="grid gap-4">
          {[0, 1].map((item) => (
            <div
              key={item}
              className="flex items-center gap-4 p-6 rounded-[32px] border-2 border-white bg-white shadow-sm animate-pulse"
            >
              <div className="w-14 h-14 rounded-2xl bg-slate-100" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-24 rounded bg-slate-100" />
                <div className="h-4 w-40 rounded bg-slate-100" />
                <div className="h-3 w-32 rounded bg-slate-50" />
              </div>
              <div className="w-9 h-9 rounded-full bg-slate-100" />
            </div>
          ))}
        </div>
      ) : payoutMethods.length === 0 ? (
        <div className="rounded-[32px] border-2 border-dashed border-slate-200 bg-white py-10 px-6 text-center flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-300">
            <CreditCard size={18} />
          </div>
          <p className="text-sm font-semibold text-slate-600">
            No payout methods yet.
          </p>
          <p className="text-xs text-slate-400 max-w-xs">
            Add a bank account or upload a QR so friends know where to send your
            share.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {payoutMethods.map((method) => (
            <div
              key={method.id}
              className="group relative flex flex-col md:flex-row md:items-center gap-6 p-6 rounded-[32px] border-2 border-white bg-white shadow-sm transition-all"
            >
              <div
                className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner ${
                  method.type === "bank"
                    ? "bg-blue-600 text-white"
                    : "bg-emerald-500 text-white"
                }`}
              >
                {method.type === "bank" ? (
                  <CreditCard size={28} />
                ) : (
                  <QrCode size={28} />
                )}
              </div>

              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-black uppercase tracking-tighter px-2 py-0.5 rounded-md bg-slate-100 text-slate-500">
                    {method.type === "bank"
                      ? (method.bankType ?? "Bank account")
                      : "QR METHOD"}
                  </span>
                </div>
                <h4 className="text-xl font-black text-slate-900 tracking-tight">
                  {method.type === "bank"
                    ? (method.accountName ?? "Unnamed account")
                    : "Personal QR Code"}
                </h4>
                <p className="text-sm font-mono font-bold text-slate-400 tracking-widest">
                  {method.type === "bank"
                    ? method.accountNumber
                    : "Image Uploaded"}
                </p>
              </div>

              <div className="flex items-center gap-2">
                {method.type === "qr" && method.qrImage && (
                  <div className="w-14 h-14 rounded-xl bg-slate-50 border border-slate-100 p-1 flex items-center justify-center overflow-hidden">
                    <Image
                      width={56}
                      height={56}
                      src={method.qrImage}
                      className="w-full h-full object-contain"
                      alt="QR code"
                    />
                  </div>
                )}
                {pendingDeleteId === method.id ? (
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        onRemoveMethod(method.id);
                        setPendingDeleteId(null);
                      }}
                      className="px-3 py-1.5 text-[10px] font-black uppercase rounded-xl bg-rose-600 text-white hover:bg-rose-700 transition-colors"
                    >
                      Confirm
                    </button>
                    <button
                      type="button"
                      onClick={() => setPendingDeleteId(null)}
                      className="px-3 py-1.5 text-[10px] font-black uppercase rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setPendingDeleteId(method.id)}
                    className="p-3 text-slate-300 hover:text-rose-500 transition-all"
                  >
                    <Trash2 size={20} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
