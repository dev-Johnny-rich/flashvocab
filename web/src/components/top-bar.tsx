"use client";

import type { ReactNode } from "react";

const SERIF =
  'Baskerville, "Songti SC", "Noto Serif SC", "SimSun", Georgia, serif';

// 各功能界面统一顶栏：左返回退出，中品牌，右标签（可点击切换词书时显示下拉提示）
export default function TopBar({
  label,
  onBack,
  onLabelClick,
}: {
  label: ReactNode;
  onBack?: () => void;
  onLabelClick?: () => void;
}) {
  return (
    <header className="grid h-14 shrink-0 grid-cols-3 items-center border-b border-neutral-200/80 bg-background/90 px-4 backdrop-blur-sm sm:px-6">
      <div className="justify-self-start">
        {onBack && (
          <button
            onClick={onBack}
            className="flex items-center gap-1 text-sm text-neutral-500 transition hover:text-neutral-900"
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            返回
          </button>
        )}
      </div>
      <div className="justify-self-center">
        <span
          className="text-lg text-foreground"
          style={{ fontFamily: SERIF }}
        >
          词闪记
        </span>
      </div>
      <div className="justify-self-end">
        {onLabelClick ? (
          <button
            onClick={onLabelClick}
            className="flex items-center gap-1 text-sm text-neutral-500 transition hover:text-neutral-900"
            title="切换词书"
          >
            <span className="max-w-40 truncate sm:max-w-none">{label}</span>
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d="m6 9 6 6 6-6" />
            </svg>
          </button>
        ) : (
          <span className="text-sm text-neutral-400">{label}</span>
        )}
      </div>
    </header>
  );
}
