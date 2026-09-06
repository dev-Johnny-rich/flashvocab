"use client";

import { useEffect } from "react";

const RUNTIME_CACHE = "flashvocab-runtime-v1";

// 生产环境注册 Service Worker（PWA 离线）
// 注册完成后把本次页面加载用到的同源静态资源补进运行时缓存，
// 保证首次访问（SW 尚未控制的这次）之后即具备离线能力
export default function SwRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;
    if (!("caches" in window)) return;

    navigator.serviceWorker
      .register("/sw.js")
      .then(() => navigator.serviceWorker.ready)
      .then(() => {
        // 收集本次加载的同源静态资源（JS chunks / CSS / 字体 / 数据）
        const urls: string[] = [location.pathname];
        for (const e of performance.getEntriesByType("resource")) {
          try {
            const u = new URL(e.name);
            if (u.origin === location.origin && !u.pathname.startsWith("/audio/")) {
              urls.push(e.name);
            }
          } catch {
            /* 忽略解析失败的条目 */
          }
        }
        // 分批写入，避免一次性请求过多
        const batch = async (list: string[]) => {
          const c = await caches.open(RUNTIME_CACHE);
          for (let i = 0; i < list.length; i += 8) {
            await c.addAll(list.slice(i, i + 8)).catch(() => {});
          }
        };
        void batch(urls);
      })
      .catch(() => {});
  }, []);
  return null;
}
