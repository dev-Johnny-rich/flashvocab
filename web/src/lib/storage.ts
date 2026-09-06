import type { Card } from "@/lib/scheduler";
import type { BookId } from "@/lib/books";

// 学习数据存储层（每词书独立 key；localStorage 实现，预留 remote 同步替换位）
// 词书间进度/评分/复习排期完全隔离，互不影响

export type Rating = "again" | "hard" | "good";

export interface LogEntry {
  r: Rating;
  at: string; // ISO 时间戳
}

// 今日学习会话：每天从词库续取 NEW_PER_DAY 个新词
export interface Daily {
  date: string; // YYYY-MM-DD（本地时区）
  start: number; // 今日首词在词库中的 index
  done: number; // 今日已完成（已评分）词数
}

// 今日复习会话：到期词队列快照（跨天重置）
export interface Review {
  date: string; // YYYY-MM-DD
  queue: string[]; // 今日到期需复习的单词（按词库顺序）
  pos: number; // 已完成复习的词数
}

export interface StudyState {
  version: 1;
  // 每个单词的评分历史（原始事实，可推导任何算法状态）
  logs: Record<string, LogEntry[]>;
  // FSRS 卡片状态（当前调度依据；JSON 中 due/last_review 为 ISO 字符串）
  cards: Record<string, Card>;
  // 词库总进度：已完成到第几个词（0-based，= 下一个新词的 index）
  cursor: number;
  // 今日会话（null = 尚未开始今日学习）
  daily: Daily | null;
  // 今日复习会话（null = 今日尚未复习）
  review: Review | null;
}

const KEY_PREFIX = "flashvocab.state.";
const LEGACY_KEY = "flashvocab.state.v1"; // 词书功能前的旧数据 key
const CURRENT_KEY = "flashvocab.currentBook";
const BACKUP_KEY = "flashvocab.backup"; // 上次手动备份日期 YYYY-MM-DD

const keyOf = (book: BookId) => `${KEY_PREFIX}${book}.v1`;

const EMPTY: StudyState = {
  version: 1,
  logs: {},
  cards: {},
  cursor: 0,
  daily: null,
  review: null,
};

// 本地时区日期 YYYY-MM-DD
export function todayStr(d: Date = new Date()): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

// —— 当前词书（主页学习/复习默认目标）——
export function loadCurrentBook(): BookId {
  try {
    const b = localStorage.getItem(CURRENT_KEY);
    return b === "cet6" ? "cet6" : "cet4";
  } catch {
    return "cet4";
  }
}

export function saveCurrentBook(book: BookId): void {
  try {
    localStorage.setItem(CURRENT_KEY, book);
  } catch {
    /* noop */
  }
}

// —— 备份时间追踪（温和提醒用）——
export function setLastBackupDate(d: string = todayStr()): void {
  try {
    localStorage.setItem(BACKUP_KEY, d);
  } catch {
    /* noop */
  }
}

export function getLastBackupDate(): string | null {
  try {
    return localStorage.getItem(BACKUP_KEY);
  } catch {
    return null;
  }
}

// 距上次备份的天数；从未备份返回 null
export function daysSinceBackup(): number | null {
  const d = getLastBackupDate();
  if (!d) return null;
  const [y, m, day] = d.split("-").map(Number);
  if (!y || !m || !day) return null;
  const a = new Date(y, m - 1, day);
  const b = new Date();
  a.setHours(0, 0, 0, 0);
  b.setHours(0, 0, 0, 0);
  return Math.round((b.getTime() - a.getTime()) / 86400000);
}

// 读取指定词书状态（含旧单书数据迁移到 cet4）
export function loadStudyState(book: BookId): StudyState {
  try {
    let raw = localStorage.getItem(keyOf(book));
    if (!raw && book === "cet4") {
      // 迁移词书功能前的旧数据到 cet4 新 key（并立即落盘，防止丢失）
      const legacy = localStorage.getItem(LEGACY_KEY);
      if (legacy) {
        raw = legacy;
        localStorage.removeItem(LEGACY_KEY);
        localStorage.setItem(keyOf(book), legacy);
      }
    }
    if (!raw) return { ...EMPTY, logs: {} };
    const parsed = JSON.parse(raw) as StudyState;
    if (parsed.version !== 1 || typeof parsed.cursor !== "number") {
      return { ...EMPTY, logs: {} };
    }
    return {
      version: 1,
      logs: parsed.logs ?? {},
      cards: parsed.cards ?? {},
      cursor: parsed.cursor ?? 0,
      daily: parsed.daily ?? null,
      review: parsed.review ?? null,
    };
  } catch {
    return { ...EMPTY, logs: {} };
  }
}

export function saveStudyState(book: BookId, s: StudyState): void {
  try {
    localStorage.setItem(keyOf(book), JSON.stringify(s));
  } catch {
    // 存储不可用（隐私模式/超限）时静默降级：本次会话仍可学习
  }
}

export function resetStudyState(book: BookId): void {
  try {
    localStorage.removeItem(keyOf(book));
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

// 某词今天最后一次评分（列表标记用）
export function lastRatingToday(
  logs: Record<string, LogEntry[]>,
  word: string,
  today: string = todayStr(),
): Rating | null {
  const arr = logs[word];
  if (!arr) return null;
  for (let i = arr.length - 1; i >= 0; i--) {
    if (arr[i].at.slice(0, 10) === today) return arr[i].r;
  }
  return null;
}

// 确保今日会话存在（跨天自动开新一批），返回新状态
export function ensureToday(
  s: StudyState,
  today: string = todayStr(),
): StudyState {
  if (s.daily && s.daily.date === today) return s;
  return { ...s, daily: { date: today, start: s.cursor, done: 0 } };
}
