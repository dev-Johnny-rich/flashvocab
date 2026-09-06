"use client";

import { useEffect } from "react";
import type { Word } from "@/lib/types";
import SpeakButton from "@/components/speak-button";

const SERIF =
  'Baskerville, "Songti SC", "Noto Serif SC", "SimSun", Georgia, serif';

// 单词详情弹层：结算页/词库查阅时点击单词弹出
export default function WordModal({
  word,
  onClose,
}: {
  word: Word;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 backdrop-blur-[2px]"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="max-h-[82vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white px-7 py-9 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <h2
              className="break-words text-4xl font-normal leading-tight text-foreground"
              style={{ fontFamily: SERIF }}
            >
              {word.word}
            </h2>
            <SpeakButton word={word.word} />
          </div>
          <button
            onClick={onClose}
            aria-label="关闭"
            className="rounded-full p-1.5 text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-700"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              aria-hidden
            >
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {word.phonetic && (
          <p
            className="mt-1.5 text-base text-neutral-400"
            style={{ fontFamily: SERIF }}
          >
            /{word.phonetic}/
          </p>
        )}

        <ul className="mt-6 space-y-3">
          {word.senses.map((s, i) => (
            <li key={i} className="flex gap-2.5 text-[15px] leading-relaxed">
              <span className="shrink-0 pt-px text-neutral-400">
                {s.pos ? `${s.pos}.` : s.domain ? `[${s.domain}]` : "·"}
              </span>
              <span className="text-foreground/90">{s.text}</span>
            </li>
          ))}
        </ul>

        {word.example && (
          <div className="mt-7 border-t border-neutral-200/70 pt-5">
            <p
              className="text-base italic leading-relaxed text-neutral-600"
              style={{ fontFamily: SERIF }}
            >
              {word.example.en}
            </p>
            {word.example.zh ? (
              <p className="mt-1.5 text-sm text-neutral-400">{word.example.zh}</p>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
