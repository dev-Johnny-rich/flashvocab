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
    fetch("data/about.json")
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

  // 今日日期（自动显示当天，不依赖数据文件手写日期）
  const now = new Date();
  const todayCn = `${now.getFullYear()} 年 ${now.getMonth() + 1} 月 ${now.getDate()} 日`;
  const post = data ? data.posts[0] : null; // 每日动态模式：只显示最新（当日）内容

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

          {/* 每日学习日志（日期自动为今天，内容每天更新） */}
          <div className="mt-8 flex items-baseline justify-between">
            <h2 className="text-xs uppercase tracking-widest text-neutral-400">
              每日学习日志
            </h2>
            <p
              className="text-sm tracking-wide text-neutral-500"
              style={{ fontFamily: SERIF }}
            >
              {todayCn}
            </p>
          </div>
          {!post ? (
            <p className="mt-6 text-sm text-neutral-400">
              今日日志更新中，敬请期待
            </p>
          ) : (
            <div className="mt-4 whitespace-pre-line border-b border-neutral-100 py-6 text-[15px] leading-relaxed text-neutral-700">
              {post.content}
            </div>
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
