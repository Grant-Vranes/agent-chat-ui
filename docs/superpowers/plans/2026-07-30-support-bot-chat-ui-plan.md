# Support Bot Chat UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) for syntax tracking.

**Goal:** Rewrite agent-chat-ui to remove all LangGraph dependencies and connect directly to the support-bot-master backend via SSE streaming.

**Architecture:** Three-page Next.js app (chat, document upload, product info). Chat uses `EventSource` for SSE streaming, `localStorage` for session persistence. No server-side API proxy needed — frontend connects to backend directly.

**Tech Stack:** Next.js 15, React 19, Tailwind CSS 4, shadcn/ui, framer-motion, react-markdown, EventSource API

---

### Task 1: Clean up dependencies and remove LangGraph files

**Files:**
- Modify: `package.json`
- Delete: `src/providers/`, `src/components/thread/`, `src/components/icons/`, `src/app/api/`
- Delete: `src/lib/api-key.tsx`, `src/lib/agent-inbox-interrupt.ts`, `src/lib/ensure-tool-responses.ts`, `src/lib/multimodal-utils.ts`
- Delete: `src/hooks/use-file-upload.tsx`

- [ ] **Step 1: Update package.json — remove LangGraph deps and unrelated deps**

Edit `package.json`

Remove from dependencies:
```json
    "@langchain/core": "^1.1.44",
    "@langchain/langgraph": "^1.2.9",
    "@langchain/langgraph-sdk": "^1.8.10",
    "esbuild": "^0.28.1",
    "esbuild-plugin-tailwindcss": "^2.2.0",
    "katex": "^0.16.45",
    "langgraph-nextjs-api-passthrough": "^0.1.4",
    "nuqs": "^2.8.9",
    "recharts": "^2.15.3",
    "rehype-katex": "^7.0.1",
    "remark-math": "^6.0.0",
    "react-syntax-highlighter": "^16.1.1",
    "use-stick-to-bottom": "^1.1.14",
```

Remove from devDependencies:
```json
    "dotenv": "^16.5.0",
    "react-syntax-highlighter": "^16.1.1",
    "@types/react-syntax-highlighter": "^15.5.13",
```

- [ ] **Step 2: Delete unnecessary files**

Run:
```bash
rm -rf src/providers src/components/thread src/components/icons src/app/api
rm -f src/lib/api-key.tsx src/lib/agent-inbox-interrupt.ts src/lib/ensure-tool-responses.ts src/lib/multimodal-utils.ts
rm -f src/hooks/use-file-upload.tsx
rm -f .env.example .codespellignore .prettierignore prettier.config.js eslint.config.js
```

- [ ] **Step 3: Install updated dependencies**

Run: `pnpm install`

---

### Task 2: Create localStorage storage utility

**Files:**
- Create: `src/lib/storage.ts`

- [ ] **Step 1: Create storage.ts with types and CRUD operations**

```typescript
export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
}

const SESSIONS_KEY = "chat:sessions";

function readSessions(): ChatSession[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(SESSIONS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function writeSessions(sessions: ChatSession[]) {
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
}

export function getSessions(): ChatSession[] {
  return readSessions().sort((a, b) => b.updatedAt - a.updateAt);
}

export function getSession(id: string): ChatSession | undefined {
  return readSessions().find((s) => s.id === id);
}

export function saveSession(session: ChatSession) {
  const all = readSessions();
  const idx = all.findIndex((s) => s.id === session.id);
  if (idx >= 0) all[idx] = session;
  else all.push(session);
  writeSessions(all);
}

export function deleteSession(id: string) {
  writeSessions(readSessions().filter((s) => s.id !== id));
}

export function createSession(id: string, firstMessage: string): ChatSession {
  return {
    id,
    title: firstMessage.slice(0, 50),
    messages: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}
```

---

### Task 3: Create SSE streaming hook

**Files:**
- Create: `src/hooks/useChat.ts`

- [ ] **Step 1: Write useChat.ts**

