"use client";

import { useEffect, useRef } from "react";
import { ChatMessage } from "@/lib/storage";
import { AIMessage } from "./AIMessage";
import { HumanMessage } from "./HumanMessage";
import { motion, AnimatePresence } from "framer-motion";

export function MessageList({
  messages,
  isLoading,
  stopped,
  isWorking,
}: {
  messages: ChatMessage[];
  isLoading: boolean;
  stopped: boolean;
  isWorking: boolean;
}) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex flex-col gap-5">
      <AnimatePresence initial={false}>
        {messages.map((msg) => (
          <motion.div
            key={msg.id}
            id={`msg-${msg.id}`}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            {msg.role === "user" ? (
              <HumanMessage content={msg.content} timestamp={msg.timestamp} />
            ) : (
              <AIMessage content={msg.content} timestamp={msg.timestamp} messageId={msg.id} />
            )}
          </motion.div>
        ))}
      </AnimatePresence>
      {stopped && !isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex justify-center"
        >
          <div className="flex items-center gap-2 rounded-full border border-border bg-secondary/50 px-4 py-1.5">
            <div className="h-1 w-1 rounded-full bg-muted-foreground/40" />
            <span className="text-[11px] text-muted-foreground/60">Response interrupted</span>
            <div className="h-1 w-1 rounded-full bg-muted-foreground/40" />
          </div>
        </motion.div>
      )}
      {isLoading && isWorking && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mr-auto flex items-center gap-2.5"
        >
          <div className="flex items-center gap-2.5 rounded-2xl bg-secondary px-4 py-3">
            <div className="h-2 w-2 animate-pulse rounded-full bg-primary/60" />
            <span className="text-xs text-muted-foreground">正在生成 PPT，请稍候…</span>
          </div>
        </motion.div>
      )}
      {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mr-auto flex items-start gap-3"
        >
          <div className="bg-primary/10 text-primary mt-1 flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold">
            AI
          </div>
          <div className="flex items-center gap-2.5 rounded-2xl bg-secondary px-4 py-3">
            <div className="bg-primary/40 h-2 w-2 animate-bounce-dot-1 rounded-full" />
            <div className="bg-primary/40 h-2 w-2 animate-bounce-dot-2 rounded-full" />
            <div className="bg-primary/40 h-2 w-2 animate-bounce-dot-3 rounded-full" />
            <span className="ml-1 text-xs text-muted-foreground">Thinking</span>
          </div>
        </motion.div>
      )}
      <div ref={bottomRef} />
    </div>
  );
}