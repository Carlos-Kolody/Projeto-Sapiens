import { useCallback, useEffect, useMemo, useState } from "react";
import { Moon, PanelRight, PanelLeft, Sun } from "lucide-react";
import { ask, checkHealth, listDocuments } from "../api";
import { uid, useConversations, type Theme } from "../storage";
import type { KnowledgeDoc, Message, Session } from "../types";
import Sidebar from "./Sidebar";
import ChatView from "./ChatView";
import KnowledgePanel from "./KnowledgePanel";

interface Props {
  session: Session;
  onLogout: () => void;
  theme: Theme;
  onToggleTheme: () => void;
}

export default function Workspace({ session, onLogout, theme, onToggleTheme }: Props) {
  const { conversations, create, addMessage, remove, clearAll } = useConversations();
  const [activeId, setActiveId] = useState<string | null>(() => conversations[0]?.id ?? null);
  const [pending, setPending] = useState<null | "base" | "arquivo">(null);
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  const [highlightedSource, setHighlightedSource] = useState<number | null>(null);
  const [docs, setDocs] = useState<KnowledgeDoc[]>([]);
  const [docsError, setDocsError] = useState<string | null>(null);
  const [online, setOnline] = useState<boolean | null>(null);
  const isWide = () => window.innerWidth > 960;
  const [showSidebar, setShowSidebar] = useState(isWide);
  const [showPanel, setShowPanel] = useState(isWide);

  const isAdmin = session.accessLevel === "premium";
  const active = conversations.find((c) => c.id === activeId) ?? null;

  // Mensagem cujas fontes aparecem no painel: a selecionada ou a última resposta da IA.
  const sourceMessage = useMemo<Message | null>(() => {
    if (!active) return null;
    const selected = active.messages.find((m) => m.id === selectedMessageId);
    if (selected) return selected;
    return [...active.messages].reverse().find((m) => m.role === "ai" && m.fontes?.length) ?? null;
  }, [active, selectedMessageId]);

  const refreshDocs = useCallback(async () => {
    try {
      const { documentos } = await listDocuments();
      setDocs(documentos);
      setDocsError(null);
      setOnline(true);
    } catch (err) {
      setDocsError((err as Error).message);
      setOnline(false);
    }
  }, []);

  useEffect(() => {
    refreshDocs();
    const timer = setInterval(() => {
      checkHealth().then(() => setOnline(true)).catch(() => setOnline(false));
    }, 15000);
    return () => clearInterval(timer);
  }, [refreshDocs]);

  function handleNewChat() {
    setActiveId(create());
    setSelectedMessageId(null);
  }

  function handleSelectConversation(id: string) {
    setActiveId(id);
    setSelectedMessageId(null);
    setHighlightedSource(null);
  }

  async function handleSend(text: string, file: File | null) {
    const convId = activeId ?? create();
    if (!activeId) setActiveId(convId);

    addMessage(convId, {
      id: uid(),
      role: "user",
      content: text,
      attachment: file?.name,
      createdAt: Date.now(),
    });

    setPending(file ? "arquivo" : "base");
    setSelectedMessageId(null);
    setHighlightedSource(null);
    try {
      const { resposta, fontes } = await ask(text, file);
      addMessage(convId, { id: uid(), role: "ai", content: resposta, fontes, createdAt: Date.now() });
      setOnline(true);
    } catch (err) {
      addMessage(convId, {
        id: uid(),
        role: "ai",
        content: (err as Error).message,
        error: true,
        createdAt: Date.now(),
      });
    } finally {
      setPending(null);
    }
  }

  function handleSourceClick(messageId: string, index: number) {
    setSelectedMessageId(messageId);
    setHighlightedSource(index);
    setShowPanel(true);
  }

  return (
    <div className={`workspace ${showSidebar ? "" : "no-sidebar"} ${showPanel ? "" : "no-panel"}`}>
      {showSidebar && (
        <Sidebar
          conversations={conversations}
          activeId={activeId}
          session={session}
          onNew={handleNewChat}
          onSelect={handleSelectConversation}
          onDelete={(id) => {
            remove(id);
            if (id === activeId) setActiveId(null);
          }}
          onClearAll={() => {
            clearAll();
            setActiveId(null);
          }}
          onLogout={onLogout}
        />
      )}

      <main className="main">
        <header className="toolbar">
          <button className="icon-btn" onClick={() => setShowSidebar((v) => !v)} title="Mostrar/ocultar conversas">
            <PanelLeft size={18} />
          </button>
          <h2 className="toolbar-title">{active?.title ?? "Nova conversa"}</h2>
          <span className={`status ${online === false ? "is-offline" : online ? "is-online" : ""}`}>
            <span className="status-dot" />
            {online === false ? "Backend offline" : online ? "Conectado" : "Conectando…"}
          </span>
          <button className="icon-btn" onClick={onToggleTheme} title="Alternar tema">
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button className="icon-btn" onClick={() => setShowPanel((v) => !v)} title="Mostrar/ocultar painel da base">
            <PanelRight size={18} />
          </button>
        </header>

        <ChatView
          messages={active?.messages ?? []}
          pending={pending}
          docsCount={docs.length}
          selectedMessageId={sourceMessage?.id ?? null}
          onSend={handleSend}
          onSourceClick={handleSourceClick}
        />
      </main>

      {showPanel && (
        <KnowledgePanel
          docs={docs}
          docsError={docsError}
          canManage={isAdmin}
          sourceMessage={sourceMessage}
          highlightedSource={highlightedSource}
          onRefresh={refreshDocs}
          onClose={() => setShowPanel(false)}
        />
      )}
    </div>
  );
}
