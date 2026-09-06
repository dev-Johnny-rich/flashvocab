// 词书定义（数据文件在 web/public/data/，由 scripts/build_wordbook.py 生成）
export type BookId = "cet4" | "cet6";

export interface BookInfo {
  id: BookId;
  label: string; // 界面显示名
  file: string; // 数据文件名
  count: number; // 词数（与数据 meta 一致）
  desc: string;
}

export const BOOKS: Record<BookId, BookInfo> = {
  cet4: {
    id: "cet4",
    label: "四级词汇",
    file: "cet4.json",
    count: 3849,
    desc: "大学英语四级 · 高频核心词",
  },
  cet6: {
    id: "cet6",
    label: "六级词汇",
    file: "cet6.json",
    count: 5407,
    desc: "大学英语六级 · 高频核心词",
  },
};

export const BOOK_ORDER: BookId[] = ["cet4", "cet6"];
