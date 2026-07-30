"use client";

import { useEffect, useState } from "react";
import { useChat } from "@/hooks/useChat";
import { ChatHistory } from "./ChatHistory";
import { MessageList } from "./MessageList";
import { ChatInput } from "./ChatInput";
import { Button } from "@/components/ui/button";
import { MessageSquarePlus, PanelRightClose, PanelRightOpen } from "lucide-react";
import { motion } from "framer-motion";
import { NavBar } from "@/components/layout/NavBar";

export function ChatWindow() {
  const {
    messages,
    isLoading,
    sendMessage,
    stop,
    loadSession,
    currentChatId,
    sessions,
    newSession,
    removeSession,
  } = useChat();

  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    // no-op: sessions load from useChat hook on mount
  }, []);

  return (
    <div className="flex h-screen w-full overflow-hidden">
      {/* Sidebar */}
      <motion.div
        className="h-full border-r bg-background"
        style={{ width: 300 }}
        animate={{ x: sidebarOpen ? 0 : -300 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        <div className="flex h-full flex-col" style={{ width: 300 }}>
          <div className="flex items-center justify-between border-b p-3">
            <h2 className="text-sm font-semibold">History</h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(false)}
            >
              <PanelRightClose className="h-4 w-4" />
            </Button>
          </div>
          <ChatHistory
            sessions={sessions}
            currentChatId={currentChatId}
            onSelect={loadSession}
            onDelete={removeSession}
          />
        </div>
      </motion.div>

      {/* Main area */}
      <div className="flex flex-1 flex-col">
        {/* Top bar */}
        <NavBar chatId={currentChatId}>
          {!sidebarOpen && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(true)}
            >
              <PanelRightOpen className="h-4 w-4" />
            </Button>
          )}
          <Button variant="ghost" size="icon" onClick={newSession}>
            <MessageSquarePlus className="h-5 w-5" />
          </Button>
        </NavBar>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-8">
          <div className="mx-auto max-w-3xl">
            {messages.length === 0 && !isLoading ? (
              <div className="mt-[25vh] text-center text-muted-foreground">
                <p className="text-2xl font-semibold">Logistics Consultant</p>
                <p>Describe your logistics scenario to get a tailored proposal.</p>
              </div>
            ) : null}
            <MessageList messages={messages} isLoading={isLoading} />
          </div>
        </div>

        {/* Input */}
        <div className="border-t p-4">
          <div className="mx-auto max-w-3xl">
            <ChatInput onSend={sendMessage} isLoading={isLoading} onStop={stop} />
          </div>
        </div>
      </div>
    </div>
  );
}