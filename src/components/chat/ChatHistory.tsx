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
    <div className="flex h-full w-full flex-col gap-2 overflow-y-auto p-2">
      {sessions.map((s) => (
        <div key={s.id} className="flex items-center gap-1">
          <Button
            variant={s.id === currentChatId ? "secondary" : "ghost"}
            className="flex-1 justify-start truncate text-left text-sm"
            onClick={() => onSelect(s.id)}
          >
            {s.title || "New chat"}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={() => onDelete(s.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
    </div>
  );
}