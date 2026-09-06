#!/usr/bin/env python3
"""ECDICT → 四六级词书 JSON 清洗脚本 (M1.2)

用法: python3 build_wordbook.py
产出: ../data/wordbooks/cet4.json  ../data/wordbooks/cet6.json
"""
import csv, json, re, sys, os
from collections import Counter, defaultdict

HERE = os.path.dirname(os.path.abspath(__file__))
CSV = os.path.join(HERE, '..', 'data', 'ecdict', 'ecdict.csv')
OUT = os.path.join(HERE, '..', 'data', 'wordbooks')

# ---- 音标字符修正（ECDICT 坏编码 → 标准 IPA，实测映射表 2026-09-05） ----
# єә→eə, є→e, \:→ɜ:, .→删除(音节分隔), ^→g(丢失字母), ,→ˌ(次重音),
# '→ˈ(主重音), ?/@/;/→删除(噪声)
IPA_FIX_SEQ = [
    ('ә', 'ə'),  # 西里尔 U+04D9 → 拉丁 U+0259（同形不同码位，先映射避免干扰 єә 规则）
    ('єә', 'eə'), ('є', 'e'), ('^', 'g'), (',', 'ˌ'),
    ('?', ''), ('@', ''), (';', ''), ("'", 'ˈ'),
    # 双元音旧式写法 → 标准 IPA（在音标串中这些字母组合无歧义）
    ('ei', 'eɪ'), ('ai', 'aɪ'), ('əu', 'əʊ'), ('au', 'aʊ'), ('ɔi', 'ɔɪ'), ('ɒi', 'ɔɪ'),
    # ASCII 冒号长音符 → IPA 长音符号
    (':', 'ː'),
    ('.', ''), ('\\', ''),
]
# 词性缩写归一（ECDICT 用 a./ad. 老式写法）
POS_NORM = {'a': 'adj', 'ad': 'adv'}
# 扫描 phonetic 用到的全部字符（针对目标词书）
def scan_phonetic_chars(words):
    c = Counter()
    for w in words:
        if w.get('phonetic'):
            c.update(w['phonetic'])
    return c

POS_RE = re.compile(r'^(?P<pos>(?:vt|vi|v|n|adj|adv|prep|conj|pron|num|art|int|aux|modal|det|abbr|a|ad)\.)(?:&|&amp;)?\s*')
DOMAIN_RE = re.compile(r'^\[([^\]]+)\]\s*')
# 行内多词性切分：在 pos 标记（如 " a. "、" vt. "）前切开
POS_SPLIT = re.compile(r'(?=(?:^|\s)(?:vt|vi|v|n|adj|adv|prep|conj|pron|num|art|int|aux|modal|det|abbr|a|ad)\.\s)')
# 合法 IPA 音标字符集（判断是否需要映射）
IPA_OK = set("əɪʊɑːɒɔɜæeʌuioɛaɚɝɞɤɐɨɵɘɶɷɳɲŋɱmnpbt dkgfvs zʃʒθðhwlrjʧʤtrdztsʦʣɹɻʀʁχɸβɣħɬɮʍw̩ɐɔɜəʊʌæɑɒɪiueoɛaːˈˌ'·- ()ɡ:")
IPA_OK |= set('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ')

def parse_translation(trans):
    """ECDICT translation 用字面 '\\n' 分隔义项行，行内可嵌多词性段
    'n. 能力, 才干\\n[经] 能力, 才能' / 'n. 州, ... a. 国家的, ... vt. 说明...'
    → [{pos, domain, text}, ...]"""
    senses = []
    text = (trans or '').replace('\\n', '\n')
    for line in text.split('\n'):
        line = line.strip()
        if not line:
            continue
        for seg in POS_SPLIT.split(line):  # 行内多词性切段
            seg = seg.strip()
            if not seg:
                continue
            pos = domain = None
            m = POS_RE.match(seg)
            if m:
                raw = m.group('pos').rstrip('.')
                pos = POS_NORM.get(raw, raw)
                seg = seg[m.end():].strip()
            m = DOMAIN_RE.match(seg)
            if m:
                domain = m.group(1)
                seg = seg[m.end():].strip()
            if not seg:
                continue
            # 行内重复义项去重（数据噪声，如 "发生, 发生, 恰巧"）
            parts = [p for p in re.split(r',\s*', seg) if p]
            seen, uniq = set(), []
            for p in parts:
                if p not in seen:
                    seen.add(p)
                    uniq.append(p)
            seg = ', '.join(uniq)
            if seg:
                senses.append({'pos': pos, 'domain': domain, 'text': seg})
    return senses

