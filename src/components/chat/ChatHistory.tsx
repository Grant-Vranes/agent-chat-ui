"use client";

import { ChatSession } from "@/lib/storage";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

export function ChatHistory({
  sessions,
  currentChatId,
  onSelect,
  onDelete,
}: {
  sessions: ChatSession[];
  currentChatId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="flex flex-1 flex-col gap-0.5 overflow-y-auto p-2">
      {sessions.map((s) => (
        <div
          key={s.id}
          className={`group flex items-center gap-1 rounded-lg px-3 py-2 transition-colors hover:bg-secondary ${
            s.id === currentChatId ? "bg-secondary" : ""
          }`}
        >
          {s.id === currentChatId && (
            <div className="-ml-3 mr-2 h-5 w-0.5 shrink-0 rounded-full bg-primary" />
          )}
          <button
            className="flex-1 truncate text-left text-sm text-foreground/80 transition-colors hover:text-foreground"
            onClick={() => onSelect(s.id)}
          >
            {s.title || "New chat"}
          </button>
          <Button
            variant="ghost"
            size="icon"
            className="size-7 shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
            onClick={() => onDelete(s.id)}
          >
            <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
          </Button>
        </div>
      ))}
    </div>
  );
}