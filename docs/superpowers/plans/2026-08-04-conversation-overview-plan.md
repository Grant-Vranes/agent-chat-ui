# Conversation Overview Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a collapsible right-side panel showing a flat conversation overview derived from Markdown headings in AI messages and summaries of user messages.

**Architecture:** Pure client-side solution. A utility extracts headings from message content using regex. AIMessage's react-markdown renderer injects `id` attributes on h2/h3 for scroll anchoring. A new `ConversationOverview` component renders the collapsible panel. MessageList adds `id` on wrappers for user-message targeting.

**Tech Stack:** Next.js 15, React 19, Tailwind CSS, framer-motion, react-markdown, lucide-react

---

### Task 1: Create headings utility

**Files:**
- Create: `src/lib/headings.ts`

- [ ] **Step 1: Write the utility**

```typescript
import { ChatMessage } from "./storage";

export interface HeadingItem {
  id: string;
  text: string;
  level: number;
  msgId: string;
}

export interface OverviewItem {
  id: string;
  text: string;
  type: "user" | "ai-heading" | "ai-summary";
  msgId: string;
}

function headingId(msgId: string, text: string): string {
  const slug = text
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9\u4e00-\u9fff\u3040-\u309f\u30a0-\u30ff-]/g, "");
  return `heading-${msgId}-${slug}`;
}

export function extractHeadings(content: string, msgId: string): HeadingItem[] {
  const items: HeadingItem[] = [];
  const regex = /^(#{2,3})\s+(.+)$/gm;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(content)) !== null) {
    const level = match[1].length as 2 | 3;
    const text = match[2].trim();
    items.push({
      id: headingId(msgId, text),
      text,
      level,
      msgId,
    });
  }
  return items;
}

export function getOverview(messages: ChatMessage[]): OverviewItem[] {
  const items: OverviewItem[] = [];
  for (const msg of messages) {
    if (msg.role === "user") {
      const text = msg.content.length > 50 ? msg.content.slice(0, 50) + "…" : msg.content;
      items.push({
        id: `msg-${msg.id}`,
        text,
        type: "user",
        msgId: msg.id,
      });
    } else {
      const headings = extractHeadings(msg.content, msg.id);
      if (headings.length > 0) {
        for (const h of headings) {
          items.push({ ...h, type: "ai-heading" });
        }
      } else {
        const text = msg.content.length > 80 ? msg.content.slice(0, 80) + "…" : msg.content;
        items.push({
          id: `msg-${msg.id}`,
          text,
          type: "ai-summary",
          msgId: msg.id,
        });
      }
    }
  }
  return items;
}
```

- [ ] **Step 2: Verify build**

Run: `npm run build` (or just check TypeScript with `npx tsc --noEmit`)

---

### Task 2: Add id to message wrappers in MessageList

**Files:**
- Modify: `src/components/chat/MessageList.tsx`

- [ ] **Step 1: Add id to motion.div wrapper**

Find line 26 (`key={msg.id}`) and add `id={`msg-${msg.id}`}`:

```typescript
<motion.div
  key={msg.id}
  id={`msg-${msg.id}`}
  initial={{ opacity: 0, y: 12 }}
  animate={{ opacity: 1, y: 0 }}
  exit={{ opacity: 0, y: -12 }}
  transition={{ duration: 0.3, ease: "easeOut" }}
>
```

---

### Task 3: Inject heading IDs in AIMessage markdown rendering

**Files:**
- Modify: `src/components/chat/AIMessage.tsx`

- [ ] **Step 1: Add h2/h3 custom renderers to the components map**

Find the `components` object (around line 48). After the `hr()` entry, add h2 and h3 renderers:

```typescript
  h2({ children, ...props }) {
    const text = extractHeadingText(children);
    const id = text ? headingId(props.id || "", text) : undefined;
    return <h2 id={id} className="scroll-mt-20" {...props}>{children}</h2>;
  },
  h3({ children, ...props }) {
    const text = extractHeadingText(children);
    const id = text ? headingId(props.id || "", text) : undefined;
    return <h3 id={id} className="scroll-mt-20" {...props}>{children}</h3>;
  },
```

