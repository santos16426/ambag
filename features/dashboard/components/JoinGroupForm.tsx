"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X, Loader2, KeyRound, Check, Clock, Clipboard } from "lucide-react";
import React, { useRef, useState } from "react";

import { createClient } from "@/lib/supabase/client";
import { useDashboardGroupsStore } from "../store/groups.store";

interface JoinGroupFormProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  onSuccess?: () => void;
}

const JoinGroupForm = ({
  isOpen,
  setIsOpen,
  onSuccess,
}: JoinGroupFormProps) => {
  const [code, setCode] = useState(["", "", "", "", "", "", "", ""]);
  const [isJoining, setIsJoining] = useState(false);
  const [step, setStep] = useState<"input" | "success">("input");
  const [error, setError] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<{
    groupName: string;
    autoApproved: boolean;
  } | null>(null);
  const inputs = useRef<HTMLInputElement[]>([]);
  const upsertGroupFromSummary = useDashboardGroupsStore(
    (s) => s.upsertGroupFromSummary,
  );

  const handleChange = (index: number, value: string) => {
    if (value.length > 1) value = value.slice(-1);
    const newCode = [...code];
    newCode[index] = value.toUpperCase();
    setCode(newCode);
    setError(null);

    if (value && index < 7) {
      inputs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const handleJoin = async () => {
    const inviteCode = code.join("").trim();
    if (!inviteCode || inviteCode.length < 8) return;

    setError(null);
    setIsJoining(true);

    const supabase = createClient();
    const { data, error } = await supabase.rpc("joingroupbyinvitecode", {
      invitecode: inviteCode,
    });

    if (error) {
      setError(error.message);
      setIsJoining(false);
      return;
    }

    const payload = (data ?? null) as {
      autoapproved?: boolean;
      group?: {
        id: string;
        name: string;
        description: string | null;
        invitecode: string | null;
        imageurl: string | null;
        createdat: string;
        archivedat: string | null;
        createdbyid: string;
        role: string;
        membercount: number;
        pendingjoinrequestcount: number;
        pendinginvitationcount: number;
        totalexpenses: number;
        totalsettlements: number;
      } | null;
    } | null;

    if (payload?.group) upsertGroupFromSummary(payload.group);

    setSuccessData({
      groupName: payload?.group?.name ?? "the group",
      autoApproved: payload?.autoapproved ?? true,
    });
    setStep("success");
    // No refetch needed: we store the returned summary-shaped group in the dashboard store.
    onSuccess?.();
    setIsJoining(false);
  };

  const resetAndClose = () => {
    setCode(["", "", "", "", "", "", "", ""]);
    setStep("input");
    setError(null);
    setSuccessData(null);
    setIsOpen(false);
  };

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-100 overflow-y-auto bg-[#F8F9FD]/95 backdrop-blur-md flex items-center justify-center p-4">
      <AnimatePresence mode="wait">
        {step === "input" ? (
          <motion.div
            key="join-input"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl p-8 border border-slate-100"
          >
            <div className="flex justify-between items-start mb-8">
              <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase italic">
                  Join Group
                </h2>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                  Enter 8-character invitation code
                </p>
              </div>
              <button
                onClick={resetAndClose}
                className="p-2 hover:bg-slate-50 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="flex justify-between gap-2 mb-10">
              {code.map((digit, idx) => (
                <input
                  key={idx}
                  ref={(el) => {
                    if (el) {
                      inputs.current[idx] = el;
                    }
                  }}
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(idx, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(idx, e)}
                  className="w-12 h-16 bg-slate-50 border-2 border-slate-100 rounded-2xl text-center text-xl font-black focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-50 outline-none transition-all"
                />
              ))}
            </div>

            {error && (
              <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-100">
                <p className="text-sm font-bold text-red-700">{error}</p>
              </div>
            )}

            <button
              disabled={code.join("").length < 8 || isJoining}
              onClick={handleJoin}
              className="w-full h-16 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-xs flex items-center justify-center gap-4 hover:bg-indigo-600 transition-all disabled:opacity-20"
            >
              {isJoining ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Verify Code <KeyRound className="w-4 h-4" />
                </>
              )}
            </button>
            {/* paste clipboard */}
            <button
              className="w-full h-16  text-slate-500 rounded-2xl text-xs flex items-center justify-center gap-2 transition-all disabled:opacity-20 cursor-pointer"
              onClick={async () => {
                const clipboard = await navigator.clipboard.readText();
                if (clipboard.length === 8) {
                  setCode(clipboard.split(""));
                } else {
                  setError("Invalid code length, please enter a valid code");
                }
              }}
            >
              <Clipboard className="w-4 h-4" />
              Paste Clipboard
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="join-success"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl p-12 border border-slate-100"
          >
            <div className="w-20 h-20 bg-green-500 rounded-3xl flex items-center justify-center text-white mx-auto mb-6 shadow-xl shadow-green-100">
              <Check className="w-10 h-10" />
            </div>
            <h3 className="text-2xl font-black text-slate-900 uppercase italic mb-2">
              {successData?.autoApproved ? "Access Granted" : "Request Sent"}
            </h3>
            <p className="text-slate-400 text-sm font-medium mb-10">
              {successData?.autoApproved ? (
                <>
                  You&apos;ve been added to{" "}
                  <span className="text-slate-900 font-bold">
                    &quot;{successData?.groupName ?? "the group"}&quot;
                  </span>
                </>
              ) : (
                <>
                  Your request to join{" "}
                  <span className="text-slate-900 font-bold">
                    &quot;{successData?.groupName ?? "the group"}&quot;
                  </span>{" "}
                  is pending approval from the group admin.
                </>
              )}
            </p>
            <button
              onClick={resetAndClose}
              className="w-full h-16 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-xs transition-all hover:bg-indigo-600 flex items-center justify-center gap-2"
            >
              {successData?.autoApproved ? (
                "Enter Group"
              ) : (
                <>
                  <Clock className="w-4 h-4" /> Done
                </>
              )}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default JoinGroupForm;
