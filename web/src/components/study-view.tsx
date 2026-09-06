"use client";

import { useEffect, useState } from "react";
import type { Word, WordBook } from "@/lib/types";
import TopBar from "@/components/top-bar";

const SERIF =
  'Baskerville, "Songti SC", "Noto Serif SC", "SimSun", Georgia, serif';

export default function StudyView({ onBack }: { onBack?: () => void }) {
  const [book, setBook] = useState<WordBook | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let alive = true;
    fetch("/data/cet4.json")
      .then((r) => {
        if (!r.ok) throw new Error(String(r.status));
        return r.json();
      })
      .then((d: WordBook) => alive && setBook(d))
      .catch(() => alive && setError(true));
    return () => {
      alive = false;
    };
  }, []);

  const w: Word | undefined = book?.words[0];

  return (
    <main className="view-in flex min-h-screen flex-col bg-background">
      <TopBar label="四级词汇 · 共 3849 词" onBack={onBack} />

      {/* 词卡区域 */}
      <section className="flex flex-1 items-center justify-center p-6">
        {error ? (
          <p className="text-sm text-neutral-400">词书加载失败，请刷新重试</p>
        ) : !w ? (
          <p className="text-sm text-neutral-400">加载词库中…</p>
        ) : (
          <div className="w-full max-w-2xl rounded-2xl border border-neutral-200/80 bg-white px-8 py-20 text-center shadow-[0_1px_2px_rgba(0,0,0,0.03)] sm:py-28">
            <h1
              className="break-words text-[clamp(3rem,9vw,5.5rem)] font-normal leading-tight text-foreground"
              style={{ fontFamily: SERIF }}
            >
              {w.word}
            </h1>
            {w.phonetic && (
              <p
                className="mt-5 text-xl text-neutral-400"
                style={{ fontFamily: SERIF }}
              >
                {w.phonetic}
              </p>
            )}
            <p className="mt-8 text-xs tracking-wider text-neutral-300">
              {[w.oxford && "牛津3000", w.collins && `柯林斯${w.collins}星`]
                .filter(Boolean)
                .join(" · ") || "\u00a0"}
            </p>
          </div>
        )}
      </section>
    </main>
  );
}
