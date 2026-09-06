"use client";

import { BOOK_ORDER, BOOKS, type BookId } from "@/lib/books";

const SERIF =
  'Baskerville, "Songti SC", "Noto Serif SC", "SimSun", Georgia, serif';

// 词书选择弹层（主页"学习"入口、学习/复习界面内切换共用）
export default function BookPicker({
  current,
  onPick,
  onClose,
}: {
  current: BookId;
  onPick: (book: BookId) => void;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 backdrop-blur-[2px]"
      onClick={onClose}
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
        <p className="mt-2 text-xs text-neutral-400">
          每本词书的进度和复习计划相互独立，随时可切换
        </p>
        <div className="mt-5 flex flex-col gap-3">
          {BOOK_ORDER.map((id) => {
            const b = BOOKS[id];
            const active = id === current;
            return (
              <button
                key={id}
                onClick={() => onPick(id)}
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
                  {active ? "学习中" : "切换"}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
