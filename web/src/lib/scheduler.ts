// FSRS 复习调度封装（M3：ts-fsrs 5.4.2）
// 关闭短时学习步骤（闪卡模式，无分钟级复习），评分后直接进入以天计的间隔
import {
  createEmptyCard,
  fsrs,
  generatorParameters,
  Rating,
  State,
  type Card,
  type Grade,
} from "ts-fsrs";

const f = fsrs(generatorParameters({ enable_short_term: false }));

export type { Card };

export type RatingKey = "again" | "hard" | "good";

// 三档映射：忘记→Again(+1天起步) 模糊→Hard(+2天) 认识→Good(+3天)
const RATING_MAP: Record<RatingKey, Grade> = {
  again: Rating.Again,
  hard: Rating.Hard,
  good: Rating.Good,
};

export function newCard(): Card {
  return createEmptyCard();
}

// 按评分推进卡片状态（学习与复习统一走这里）
export function scheduleNext(
  card: Card,
  ratingKey: RatingKey,
  now: Date = new Date(),
): Card {
  return f.next(card, now, RATING_MAP[ratingKey]).card;
}

// 还原持久化的卡片（JSON 中 due/last_review 为 ISO 字符串）
export function reviveCard(raw: unknown): Card | null {
  if (!raw || typeof raw !== "object") return null;
  const c = raw as Partial<Card>;
  if (typeof c.due === "undefined" || typeof c.stability !== "number") {
    return null;
  }
  return {
    ...(c as Card),
    due: new Date(c.due as unknown as string),
    last_review: c.last_review
      ? new Date(c.last_review as unknown as string)
      : undefined,
  };
}

// 距今天数文案（按本地日历日差，非精确小时）
export function dueInDaysText(card: Card, now: Date = new Date()): string {
  const a = new Date(card.due);
  a.setHours(0, 0, 0, 0);
  const b = new Date(now);
  b.setHours(0, 0, 0, 0);
  const d = Math.round((a.getTime() - b.getTime()) / 86400000);
  if (d <= 0) return "今天";
  if (d === 1) return "明天";
  return `${d} 天后`;
}

// 是否到期需要复习（排除未学过的 New 卡；按日历日：due 在今天或以前即到期）
export function isDueCard(card: Card, now: Date = new Date()): boolean {
  if (card.state === State.New) return false;
  const a = new Date(card.due);
  a.setHours(0, 0, 0, 0);
  const b = new Date(now);
  b.setHours(0, 0, 0, 0);
  return a.getTime() <= b.getTime();
}
