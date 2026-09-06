"use client";

const SERIF =
  'Baskerville, "Songti SC", "Noto Serif SC", "SimSun", Georgia, serif';

// 各功能界面统一顶栏：左返回退出，中品牌，右标签
export default function TopBar({
  label,
  onBack,
}: {
  label: string;
  onBack?: () => void;
}) {
  return (
    <header className="grid h-14 shrink-0 grid-cols-3 items-center border-b border-neutral-200/80 bg-background px-4 sm:px-6">
      <div className="justify-self-start">
        {onBack && (
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 rounded-full py-1.5 pl-1 pr-3 text-sm text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-900"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d="M19 12H5" />
              <path d="M12 19l-7-7 7-7" />
            </svg>
            返回
          </button>
        )}
      </div>

      <span
        className="justify-self-center text-lg text-foreground"
        style={{ fontFamily: SERIF }}
      >
        词闪记
      </span>

      <span className="justify-self-end text-sm text-neutral-400">{label}</span>
    </header>
  );
}
