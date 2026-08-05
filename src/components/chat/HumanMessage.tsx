"use client";

import { useState, useCallback } from "react";
import { Copy, Check, Download, User } from "lucide-react";

function formatTime(ts: number): string {
  return new Date(ts).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function HumanMessage({ content, timestamp }: { content: string; timestamp: number }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(content).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [content]);

  const handleDownload = useCallback(() => {
    const blob = new Blob([content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "message.md";
    a.click();
    URL.revokeObjectURL(url);
  }, [content]);

  return (
    <div className="group flex w-full flex-col items-end gap-1.5">
      <div className="flex w-full justify-end gap-3 items-end">
        <div className="bg-primary text-primary-foreground w-fit max-w-[80%] rounded-2xl rounded-br-sm px-4 py-3 text-sm leading-relaxed shadow-bubble whitespace-pre-wrap">
          {content}
        </div>
        <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <User className="size-5" />
        </div>
      </div>
      <div className="mr-13 flex items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100">
        <span className="text-xs text-muted-foreground/60">{formatTime(timestamp)}</span>
        <button
          onClick={handleCopy}
          className="flex size-6 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground"
          aria-label={copied ? "Copied" : "Copy message"}
        >
          {copied ? <Check className="size-3 text-green-500" /> : <Copy className="size-3" />}
        </button>
        <button
          onClick={handleDownload}
          className="flex size-6 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground"
          aria-label="Download message"
        >
          <Download className="size-3" />
        </button>
      </div>
    </div>
  );
}