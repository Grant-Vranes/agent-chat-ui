"use client";

import { useMemo, useCallback, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChatMessage } from "@/lib/storage";
import { getRoundGroups, RoundGroup } from "@/lib/headings";
import { List, X, ChevronRight, MessageSquare, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ConversationOverview({
  messages,
  isOpen,
  onToggle,
  width = 280,
}: {
  messages: ChatMessage[];
  isOpen: boolean;
  onToggle: () => void;
  width?: number;
}) {
  const groups = useMemo(() => getRoundGroups(messages), [messages]);

  const handleClick = useCallback((id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, []);

  return (
    <AnimatePresence>
      {isOpen ? (
        <motion.aside
          key="overview-open"
          initial={{ width: 0, opacity: 0 }}
          animate={{ width, opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="h-full border-l border-border bg-background overflow-hidden flex-shrink-0"
        >
          <div className="flex h-full flex-col" style={{ width }}>
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <h2 className="text-sm font-semibold text-foreground">Overview</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={onToggle}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto px-3 py-3">
              {groups.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center mt-8">
                  No messages yet
                </p>
              ) : (
                <nav className="flex flex-col gap-1">
                  {groups.map((group) => (
                    <RoundGroupRow
                      key={group.roundIndex}
                      group={group}
                      onClick={handleClick}
                    />
                  ))}
                </nav>
              )}
            </div>
          </div>
        </motion.aside>
      ) : (
        <motion.aside
          key="overview-closed"
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 40, opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="h-full border-l border-border bg-background flex-shrink-0"
        >
          <div className="flex h-full w-[40px] flex-col items-center pt-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggle}
              className="text-muted-foreground hover:text-foreground"
              aria-label="Open overview"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}

function RoundGroupRow({
  group,
  onClick,
}: {
  group: RoundGroup;
  onClick: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="flex flex-col">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="flex items-center gap-2 rounded-md px-2 py-2 text-left text-xs transition-colors hover:bg-muted w-full group/round"
      >
        <ChevronRight
          className={`h-3 w-3 shrink-0 text-muted-foreground transition-transform ${
            expanded ? "rotate-90" : ""
          }`}
        />
        <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
        <span className="flex-1 text-foreground font-medium leading-snug line-clamp-2">
          {group.userItem.text}
        </span>
      </button>
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="flex flex-col gap-0.5 pl-6 pb-1">
              {group.children.length === 0 ? (
                <span className="text-xs text-muted-foreground/50 italic px-2 py-1">
                  Awaiting response...
                </span>
              ) : (
                group.children.map((child) => (
                  <button
                    key={child.id}
                    onClick={() => onClick(child.id)}
                    className="flex items-start gap-2 rounded-md px-2 py-1.5 text-left text-xs transition-colors hover:bg-muted w-full"
                  >
                    <span className="mt-1 h-3 w-3 shrink-0 text-muted-foreground">
                      {child.type === "ai-heading" ? (
                        <Bot className="h-3 w-3" />
                      ) : (
                        <MessageSquare className="h-3 w-3" />
                      )}
                    </span>
                    <span className="text-muted-foreground leading-relaxed line-clamp-2">
                      {child.text}
                    </span>
                  </button>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}