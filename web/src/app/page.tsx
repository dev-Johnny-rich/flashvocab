const CN = ["词", "闪", "记"];
const EN = Array.from("Flashvocab");

// 逐字时间轴 (ms)：词闪记逐字 → Flashvocab 字母逐个接续
// 进度条总时长 = 最后一个字符浮现完成，两者同步
const CN_START = 200; // 首字延迟
const CN_GAP = 400; // 中文字间隔
const EN_START = 1250; // 英文接续起点
const EN_GAP = 110; // 英文字母间隔
const CHAR_DUR = 450; // 单字浮现动画时长（与 CSS keyframes 对齐）
const TOTAL = EN_START + (EN.length - 1) * EN_GAP + CHAR_DUR + 80;

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center">
      {/* 词闪记 · 逐字（Baskerville 衬线气质：中文落宋体） */}
      <h1
        className="flex select-none text-[clamp(4rem,15vw,8.5rem)] font-normal leading-none tracking-[0.06em] text-foreground"
        style={{
          fontFamily:
            'Baskerville, "Songti SC", "Noto Serif SC", "SimSun", Georgia, serif',
        }}
      >
        {CN.map((ch, i) => (
          <span
            key={ch}
            className="intro-char"
            style={{ animationDelay: `${CN_START + i * CN_GAP}ms` }}
          >
            {ch}
          </span>
        ))}
      </h1>

      {/* Flashvocab · 字母逐个接续（Baskerville） */}
      <p
        className="mt-5 flex select-none text-base text-neutral-500"
        style={{ fontFamily: 'Baskerville, Georgia, serif' }}
      >
        {EN.map((ch, i) => (
          <span
            key={i}
            className="intro-char inline-block"
            style={{
              animationDelay: `${EN_START + i * EN_GAP}ms`,
              marginRight: i < EN.length - 1 ? "0.42em" : 0,
            }}
          >
            {ch}
          </span>
        ))}
      </p>

      {/* 进度条 · 1200px 上限，走满后淡出退场 */}
      <div
        className="intro-fade mt-14 h-[2px] w-[min(1200px,calc(100vw-3rem))] overflow-hidden rounded-full bg-neutral-200"
        style={{ animationDelay: `${TOTAL + 300}ms` }}
      >
        <div
          className="intro-bar h-full rounded-full bg-foreground"
          style={{ animationDuration: `${TOTAL}ms` }}
        />
      </div>
    </main>
  );
}
