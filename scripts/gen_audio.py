#!/usr/bin/env python3
"""edge-tts 批量发音生成：为词书每词生成 mp3 (en-GB-SoniaNeural)

用法:
  LIMIT=20 python3 gen_audio.py              # 试跑 20 词（默认 cet4）
  BOOK=cet6 python3 gen_audio.py             # 生成六级词书音频
产出: ~/vocab/web/public/audio/<word>.mp3 （cet4/cet6 词表无重叠，可共用目录）
"""
import asyncio
import json
import os
import sys
import time

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.normpath(os.path.join(HERE, "..", "web", "public", "audio"))
BOOK = os.environ.get("BOOK", "cet4")
BOOK_PATH = os.path.normpath(os.path.join(HERE, "..", "data", "wordbooks", f"{BOOK}.json"))
VOICE = os.environ.get("VOICE", "en-GB-SoniaNeural")
LIMIT = int(os.environ.get("LIMIT", "0"))  # 0 = all
WORKERS = int(os.environ.get("WORKERS", "4"))
RATE = os.environ.get("RATE", "+0%")

from edge_tts import Communicate  # noqa: E402


async def synth(word: str) -> bool:
    path = os.path.join(OUT, f"{word}.mp3")
    try:
        comm = Communicate(word, VOICE, rate=RATE)
        await comm.save(path)
        return os.path.getsize(path) > 500
    except Exception:
        try:
            if os.path.exists(path):
                os.remove(path)
        except OSError:
            pass
        return False


async def worker(q: asyncio.Queue, stats: dict) -> None:
    while True:
        try:
            word = q.get_nowait()
        except asyncio.QueueEmpty:
            return
        ok = await synth(word)
        stats["done"] += 1
        if ok:
            stats["hit"] += 1
        else:
            stats["fail"] += 1
        if stats["done"] % 50 == 0:
            eta = "?"
            print(f"  进度 {stats['done']}/{stats['total']} | 成功 {stats['hit']} | 失败 {stats['fail']}", flush=True)


async def main() -> None:
    os.makedirs(OUT, exist_ok=True)
    with open(BOOK_PATH, encoding="utf-8") as f:
        book = json.load(f)
    words = [w["word"] for w in book["words"]]
    todo = [w for w in words if not os.path.exists(os.path.join(OUT, f"{w}.mp3"))]
    if LIMIT:
        todo = todo[:LIMIT]
    stats = {"done": 0, "hit": 0, "fail": 0, "total": len(todo)}
    print(f"{BOOK}: 共 {len(words)} 词, 待生成 {len(todo)}, 并发 {WORKERS}", flush=True)
    q = asyncio.Queue()
    for w in todo:
        q.put_nowait(w)
    t0 = time.time()
    workers = [asyncio.create_task(worker(q, stats)) for _ in range(min(WORKERS, len(todo)))]
    await asyncio.gather(*workers)
    el = time.time() - t0
    rate = stats["done"] / el if el > 0 else 0
    print(f"完成: 成功 {stats['hit']}/{stats['total']} | 失败 {stats['fail']} | {rate:.2f} 词/秒", flush=True)


if __name__ == "__main__":
    asyncio.run(main())
