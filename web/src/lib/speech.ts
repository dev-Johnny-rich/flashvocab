"use client";

// 单词发音（M4：本地 edge-tts 预生成 mp3 优先，SpeechSynthesis 兜底）
// 音频文件: public/audio/<word>.mp3（生成脚本 scripts/gen_audio.py）

// 探测结果缓存，避免重复 HEAD 请求
const mp3Cache = new Map<string, boolean>();

function playMp3(url: string): Promise<boolean> {
  return new Promise((resolve) => {
    try {
      const a = new Audio(url);
      a.volume = 1;
      a.play()
        .then(() => resolve(true))
        .catch(() => resolve(false));
    } catch {
      resolve(false);
    }
  });
}

async function tryLocalAudio(word: string): Promise<boolean> {
  const url = `/audio/${encodeURIComponent(word)}.mp3`;
  if (mp3Cache.has(word)) {
    return mp3Cache.get(word) ? playMp3(url) : false;
  }
  try {
    const r = await fetch(url, { method: "HEAD" });
    const ok = r.ok;
    mp3Cache.set(word, ok);
    return ok ? playMp3(url) : false;
  } catch {
    mp3Cache.set(word, false);
    return false;
  }
}

// —— 兜底：浏览器内置语音 ——
function pickVoice(): SpeechSynthesisVoice | null {
  if (!("speechSynthesis" in window)) return null;
  const voices = window.speechSynthesis.getVoices();
  return (
    voices.find(
      (v) => v.lang === "en-US" && /google|samantha|aria/i.test(v.name),
    ) ??
    voices.find((v) => v.lang === "en-US") ??
    voices.find((v) => v.lang === "en-GB") ??
    voices.find((v) => v.lang.startsWith("en")) ??
    null
  );
}

function speakFallback(word: string): void {
  if (!("speechSynthesis" in window)) return;
  const synth = window.speechSynthesis;
  synth.cancel();
  synth.resume();
  const u = new SpeechSynthesisUtterance(word);
  const v = pickVoice();
  if (v) u.voice = v;
  u.lang = v?.lang ?? "en-US";
  u.rate = 0.92;
  window.setTimeout(() => {
    synth.speak(u);
  }, 80);
}

export async function speakWord(word: string): Promise<void> {
  const ok = await tryLocalAudio(word);
  if (!ok) speakFallback(word);
}