Also add helper functions before the `components` definition:

```typescript
function extractHeadingText(children: React.ReactNode): string {
  let text = "";
  React.Children.forEach(children, (child) => {
    if (typeof child === "string") text += child;
    else if (typeof child === "number") text += String(child);
  });
  return text.trim();
}

function headingId(msgId: string, text: string): string {
  const slug = text
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9\u4e00-\u9fff\u3040-\u309f\u30a0-\u30ff-]/g, "");
  return `heading-${msgId}-${slug}`;
}
```

- [ ] **Step 2: Add React import at top** (if not already present)

The file already has `import { useState, useCallback } from "react";` — change to `import React, { useState, useCallback } from "react";`.

---

### Task 4: Create ConversationOverview component

**Files:**
- Create: `src/components/chat/ConversationOverview.tsx`

- [ ] **Step 1: Write the component**

```typescript
"use client";

import { useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChatMessage } from "@/lib/storage";
import { getOverview, OverviewItem } from "@/lib/headings";
import { List, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ConversationOverview({
  messages,
  isOpen,
  onToggle,
}: {
  messages: ChatMessage[];
  isOpen: boolean;
  onToggle: () => void;
}) {
  const items = useMemo(() => getOverview(messages), [messages]);

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
          animate={{ width: 260, opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="h-full border-l border-border bg-background overflow-hidden flex-shrink-0"
        >
          <div className="flex h-full w-[260px] flex-col">
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
              {items.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center mt-8">
                  No messages yet
                </p>
              ) : (
                <nav className="flex flex-col gap-0.5">
                  {items.map((item) => (
                    <OverviewItemRow key={item.id} item={item} onClick={handleClick} />
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

function OverviewItemRow({
  item,
  onClick,
}: {
  item: OverviewItem;
  onClick: (id: string) => void;
}) {
  const dotColor =
    item.type === "user"
      ? "bg-primary"
      : item.type === "ai-heading"
        ? "bg-accent"
        : "bg-muted-foreground/50";

  return (
    <button
      onClick={() => onClick(item.id)}
      className="flex items-start gap-2 rounded-md px-2 py-1.5 text-left text-xs transition-colors hover:bg-muted w-full"
    >
      <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${dotColor}`} />
      <span className="text-muted-foreground leading-relaxed line-clamp-2">
        {item.text}
      </span>
    </button>
  );
}
```

---

### Task 5: Add right panel to ChatWindow

**Files:**
- Modify: `src/components/chat/ChatWindow.tsx`

- [ ] **Step 1: Import ConversationOverview**

Add import after the existing ChatInput import:

```typescript
import { ConversationOverview } from "./ConversationOverview";
```

- [ ] **Step 2: Add state for right panel**

Add after `const [sidebarOpen, setSidebarOpen] = useState(true);`:

```typescript
const [overviewOpen, setOverviewOpen] = useState(false);
```

- [ ] **Step 3: Add the right panel before the closing `</div>` of the outer flex container**

After the center content div (the one with `flex-1 flex-col min-w-0`) closes (line 102 in the original), add before the final `</div>`:

```typescript
      <ConversationOverview
        messages={messages}
        isOpen={overviewOpen}
        onToggle={() => setOverviewOpen((v) => !v)}
      />
```

The final layout should be:
```
<div class="flex h-screen ...">
  <LeftSidebar />
  <div class="flex-1 flex-col min-w-0">
    <NavBar />
    <main />
    <ChatInput />
  </div>
  <ConversationOverview />
</div>
```

---

### Task 6: Build and verify

- [ ] **Step 1: Run the build**

```bash
npm run build
```

Expected: clean build without errors. If there are type errors, fix them.

- [ ] **Step 2: Run lint**

```bash
npm run lint
```

Expected: no lint errors.