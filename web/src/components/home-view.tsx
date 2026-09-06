"use client";

import { useState } from "react";
import { daysSinceBackup, loadCurrentBook, loadStudyState, saveCurrentBook } from "@/lib/storage";
import { isDueCard, reviveCard } from "@/lib/scheduler";
import { BOOK_ORDER, BOOKS, type BookId } from "@/lib/books";
import DataTools from "@/components/data-tools";

const SERIF =
  'Baskerville, "Songti SC", "Noto Serif SC", "SimSun", Georgia, serif';

export default function HomeView({
  currentBook,
  onLearnBook,
  onReview,
  onAbout,
}: {
  currentBook: BookId;
  onLearnBook: (book: BookId) => void;
  onReview: () => void;
  onAbout: () => void;
}) {
  // 待复习数（当前词书的到期卡片数）
  const [due] = useState(() => {
    const s = loadStudyState(currentBook);
    let n = 0;
    for (const raw of Object.values(s.cards)) {
      const c = reviveCard(raw);
      if (c && isDueCard(c)) n += 1;
    }
    return n;
  });

  const [picker, setPicker] = useState(false);
  const [tools, setTools] = useState(false);

  // 备份提醒：从未备份或超过 7 天未备份时，按钮显示小圆点
  const backupStale = (() => {
    const d = daysSinceBackup();
    return d === null || d > 7;
  })();

  const pickBook = (b: BookId) => {
    saveCurrentBook(b);
    onLearnBook(b);
  };

  return (
    <main
      className="view-in relative min-h-screen overflow-hidden bg-cover bg-center"
      style={{ backgroundImage: "url(images/flashvocab-bg.jpg)" }}
    >
      {/* 顶部欢迎滚动条 */}
      <div className="marquee absolute inset-x-0 top-0 z-10 border-b border-black/5 bg-white/60 py-2 backdrop-blur-sm">
        <div className="marquee-track text-[13px] tracking-[0.12em] text-neutral-700">
          <span>
            欢迎使用词闪记 / Flashvocab web，本网站功能将持续更新，希望大家可以喜欢并多多支持。学习数据自动保存在本机，可在数据备份中导出留存。
          </span>
        </div>
      </div>
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
            onClick={() => setPicker(true)}
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

      {/* 左下角：关于作者（蓝色按钮） */}
      <button
        onClick={onAbout}
        className="absolute bottom-5 left-[100px] rounded-lg bg-blue-600 px-5 py-2 text-sm text-white shadow-sm transition hover:bg-blue-500 active:scale-[0.98]"
      >
        关于作者
      </button>

      {/* 右下角：数据备份 */}
      <button
        onClick={() => setTools(true)}
        className="absolute bottom-5 right-5 flex items-center gap-1.5 rounded-lg border border-neutral-900/15 bg-white/70 px-4 py-2 text-sm text-neutral-600 backdrop-blur-sm transition hover:border-neutral-900/40 hover:text-neutral-900 active:scale-[0.98]"
      >
        数据备份
        {backupStale && (
          <span
            className="h-1.5 w-1.5 rounded-full bg-amber-500"
            title="超过 7 天未备份，建议导出留存"
          />
        )}
      </button>

      {/* 词书选择弹层 */}
      {picker && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 backdrop-blur-[2px]"
          onClick={() => setPicker(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white px-7 py-8 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <h2 className="text-xl font-normal text-foreground">选择词书</h2>
              <button
                onClick={() => setPicker(false)}
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
            <p className="mt-2 text-xs text-neutral-400">
              每本词书的进度和复习计划相互独立
            </p>
            <div className="mt-5 flex flex-col gap-3">
              {BOOK_ORDER.map((id) => {
                const b = BOOKS[id];
                const active = id === currentBook;
                return (
                  <button
                    key={id}
                    onClick={() => pickBook(id)}
                    className={`flex items-center justify-between rounded-xl border px-5 py-4 text-left transition active:scale-[0.99] ${
                      active
                        ? "border-neutral-900 bg-neutral-900 text-white"
                        : "border-neutral-200 bg-white hover:border-neutral-400"
                    }`}
                  >
                    <span>
                      <span className="block text-lg" style={{ fontFamily: SERIF }}>
                        {b.label}
                      </span>
                      <span
                        className={`block text-xs ${
                          active ? "text-white/70" : "text-neutral-400"
                        }`}
                      >
                        {b.desc} · {b.count} 词
                      </span>
                    </span>
                    <span
                      className={`text-sm ${active ? "text-white" : "text-neutral-300"}`}
                    >
                      {active ? "学习中" : "→"}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {tools && <DataTools onClose={() => setTools(false)} />}
    </main>
  );
}
