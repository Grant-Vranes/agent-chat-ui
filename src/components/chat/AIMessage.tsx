"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useState, useCallback } from "react";
import { Copy, Check, ExternalLink } from "lucide-react";
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

export function AIMessage({ content }: { content: string }) {
  if (!content) return null;
  return (
    <div className="mr-auto flex w-full items-start gap-2">
      <div className="prose prose-sm max-w-none py-1 dark:prose-invert">
        <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
          {preprocessMarkdown(content)}
        </ReactMarkdown>
      </div>
    </div>
  );
}