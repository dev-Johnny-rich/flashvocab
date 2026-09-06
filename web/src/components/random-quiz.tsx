"use client";

import { useEffect, useMemo, useState } from "react";
import type { Word, WordBook } from "@/lib/types";
import TopBar from "@/components/top-bar";
import WordCard from "@/components/word-card";
import { BOOK_ORDER, BOOKS, type BookId } from "@/lib/books";

const SERIF =
  'Baskerville, "Songti SC", "Noto Serif SC", "SimSun", Georgia, serif';

// 随机单词检测：从 cet4 + cet6 全词库随机抽词翻卡自测（不记录进度）
export default function RandomQuiz({ onExit }: { onExit: () => void }) {
  const [deck, setDeck] = useState<{ w: Word; from: BookId }[] | null>(null);
  const [error, setError] = useState(false);
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);

  // 加载两本词书并打乱
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const pools = await Promise.all(
          BOOK_ORDER.map(async (id) => {
            const r = await fetch(`data/${BOOKS[id].file}`);
            const d = (await r.json()) as WordBook;
            return d.words.map((w) => ({ w, from: id as BookId }));
          }),
        );
        const all = pools.flat();
        // Fisher–Yates 洗牌
        for (let i = all.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [all[i], all[j]] = [all[j], all[i]];
        }
        if (alive) setDeck(all);
      } catch {
        if (alive) setError(true);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const cur = deck ? deck[idx % deck.length] : null;
  const total = deck?.length ?? 0;

  const next = () => {
    setFlipped(false);
    setIdx((i) => i + 1);
  };

  return (
    <main className="view-in flex min-h-screen flex-col bg-background">
      <TopBar label="随机单词检测" onBack={onExit} />

      {error ? (
        <section className="flex flex-1 items-center justify-center">
          <p className="text-sm text-neutral-400">词库加载失败，请重试</p>
        </section>
      ) : !cur ? (
        <section className="flex flex-1 items-center justify-center">
          <p className="text-sm text-neutral-400">随机组词中…</p>
        </section>
      ) : (
        <section className="flex flex-1 flex-col items-center justify-center gap-7 p-6">
          <p className="text-xs text-neutral-300" style={{ fontFamily: SERIF }}>
            随机抽词 · 来自 {BOOKS[cur.from].label}（共 {total} 词可抽）
          </p>

          <WordCard w={cur.w} flipped={flipped} onFlip={() => setFlipped((f) => !f)} />

          {/* 操作区 */}
          <div className="flex h-16 items-center justify-center">
            {!flipped ? (
              <p
                className="text-sm italic text-neutral-400"
                style={{ fontFamily: SERIF }}
              >
                点击卡片，查看释义
              </p>
            ) : (
              <div className="word-enter flex items-center gap-3">
                <button
                  onClick={next}
                  className="w-40 rounded-full bg-neutral-900 py-3 text-base text-white transition hover:bg-neutral-700 active:scale-[0.97]"
                >
                  下一个随机词
                </button>
              </div>
            )}
          </div>
        </section>
      )}
    </main>
  );
}
