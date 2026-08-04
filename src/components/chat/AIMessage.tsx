"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useState, useCallback } from "react";
import { Copy, Check, Download, ExternalLink } from "lucide-react";
import type { Components } from "react-markdown";

function preprocessMarkdown(raw: string): string {
  return raw
    .replace(/^(#{1,6})([^#\s\n])/gm, "$1 $2")
    .replace(/^([-+])([^\s\n])/gm, "$1 $2")
    .replace(/^(\d+\.)([^\s\n])/gm, "$1 $2")
    .replace(/^(>)([^\s\n>])/gm, "$1 $2");
}

function CodeBlock({ language, children }: { language?: string; children: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(children).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [children]);

  return (
    <div className="group relative my-3 overflow-hidden rounded-lg border">
      {language && (
        <div className="bg-muted/50 border-b px-4 py-1.5 text-xs font-medium text-muted-foreground">
          {language}
        </div>
      )}
      <pre className="overflow-x-auto p-4 text-sm leading-relaxed">
        <code>{children}</code>
      </pre>
      <button
        onClick={handleCopy}
        className="absolute top-2 right-2 rounded-md p-1.5 text-muted-foreground opacity-0 transition-opacity hover:bg-muted hover:text-foreground group-hover:opacity-100"
        aria-label={copied ? "Copied" : "Copy code"}
      >
        {copied ? <Check className="size-4 text-green-500" /> : <Copy className="size-4" />}
      </button>
    </div>
  );
}

const components: Components = {
  code({ className, children, ...props }) {
    const match = /language-(\w+)/.exec(className || "");
    const isInline = !match && !className;
    if (isInline) {
      return (
        <code
          className="rounded bg-muted px-1.5 py-0.5 text-sm font-medium text-foreground"
          {...props}
        >
          {children}
        </code>
      );
    }
    return (
      <CodeBlock language={match?.[1]}>
        {String(children).replace(/\n$/, "")}
      </CodeBlock>
    );
  },
  table({ children }) {
    return (
      <div className="my-3 overflow-x-auto rounded-lg border">
        <table className="min-w-full divide-y text-sm">{children}</table>
      </div>
    );
  },
  thead({ children }) {
    return <thead className="bg-muted/50">{children}</thead>;
  },
  th({ children }) {
    return (
      <th className="px-4 py-2 text-left font-medium text-muted-foreground">{children}</th>
    );
  },
  td({ children }) {
    return <td className="px-4 py-2">{children}</td>;
  },
  tr({ children }) {
    return <tr className="even:bg-muted/30">{children}</tr>;
  },
  a({ href, children, ...props }) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 font-medium text-primary underline underline-offset-2 decoration-primary/30 hover:decoration-primary"
        {...props}
      >
        {children}
        <ExternalLink className="size-3 shrink-0" />
      </a>
    );
  },
  blockquote({ children }) {
    return (
      <blockquote className="my-3 border-l-4 border-primary/20 pl-4 italic text-muted-foreground">
        {children}
      </blockquote>
    );
  },
  img({ src, alt }) {
    return (
      <img
        src={src}
        alt={alt || ""}
        className="my-3 max-w-full rounded-lg border"
      />
    );
  },
  ul({ children }) {
    return <ul className="my-2 list-disc space-y-1 pl-6">{children}</ul>;
  },
  ol({ children }) {
    return <ol className="my-2 list-decimal space-y-1 pl-6">{children}</ol>;
  },
  hr() {
    return <hr className="my-4 border-t" />;
  },
};

function formatTime(ts: number): string {
  return new Date(ts).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function AIMessage({ content, timestamp }: { content: string; timestamp: number }) {
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

  if (!content) return null;

  return (
    <div className="group flex w-full flex-col items-start gap-1.5">
      <div className="flex items-start gap-3">
        <div className="bg-primary/10 text-primary flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold">
          AI
        </div>
        <div className="prose prose-sm max-w-none py-0.5 dark:prose-invert">
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
            {preprocessMarkdown(content)}
          </ReactMarkdown>
        </div>
      </div>
      <div className="ml-13 flex items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100">
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