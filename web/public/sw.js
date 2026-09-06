/* 词闪记 Flashvocab — Service Worker（离线可用，路径相对化兼容子路径部署）
   策略：安装时预缓存核心资源；运行时同源 GET 走 stale-while-revalidate；
   音频 mp3 不变，走 cache-first */

const CORE = [
  "./",
  "./manifest.webmanifest",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./data/cet4.json",
  "./images/flashvocab-bg.jpg",
];
const CORE_CACHE = "flashvocab-core-v1";
const RUNTIME_CACHE = "flashvocab-runtime-v1";
const AUDIO_CACHE = "flashvocab-audio-v1";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CORE_CACHE)
      .then((c) => c.addAll(CORE))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k !== CORE_CACHE && k !== RUNTIME_CACHE && k !== AUDIO_CACHE)
            .map((k) => caches.delete(k)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // 音频：cache-first（文件永久不变）
  if (url.pathname.includes("/audio/")) {
    event.respondWith(
      caches.match(req).then(
        (hit) =>
          hit ||
          fetch(req).then((res) => {
            const copy = res.clone();
            caches.open(AUDIO_CACHE).then((c) => c.put(req, copy));
            return res;
          }),
      ),
    );
    return;
  }

  // 其余同源 GET：stale-while-revalidate（页面/JS 更新走网络）
  event.respondWith(
    caches.match(req).then((hit) => {
      const network = fetch(req)
        .then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(RUNTIME_CACHE).then((c) => c.put(req, copy));
          }
          return res;
        })
        .catch(() => hit);
      return hit || network;
    }),
  );
});
