"use client";

export function HumanMessage({ content }: { content: string }) {
  return (
    <div className="ml-auto flex items-center gap-2">
      <p className="bg-primary text-primary-foreground ml-auto w-fit rounded-3xl px-4 py-2 text-right whitespace-pre-wrap">
        {content}
      </p>
    </div>
  );
}