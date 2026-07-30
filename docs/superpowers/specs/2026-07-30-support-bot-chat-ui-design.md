# Support Bot Chat UI — Rewrite Design

## Objective

Rewrite `agent-chat-ui` (LangChain's agent chat interface) to connect directly to the `support-bot-master` Java backend, removing all LangGraph-specific features while preserving the chat UI layout. Add document management and product info extraction pages.

## Dependencies & Cleanup

### Remove packages
- `@langchain/core`, `@langchain/langgraph`, `@langchain/langgraph-sdk`
- `langgraph-nextjs-api-passthrough`
- `nuqs`
- `recharts`, `rehype-katex`, `remark-math`, `katex`
- `react-syntax-highlighter`
- `use-stick-to-bottom`

### Keep packages
`framer-motion`, `lucide-react`, `react-markdown`, `sonner`, `uuid`, `clsx`, `tailwind-merge`, `class-variance-authority`, `date-fns`, `remark-gfm`

### Delete files
- `src/providers/` (Stream, Thread, client)
- `src/components/thread/agent-inbox/`
- `src/components/thread/artifact.tsx`
- `src/components/thread/messages/tool-calls.tsx`
- `src/components/thread/messages/generic-interrupt.tsx`
- `src/components/thread/messages/shared.tsx`
- `src/lib/agent-inbox-interrupt.ts`, `ensure-tool-responses.ts`, `multimodal-utils.ts`, `api-key.tsx`
- `src/hooks/use-file-upload.tsx`
- `src/components/icons/`
- `src/app/api/`

## Architecture

```
src/
├── app/
│   ├── layout.tsx              # Simplified, no NuqsAdapter
│   ├── page.tsx               # Main chat page
│   ├── documents/
│   │   └── page.tsx            # Document upload management
│   ├── product-info/
│   │   └── page.tsx            # Product info extraction
│   └── globals.css             # Keep existing
├── components/
│   ├── ui/                    # Keep existing shadcn
│   ├── chat/
│   │   ├── ChatWindow.tsx      # Main chat layout (replaces Thread)
│   │   ├── MessageList.tsx     # Message list + auto-scroll
│   │   ├── ChatInput.tsx       # Input box
│   │   ├── AIMessage.tsx       # AI bubble with Markdown
│   │   └── HumanMessage.tsx    # User bubble
│   └── documents/
│       └── UploadPanel.tsx     # Unified upload panel
├── hooks/
│   ├── useChat.ts             # SSE streaming hook
│   └── useMediaQuery.tsx       # Keep
└── lib/
    ├── utils.ts               # Keep cn
    └── storage.ts             # localStorage chat sessions
```

## Routes
- `/` — Chat
- `/documents` — Document upload
- `/product-info` — Product info extraction

## Data Flow

### Chat
1. First message generates `chatId` (UUID)
2. `EventSource` connects to `GET /ai/assistant_app/chat/sse?message={msg}&chatId={id}`
3. `onmessage` appends chunk to current AI message content
4. `oncomplete` saves complete conversation to `localStorage`
5. History click loads chat session from `localStorage` by `chatId`

### localStorage Schema
```
interface ChatSession {
  id: string;       // chatId (UUID)
  title: string;    // First 50 chars of user's first message
  messages: { role: 'user' | 'assistant'; content: string; timestamp: number }[];
  createdAt: number;
}
// key: "chat:sessions" → ChatSession[]
// key: "chat:active" → current chatId
```

### Document Upload
`fetch POST /document/upload/:type` with file/conent → display result

### Product Info
`fetch GET /ai/product_info_app/chat/sync?message=` → render JSON

API base URL from `NEXT_PUBLIC_API_URL=http://localhost:8080`

## UI Layout

### Chat Page
- Top bar: hamburger menu + "Support Bot" title + "New Chat" button
- Left sidebar (300px): session list
- Main area: message list (user right-aligned, AI left-aligned with Markdown), input box at bottom
- Remove: Artifact panel, Tool Calls, Agent Inbox, Branch Switcher, Command Bar, File upload in chat, GitHub link

### Documents Page
- Upload type selector: plain text, general file, Markdown, JSON (basic/fields/pointer)
- Result display (success/error message + document count)

### Product Info Page
- Textarea for input
- "Extract" button
- Structured result display (title, description, price, rating)

## Removed Features
- LangGraph thread management → localStorage-baed session history
- Tool call rendering → not applicable
- Agent inbox (HITL) → not applicable
- Artifact side panel → removed
- Branch switching → removed
- Cha file upload (images/PDF) → document upload moved to dedicated page
- GitHub link → removed