def fix_phonetic(ph):
    if not ph:
        return ''
    # \: 组合 → ɜ:（坏编码的 ɜː 长元音），须先于单个反斜杠删除处理
    ph = re.sub(r'\\+:', 'ɜ:', ph)
    for a, b in IPA_FIX_SEQ:
        ph = ph.replace(a, b)
    return ph.strip()

def load_books(tags):
    books = {t: {'words': {}, 'phon_chars': Counter()} for t in tags}
    with open(CSV, encoding='utf-8', errors='replace') as f:
        for row in csv.DictReader(f):
            tag = (row.get('tag') or '').strip()
            if not tag:
                continue
            for t in tags:
                if t in tag.split():
                    books[t]['words'][row['word']] = row
    return books

def clean(book, name):
    rows = book['words']
    words = []
    for word, r in rows.items():
        senses = parse_translation(r.get('translation'))
        ph = fix_phonetic(r.get('phonetic') or '')
        frq = r.get('frq') or ''
        collins = r.get('collins') or ''
        oxford = r.get('oxford') or ''
        item = {
            'word': word,
            'phonetic': ph,
            'senses': senses,
            'definition': (r.get('definition') or '').strip(),
            'collins': int(collins) if collins.isdigit() else None,
            'oxford': oxford.strip() == '1',
            'frq': int(frq) if frq.isdigit() else None,
        }
        words.append(item)
        book['phon_chars'].update(ph)
    # 高频在前（frq 越小越常用，空值排最后）
    words.sort(key=lambda x: (x['frq'] is None, x['frq'] or 10**9, x['word']))
    return {
        'meta': {
            'book': name,
            'source': 'ECDICT (MIT)',
            'count': len(words),
            'builtAt': '2026-09-06',
        },
        'words': words,
    }

def main():
    os.makedirs(OUT, exist_ok=True)
    books = load_books(['cet4', 'cet6'])
    # 六级定位修正（2026-09-06）：剔除与四级重叠的词，
    # 避免六级词书出现 state/might 等四级基础词，保证难度定位准确
    books['cet6']['words'] = {
        w: r for w, r in books['cet6']['words'].items() if w not in books['cet4']['words']
    }
    for t, name in [('cet4', 'cet4'), ('cet6', 'cet6')]:
        data = clean(books[t], name)
        path = os.path.join(OUT, f'{name}.json')
        with open(path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, separators=(',', ':'))
        print(f'[{name}] 词数: {data["meta"]["count"]}  ->  {path} ({os.path.getsize(path)/1048576:.2f} MB)')

    # 报告（cet6 已剔除四级重叠词）
    c4 = set(books['cet4']['words'])
    c6 = set(books['cet6']['words'])
    print(f'\n=== 词书定位 ===')
    print(f'cet4: {len(c4)} 词 (含六级重叠 {len(c4 & set(load_books(["cet6"])["cet6"]["words"]))} 词)')
    print(f'cet6: {len(c6)} 词 (已剔除四级重叠, 纯六级专属)')

    # 音标字符检查
    for t in ['cet4', 'cet6']:
        unknown = {ch: n for ch, n in books[t]['phon_chars'].items() if ch not in IPA_OK and not ch.isspace()}
        if unknown:
            print(f'\n[{t}] 音标中非标准字符: ' + ', '.join(f"{ch!r}:{n}" for ch, n in sorted(unknown.items(), key=lambda x: -x[1])))
        else:
            print(f'\n[{t}] 音标字符全部标准 ✓')

    # 空字段率
    for t in ['cet4', 'cet6']:
        total = len(books[t]['words'])
        no_ph = sum(1 for w in books[t]['words'].values() if not (w.get('phonetic') or '').strip())
        no_sense = sum(1 for w in books[t]['words'].values() if not parse_translation(w.get('translation')))
        no_definition = sum(1 for w in books[t]['words'].values() if not (w.get('definition') or '').strip())
        no_frq = sum(1 for w in books[t]['words'].values() if not (w.get('frq') or '').strip())
        print(f'[{t}] 无音标:{no_ph} 无释义:{no_sense} 无英释:{no_definition} 无词频:{no_frq} / 总 {total}')

if __name__ == '__main__':
    main()