```typescript
import { useState, useRef, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";
import { ChatMessage, ChatSession, getSessions, getSession, saveSession, createSession } from "@/lib/storage";

export interface UseChatReturn {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  sendMessage: (content: string) => void;
  stop: () => void;
  loadSession: (chatId: string) => void;
  currentChatId: string | null;
  sessions: ChatSession[];
  newSession: () => void;
  deleteSession: (id: string) => void;
}

export function useChat(): UseChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const eventSourceRef = useRef<EventSource | null>(null);
  const accumulatedRef = useRef<string>("");
  const chatIdRef = useRef<string | null>(null);
  const messagesRef = useRef<ChatMessage[]>([]);

  // Keep ref in sync
  messagesRef.current = messages;

  const refreshSessions = useCallback(() => {
    setSessions(getSessions());
  }, []);

  const sendMessage = useCallback((content: string) => {
    setError(null);
    // Generate chatId if first message
    const chatId = chatIdRef.current || uuidv4();
    chatIdRef.current = chatId;
    setCurrentChatId(chatId);

    const userMsg: ChatMessage = {
      id: uuidv4(),
      role:"user",
      content,
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);
    accumulatedRef.current = "";

    // Find API URL
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
    const url = `${apiUrl}/ai/assistant_app/chat/sse?message=${encodeURIComponent(content)}&chatId=${encodeURIComponent(chatId)}`;

    const es = new EventSource(url);
    eventSourceRef.current = es;

    es.onmessage = (event) => {
      // Skip keepalive comments
      if (event.type === "message" && event.data) {
        accumulatedRef.current += event.data;
        // Update last AI message in place
        setMessages((prev) => {
          const updated = [...prev];
          const last = updated[updated.length - 1];
          if (last?.role === "assistant") {
            updated[updated.length - 1] = { ...last, content: accumulatedRef.current };
          } else {
            updated.push({
              id: uuidv4(),
              role: "assistant",
              content: accumulatedRef.current,
              timestamp: Date.now(),
            });
          }
          return updated;
        });
      }
    };

    es.onerror = () => {
      es.close();
      setIsLoading(false);
      // Save to localStorage
      const finalMessages = [...messagesRef.current, userMsg];
      const finalContent = accumulatedRef.current;
      if (finalContent) {
        finalMessages.push({
          id: uuidv4(),
          role: "assistant",
          content: finalContent,
          timestamp: Date.now(),
        });
      }
      let session = getSession(chatId);
      if (!session) {
        session = createSession(chatId, content);
      }
      session.messages = finalMessages;
      session.updateAt = Date.now();
      saveSession(session);
      refreshSessions();
    };
  }, [refreshSessions]);

  const stop = useCallback(() => {
    eventSourceRef.current?.close();
    setIsLoading(false);
  }, []);

  const loadSession = useCallback((chatId: string) => {
    chatIdRef.current = chatId;
    setCurrentChatId(chatId);
    const session = getSession(chatId);
    setMessages(session?.messages || []);
  }, []);

  const newSession = useCallback(() => {
    chatIdRef.current = null;
    setCurrentChatId(null);
    setMessages([]);
    setError(null);
  }, []);

  const deleteSession = useCallback((id: string) => {
    deleteSession(id);
    if (currentChatId === id) {
      newSession();
    }
    refreshSessions();
  }, [currentChatId, newSession, refreshSessions]);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    stop,
    loadSession,
    currentChatId,
    sessions,
    newSession,
    deleteSession,
  };
}
```

---

### Task 4: Create chat UI components

**Files:**
- Create: `src/components/chat/AIMessage.tsx`
- Create: `src/components/chat/HumanMessage.tsx`
- Create: `src/components/chat/ChatInput.tsx`
- Create: `src/components/chat/MessageList.tsx`
- Create: `src/components/chat/ChatHistory.tsx`
- Create: `src/components/chat/ChatWindow.tsx`

