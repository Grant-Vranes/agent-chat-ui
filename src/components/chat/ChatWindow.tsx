"use client";

import { useState, useCallback } from "react";
import { useChat } from "@/hooks/useChat";
import { ChatHistory } from "./ChatHistory";
import { MessageList } from "./MessageList";
import { ChatInput } from "./ChatInput";
import { ConversationOverview } from "./ConversationOverview";
import { SlideViewer } from "./SlideViewer";
import { ResizableHandle } from "@/components/ui/resizable-handle";
import { Button } from "@/components/ui/button";
import { MessageSquarePlus, PanelRightClose, PanelRightOpen } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { NavBar } from "@/components/layout/NavBar";

export function ChatWindow() {
  const {
    messages,
    isLoading,
    stopped,
    sendMessage,
    stop,
    loadSession,
    currentChatId,
    sessions,
    newSession,
    removeSession,
    renameSession,
    pptOutline,
    hasOutline,
  } = useChat();

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [overviewOpen, setOverviewOpen] = useState(true);
  const [outlineOpen, setOutlineOpen] = useState(true);
  const [outlineWidth, setOutlineWidth] = useState(420);
  const [overviewWidth, setOverviewWidth] = useState(280);

  const handleOutlineResize = useCallback((deltaX: number) => {
    setOutlineWidth((prev) => Math.max(200, Math.min(500, prev + deltaX)));
  }, []);

  const handleOverviewResize = useCallback((deltaX: number) => {
    setOverviewWidth((prev) => Math.max(200, Math.min(450, prev - deltaX)));
  }, []);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <AnimatePresence>
        {sidebarOpen && (
          <motion.aside
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="h-full border-r border-sidebar-border bg-sidebar shadow-inner-right"
            style={{ width: 300, flexShrink: 0 }}
          >
            <div className="flex h-full flex-col">
              <div className="flex items-center justify-between border-b border-sidebar-border px-4 py-3">
                <h2 className="text-sm font-semibold text-sidebar-foreground">History</h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSidebarOpen(false)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <PanelRightClose className="h-4 w-4" />
                </Button>
              </div>
              <ChatHistory
                sessions={sessions}
                currentChatId={currentChatId}
                onSelect={loadSession}
                onDelete={removeSession}
                onRename={renameSession}
              />
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      <SlideViewer
        outline={pptOutline}
        hasOutline={hasOutline}
        isOpen={outlineOpen}
        onToggle={() => setOutlineOpen((v) => !v)}
        width={outlineWidth}
      />

      {hasOutline && outlineOpen && (
        <ResizableHandle onResize={handleOutlineResize} />
      )}

      <div className="flex flex-1 flex-col min-w-0">
        <NavBar chatId={currentChatId}>
          {!sidebarOpen && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(true)}
              className="text-muted-foreground hover:text-foreground"
            >
              <PanelRightOpen className="h-4 w-4" />
            </Button>
          )}
          <Button variant="ghost" size="icon" onClick={newSession} className="text-muted-foreground hover:text-foreground">
            <MessageSquarePlus className="h-5 w-5" />
          </Button>
        </NavBar>

        <div className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-[1400px] px-6 py-8">
            {messages.length === 0 && !isLoading ? (
              <div className="mt-[20vh] text-center">
                <h1 className="font-display text-4xl font-normal text-primary">
                  Logistics Consultant
                </h1>
                <div className="mx-auto mt-4 h-px w-16 bg-border" />
                <p className="mt-4 text-sm text-muted-foreground">
                  Describe your logistics scenario to get a tailored proposal.
                </p>
              </div>
            ) : null}
            <MessageList messages={messages} isLoading={isLoading} stopped={stopped} />
          </div>
        </div>

        <div className="border-t border-border bg-background px-4 py-4">
          <div className="mx-auto w-full max-w-[1400px] px-6">
            <ChatInput onSend={sendMessage} isLoading={isLoading} onStop={stop} />
          </div>
        </div>
      </div>

      {overviewOpen && (
        <ResizableHandle onResize={handleOverviewResize} />
      )}

      <ConversationOverview
        messages={messages}
        isOpen={overviewOpen}
        onToggle={() => setOverviewOpen((v) => !v)}
        width={overviewWidth}
      />
    </div>
  );
}