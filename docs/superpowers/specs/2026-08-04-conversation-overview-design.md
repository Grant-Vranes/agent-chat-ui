# Conversation Overview - Right Panel Design

## Summary

Add a collapsible right-side panel to the chat UI that displays a flat overview of the conversation. Items include Markdown headings extracted from AI messages and summaries of user messages. Clicking an item scrolls the main chat area to the corresponding position.

## Architecture

### New Files

- `src/lib/headings.ts` — heading extraction and overview item generation utilities
- `src/components/chat/ConversationOverview.tsx` — the right panel component (collapsible sidebar + expanded list)

### Modified Files

- `src/components/chat/AIMessage.tsx` — add `id` attribute to rendered `<h2>` and `<h3>` elements for scroll anchoring
- `src/components/chat/MessageList.tsx` — add `id` to message wrapper `<div>` for user-message scroll targets
- `src/components/chat/ChatWindow.tsx` — add the right panel alongside existing left sidebar and center area

## Data Model

```typescript
interface HeadingItem {
  id: string;        // "heading-{msgId}-{slug}"
  text: string;      // heading text
  level: number;     // 2 or 3
  msgId: string;     // parent message id
}

interface OverviewItem {
  id: string;        // anchor id
  text: string;      // display text
  type: "user" | "ai-heading" | "ai-summary";
  msgId: string;
}
```

## Component Design

### headings.ts

- `extractHeadings(content, msgId)` — regex `/^(#{2,3})\s+(.+)$/gm` → `HeadingItem[]`
- `getOverview(messages)` — iterate all messages, produce flat `OverviewItem[]`
  - user messages: first 50 chars as text
  - AI messages: extract headings; if none, first 80 chars as summary
- ID generation: `heading-{msgId}-{text.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}`

### AIMessage.tsx

Add custom `h2`/`h3` renderers in react-markdown `components`:
- Extract text children
- Generate id using same algorithm as `headings.ts`
- Render `<h2 id={id}>` or `<h3 id={id}>`

### MessageList.tsx

Add `id={msg.id}` to the outer `<motion.div>` wrapping each message.

### ConversationOverview.tsx

- **Collapsed state**: narrow bar (~40px) on the right side with a clickable icon (e.g., `List` or `Bookmark` icon)
- **Expanded state**: 260px panel sliding in from the right using framer-motion
  - Header "Overview"
  - Flat list of `OverviewItem` entries
  - Each entry shows a small dot/indicator for type (user vs AI heading)
  - Click → `document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })`
  - IntersectionObserver updates active item highlight
- Toggle via `useState`: click icon to expand, click close button or icon to collapse

### ChatWindow.tsx

Add the right panel:
- `<AnimatePresence>` for expand/collapse animation (mirrors left sidebar pattern)
- Panel positioned after the center flex area
- Pass `messages` to `ConversationOverview`

## Interaction

1. User opens right panel by clicking the collapsed bar icon
2. Panel slides in from right
3. As messages arrive, overview updates (useMemo)
4. User clicks an overview item → main chat scrolls to that heading/message
5. Active item highlighted based on scroll position
6. User clicks close button → panel collapses back to narrow bar

## Edge Cases

- **No headings in any message**: overview shows only user message summaries
- **Empty conversation**: panel shows empty state message
- **Duplicate heading text**: IDs are unique due to `msgId` prefix
- **Streaming messages**: headings appear incrementally; overview updates via useMemo dependency on messages
- **Very long heading**: truncate to ~60 chars with ellipsis