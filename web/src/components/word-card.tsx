"use client";

import type { Word } from "@/lib/types";
import SpeakButton from "@/components/speak-button";

const SERIF =
  'Baskerville, "Songti SC", "Noto Serif SC", "SimSun", Georgia, serif';

// 单词大字按长度分档：返回 clamp(min, vw, max) 三个值（内联 style，
// 不依赖 Tailwind 动态类提取；移动端 vw 自适应防溢出，桌面由 max 上限控制）
function wordSize(len: number): string {
  const s =
    len <= 5
      ? "clamp(2.9rem, 10vw, 5rem)"
      : len <= 7
        ? "clamp(2.5rem, 8.6vw, 4.4rem)"
        : len <= 9
          ? "clamp(2.1rem, 7.2vw, 3.7rem)"
          : len <= 11
            ? "clamp(1.85rem, 6.2vw, 3.2rem)"
            : len <= 13
              ? "clamp(1.6rem, 5.2vw, 2.8rem)"
              : "clamp(1.4rem, 4.5vw, 2.4rem)";
  return s;
}

// 学习/复习共用的词卡：点击翻转（受控 flipped），正反两面含发音与例句
export default function WordCard({
  w,
  flipped,
  onFlip,
}: {
  w: Word;
  flipped: boolean;
  onFlip: () => void;
}) {
  return (
    <div
      className="flashcard w-full max-w-2xl cursor-pointer select-none"
      onClick={onFlip}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onFlip();
        }
      }}
    >
      <div
        className={`flashcard-inner max-h-[62vh] ${flipped ? "flipped" : ""}`}
      >
        {/* 正面：单词 */}
        <div className="face max-h-[62vh] overflow-y-auto rounded-2xl border border-neutral-200/80 bg-white px-8 py-14 text-center shadow-[0_1px_2px_rgba(0,0,0,0.03)] sm:py-16">
          <div key={w.word} className="word-enter">
            <div className="flex min-w-0 items-center justify-center gap-3">
              {/* 字号按单词长度自适应，防窄屏溢出 */}
              <h1
                className="min-w-0 max-w-full break-words font-normal leading-tight text-foreground"
                style={{ fontFamily: SERIF, fontSize: wordSize(w.word.length) }}
              >
                {w.word}
              </h1>
              <SpeakButton word={w.word} />
            </div>
            {w.phonetic && (
              <p
                className="mt-4 text-xl text-neutral-400"
                style={{ fontFamily: SERIF }}
              >
                /{w.phonetic}/
              </p>
            )}
            {w.example && (
              <p
                className="mx-auto mt-7 max-w-md text-base italic leading-relaxed text-neutral-500"
                style={{ fontFamily: SERIF }}
              >
                {w.example.en}
              </p>
            )}
          </div>
        </div>

        {/* 背面：释义 */}
        <div className="face face-back max-h-[62vh] overflow-y-auto rounded-2xl border border-neutral-200/80 bg-white px-6 py-10 text-left shadow-[0_1px_2px_rgba(0,0,0,0.03)] sm:px-10 sm:py-12">
          <div className="flex items-center justify-center gap-2">
            <p
              className="break-words text-center text-3xl font-normal leading-tight text-foreground sm:text-4xl"
              style={{ fontFamily: SERIF }}
            >
              {w.word}
            </p>
            <SpeakButton word={w.word} size="sm" />
          </div>
          {w.phonetic && (
            <p
              className="mt-1.5 text-center text-sm text-neutral-400"
              style={{ fontFamily: SERIF }}
            >
              /{w.phonetic}/
            </p>
          )}
          <ul className="mx-auto mt-6 max-w-md space-y-3">
            {w.senses.map((s, i) => (
              <li key={i} className="flex gap-2.5 text-[15px] leading-relaxed">
                <span className="shrink-0 pt-px text-neutral-400">
                  {s.pos ? `${s.pos}.` : s.domain ? `[${s.domain}]` : "·"}
                </span>
                <span className="text-foreground/90">{s.text}</span>
              </li>
            ))}
          </ul>

          {w.example && (
            <div className="mx-auto mt-7 max-w-md border-t border-neutral-200/70 pt-5">
              <p
                className="text-base italic leading-relaxed text-neutral-600"
                style={{ fontFamily: SERIF }}
              >
                {w.example.en}
              </p>
              <p className="mt-1.5 text-sm text-neutral-400">{w.example.zh}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
