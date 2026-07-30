"use client";

import { useEffect, useRef } from "react";
import { ChatMessage } from "@/lib/storage";
import { AIMessage } from "./AIMessage";
import { HumanMessage } from "./HumanMessage";

export function MessageList({
  messages,
  isLoading,
}: {
  messages: ChatMessage[];
  isLoading: boolean;
}) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex flex-col gap-4">
      {messages.map((msg) =>
        msg.role === "user" ? (
          <HumanMessage key={msg.id} content={msg.content} />
        ) : (
          <AIMessage key={msg.id} content={msg.content} />
        ),
      )}
      {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
        <div className="mr-auto flex items-start gap-2">
          <div className="bg-muted flex h-8 items-center gap-1 rounded-2xl px-4 py-2">
            <div className="bg-foreground/50 h-1.5 w-1.5 animate-[pulse_1.5s_ease-in-out_infinite] rounded-full" />
            <div className="bg-foreground/50 h-1.5 w-1.5 animate-[pulse_1.5s_ease-in-out_0.5s_infinite] rounded-full" />
            <div className="bg-foreground/50 h-1.5 w-1.5 animate-[pulse_1.5s_ease-in-out_1s_infinite] rounded-full" />
          </div>
        </div>
      )}
      <div ref={bottomRef} />
    </div>
  );
}