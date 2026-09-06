"use client";

import { useState } from "react";
import { loadStudyState } from "@/lib/storage";
import { isDueCard, reviveCard } from "@/lib/scheduler";

const SERIF =
  'Baskerville, "Songti SC", "Noto Serif SC", "SimSun", Georgia, serif';

export default function HomeView({
  onLearn,
  onReview,
}: {
  onLearn: () => void;
  onReview: () => void;
}) {
  // 待复习数（进入主页时按到期卡片计算）
  const [due] = useState(() => {
    const s = loadStudyState();
    let n = 0;
    for (const raw of Object.values(s.cards)) {
      const c = reviveCard(raw);
      if (c && isDueCard(c)) n += 1;
    }
    return n;
  });

  return (
    <main
      className="view-in relative min-h-screen overflow-hidden bg-cover bg-center"
      style={{ backgroundImage: "url(/images/flashvocab-bg.jpg)" }}
    >
      {/* 标语 · 黑色 h1，位于屏心上方 200px */}
      <h1
        className="absolute left-1/2 w-[min(92vw,64rem)] px-4 text-center text-[clamp(1.9rem,5vw,3.4rem)] font-normal leading-snug text-black"
        style={{
          fontFamily: SERIF,
          top: "calc(50% - 200px)",
          transform: "translate(-50%, -50%)",
        }}
      >
        Break language barriers, unlock endless possibilities.
      </h1>

      {/* 学习 / 复习选择 · 屏幕居中 */}
      <div className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:gap-6">
          <button
            onClick={onLearn}
            className="w-44 rounded-full bg-neutral-900 px-8 py-3.5 text-base text-white transition hover:bg-neutral-700 active:scale-[0.98]"
          >
            学习
          </button>
          <button
            onClick={onReview}
            className="flex w-44 items-center justify-center gap-2 rounded-full border border-neutral-900/25 bg-white/85 px-8 py-3.5 text-base text-neutral-900 backdrop-blur-sm transition hover:bg-white active:scale-[0.98]"
          >
            复习
            {due > 0 && (
              <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-neutral-900 px-1.5 text-xs font-medium text-white">
                {due}
              </span>
            )}
          </button>
        </div>
      </div>
    </main>
  );
}
