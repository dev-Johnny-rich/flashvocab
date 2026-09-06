// 学习数据存储层（R4：localStorage 实现；预留 remote 同步替换位）
// 数据模型带 version 字段，未来 schema 变更可迁移

export type Rating = "again" | "hard" | "good";

export interface LogEntry {
  r: Rating;
  at: string; // ISO 时间戳
}

export interface StudyState {
  version: 1;
  // 每个单词的评分历史（FSRS 等算法可从原始序列推导卡片状态）
  logs: Record<string, LogEntry[]>;
  // 顺序学习进度：已完成到第几个词（0-based，= 下一个新词的 index）
  cursor: number;
}

const KEY = "flashvocab.state.v1";

const EMPTY: StudyState = { version: 1, logs: {}, cursor: 0 };

export function loadStudyState(): StudyState {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...EMPTY, logs: {} };
    const parsed = JSON.parse(raw) as StudyState;
    if (parsed.version !== 1 || typeof parsed.cursor !== "number") {
      return { ...EMPTY, logs: {} };
    }
    return {
      version: 1,
      logs: parsed.logs ?? {},
      cursor: parsed.cursor ?? 0,
    };
  } catch {
    return { ...EMPTY, logs: {} };
  }
}

export function saveStudyState(s: StudyState): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    // 存储不可用（隐私模式/超限）时静默降级：本次会话仍可学习
  }
}

export function resetStudyState(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* noop */
  }
}

// 记录一次评分，返回新状态（不修改入参）
export function addLog(
  s: StudyState,
  word: string,
  rating: Rating,
  at: Date = new Date(),
): StudyState {
  const entry: LogEntry = { r: rating, at: at.toISOString() };
  const prev = s.logs[word] ?? [];
  return {
    ...s,
    logs: { ...s.logs, [word]: [...prev, entry] },
  };
}
