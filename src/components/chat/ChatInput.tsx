"use client";

import { useState, FormEvent, KeyboardEvent } from "react";
import { Button } from "@/components/ui/button";
import { LoaderCircle, Send } from "lucide-react";

export function ChatInput({
  onSend,
  isLoading,
  onStop,
}: {
  onSend: (message: string) => void;
  isLoading: boolean;
  onStop: () => void;
}) {
  const [input, setInput] = useState("");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    onSend(input.trim());
    setInput("");
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      const form = (e.target as HTMLElement).closest("form");
      form?.requestSubmit();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-end gap-3">
      <div className="relative flex-1">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your message..."
          className="field-sizing-content w-full resize-none rounded-2xl border border-input bg-secondary/50 px-4 py-3 pr-12 text-sm outline-none ring-0 transition-colors placeholder:text-muted-foreground/60 focus:border-primary focus:ring-2 focus:ring-primary/20"
          rows={2}
        />
      </div>
      {isLoading ? (
        <Button type="button" onClick={onStop} variant="outline" size="icon" className="size-10 shrink-0 rounded-xl">
          <LoaderCircle className="h-4 w-4 animate-spin" />
        </Button>
      ) : (
        <Button
          type="submit"
          disabled={!input.trim()}
          size="icon"
          className="size-10 shrink-0 rounded-xl"
        >
          <Send className="h-4 w-4" />
        </Button>
      )}
    </form>
  );
}