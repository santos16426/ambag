"use client";

import { useState } from "react";
import { Search, X, Mail, UserPlus, Check } from "lucide-react";

import { searchUserByEmail } from "./search-users.service";
import type { MemberInvite } from "./types";
import Image from "next/image";

export interface MemberSearchProps {
  selectedMembers: MemberInvite[];
  onAddMember: (member: MemberInvite) => void;
  onRemoveMember: (id: string) => void;
  /**
   * When adding to an existing group, return a reason to disable the Add button
   * (e.g. "Already a member", "Invitation already sent", "Join request pending").
   */
  getAddDisabledReason?: (result: MemberInvite) => string | null;
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function MemberSearch({
  selectedMembers,
  onAddMember,
  onRemoveMember,
  getAddDisabledReason,
}: MemberSearchProps) {
  const [emailInput, setEmailInput] = useState("");
  const [searchResult, setSearchResult] = useState<MemberInvite | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [showResult, setShowResult] = useState(false);

  async function handleEmailChange(email: string) {
    setEmailInput(email);

    if (!email.trim()) {
      setSearchResult(null);
      setShowResult(false);
      return;
    }

    if (!isValidEmail(email)) {
      setSearchResult(null);
      setShowResult(false);
      return;
    }

    setIsSearching(true);
    setShowResult(true);

    try {
      const result = await searchUserByEmail(email);
      setSearchResult(result);
    } catch {
      setSearchResult(null);
    } finally {
      setIsSearching(false);
    }
  }

  function handleAddMember() {
    if (!searchResult) return;

    const alreadyAdded = selectedMembers.some(
      (m) => m.email.toLowerCase() === searchResult.email.toLowerCase(),
    );
    if (alreadyAdded) return;

    const groupBlockReason = getAddDisabledReason?.(searchResult) ?? null;
    if (groupBlockReason) return;

    onAddMember(searchResult);
    setEmailInput("");
    setSearchResult(null);
    setShowResult(false);
  }

  function isAlreadyAdded(email: string) {
    return selectedMembers.some(
      (m) => m.email.toLowerCase() === email.toLowerCase(),
    );
  }

  function getDisabledReason(): string | null {
    if (!searchResult) return null;
    if (isAlreadyAdded(searchResult.email)) return "Already Added";
    return getAddDisabledReason?.(searchResult) ?? null;
  }

  const disabledReason = getDisabledReason();
  const isAddDisabled = !!disabledReason;

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="email"
          placeholder="Enter email address..."
          value={emailInput}
          onChange={(e) => handleEmailChange(e.target.value)}
          onFocus={() => emailInput && setShowResult(true)}
          className="w-full flex-1 bg-slate-50 px-6 py-4 pl-11 pr-10 rounded-2xl outline-none font-bold text-sm focus:bg-white border border-transparent focus:border-slate-200 transition-all"
        />
        {emailInput && (
          <button
            type="button"
            onClick={() => {
              setEmailInput("");
              setSearchResult(null);
              setShowResult(false);
            }}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {showResult && isValidEmail(emailInput) && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-100 rounded-2xl shadow-lg z-50 overflow-hidden">
            {isSearching ? (
              <div className="p-4 text-center text-sm text-slate-400">
                Checking email...
              </div>
            ) : searchResult ? (
              <div className="p-4">
                {searchResult.isExistingUser ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-black text-sm">
                        {searchResult.full_name?.charAt(0) ||
                          searchResult.email.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-800 truncate">
                          {searchResult.full_name || "User"}
                        </p>
                        <p className="text-xs text-slate-400 truncate">
                          {searchResult.email}
                        </p>
                      </div>
                      <UserPlus className="w-4 h-4 text-green-500 shrink-0" />
                    </div>
                    <button
                      type="button"
                      onClick={handleAddMember}
                      disabled={isAddDisabled}
                      className="w-full py-3 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-900 transition-all disabled:opacity-50"
                    >
                      {disabledReason ? (
                        <>
                          <Check className="w-4 h-4 inline mr-2" />
                          {disabledReason}
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-4 h-4 inline mr-2" />
                          Add Member
                        </>
                      )}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                        <Mail className="w-5 h-5 text-slate-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-800">
                          User not found
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5 truncate">
                          {searchResult.email}
                        </p>
                        <p className="text-xs text-indigo-600 mt-1">
                          Will send email invitation
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleAddMember}
                      disabled={isAddDisabled}
                      className="w-full py-3 bg-white border border-slate-200 text-slate-700 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all disabled:opacity-50"
                    >
                      {disabledReason ? (
                        <>
                          <Check className="w-4 h-4 inline mr-2" />
                          {disabledReason}
                        </>
                      ) : (
                        <>
                          <Mail className="w-4 h-4 inline mr-2" />
                          Add & Send Invite
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        )}
      </div>

      {selectedMembers.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
            {selectedMembers.length}{" "}
            {selectedMembers.length === 1 ? "member" : "members"} to add
          </p>
          <div className="flex flex-wrap gap-2">
            {selectedMembers.map((member) => (
              <div
                key={member.id}
                className={`flex w-full items-center gap-2 py-1.5 rounded-2xl text-sm `}
              >
                {member.isExistingUser || member.avatar_url ? (
                  <div className="w-11 h-11 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center border-2 border-white shadow-sm text-sm font-bold overflow-hidden">
                    <Image
                      width={32}
                      height={32}
                      src={member.avatar_url || ""}
                      alt={member.full_name || member.email}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-11 h-11 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center border-2 border-white shadow-sm text-sm font-bold overflow-hidden">
                    <Mail className="w-3 h-3 text-indigo-500 shrink-0" />
                  </div>
                )}
                <div className="flex flex-col gap-1 flex-1">
                  <span className="font-bold text-slate-600 truncate w-full">
                    {member.full_name || member.email}
                  </span>
                  {member.isExistingUser ? (
                    <span className="text-[10px] font-bold text-slate-400 tracking-tight truncate max-w-[140px]">
                      {member.email}
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-slate-400 tracking-tight truncate max-w-[140px]">
                      Will send email invitation
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => onRemoveMember(member.id)}
                  className="p-1 text-slate-300 hover:text-red-500 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
