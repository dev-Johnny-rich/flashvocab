"use client";

import { useEffect, useMemo, useState } from "react";
import type { Word, WordBook } from "@/lib/types";
import TopBar from "@/components/top-bar";
import SpeakButton from "@/components/speak-button";
import WordModal from "@/components/word-modal";
import {
  addLog,
  ensureToday,
  loadStudyState,
  saveStudyState,
  todayStr,
  type Rating,
  type StudyState,
} from "@/lib/storage";

const SERIF =
  'Baskerville, "Songti SC", "Noto Serif SC", "SimSun", Georgia, serif';
const NEW_PER_DAY = 20; // 每日新词配额

export default function StudyView({ onBack }: { onBack?: () => void }) {
  const [book, setBook] = useState<WordBook | null>(null);
  const [error, setError] = useState(false);
  const [state, setState] = useState<StudyState>(() => loadStudyState());
  // 今日会话（进入界面时确保存在；跨天自动开新一批）
  const [daily, setDaily] = useState(() => ensureToday(loadStudyState()).daily);
  const [flipped, setFlipped] = useState(false);
  const [selected, setSelected] = useState<Word | null>(null);

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

  // 今日完成数（done）；当前词 index = 今日起点 + 已完成数
  const done = daily?.done ?? 0;
  const cur = (daily?.start ?? 0) + done;

  const finished = useMemo(() => {
    if (!book || !daily) return false;
    const quota = daily.done >= NEW_PER_DAY;
    const exhausted = daily.start + daily.done >= book.words.length;
    return quota || exhausted;
  }, [book, daily]);

  // 今日评分统计（结算页用）：取今天产生的日志
  const todayStats = useMemo(() => {
    const t = todayStr();
    const counts = { again: 0, hard: 0, good: 0 };
    for (const entries of Object.values(state.logs)) {
      for (const e of entries) {
        if (e.at.slice(0, 10) === t) counts[e.r] += 1;
      }
    }
    return counts;
  }, [state.logs]);

  // 今日学习的单词（右侧栏列表）
  const todayWords = useMemo(() => {
    if (!book || !daily) return [];
    return book.words.slice(daily.start, daily.start + NEW_PER_DAY);
  }, [book, daily]);

  // 某词今天最后一次评分（列表标记用）
  const todayRatingOf = (word: string): string | null => {
    const t = todayStr();
    const arr = state.logs[word];
    if (!arr) return null;
    for (let i = arr.length - 1; i >= 0; i--) {
      if (arr[i].at.slice(0, 10) === t) return arr[i].r;
    }
    return null;
  };

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

  if (!book || !daily) {
    return (
      <main className="view-in flex min-h-screen flex-col bg-background">
        <TopBar label="四级词汇" onBack={onBack} />
        <section className="flex flex-1 items-center justify-center">
          <p className="text-sm text-neutral-400">加载词库中…</p>
        </section>
      </main>
    );
  }

  // —— 结算页（今日配额完成或词库学完）——
  if (finished) {
    const allDone = daily.start + daily.done >= book.words.length;
    return (
      <main className="view-in flex h-screen flex-col bg-background">
        <TopBar label="四级词汇 · 今日已完成" onBack={onBack} />
        <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
          {/* 主区：完成信息 */}
          <section className="flex flex-1 flex-col items-center justify-center gap-5 overflow-y-auto px-6 py-10 text-center">
            <h1
              className="text-5xl font-normal text-foreground sm:text-6xl"
              style={{ fontFamily: SERIF }}
            >
              {allDone ? "词库学完" : "今日完成"}
            </h1>
            <p className="text-base text-neutral-500">
              {allDone
                ? `已学完四级词汇全部 ${book.words.length} 词`
                : `今日学习了 ${Math.min(daily.done, NEW_PER_DAY)} 个新单词`}
            </p>
            {!allDone && (
              <div className="mt-2 flex items-center gap-6 text-sm text-neutral-500">
                <span>
                  认识 <b className="text-foreground">{todayStats.good}</b>
                </span>
                <span>
                  模糊 <b className="text-foreground">{todayStats.hard}</b>
                </span>
                <span>
                  忘记 <b className="text-foreground">{todayStats.again}</b>
                </span>
              </div>
            )}
            <button
              onClick={onBack}
              className="mt-6 rounded-full bg-neutral-900 px-10 py-3 text-base text-white transition hover:bg-neutral-700 active:scale-[0.98]"
            >
              返回主页
            </button>
            {!allDone && (
              <p className="text-xs text-neutral-300">
                明天继续学习下一批 · 复习功能即将开放
              </p>
            )}
          </section>

          {/* 右侧栏：今日单词，点击弹详情 */}
          <aside className="flex h-[45vh] min-h-0 flex-col border-t border-neutral-200/80 lg:h-auto lg:w-80 lg:border-l lg:border-t-0">
            <h2 className="shrink-0 border-b border-neutral-200/80 px-5 py-3 text-xs uppercase tracking-widest text-neutral-400">
              今日单词 · {todayWords.length}
            </h2>
            <ul className="min-h-0 flex-1 overflow-y-auto">
              {todayWords.map((tw, i) => {
                const r = todayRatingOf(tw.word);
                return (
                  <li key={tw.word}>
                    <button
                      onClick={() => setSelected(tw)}
                      className="flex w-full items-center justify-between gap-3 border-b border-neutral-100 px-5 py-2.5 text-left transition hover:bg-neutral-50 active:bg-neutral-100"
                    >
                      <span className="min-w-0">
                        <span
                          className="block truncate text-lg leading-snug text-foreground"
                          style={{ fontFamily: SERIF }}
                        >
                          {tw.word}
                        </span>
                        {tw.phonetic && (
                          <span className="block truncate text-xs text-neutral-400">
                            /{tw.phonetic}/
                          </span>
                        )}
                      </span>
                      <span className="flex shrink-0 items-center gap-1.5 text-[11px] text-neutral-400">
                        <span className="text-neutral-300">{i + 1}</span>
                        <span
                          className="h-1.5 w-1.5 rounded-full"
                          style={{
                            background:
                              r === "good"
                                ? "#171717"
                                : r === "hard"
                                  ? "#a3a3a3"
                                  : "transparent",
                            border:
                              r === "again" ? "1px solid #a3a3a3" : "none",
                          }}
                          title={
                            r === "good"
                              ? "认识"
                              : r === "hard"
                                ? "模糊"
                                : r === "again"
                                  ? "忘记"
                                  : ""
                          }
                        />
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </aside>
        </div>

        {/* 单词详情弹层 */}
        {selected && (
          <WordModal word={selected} onClose={() => setSelected(null)} />
        )}
      </main>
    );
  }

  const w: Word = book.words[cur];
  const rate = (rating: Rating) => {
    const next = addLog(state, w.word, rating);
    const saved: StudyState = {
      ...next,
      cursor: state.cursor + 1,
      daily: { ...daily, done: daily.done + 1 },
    };
    saveStudyState(saved);
    setState(saved);
    setDaily(saved.daily!);
    setFlipped(false);
  };

  const toggleFlip = () => setFlipped((f) => !f);

  return (
    <main className="view-in flex min-h-screen flex-col bg-background">
      <TopBar
        label={`今日 ${Math.min(done, NEW_PER_DAY)}/${NEW_PER_DAY} · 四级词汇`}
        onBack={onBack}
      />

      {/* 词卡 + 操作区 */}
      <section className="flex flex-1 flex-col items-center justify-center gap-7 p-6">
        {/* 卡片 */}
        <div
          className="flashcard w-full max-w-2xl cursor-pointer select-none"
          onClick={toggleFlip}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              toggleFlip();
            }
          }}
        >
          <div
            className={`flashcard-inner max-h-[62vh] ${flipped ? "flipped" : ""}`}
          >
            {/* 正面：单词 */}
            <div className="face max-h-[62vh] overflow-y-auto rounded-2xl border border-neutral-200/80 bg-white px-8 py-14 text-center shadow-[0_1px_2px_rgba(0,0,0,0.03)] sm:py-16">
              <div key={cur} className="word-enter">
                <div className="flex items-center justify-center gap-3">
                  <h1
                    className="break-words text-[clamp(3rem,9vw,5.5rem)] font-normal leading-tight text-foreground"
                    style={{ fontFamily: SERIF }}
                  >
                    {w.word}
                  </h1>
                  <SpeakButton word={w.word} />
                </div>
                {w.phonetic && (
                  <p
                    className="mt-4 text-xl text-neutral-400"
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
              <div className="flex items-center justify-center gap-2">
                <p
                  className="break-words text-center text-3xl font-normal leading-tight text-foreground sm:text-4xl"
                  style={{ fontFamily: SERIF }}
                >
                  {w.word}
                </p>
                <SpeakButton word={w.word} size="sm" />
              </div>
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
