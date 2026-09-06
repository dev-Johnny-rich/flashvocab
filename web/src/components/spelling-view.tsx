"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Word } from "@/lib/types";
import TopBar from "@/components/top-bar";

const SERIF =
  'Baskerville, "Songti SC", "Noto Serif SC", "SimSun", Georgia, serif';

type Phase = "idle" | "ok" | "fail";

// 复习完成后的单词默写：只显示中文释义，逐字母填空拼写
export default function SpellingView({
  words,
  onClose,
}: {
  words: Word[];
  onClose: () => void;
}) {
  const [idx, setIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(0); // 已正确填写的字母数
  const [mistakes, setMistakes] = useState(0); // 当前字母连续错误次数
  const [phase, setPhase] = useState<Phase>("idle");
  const [stats, setStats] = useState({ ok: 0, fail: 0 });
  const inputRef = useRef<HTMLInputElement>(null);

  const w = words[idx];
  const letters = useMemo(
    () => (w ? w.word.replace(/[^a-z]/gi, "").toLowerCase().split("") : []),
    [w],
  );

  const done = idx >= words.length;

  const lock = phase !== "idle";

  // 推进到下一词
  const next = useCallback(
    (result: "ok" | "fail") => {
      setStats((s) => ({
        ok: s.ok + (result === "ok" ? 1 : 0),
        fail: s.fail + (result === "fail" ? 1 : 0),
      }));
      setIdx((i) => i + 1);
      setCharIdx(0);
      setMistakes(0);
      setPhase("idle");
    },
    [],
  );

  // 输入处理
  const onKey = useCallback(
    (e: KeyboardEvent) => {
      if (!w || done || lock) return;
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key === "Backspace") {
        setCharIdx((c) => Math.max(0, c - 1));
        return;
      }
      const k = e.key.toLowerCase();
      if (k.length !== 1 || !/[a-z]/.test(k)) return;

      if (k === letters[charIdx]) {
        // 拼写正确
        const nextChar = charIdx + 1;
        setCharIdx(nextChar);
        if (nextChar >= letters.length) {
          // 整词完成
          setPhase("ok");
          window.setTimeout(() => next("ok"), 800);
        }
      } else {
        // 拼写错误：两次机会，仍错自动补全
        const m = mistakes + 1;
        setMistakes(m);
        if (m >= 3) {
          setPhase("fail");
          window.setTimeout(() => next("fail"), 900);
        }
      }
    },
    [w, done, lock, letters, charIdx, mistakes, next, onClose],
  );

  useEffect(() => {
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onKey]);

  // 移动端软键盘支持：隐藏 input 保持焦点
  useEffect(() => {
    if (!done) inputRef.current?.focus();
  }, [idx, done, phase]);

  // —— 结果页 ——
  if (done) {
    return (
      <main className="view-in flex min-h-screen flex-col bg-background">
        <TopBar label="默写" onBack={onClose} />
        <section className="flex flex-1 flex-col items-center justify-center gap-5 px-6 text-center">
          <h1
            className="text-5xl font-normal text-foreground sm:text-6xl"
            style={{ fontFamily: SERIF }}
          >
            默写完成
          </h1>
          <p className="text-base text-neutral-500">
            拼写正确 <b className="text-foreground">{stats.ok}</b> 词 · 自动补全{" "}
            <b className="text-foreground">{stats.fail}</b> 词
          </p>
          <button
            onClick={onClose}
            className="mt-6 rounded-full bg-neutral-900 px-10 py-3 text-base text-white transition hover:bg-neutral-700 active:scale-[0.98]"
          >
            返回
          </button>
        </section>
      </main>
    );
  }

  // —— 默写主界面 ——
  const chars = w.word.split("");
  let letterIdx = -1; // 遍历到第几个字母

  return (
    <main className="view-in flex min-h-screen flex-col bg-background">
      {/* 隐藏输入框：接收键盘输入并唤起移动端软键盘 */}
      <input
        ref={inputRef}
        autoFocus
        className="pointer-events-none absolute h-px w-px opacity-0"
        onKeyDown={(e) => {
          e.preventDefault();
          const ke = e.nativeEvent;
          onKey(ke as unknown as KeyboardEvent);
        }}
        aria-label="默写输入"
      />
      <TopBar label={`默写 ${Math.min(idx + 1, words.length)} / ${words.length}`} onBack={onClose} />

      <section className="flex flex-1 flex-col items-center justify-center gap-10 px-6">
        {/* 中文释义（单词被遮住） */}
        <div className="text-center">
          <p className="mb-1 text-xs uppercase tracking-widest text-neutral-300">
            中文释义
          </p>
          <ul className="mx-auto mt-3 max-w-md space-y-1.5">
            {w.senses.slice(0, 4).map((s, i) => (
              <li key={i} className="text-xl leading-relaxed text-neutral-800">
                {s.domain ? `[${s.domain}] ` : ""}
                {s.text}
              </li>
            ))}
          </ul>
        </div>

        {/* 拼写槽 */}
        <div
          className="flex max-w-full flex-wrap items-end justify-center gap-y-3"
          onClick={() => inputRef.current?.focus()}
        >
          {chars.map((ch, i) => {
            const isLetter = /[a-z]/i.test(ch);
            if (isLetter) {
              letterIdx += 1;
              const filled = letterIdx < charIdx;
              const current = letterIdx === charIdx && phase === "idle";
              const revealed = phase === "fail"; // 补全时全部显示
              return (
                <span
                  key={i}
                  className={`mx-[3px] inline-flex h-11 w-8 items-end justify-center border-b-2 pb-1 text-3xl ${
                    revealed || filled
                      ? "border-neutral-900 text-foreground"
                      : current
                        ? "border-neutral-900 bg-neutral-100"
                        : "border-neutral-300"
                  } ${phase === "ok" ? "text-foreground" : ""}`}
                  style={{ fontFamily: SERIF }}
                >
                  {filled || revealed ? ch.toLowerCase() : ""}
                </span>
              );
            }
            // 非字母字符（连字符/撇号等）：预显示，无需输入
            return (
              <span
                key={i}
                className="mx-[2px] inline-block pb-1 text-2xl text-neutral-400"
              >
                {ch}
              </span>
            );
          })}
        </div>

        {/* 状态提示 */}
        <div className="flex h-8 items-center justify-center">
          {phase === "idle" && mistakes === 0 && (
            <p className="text-sm text-neutral-400">
              按字母拼写，退格可修改
            </p>
          )}
          {phase === "idle" && mistakes > 0 && (
            <p className="text-sm text-red-500">
              拼写错误，还剩 {3 - mistakes} 次机会
            </p>
          )}
          {phase === "ok" && (
            <p className="text-sm text-neutral-600">✓ 拼写正确</p>
          )}
          {phase === "fail" && (
            <p className="text-sm text-neutral-500">已自动补全，下一个</p>
          )}
        </div>
      </section>
    </main>
  );
}
