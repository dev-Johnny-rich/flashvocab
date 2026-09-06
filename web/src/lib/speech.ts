"use client";

// 单词发音（R5：浏览器内置语音 SpeechSynthesis，零依赖；
// M4 将替换/降级为 edge-tts 预生成的高质量音频）

let voices: SpeechSynthesisVoice[] = [];

function pickVoice(): SpeechSynthesisVoice | null {
  if (!("speechSynthesis" in window)) return null;
  if (!voices.length) voices = window.speechSynthesis.getVoices();
  // 优先美音
  return (
    voices.find((v) => v.lang === "en-US" && /google/i.test(v.name)) ??
    voices.find((v) => v.lang === "en-US") ??
    voices.find((v) => v.lang.startsWith("en")) ??
    null
  );
}

// 语音列表异步加载（部分浏览器首次 getVoices 为空）
if (typeof window !== "undefined" && "speechSynthesis" in window) {
  window.speechSynthesis.onvoiceschanged = () => {
    voices = window.speechSynthesis.getVoices();
  };
}

export function speakWord(text: string): void {
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel(); // 打断上一次朗读
  const u = new SpeechSynthesisUtterance(text);
  const v = pickVoice();
  if (v) u.voice = v;
  u.lang = v?.lang ?? "en-US";
  u.rate = 0.92;
  window.speechSynthesis.speak(u);
}
