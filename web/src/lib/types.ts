// 词书数据结构（与 scripts/build_wordbook.py 输出对齐）
export interface Sense {
  pos: string | null;
  domain: string | null;
  text: string;
}

export interface Word {
  word: string;
  phonetic: string;
  senses: Sense[];
  definition: string;
  collins: number | null;
  oxford: boolean;
  frq: number | null;
}

export interface WordBook {
  meta: {
    book: string;
    source: string;
    count: number;
    builtAt: string;
  };
  words: Word[];
}
