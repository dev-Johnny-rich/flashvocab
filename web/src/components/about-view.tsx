"use client";

import { useEffect, useState } from "react";
import TopBar from "@/components/top-bar";

const SERIF =
  'Baskerville, "Songti SC", "Noto Serif SC", "SimSun", Georgia, serif';

interface Post {
  date: string;
  content: string;
}

interface AboutData {
  author: { name: string; bio: string };
  posts: Post[];
}

// 关于作者：作者简介 + 每日学习日志（内容来自 public/data/about.json，随构建更新）
export default function AboutView({ onBack }: { onBack?: () => void }) {
  const [data, setData] = useState<AboutData | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let alive = true;
    fetch("/data/about.json")
      .then((r) => {
        if (!r.ok) throw new Error(String(r.status));
        return r.json();
      })
      .then((d: AboutData) => alive && setData(d))
      .catch(() => alive && setError(true));
    return () => {
      alive = false;
    };
  }, []);

  return (
    <main className="view-in flex min-h-screen flex-col bg-background">
      <TopBar label="关于作者" onBack={onBack} />

      {error ? (
        <section className="flex flex-1 items-center justify-center">
          <p className="text-sm text-neutral-400">内容加载失败，请刷新重试</p>
        </section>
      ) : !data ? (
        <section className="flex flex-1 items-center justify-center">
          <p className="text-sm text-neutral-400">加载中…</p>
        </section>
      ) : (
        <section className="mx-auto w-full max-w-2xl flex-1 px-6 py-10">
          {/* 作者简介 */}
          <div className="border-b border-neutral-200/80 pb-8">
            <h1
              className="text-4xl font-normal text-foreground"
              style={{ fontFamily: SERIF }}
            >
              {data.author.name}
            </h1>
            {data.author.bio && (
              <p className="mt-4 text-[15px] leading-relaxed text-neutral-600">
                {data.author.bio}
              </p>
            )}
          </div>

          {/* 每日学习日志 */}
          <h2 className="mt-8 text-xs uppercase tracking-widest text-neutral-400">
            每日学习日志
          </h2>
          {data.posts.length === 0 ? (
            <p className="mt-6 text-sm text-neutral-400">
              日志更新中，敬请期待
            </p>
          ) : (
            <ul className="mt-4">
              {data.posts.map((p) => (
                <li
                  key={p.date}
                  className="border-b border-neutral-100 py-6 last:border-b-0"
                >
                  <p
                    className="text-sm tracking-wide text-neutral-400"
                    style={{ fontFamily: SERIF }}
                  >
                    {p.date}
                  </p>
                  <div className="mt-2 whitespace-pre-line text-[15px] leading-relaxed text-neutral-700">
                    {p.content}
                  </div>
                </li>
              ))}
            </ul>
          )}

          {/* 数据来源说明 */}
          <footer className="mt-12 border-t border-neutral-200/60 pt-5 text-xs leading-relaxed text-neutral-300">
            例句数据来自 Tatoeba（CC BY 2.0 FR）· 词库数据来自 ECDICT（MIT）
          </footer>
        </section>
      )}
    </main>
  );
}
