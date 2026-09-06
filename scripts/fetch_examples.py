#!/usr/bin/env python3
"""Tatoeba 例句抓取增强：为词书每词取 1 条中英对照例句 (CC BY 2.0 FR)

用法:
  LIMIT=20 python3 fetch_examples.py          # 试跑 20 词
  python3 fetch_examples.py                   # 全量（跳过已抓词，可断点续跑）
产出: 例句合并写入 ../data/wordbooks/<book>.json (words[].example)
"""
import json, os, re, sys, time, urllib.parse, urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed

HERE = os.path.dirname(os.path.abspath(__file__))
BOOK_DIR = os.path.join(HERE, '..', 'data', 'wordbooks')
BOOK = os.environ.get('BOOK', 'cet4')
LIMIT = int(os.environ.get('LIMIT', '0') or 0)
SLEEP = float(os.environ.get('SLEEP', '0.25'))

PATH = os.path.join(BOOK_DIR, f'{BOOK}.json')
UA = 'Flashvocab-wordbook-builder/0.1 (personal use; MIT data build)'


def fetch_examples(q):
    url = 'https://tatoeba.org/en/api_v0/search?' + urllib.parse.urlencode({
        'from': 'eng', 'to': 'cmn', 'query': q, 'orphans': 'no',
        'unapproved': 'no', 'limit': '8',
    })
    for attempt in range(3):
        try:
            req = urllib.request.Request(url, headers={'User-Agent': UA})
            with urllib.request.urlopen(req, timeout=20) as r:
                return json.load(r)
        except Exception:
            if attempt == 2:
                return None
            time.sleep(2 * (attempt + 1))
    return None


def word_forms(word):
    w = word.lower()
    forms = {w}
    for suf in ('s', 'es', 'd', 'ed', 'ing', 'ied', 'er', 'est', 'ly'):
        forms.add(w + suf)
    # 去 e 加 ing/ed: state -> stating/strated 不需要；take 类
    if w.endswith('e') and len(w) > 3:
        forms.add(w[:-1] + 'ing')
        forms.add(w[:-1] + 'ed')
    if w.endswith('y') and len(w) > 3:
        forms.add(w[:-1] + 'ies')
        forms.add(w[:-1] + 'ied')
    return forms


def contains_word(en, word):
    toks = re.findall(r"[a-z']+", en.lower())
    forms = word_forms(word)
    return any(t in forms for t in toks)


def pick(data, word):
    if not data or 'results' not in data:
        return None
    best = None          # 带中文翻译的最佳
    fallback = None      # 纯英文例句兜底（生僻词无中英对照时）
    for s in data['results']:
        en = (s.get('text') or '').strip()
        if not en or not (6 <= len(en) <= 70):
            continue
        if not contains_word(en, word):
            continue
        zh = None
        for tr in s.get('translations', []):
            for t in tr:
                if t.get('lang') == 'cmn' and (t.get('text') or '').strip():
                    zh = t['text'].strip()
                    break
            if zh:
                break
        if zh is None:
            if fallback is None or len(en) < fallback[0]:
                fallback = (len(en), en)
            continue
        if best is None or len(en) < best[0]:
            best = (len(en), en, zh)
    if best:
        return {'en': best[1], 'zh': best[2]}
    if fallback:
        return {'en': fallback[1], 'zh': ''}
    return None


def main():
    WORKERS = int(os.environ.get('WORKERS', '4'))
    with open(PATH, encoding='utf-8') as f:
        book = json.load(f)
    words = book['words']
    todo = [w for w in words if not w.get('example')]
    if LIMIT:
        todo = todo[:LIMIT]
    print(f'{BOOK}: 共 {len(words)} 词, 待抓 {len(todo)}, 并发 {WORKERS}', flush=True)

    ok = 0
    done = 0
    t0 = time.time()

    def grab(w):
        ex = pick(fetch_examples(w['word']), w['word'])
        return w, ex

    with ThreadPoolExecutor(max_workers=WORKERS) as pool:
        futures = {pool.submit(grab, w): w for w in todo}
        for fut in as_completed(futures):
            w, ex = fut.result()
            if ex:
                w['example'] = ex
                ok += 1
            done += 1
            if done % 100 == 0 or done == len(todo):
                with open(PATH, 'w', encoding='utf-8') as f:
                    json.dump(book, f, ensure_ascii=False, separators=(',', ':'))
                rate = done / (time.time() - t0)
                remain = (len(todo) - done) / rate / 60 if rate else 0
                print(f'  进度 {done}/{len(todo)} | 命中 {ok} | '
                      f'{rate:.2f} 词/秒 | 预计还需 {remain:.1f} 分', flush=True)
            time.sleep(SLEEP)

    with open(PATH, 'w', encoding='utf-8') as f:
        json.dump(book, f, ensure_ascii=False, separators=(',', ':'))
    print(f'完成: {ok}/{len(todo)} 词获得例句')


if __name__ == '__main__':
    main()
