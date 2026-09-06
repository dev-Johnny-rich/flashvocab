"use client";

import { useEffect, useMemo, useState } from "react";
import type { Word, WordBook } from "@/lib/types";
import TopBar from "@/components/top-bar";
import { BOOKS, type BookId } from "@/lib/books";
import WordCard from "@/components/word-card";
import WordModal from "@/components/word-modal";
import SpellingView from "@/components/spelling-view";
import {
  addLog,
  lastRatingToday,
  loadStudyState,
  saveStudyState,
  todayStr,
  type Rating,
  type Review,
  type StudyState,
} from "@/lib/storage";
import {
  dueInDaysText,
  isDueCard,
  newCard,
  reviveCard,
  scheduleNext,
} from "@/lib/scheduler";

const SERIF =
  'Baskerville, "Songti SC", "Noto Serif SC", "SimSun", Georgia, serif';

export default function ReviewView({
  bookId,
  onBack,
  onLearn,
}: {
  bookId: BookId;
  onBack?: () => void;
  onLearn?: () => void;
}) {
  const [book, setBook] = useState<WordBook | null>(null);
  const [error, setError] = useState(false);
  const [state, setState] = useState<StudyState>(() => loadStudyState(bookId));
  const [session, setSession] = useState<Review | null>(() =>
    loadStudyState(bookId).review,
  );
  const [flipped, setFlipped] = useState(false);
  const [selected, setSelected] = useState<Word | null>(null);
  const [spelling, setSpelling] = useState(false);

  useEffect(() => {
    let alive = true;
    fetch(`data/${BOOKS[bookId].file}`)
      .then((r) => {
        if (!r.ok) throw new Error(String(r.status));
        return r.json();
      })
      .then((d: WordBook) => {
        if (!alive) return;
        setBook(d);
        // 复习会话：非今日则按到期卡重建队列（词库顺序）
        const today = todayStr();
        const cur = loadStudyState(bookId);
        let rv = cur.review;
        if (!rv || rv.date !== today) {
          const q = d.words
            .filter((w) => {
              const c = reviveCard(cur.cards[w.word]);
              return c ? isDueCard(c) : false;
            })
            .map((w) => w.word);
          rv = { date: today, queue: q, pos: 0 };
          const saved = { ...cur, review: rv };
          saveStudyState(bookId, saved);
          setState(saved);
        }
        setSession(rv);
      })
      .catch(() => alive && setError(true));
    return () => {
      alive = false;
    };
  }, []);

  const wordOf = useMemo(() => {
    const m = new Map<string, Word>();
    if (book) {
      for (const w of book.words) m.set(w.word, w);
    }
    return m;
  }, [book]);

  const queue = session?.queue ?? [];
  const pos = session?.pos ?? 0;
  const w = wordOf.get(queue[pos]);

  const finished = !!session && queue.length > 0 && pos >= queue.length;
  const hasLearned = Object.keys(state.cards).length > 0;
  const noDueToday = hasLearned && queue.length === 0;

  if (error) {
    return (
      <main className="view-in flex min-h-screen flex-col bg-background">
        <TopBar label={`复习 · ${BOOKS[bookId].label}`} onBack={onBack} />
        <section className="flex flex-1 items-center justify-center">
          <p className="text-sm text-neutral-400">词书加载失败，请刷新重试</p>
        </section>
      </main>
    );
  }

  // —— 空态：没学过 / 今日无到期 ——
  if (!session || queue.length === 0) {
    return (
      <main className="view-in flex min-h-screen flex-col bg-background">
        <TopBar label={`复习 · ${BOOKS[bookId].label}`} onBack={onBack} />
        <section className="flex flex-1 flex-col items-center justify-center gap-8 px-6 text-center">
          <p className="text-lg text-neutral-700">
            {noDueToday ? "今天没有到期的单词" : "还没有学过的单词"}
          </p>
          <p className="-mt-4 text-sm text-neutral-400">
            {noDueToday
              ? "学过的词会在到期日自动回到这里，明天再来看看吧"
              : "先去学习，积累一些单词后再来复习"}
          </p>
          {onLearn ? (
            <button
              onClick={onLearn}
              className="rounded-full bg-neutral-900 px-8 py-3 text-base text-white transition hover:bg-neutral-700 active:scale-[0.98]"
            >
              去学习
            </button>
          ) : (
            <button
              onClick={onBack}
              className="rounded-full bg-neutral-900 px-8 py-3 text-base text-white transition hover:bg-neutral-700 active:scale-[0.98]"
            >
              返回主页
            </button>
          )}
        </section>
      </main>
    );
  }

  // —— 复习完成页 ——
  if (finished) {
    // 默写模式（对今日复习的全部单词拼写测试）
    if (spelling) {
      const spellWords = queue
        .map((word) => wordOf.get(word))
        .filter((x): x is Word => !!x);
      return (
        <SpellingView
          words={spellWords}
          onClose={() => setSpelling(false)}
        />
      );
    }
    return (
      <main className="view-in flex h-screen flex-col bg-background">
        <TopBar label="复习 · 已完成" onBack={onBack} />
        <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
          {/* 主区 */}
          <section className="flex flex-1 flex-col items-center justify-center gap-5 overflow-y-auto px-6 py-10 text-center">
            <h1
              className="text-5xl font-normal text-foreground sm:text-6xl"
              style={{ fontFamily: SERIF }}
            >
              今日复习完成
            </h1>
            <p className="text-base text-neutral-500">
              共复习了 {queue.length} 个单词
            </p>
            <button
              onClick={onBack}
              className="mt-6 rounded-full bg-neutral-900 px-10 py-3 text-base text-white transition hover:bg-neutral-700 active:scale-[0.98]"
            >
              返回主页
            </button>
            <button
              onClick={() => setSpelling(true)}
              className="rounded-full border border-neutral-300 bg-white px-8 py-2.5 text-sm text-neutral-700 transition hover:border-neutral-900 hover:text-neutral-900 active:scale-[0.98]"
            >
              单词默写 · 检验拼写
            </button>
            <p className="mt-1 text-[15px] text-neutral-500">
              🎉 复习是记忆的关键，明天继续
            </p>
          </section>

          {/* 右侧栏：今日复习的单词 */}
          <aside className="flex h-[45vh] min-h-0 flex-col border-t border-neutral-200/80 lg:h-auto lg:w-80 lg:border-l lg:border-t-0">
            <h2 className="shrink-0 border-b border-neutral-200/80 px-5 py-3 text-xs uppercase tracking-widest text-neutral-400">
              今日复习 · {queue.length}
            </h2>
            <ul className="min-h-0 flex-1 overflow-y-auto">
              {queue.map((word, i) => {
                const tw = wordOf.get(word);
                if (!tw) return null;
                const r = lastRatingToday(state.logs, word);
                const card = reviveCard(state.cards[word]);
                return (
                  <li key={word}>
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
                            {card && ` · 下次复习 ${dueInDaysText(card)}`}
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

  // —— 复习主流程 ——
  if (!w) {
    return (
      <main className="view-in flex min-h-screen flex-col bg-background">
        <TopBar label={`复习 · ${BOOKS[bookId].label}`} onBack={onBack} />
        <section className="flex flex-1 items-center justify-center">
          <p className="text-sm text-neutral-400">加载词库中…</p>
        </section>
      </main>
    );
  }

  const rate = (rating: Rating) => {
    const prevCard = reviveCard(state.cards[w.word]) ?? newCard();
    const nextCard = scheduleNext(prevCard, rating);
    const next = addLog(state, w.word, rating);
    const saved: StudyState = {
      ...next,
      cards: { ...state.cards, [w.word]: nextCard },
      review: { ...session, pos: session.pos + 1 },
    };
    saveStudyState(bookId, saved);
    setState(saved);
    setSession(saved.review!);
    setFlipped(false);
  };

  return (
    <main className="view-in flex min-h-screen flex-col bg-background">
      <TopBar
        label={`复习 ${pos + 1} / ${queue.length}`}
        onBack={onBack}
      />

      <section className="flex flex-1 flex-col items-center justify-center gap-7 p-6">
        <WordCard
          w={w}
          flipped={flipped}
          onFlip={() => setFlipped((f) => !f)}
        />

        {/* 操作区 */}
        <div className="flex h-16 items-center justify-center">
          {!flipped ? (
            <p
              className="text-sm italic text-neutral-400"
              style={{ fontFamily: SERIF }}
            >
              点击卡片，回忆释义
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
