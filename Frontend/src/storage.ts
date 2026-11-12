import { useCallback, useEffect, useState } from "react";
import type { Conversation, Message, Session } from "./types";

const SESSION_KEY = "sapiens-session";
const CONVERSATIONS_KEY = "sapiens-conversations-v2";
const THEME_KEY = "sapiens-theme";

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* armazenamento indisponível: segue só em memória */
  }
}

export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

export const loadSession = () => read<Session | null>(SESSION_KEY, null);
export const saveSession = (s: Session | null) => write(SESSION_KEY, s);

export type Theme = "dark" | "light";
export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => read<Theme>(THEME_KEY, "dark"));
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    write(THEME_KEY, theme);
  }, [theme]);
  return [theme, () => setTheme((t) => (t === "dark" ? "light" : "dark"))] as const;
}

/** Conversas guardadas no navegador (o histórico no servidor fica pra uma próxima etapa). */
export function useConversations() {
  const [conversations, setConversations] = useState<Conversation[]>(() =>
    read<Conversation[]>(CONVERSATIONS_KEY, [])
  );

  useEffect(() => write(CONVERSATIONS_KEY, conversations), [conversations]);

  const create = useCallback((): string => {
    const now = Date.now();
    const conv: Conversation = { id: uid(), title: "Nova conversa", createdAt: now, updatedAt: now, messages: [] };
    setConversations((prev) => [conv, ...prev.filter((c) => c.messages.length > 0)]);
    return conv.id;
  }, []);

  const addMessage = useCallback((convId: string, message: Message) => {
    setConversations((prev) => {
      const exists = prev.some((c) => c.id === convId);
      const base = exists
        ? prev
        : [{ id: convId, title: "Nova conversa", createdAt: Date.now(), updatedAt: Date.now(), messages: [] }, ...prev];
      return base
        .map((c) => {
          if (c.id !== convId) return c;
          const isFirstUserMessage = message.role === "user" && !c.messages.some((m) => m.role === "user");
          const title = isFirstUserMessage
            ? message.content.slice(0, 48) + (message.content.length > 48 ? "…" : "")
            : c.title;
          return { ...c, title, updatedAt: Date.now(), messages: [...c.messages, message] };
        })
        .sort((a, b) => b.updatedAt - a.updatedAt);
    });
  }, []);

  const remove = useCallback((convId: string) => {
    setConversations((prev) => prev.filter((c) => c.id !== convId));
  }, []);

  const clearAll = useCallback(() => setConversations([]), []);

  return { conversations, create, addMessage, remove, clearAll };
}
