"use client";

import { useEffect, useState } from "react";
import type { Word, WordBook } from "@/lib/types";
import TopBar from "@/components/top-bar";
import {
  addLog,
  loadStudyState,
  saveStudyState,
  type Rating,
  type StudyState,
} from "@/lib/storage";

const SERIF =
  'Baskerville, "Songti SC", "Noto Serif SC", "SimSun", Georgia, serif';

export default function StudyView({ onBack }: { onBack?: () => void }) {
  const [book, setBook] = useState<WordBook | null>(null);
  const [error, setError] = useState(false);
  const [initial] = useState(() => loadStudyState());
  const [state, setState] = useState<StudyState>(initial);
  // 从上次进度继续（cursor = 已完成词数 = 下一个新词的 index）
  const [idx, setIdx] = useState(initial.cursor);
  const [flipped, setFlipped] = useState(false);

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

  if (error) {
    return (
      <main className="view-in flex min-h-screen flex-col bg-background">
        <TopBar label="四级词汇" onBack={onBack} />
        <section className="flex flex-1 items-center justify-center">
          <p className="text-sm text-neutral-400">词书加载失败，请刷新重试</p>
        </section>
      </main>
    );
  }

  if (!book) {
    return (
      <main className="view-in flex min-h-screen flex-col bg-background">
        <TopBar label="四级词汇" onBack={onBack} />
        <section className="flex flex-1 items-center justify-center">
          <p className="text-sm text-neutral-400">加载词库中…</p>
        </section>
      </main>
    );
  }

  const w = book.words[idx % book.words.length];
  const doneCount = Object.keys(state.logs).length;

  const rate = (rating: Rating) => {
    // 闭包持有本次渲染的最新 state/idx，直接计算新状态一次提交
    const nextIdx = idx + 1;
    const next = addLog(state, w.word, rating);
    const saved: StudyState = { ...next, cursor: nextIdx };
    saveStudyState(saved);
    setState(saved);
    setIdx(nextIdx);
    setFlipped(false);
  };

  return (
    <main className="view-in flex min-h-screen flex-col bg-background">
      <TopBar label={`四级词汇 · 已学 ${doneCount} 词`} onBack={onBack} />

      {/* 词卡 + 操作区 */}
      <section className="flex flex-1 flex-col items-center justify-center gap-7 p-6">
        {/* 卡片 */}
        <div
          className="flashcard w-full max-w-2xl cursor-pointer select-none"
          onClick={() => setFlipped(true)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (!flipped && (e.key === "Enter" || e.key === " ")) {
              e.preventDefault();
              setFlipped(true);
            }
          }}
        >
          <div
            className={`flashcard-inner max-h-[62vh] ${flipped ? "flipped" : ""}`}
          >
            {/* 正面：单词 */}
            <div className="face max-h-[62vh] overflow-y-auto rounded-2xl border border-neutral-200/80 bg-white px-8 py-14 text-center shadow-[0_1px_2px_rgba(0,0,0,0.03)] sm:py-20">
              <div key={idx} className="word-enter">
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
                    /{w.phonetic}/
                  </p>
                )}
                {w.example && (
                  <p
                    className="mx-auto mt-7 max-w-md text-base italic leading-relaxed text-neutral-500"
                    style={{ fontFamily: SERIF }}
                  >
                    {w.example.en}
                  </p>
                )}
              </div>
            </div>

            {/* 背面：释义 */}
            <div className="face face-back max-h-[62vh] overflow-y-auto rounded-2xl border border-neutral-200/80 bg-white px-6 py-10 text-left shadow-[0_1px_2px_rgba(0,0,0,0.03)] sm:px-10 sm:py-12">
              <p
                className="break-words text-center text-3xl font-normal leading-tight text-foreground sm:text-4xl"
                style={{ fontFamily: SERIF }}
              >
                {w.word}
              </p>
              {w.phonetic && (
                <p
                  className="mt-1.5 text-center text-sm text-neutral-400"
                  style={{ fontFamily: SERIF }}
                >
                  /{w.phonetic}/
                </p>
              )}
              <ul className="mx-auto mt-6 max-w-md space-y-3">
                {w.senses.map((s, i) => (
                  <li key={i} className="flex gap-2.5 text-[15px] leading-relaxed">
                    <span className="shrink-0 pt-px text-neutral-400">
                      {s.pos ? `${s.pos}.` : s.domain ? `[${s.domain}]` : "·"}
                    </span>
                    <span className="text-foreground/90">{s.text}</span>
                  </li>
                ))}
              </ul>

              {w.example && (
                <div className="mx-auto mt-7 max-w-md border-t border-neutral-200/70 pt-5">
                  <p
                    className="text-base italic leading-relaxed text-neutral-600"
                    style={{ fontFamily: SERIF }}
                  >
                    {w.example.en}
                  </p>
                  <p className="mt-1.5 text-sm text-neutral-400">
                    {w.example.zh}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 操作区：未翻卡时提示，翻卡后三档 */}
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
                onClick={() => rate("again")}
                className="w-28 rounded-full border border-neutral-300 bg-white py-3 text-base text-neutral-700 transition hover:bg-neutral-100 active:scale-[0.97]"
              >
                忘记
              </button>
              <button
                onClick={() => rate("hard")}
                className="w-28 rounded-full bg-neutral-200 py-3 text-base text-neutral-800 transition hover:bg-neutral-300 active:scale-[0.97]"
              >
                模糊
              </button>
              <button
                onClick={() => rate("good")}
                className="w-28 rounded-full bg-neutral-900 py-3 text-base text-white transition hover:bg-neutral-700 active:scale-[0.97]"
              >
                认识
              </button>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
