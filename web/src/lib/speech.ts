"use client";

// 单词发音（R5：浏览器内置语音 SpeechSynthesis，零依赖；
// M4 将替换/降级为 edge-tts 预生成的高质量音频）

// macOS Chrome 已知问题对策：
// 1. getVoices 首次调用返回空（异步加载）→ 每次 speak 前现取，不依赖缓存
// 2. 部分 Chrome 需先 resume() 才能出声
// 3. cancel() 后立即 speak() 会丢 utterance → 延迟发声

function pickVoice(): SpeechSynthesisVoice | null {
  if (!("speechSynthesis" in window)) return null;
  const voices = window.speechSynthesis.getVoices();
  // 只挑英文语音，避免中文系统默认语音读英文
  return (
    voices.find((v) => v.lang === "en-US" && /google|samantha|aria/i.test(v.name)) ??
    voices.find((v) => v.lang === "en-US") ??
    voices.find((v) => v.lang === "en-GB") ??
    voices.find((v) => v.lang.startsWith("en")) ??
    null
  );
}

if (typeof window !== "undefined" && "speechSynthesis" in window) {
  // 预热：触发语音列表加载
  window.speechSynthesis.onvoiceschanged = () => {};
  try {
    window.speechSynthesis.getVoices();
  } catch {
    /* noop */
  }
}

export function speakWord(text: string): void {
  if (!("speechSynthesis" in window)) return;
  const synth = window.speechSynthesis;

  // 先取消再恢复（Chrome 偶发暂停状态导致无声）
  synth.cancel();
  synth.resume();

  const u = new SpeechSynthesisUtterance(text);
  const v = pickVoice();
  if (v) u.voice = v;
  u.lang = v?.lang ?? "en-US";
  u.rate = 0.92;

  // cancel 后立即 speak 会被 Chrome 吞掉，延迟一拍再发声
  window.setTimeout(() => {
    synth.speak(u);
  }, 80);
}