- [ ] **Step 1: Create AIMessage.tsx**

```tsx
"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export function AIMessage({ content }: { content: string }) {
  if (!content) return null;
  return (
    <div className="mr-auto flex w-full items-start gap-2">
      <div className="flex w-full flex-col gap-2">
        <div className="prose prose-sm max-w-none py-1">
          <ReactMarkdown remarkPlugins=[remarkGfm]}>{content}</ReactMarkdown>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create HumanMessage.tsx**

```tsx
export function HumanMessage({ content }: { content: string }) {
  return (
    <div className="ml-auto flex items-center gap-2">
      <div className="flex flex-col gap-2">
        <p className="bg-primary text-primary-foreground ml-auto w-fit rounded3xl px-4 py-2 text-right whitespace-pre-wrap">
          {content}
        </p.>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create ChatInput.tsx**

```tsx
"use client";

import { useState, FormEvent, KeyboardEvent } from "react";
import { Button } from "@/componnets/iu/button";
import { LoaderCircle, Send } from "lucide-react";

export function ChatInput({
  onSend,
  isLoading,
  onStop,
}: {
  onSend: (messaget: string) => void;
  isLoading: boolean;
  onStop: () => void;
}) {
  const [input, setInput] = useState("");

  const handleSubmit = (e: FormEent) => {
    e.prevenDefault();
    if (!input.trim()) return;
    onSend(input.trim());
    setInput("");
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preveDefault();
      handleSubmit(e as any);
    }
  };

  return (
    <form onSubmit={handleSubmit} class Name="flex items-end gap-2">
      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Type your message..."
        className="flex-1 resize-none rounded-2xl border p-3 outline-none ring-0 focus:ring-0"
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
```

- [ ] **Step 4: Create MessageList.tsx**

```tsx
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
```

- [ ] **Step 5: Create ChatHistory.tsx**

```tsx
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
```

- [ ] **Step 6: Create ChatWindow.tsx**

```tsx
"use client";

import { useEffect } from "react";
import { useChat } from "@/hooks/useChat";
import { ChatHistory } from "./ChatHistory";
import { MessageList } from "./MessageList";
import { ChatInput } from "./ChatInput";
import { Button } from "@/components/ui/button";
import { MessageSquarePlus, PanelRightClose, PanelRightOpen } from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";

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
    deleteSession,
  } = useChat();

  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    // Load sessions on mount
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
            onDelete={deleteSession}
          />
        </div>
      </motion.div>

      {/* Main area */}
      <div className="flex flex-1 flex-col">
        {/* Top bar */}
        <div className="flex items-center justify-between border-b px-4 py-2">
          <div className="flex items-center gap-2">
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
          </div>
          <h1 className="text-lg font-semibold">Support Bot</h1>
          <div className="w-10" /<!- spacer */}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px=4 py-8"
          <div className="mx-auto max-w-3xl"
            {messageslenght === 0 && !isLoding ? (
              <div class Name="mt-[25vh] text-center text-muted-foreground">
                <p`className="text=2xl font-semibold">Support Bot</p>
                <p>How can I help you today?</p>
              </div>
            ) : null}
            <MessageList messages={messages} isLoading={isLoading} />
          </divdiv>
        </div,/>

        {/* Input */}
        <div className="border-t p-4"
          <div className="mx-auto max-w-3xl">
            <ChatInput onSend={sendMessage} isLoading={isLoading} onStp={stop} />
          </div>        </div>
      </div>
    </div>  );
}
```

---

### Task 5: Rewrite layout and page

**Files:**
- Modify: `src/app/layout.tsx`
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Simplify layout.tsx**

```ts
import type { Metadata } from "next";
import "./globals.css";
import { Inter } from "next/font/google";
import React from "react";

const inter = Inter({
  subsets: ["latin"],
  preload: true,
  display: "swap",
});

