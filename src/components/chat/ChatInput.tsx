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
    <form onSubmit={handleSubmit} className="flex items-end gap-2">
      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Type your message..."
        className="field-sizing-content flex-1 resize-none rounded-2xl border p-3 outline-none ring-0 focus:ring-0"
        rows={2}
      />
      {isLoading ? (
        <Button type="button" onClick={onStop} variant="outline" size="icon">
          <LoaderCircle className="h-4 w-4 animate-spin" />
        </Button>
      ) : (
        <Button type="submit" disabled={!input.trim()} size="icon">
          <Send className="h-4 w-4" />
        </Button>
      )}
    </form>
  );
}