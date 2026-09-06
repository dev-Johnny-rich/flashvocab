"use client";

import TopBar from "@/components/top-bar";

// 复习界面（M3 接入 FSRS 复习队列前为空状态骨架）
export default function ReviewView({
  onBack,
  onLearn,
}: {
  onBack?: () => void;
  onLearn?: () => void;
}) {
  return (
    <main className="view-in flex min-h-screen flex-col bg-background">
      <TopBar label="复习" onBack={onBack} />

      <section className="flex flex-1 flex-col items-center justify-center gap-8 px-6 text-center">
        <p className="text-lg text-neutral-700">暂无待复习的单词</p>
        <p className="-mt-4 text-sm text-neutral-400">
          先去学习，积累一些单词后再来复习
        </p>
        {onLearn && (
          <button
            onClick={onLearn}
            className="rounded-full bg-neutral-900 px-8 py-3 text-base text-white transition hover:bg-neutral-700 active:scale-[0.98]"
          >
            去学习
          </button>
        )}
      </section>
    </main>
  );
}
