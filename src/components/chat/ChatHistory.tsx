"use client";

import { useState, useRef, useEffect } from "react";
import { ChatSession } from "@/lib/storage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, Check, X } from "lucide-react";

function timeAgo(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

export function ChatHistory({
  sessions,
  currentChatId,
  onSelect,
  onDelete,
  onRename,
}: {
  sessions: ChatSession[];
  currentChatId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onRename: (id: string, newTitle: string) => void;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingId && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingId]);

  function startEditing(id: string, currentTitle: string) {
    setEditingId(id);
    setEditValue(currentTitle);
  }

  function confirmEdit() {
    if (editingId && editValue.trim()) {
      onRename(editingId, editValue.trim());
    }
    setEditingId(null);
  }

  function cancelEdit() {
    setEditingId(null);
  }

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
          <div className="flex-1 min-w-0">
            {editingId === s.id ? (
              <div className="flex items-center gap-1">
                <Input
                  ref={inputRef}
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") confirmEdit();
                    if (e.key === "Escape") cancelEdit();
                  }}
                  className="h-7 text-sm px-1.5"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-6 shrink-0"
                  onClick={confirmEdit}
                >
                  <Check className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-6 shrink-0"
                  onClick={cancelEdit}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            ) : (
              <button
                className="w-full text-left"
                onClick={() => onSelect(s.id)}
                onDoubleClick={() => startEditing(s.id, s.title || "")}
              >
                <div className="truncate text-sm text-foreground/80 transition-colors hover:text-foreground">
                  {s.title || "New chat"}
                </div>
                <div className="truncate text-[11px] text-muted-foreground/60">
                  {timeAgo(s.updatedAt)}
                </div>
              </button>
            )}
          </div>
          {editingId !== s.id && (
            <Button
              variant="ghost"
              size="icon"
              className="size-7 shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
              onClick={() => onDelete(s.id)}
            >
              <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
            </Button>
          )}
        </div>
      ))}
    </div>
  );
}