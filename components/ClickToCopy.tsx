"use client";

import { useState } from "react";

interface ClickToCopyProps {
  value: string;
}

export function ClickToCopy({ value }: ClickToCopyProps) {
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value);
      setStatus("success");
    } catch {
      setStatus("error");
    }
  }

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <button
        type="button"
        onClick={handleCopy}
        className="inline-flex h-11 items-center justify-center rounded-lg bg-slate-900 px-4 text-sm font-semibold text-white transition hover:bg-slate-700"
      >
        Copy
      </button>
      {status === "success" ? <p className="text-sm font-medium text-emerald-700">Copied!</p> : null}
      {status === "error" ? <p className="text-sm font-medium text-rose-700">Unable to copy</p> : null}
    </div>
  );
}
