"use client";

// 轻量音效（Web Audio 合成，无音频资源文件）

let ctx: AudioContext | null = null;

function ensureCtx(): AudioContext | null {
  try {
    if (!ctx) ctx = new AudioContext();
    if (ctx.state === "suspended") void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

function tone(
  ac: AudioContext,
  freq: number,
  start: number,
  dur: number,
  vol = 0.18,
) {
  const o = ac.createOscillator();
  const g = ac.createGain();
  o.type = "sine";
  o.frequency.value = freq;
  o.connect(g);
  g.connect(ac.destination);
  g.gain.setValueAtTime(0.0001, start);
  g.gain.exponentialRampToValueAtTime(vol, start + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  o.start(start);
  o.stop(start + dur + 0.05);
}

// 拼写成功"叮咚"：C6 下行到 G5
export function playDingDong() {
  const ac = ensureCtx();
  if (!ac) return;
  const t = ac.currentTime;
  tone(ac, 1046.5, t, 0.16);
  tone(ac, 783.99, t + 0.2, 0.34);
}
