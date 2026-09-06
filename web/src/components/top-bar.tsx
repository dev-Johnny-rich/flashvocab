"use client";

import type { ReactNode } from "react";

const SERIF =
  'Baskerville, "Songti SC", "Noto Serif SC", "SimSun", Georgia, serif';

// 各功能界面统一顶栏：左返回退出，品牌绝对居中（不参与布局，
// 避免窄屏被左右内容挤压/重叠），右标签自适应宽度、过长自动截断
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
    <header className="relative z-10 flex h-14 shrink-0 items-center justify-between gap-2 border-b border-neutral-200/80 bg-background/90 px-3 backdrop-blur-sm sm:px-6">
      {/* 左：返回 */}
      <div className="flex min-w-0 flex-1 justify-start">
        {onBack && (
          <button
            onClick={onBack}
            className="flex items-center gap-1 whitespace-nowrap text-sm text-neutral-500 transition hover:text-neutral-900"
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

      {/* 中：品牌（绝对居中，不占布局空间） */}
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap"
        aria-hidden
      >
        <span
          className="text-lg text-foreground"
          style={{ fontFamily: SERIF }}
        >
          词闪记
        </span>
      </div>

      {/* 右：进度/词书标签（宽度限制在品牌区之外，过长省略） */}
      <div className="flex min-w-0 flex-1 justify-end">
        {onLabelClick ? (
          <button
            onClick={onLabelClick}
            className="flex max-w-[calc(50vw-2.5rem)] min-w-0 items-center gap-1 whitespace-nowrap text-sm text-neutral-500 transition hover:text-neutral-900"
            title="切换词书"
          >
            <span className="truncate">{label}</span>
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="shrink-0"
              aria-hidden
            >
              <path d="m6 9 6 6 6-6" />
            </svg>
          </button>
        ) : (
          <span className="block max-w-[calc(50vw-2.5rem)] min-w-0 truncate whitespace-nowrap text-sm text-neutral-400">
            {label}
          </span>
        )}
      </div>
    </header>
  );
}
