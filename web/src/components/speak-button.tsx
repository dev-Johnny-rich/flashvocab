"use client";

import { speakWord } from "@/lib/speech";

// 单词朗读按钮：stopPropagation 避免触发卡片翻转
export default function SpeakButton({
  word,
  size = "md",
}: {
  word: string;
  size?: "sm" | "md";
}) {
  const px = size === "sm" ? "p-1.5" : "p-2";
  const icon = size === "sm" ? 15 : 19;
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        speakWord(word);
      }}
      onKeyDown={(e) => e.stopPropagation()}
      aria-label={`朗读 ${word}`}
      title="朗读"
      className={`${px} inline-flex shrink-0 items-center justify-center rounded-full text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-700 active:scale-90`}
    >
      <svg
        width={icon}
        height={icon}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <path d="M11 5 6 9H2v6h4l5 4V5z" fill="currentColor" stroke="none" />
        <path d="M15.5 8.5a5 5 0 0 1 0 7" />
        <path d="M18.5 5.5a9.5 9.5 0 0 1 0 13" />
      </svg>
    </button>
  );
}
