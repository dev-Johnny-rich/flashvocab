"use client";

import { useState } from "react";

const SERIF =
  'Baskerville, "Songti SC", "Noto Serif SC", "SimSun", Georgia, serif';

export default function HomeView({ onLearn }: { onLearn: () => void }) {
  const [reviewHint, setReviewHint] = useState(false);

  return (
    <main
      className="view-in relative min-h-screen overflow-hidden bg-cover bg-center"
      style={{ backgroundImage: "url(/images/flashvocab-bg.jpg)" }}
    >
      <div
        className="flex min-h-screen flex-col items-center justify-center px-6 text-center"
        style={{ transform: "translateY(-200px)" }}
      >
        {/* 标语 · 黑色 h1 */}
        <h1
          className="max-w-4xl text-[clamp(1.9rem,5vw,3.4rem)] font-normal leading-snug text-black"
          style={{ fontFamily: SERIF }}
        >
          Break language barriers, unlock endless possibilities.
        </h1>

        {/* 学习 / 复习 选择 */}
        <div className="mt-14 flex flex-col items-center gap-4 sm:flex-row sm:gap-6">
          <button
            onClick={onLearn}
            className="w-44 rounded-full bg-neutral-900 px-8 py-3.5 text-base text-white transition hover:bg-neutral-700 active:scale-[0.98]"
          >
            学习
          </button>
          <button
            onClick={() => setReviewHint(true)}
            className="w-44 rounded-full border border-neutral-900/25 bg-white/85 px-8 py-3.5 text-base text-neutral-900 backdrop-blur-sm transition hover:bg-white active:scale-[0.98]"
          >
            复习
          </button>
        </div>

        {reviewHint && (
          <p className="mt-6 text-sm text-neutral-600">
            还没有待复习的单词，先去学习吧
          </p>
        )}
      </div>
    </main>
  );
}
