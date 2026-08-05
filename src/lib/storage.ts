export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

export interface PptSlide {
  pageNumber: number
  title: string
  subtitle?: string
  bullets: string[]
  contentType: "cover" | "toc" | "text" | "text+chart" | "text+list" | "qa" | "ending"
  content?: string
}

export interface PptOutline {
  slides: PptSlide[]
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
  pptOutline?: PptOutline | null;
}

const SESSIONS_KEY = "chat:sessions";

function readSessions(): ChatSession[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(SESSIONS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeSessions(sessions: ChatSession[]) {
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
}

export function getSessions(): ChatSession[] {
  return readSessions().sort((a, b) => b.updatedAt - a.updatedAt);
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