"use client";

import type { Word } from "@/lib/types";
import SpeakButton from "@/components/speak-button";

const SERIF =
  'Baskerville, "Songti SC", "Noto Serif SC", "SimSun", Georgia, serif';

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
            <div className="flex items-center justify-center gap-3">
              <h1
                className="break-words text-[clamp(3rem,9vw,5.5rem)] font-normal leading-tight text-foreground"
                style={{ fontFamily: SERIF }}
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
