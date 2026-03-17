"use client";

import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { QrCode, Upload, X } from "lucide-react";

interface QrFormProps {
  isOpen: boolean;
  onClose: () => void;
  step: "form" | "success";
  qrImage: string | null;
  isSubmitting?: boolean;
  error?: string | null;
  qrInputRef: React.RefObject<HTMLInputElement | null>;
  onUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: () => void;
  onSuccess: () => void;
}

export function QRForm({
  isOpen,
  onClose,
  step,
  qrImage,
  isSubmitting = false,
  error = null,
  qrInputRef,
  onUpload,
  onSubmit,
  onSuccess,
}: QrFormProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="qr-form-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-100 overflow-y-auto bg-[#F8F9FD]"
        >
          <div className="max-w-xl mx-auto pt-10 px-4 pb-20">
            {/* Header / Close */}
            <div className="flex items-center justify-between mb-8 px-1">
              <button
                type="button"
                onClick={onClose}
                className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-indigo-600 transition-colors"
              >
                <X className="w-3 h-3" /> Close
              </button>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  QR Method
                </span>
              </div>
            </div>

            {step === "form" ? (
              <>
                {/* Upload card */}
                <div className="space-y-4">
                  <div className="bg-white p-7 rounded-3xl border border-slate-100 shadow-sm space-y-5">
                    <p className="text-xs font-medium text-slate-500">
                      Upload a single QR image so friends know where to send your
                      share.
                    </p>
                    <button
                      type="button"
                      onClick={() => qrInputRef.current?.click()}
                      className={`relative w-full aspect-square rounded-[1.75rem] border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all ${
                        qrImage
                          ? "border-emerald-500 bg-emerald-50"
                          : "border-slate-200 bg-slate-50 hover:border-indigo-400"
                      }`}
                    >
                      {qrImage ? (
                        <div className="w-full h-full p-6">
                          <img
                            src={qrImage}
                            className="w-full h-full object-contain rounded-xl"
                            alt="QR preview"
                          />
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-3 text-slate-300">
                          <div className="p-5 bg-white rounded-3xl shadow-sm ring-1 ring-slate-100">
                            <Upload className="w-7 h-7" />
                          </div>
                          <span className="text-[10px] font-black uppercase tracking-widest">
                            Select Image
                          </span>
                        </div>
                      )}
                      <input
                        ref={qrInputRef}
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={onUpload}
                      />
                    </button>
                  </div>

                  {error && (
                    <div className="p-4 rounded-2xl bg-red-50 border border-red-100">
                      <p className="text-xs font-bold text-red-700 text-center">
                        {error}
                      </p>
                    </div>
                  )}
                </div>

                <div className="mt-8">
                  <button
                    type="button"
                    disabled={isSubmitting || !qrImage}
                    onClick={onSubmit}
                    className="w-full h-16 bg-slate-950 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-xs flex items-center justify-center gap-4 hover:bg-indigo-600 transition-all disabled:opacity-30"
                  >
                    {isSubmitting ? (
                      <span className="text-[11px] tracking-[0.2em]">
                        Saving...
                      </span>
                    ) : (
                      <span className="text-[11px] tracking-[0.2em]">
                        Save QR Method
                      </span>
                    )}
                  </button>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center mt-10 space-y-8">
                <div className="w-20 h-20 bg-emerald-500 rounded-[2rem] flex items-center justify-center text-white shadow-2xl shadow-emerald-100">
                  <QrCode className="w-10 h-10" />
                </div>
                <div className="w-full max-w-xs bg-slate-50 border border-slate-100 rounded-[2rem] p-5 flex items-center gap-4 shadow-sm">
                  <div className="w-12 h-12 rounded-2xl bg-slate-950 flex items-center justify-center text-white">
                    <QrCode className="w-6 h-6 text-white/70" />
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">
                      New QR Method
                    </p>
                    <h3 className="text-sm font-black text-slate-900 truncate">
                      Personal QR Code
                    </h3>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onSuccess}
                  className="w-full max-w-xs py-5 bg-slate-950 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-xs flex items-center justify-center gap-3 hover:bg-indigo-600 transition-all shadow-xl"
                >
                  Done
                </button>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