export const metadata: Metadata = {
  title: "Support Bot",
  descrition: "AI-powered customer support chatbot",};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
      </body>
    </html>
  );
}
```

- []**Step 2: Rewrite page.tsx**

```tsx
"use client";

import { ChatWindow } from "@/components/chat/ChatWindow";

export default function HomePage() {
  return <ChatWindow />;}
```

---

### Task 6: Create document upload page

**Files:**
- Create: `src/components/documents/UploadPanel.tsx`
- Create: `src/app/documents/page.tsx`

- [ ] **Step 1: Create UploadPanel.tsx**

```tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Upload, FileText, Braces } from "lucide-react";

type UploadMode = "string" | "file" | "markdown" | "json-basic" | "json-fields" | "json-pointer";

export function UploadPanel() {
  const [mode, setMode] = useStae<UploadMode>("file");
  const [textContent, setTextConent] = useState("");
  const [fields, setFields] = useState("");
  const [pointer, setPonter] = useStat("");
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://ocalhost:8080";

  const handleFileUplad = async (e: Reac.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const endpointMap: Record<string, string> = {
        file: "/document/upload/file",
        markdown: "/document/upload/markdown",
        "json-basic": "/document/upload/ison/basic",
      };

      let url = `${apiUrl}${endpointPp[mode] || "/document/upload/file"}`;

      if (mode === "json-fields") {
        url += `?fields=${encdeURIComponet(fields)}`;
        formData.append("fields", fields);
      }
      if (mode === "json-pointer") {
        url += `?pointer=${encodeURIComponent(pointer)}`;
      }

      const res = await fetch(url, { method: "POST", body: formData });
      const data = await res.json();
      setResult(JSON.stringify(data, null, 2);
      if (data.success) toast.success("Upload successful");
      else toast.error("Uplad failed: " + data.message);
    } catch (err: any) {
      toast.error("Uplad error: " + err.message);
    } finally {
      setLoading(false);
    }
  });

  const handleStringSu mit = async () => {
    if (!textContent.trim()) return;
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch(`${apiUrl}/document/upload/string`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: textContent,
      });
      const data = await res.json();
      setResult(JSON.stringify(data, null, 2));
      if (data.success) toast.success("Uplad successful");
    } catch (err: any) {
      toast.error("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-semibold">Document Upload</h1>

      {/* Mode selector */}
      <div className="flex flex-wrap gap-2">
        {[
          { value: "string", label: "Plain Text", icon: FileText },
          { value: "file", label: "General File", icon: Upload },
          { value: "markdown", label: "Markdown", icon: FileText },
          { value: "json-basic", label: "JSON (Basic)", icon: Braces },
          { value: "json-fields", label: "JSON (Fields)", icon: Braces },
          { value: "json-pointer", label: "JSON (Pointer)", icon: Braces },
        ].map(({ value, label, icon: Icon }) => (
          <Button
            key={value}
            variant={mode === value ? "default" : "outline"}
            size="sm"
            onClick={() => setMode(value as UploadMode)}
          >
            <Icon className="mr-1 h-4 w-4" />
            {label}
          </Button>
        ))}
      </div>

      {/* Content area */}
      <div className="rounded-lg border p-4">
        {mode === "string" ? (
          <div className="space-y-2">
            <textarea
              value={textContent}
              onChange={(e) => setTextContent(e.target.value)}
              placeholder="Enter plain text content..."
              className="min-h-[200px] w-full resize-none rounded border p-3 outline-none"
            />
            <Button onClick={handleStringSubmit} disabled={loading}>
              {loading ? "Uploading..." : "Upload Text"}
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {mode === "json-fields" && (
              <Input
                value={fields}
                onChange={(e) => setFields(e.target.value)}
                placeholder="Field names (comma-separated, e.g. title,content)"
              />
            )}
            {mode === "json-pointer" && (
              <Input
                value={pointer}
                onChange={(e) => setPointer(e.target.value)}
                placeholder="JSON Pointer path (e.g. /data/items)"
              />
            )}
            <Input type="file" onChange={handleFileUpload} />
          </div>
        )}
      </div>

      {/* Result */}
      {result && (
        <pre className="rounded-lg border bg-muted p-4 text-sm overflow-x-auto">
          {result}
        </pre>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Create documents/page.tsx**

```tsx
"use client";

import { UploadPanel } from "@/components/documents/UploadPanel";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { MessageSquare, ShoppingCart } from "lucide-react";

export default function DocumentsPage() {
  return (
    <div className="min-h-screen">
      <nav className="flex items-center justify-between border-b px-4 py-2">
        <div className="flex items-center gap-2">
          <Link href="/">
            <Button variant="ghost" size="sm">
              <MessageSquare className="mr-1 h-4 w-4" />
              Chat
            </Button>
          </Link>
          <Link href="/documents">
            <Button variant="secondary" size="sm">
              <Upload className="mr-1 h-4 w-4" />
              Documents
            </Button>
          </Link>
          <Link href="/product-info">
            <Button variant="ghost" size="sm">
              <ShoppingCart className="mr-1 h-4 w-4" />
              Product Info
            </Button>
          </Link>
        </div>
        <h1 className="text-lg font-semibold">Support Bot</h1>
        <div className="w-20" />
      </nav>
      <main className="p-6">
        <UploadPanel />
      </main>
    </div>
  );
}
```

---

### Task 7: Create product info extraction page

**Files:**
- Create: `src/app/product-info/page.tsx`

- [ ] **Step 1: Create product-info/page.tsx**

```tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { MessageSquare, Upload } from "lucide-react";
import { toast } from "sonner";

export default function ProductInfoPage() {
  const [input, setInput] = useState("");
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

  const handleExtract = async () => {
    if (!input.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch(
        `${apiUrl}/ai/product_info_app/chat/sync?message=${encodeURIComponent(input)}`,
      );
      if (!res.ok) throw new Error("Request failed");
      const data = await res.json();
      setResult(data);
    } catch (err: any) {
      toast.error("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      <nav className="flex items-center justify-between border-b px-4 py-2">
        <div className="flex items-center gap-2">
          <Link href="/">
            <Button variant="ghost" size="sm">
              <MessageSquare className="mr-1 h-4 w-4" />
              Chat
            </Button>
          </Link>
          <Link href="/documents">
            <Button variant="ghost" size="sm">
              <Upload className="mr-1 h-4 w-4" />
              Documents
            </Button>
          </Link>
          <Link href="/product-info">
            <Button variant="secondary" size="sm">
              <ShoppingCart className="mr-1 h-4 w-4" />
              Product Info
            </Button>
          </Link>
        </div>
        <h1 className="text-lg font-semibold">Support Bot</h1>
        <div className="w-20" />
      </nav>
      <main className="mx-auto max-w-2xl space-y-6 p-6">
        <h1 className="text-2xl font-semibold">Product Info Extraction</h1>

        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Enter text containing product information..."
          className="min-h-[120px] w-full resize-none rounded-lg border p-3 outline-none"
        />
        <Button onClick={handleExtract} disabled={loading}>
          {loading ? "Extracting..." : "Extract Info"}
        </Button>

        {result && (
          <div className="rounded-lg border p-4 space-y-2">
            {Object.entries(result).map(([key, value]) => (
              <div key={key} className="flex gap-2">
                <span className="font-medium capitalize min-w-[100px]">{key}:</span>
                <span>{String(value)}</span>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
```

---

### Task 8: Build verification

- [ ] **Step 1: Typecheck the project**

Run: `pnpm tsc --noEmit`
Expected: No type errors.

- [ ] **Step 2: Build the project**

Run: `pnpm build`
Expected: Build succeeds without errors.

- [ ] **Step 3: Start dev server and verify**

Run: `pnpm dev`
Open: http://localhost:3000
- Verify chat page loads
- Verify sidebar toggle works
- Verify navigation to /documents works
- Verify navigation to /product-info works