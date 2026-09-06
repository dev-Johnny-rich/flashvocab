"use client";

import { useEffect, useRef, useState } from "react";
import {
  daysSinceBackup,
  getLastBackupDate,
  loadStudyState,
  resetStudyState,
  saveStudyState,
  setLastBackupDate,
} from "@/lib/storage";
import { BOOK_ORDER, type BookId } from "@/lib/books";

// 数据备份工具：导出 / 导入 / 重置学习数据
export default function DataTools({ onClose }: { onClose: () => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // 上次备份信息
  const last = getLastBackupDate();
  const since = daysSinceBackup();
  const backupInfo =
    last === null
      ? "从未备份过"
      : since === null
        ? last
        : since === 0
          ? "今天"
          : since === 1
            ? "昨天"
            : `${since} 天前`;

  // 导出（打包全部词书数据）
  const doExport = () => {
    const books = {} as Record<BookId, unknown>;
    for (const id of BOOK_ORDER) books[id] = loadStudyState(id);
    const payload = {
      app: "flashvocab-backup",
      version: 2,
      exportedAt: new Date().toISOString(),
      books,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const d = new Date();
    const p = (n: number) => String(n).padStart(2, "0");
    a.href = url;
    a.download = `flashvocab-backup-${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setLastBackupDate();
    setMsg("已导出备份文件，请妥善保存");
    setErr(null);
  };

  // 导入（新版 v2 合集逐词书写入；兼容旧版单词书文件）
  const doImport = async (f: File | undefined) => {
    if (!f) return;
    try {
      const text = await f.text();
      const data = JSON.parse(text);
      if (data?.app === "flashvocab-backup" && data?.version === 2 && data?.books) {
        for (const id of BOOK_ORDER) {
          const b = data.books[id];
          if (b && typeof b.cursor === "number") {
            saveStudyState(id, b);
          }
        }
      } else if (data?.version === 1 && typeof data?.cursor === "number") {
        // 旧版单词书备份 → 导入 cet4
        saveStudyState("cet4", data);
      } else {
        throw new Error("格式不对");
      }
      setLastBackupDate();
      setMsg("导入成功，正在刷新…");
      setErr(null);
      window.setTimeout(() => window.location.reload(), 800);
    } catch {
      setErr("文件格式不正确，请选择词闪记导出的备份文件");
      setMsg(null);
    }
  };

  // 重置
  const doReset = () => {
    if (
      window.confirm(
        "确定要清空全部词书的学习数据吗？(四级/六级进度、评分、复习排期都会删除，此操作不可恢复)\n建议先导出备份。",
      )
    ) {
      for (const id of BOOK_ORDER) resetStudyState(id);
      window.location.reload();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 backdrop-blur-[2px]"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-sm rounded-2xl bg-white px-7 py-8 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <h2 className="text-xl font-normal text-foreground">数据备份</h2>
          <button
            onClick={onClose}
            aria-label="关闭"
            className="rounded-full p-1.5 text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-700"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              aria-hidden
            >
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <p className="mt-3 text-sm leading-relaxed text-neutral-500">
          学习数据会实时自动保存在本机浏览器中，无需每次手动操作。换设备、清理浏览器数据前导出备份即可；恢复时导入备份文件。
        </p>

        <p className="mt-4 text-xs text-neutral-400">
          上次备份：{backupInfo}
        </p>

        <div className="mt-6 flex flex-col gap-3">
          <button
            onClick={doExport}
            className="rounded-full bg-neutral-900 py-2.5 text-base text-white transition hover:bg-neutral-700 active:scale-[0.98]"
          >
            导出备份
          </button>
          <button
            onClick={() => fileRef.current?.click()}
            className="rounded-full border border-neutral-300 bg-white py-2.5 text-base text-neutral-700 transition hover:border-neutral-900 hover:text-neutral-900 active:scale-[0.98]"
          >
            导入备份
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".json,application/json"
            className="hidden"
            onChange={(e) => {
              void doImport(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
          <button
            onClick={doReset}
            className="rounded-full py-2 text-sm text-red-400 transition hover:text-red-600"
          >
            清空全部学习数据
          </button>
        </div>

        {(msg || err) && (
          <p className={`mt-4 text-sm ${err ? "text-red-500" : "text-neutral-500"}`}>
            {err ?? msg}
          </p>
        )}
      </div>
    </div>
  );
}
