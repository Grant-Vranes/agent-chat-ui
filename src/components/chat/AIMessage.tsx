"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export function AIMessage({ content }: { content: string }) {
  if (!content) return null;
  return (
    <div className="mr-auto flex w-full items-start gap-2">
      <div className="prose prose-sm max-w-none py-1">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
      </div>
    </div>
  );
}