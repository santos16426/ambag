"use client";

import { Plus } from "lucide-react";
import type { RefObject } from "react";

export const QUICK_REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "🔥"] as const;

export const EXTENDED_EMOJIS = [
  "💯",
  "✨",
  "🙌",
  "🙏",
  "👀",
  "🚀",
  "💡",
  "✅",
  "❌",
  "🤔",
  "😎",
  "🤩",
  "🤯",
  "😴",
  "💩",
  "🎉",
] as const;

export interface ReactionPickerProps {
  align: "left" | "right";
  showExtended: boolean;
  selectedEmojis: string[];
  onToggleExtended: () => void;
  onSelectEmoji: (emoji: string) => void;
  containerRef: RefObject<HTMLDivElement | null>;
}

export function ReactionPicker({
  align,
  showExtended,
  selectedEmojis,
  onToggleExtended,
  onSelectEmoji,
  containerRef,
}: ReactionPickerProps) {
  const alignClass = align === "right" ? "right-0" : "left-0";
  const selectedEmojiSet = new Set(selectedEmojis);

  return (
    <>
      <style>
        {`
          @keyframes reactionPickerPopIn {
            0% { transform: scale(0.85); opacity: 0; }
            100% { transform: scale(1); opacity: 1; }
          }
          .reaction-picker-animate-pop {
            animation: reactionPickerPopIn 0.15s cubic-bezier(0.34, 1.56, 0.64, 1);
          }
        `}
      </style>
      <div
        ref={containerRef}
        className={`absolute -top-14 z-20 flex flex-col reaction-picker-animate-pop ${alignClass}`}
      >
        <div className="flex items-center gap-1 p-1 bg-white border border-slate-100 rounded-full shadow-2xl ring-1 ring-black/5">
          {QUICK_REACTIONS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => onSelectEmoji(emoji)}
              className={`w-9 h-9 flex items-center justify-center rounded-full transition-all text-xl ${
                selectedEmojiSet.has(emoji)
                  ? "bg-indigo-100 "
                  : "hover:bg-slate-50 hover:scale-125"
              }`}
            >
              {emoji}
            </button>
          ))}

          <div className="w-px h-6 bg-slate-100 mx-1" />

          <button
            type="button"
            onClick={onToggleExtended}
            className={`w-9 h-9 flex items-center justify-center rounded-full transition-colors ${
              showExtended
                ? "bg-indigo-50 text-indigo-600"
                : "hover:bg-slate-50 text-slate-400"
            }`}
            aria-expanded={showExtended}
            aria-label="More emojis"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>

        {showExtended && (
          <div className="mt-2 p-3 bg-white border border-slate-100 rounded-2xl shadow-2xl ring-1 ring-black/5 w-64 reaction-picker-animate-pop">
            <div className="grid grid-cols-6 gap-1">
              {EXTENDED_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => onSelectEmoji(emoji)}
                  className={`w-8 h-8 flex items-center justify-center rounded-lg transition-transform text-lg ${
                    selectedEmojiSet.has(emoji)
                      ? "bg-indigo-100 ring-1 ring-indigo-300 scale-105"
                      : "hover:bg-slate-100 hover:scale-110"
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
