import { useState, useRef, useCallback, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import { ChatMessage, ChatSession, getSessions, getSession, saveSession, deleteSession as deleteStorageSession, createSession } from "@/lib/storage";

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
  removeSession: (id: string) => void;
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

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  const refreshSessions = useCallback(() => {
    setSessions(getSessions());
  }, []);

  const sendMessage = useCallback((content: string) => {
    setError(null);
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
    const url = `${apiUrl}/ai/assistant_app/chat/sse?message=${encodeURIComponent(content)}&chatId=${encodeURIComponent(chatId)}`;

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

    es.onerror = () => {
      es.close();
      setIsLoading(false);
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
      session.updatedAt = Date.now();
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

  const removeSession = useCallback((id: string) => {
    deleteStorageSession(id);
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
    removeSession,
  };
}