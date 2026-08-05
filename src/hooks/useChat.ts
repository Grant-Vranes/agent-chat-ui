import { useState, useRef, useCallback, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import { ChatMessage, ChatSession, getSessions, getSession, saveSession, deleteSession as deleteStorageSession, createSession, renameSession as renameStorageSession, PptOutline } from "@/lib/storage";

export interface UseChatReturn {
  messages: ChatMessage[];
  isLoading: boolean;
  stopped: boolean;
  error: string | null;
  sendMessage: (content: string) => void;
  stop: () => void;
  loadSession: (chatId: string) => void;
  currentChatId: string | null;
  sessions: ChatSession[];
  newSession: () => void;
  removeSession: (id: string) => void;
  renameSession: (id: string, newTitle: string) => void;
  pptOutline: PptOutline | null;
  hasOutline: boolean;
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

  const [pptOutline, setPptOutline] = useState<PptOutline | null>(null);
  const [hasOutline, setHasOutline] = useState(false);
  const [stopped, setStopped] = useState(false);
  const pptOutlineRef = useRef<PptOutline | null>(null);

  useEffect(() => {
    pptOutlineRef.current = pptOutline;
  }, [pptOutline]);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    setSessions(getSessions());
  }, []);

  const refreshSessions = useCallback(() => {
    setSessions(getSessions());
  }, []);

  const sendMessage = useCallback((content: string) => {
    setError(null);
    setStopped(false);
    const chatId = chatIdRef.current || uuidv4();
    chatIdRef.current = chatId;
    setCurrentChatId(chatId);

    const userMsg: ChatMessage = {
      id: uuidv4(),
      role: "user",
      content,
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);
    accumulatedRef.current = "";

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
    const url = `${apiUrl}/api/logistics/chat/sse?message=${encodeURIComponent(content)}&chatId=${encodeURIComponent(chatId)}`;

    const es = new EventSource(url);
    eventSourceRef.current = es;

    es.onmessage = (event) => {
      if (event.data) {
        accumulatedRef.current += event.data;
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

    es.addEventListener("ppt-outline", (event: MessageEvent) => {
      try {
        const outline: PptOutline = JSON.parse(event.data);
        setPptOutline(outline);
        setHasOutline(true);
        pptOutlineRef.current = outline;
      } catch (e) {
        console.error("Failed to parse ppt-outline event", e);
      }
    });

    es.onerror = () => {
      es.close();
      setIsLoading(false);
      const finalMessages = [...messagesRef.current];
      let session = getSession(chatId);
      if (!session) {
        session = createSession(chatId, content);
      }
      session.messages = finalMessages;
      session.pptOutline = pptOutlineRef.current;
      session.updatedAt = Date.now();
      saveSession(session);
      refreshSessions();
    };
  }, [refreshSessions]);

  const stop = useCallback(() => {
    eventSourceRef.current?.close();
    setIsLoading(false);
    setStopped(true);
  }, []);

  const loadSession = useCallback((chatId: string) => {
    chatIdRef.current = chatId;
    setCurrentChatId(chatId);
    const session = getSession(chatId);
    const loaded = session?.messages || [];
    const seen = new Set<string>();
    const deduped = loaded.filter((m) => {
      if (seen.has(m.id)) return false;
      seen.add(m.id);
      return true;
    });
    setMessages(deduped);
    setPptOutline(session?.pptOutline || null);
    setHasOutline(!!session?.pptOutline);
  }, []);

  const newSession = useCallback(() => {
    chatIdRef.current = null;
    setCurrentChatId(null);
    setMessages([]);
    setPptOutline(null);
    setHasOutline(false);
    setError(null);
  }, []);

  const removeSession = useCallback((id: string) => {
    deleteStorageSession(id);
    if (currentChatId === id) {
      newSession();
    }
    refreshSessions();
  }, [currentChatId, newSession, refreshSessions]);

  const renameSession = useCallback((id: string, newTitle: string) => {
    renameStorageSession(id, newTitle);
    refreshSessions();
  }, [refreshSessions]);

  return {
    messages,
    isLoading,
    stopped,
    error,
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
  };
}