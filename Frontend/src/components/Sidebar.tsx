import { useState } from "react";
import { LogOut, MessageSquare, Plus, Trash2 } from "lucide-react";
import type { Conversation, Session } from "../types";

interface Props {
  conversations: Conversation[];
  activeId: string | null;
  session: Session;
  onNew: () => void;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onClearAll: () => void;
  onLogout: () => void;
}

function groupLabel(ts: number) {
  const day = 24 * 60 * 60 * 1000;
  const startOfToday = new Date().setHours(0, 0, 0, 0);
  if (ts >= startOfToday) return "Hoje";
  if (ts >= startOfToday - day) return "Ontem";
  if (ts >= startOfToday - 7 * day) return "Últimos 7 dias";
  return "Mais antigas";
}

export default function Sidebar(props: Props) {
  const { conversations, activeId, session, onNew, onSelect, onDelete, onClearAll, onLogout } = props;
  const [confirmClear, setConfirmClear] = useState(false);

  const visible = conversations.filter((c) => c.messages.length > 0);
  const groups = visible.reduce<Record<string, Conversation[]>>((acc, c) => {
    (acc[groupLabel(c.updatedAt)] ??= []).push(c);
    return acc;
  }, {});

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <img src="/logo.svg" alt="" width={26} height={26} />
        <span>Sapiens</span>
      </div>

      <button className="btn btn-secondary btn-block" onClick={onNew}>
        <Plus size={16} /> Nova conversa
      </button>

      <nav className="conv-list">
        {visible.length === 0 && <p className="muted small pad">Suas conversas aparecem aqui.</p>}
        {Object.entries(groups).map(([label, items]) => (
          <div key={label} className="conv-group">
            <div className="section-label">{label}</div>
            {items.map((c) => (
              <div
                key={c.id}
                className={`conv-item ${c.id === activeId ? "is-active" : ""}`}
                onClick={() => onSelect(c.id)}
              >
                <MessageSquare size={14} className="conv-icon" />
                <span className="conv-title">{c.title}</span>
                <button
                  className="icon-btn icon-btn-sm conv-delete"
                  title="Excluir conversa"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(c.id);
                  }}
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        {visible.length > 0 &&
          (confirmClear ? (
            <div className="confirm-row">
              <span className="small">Apagar todas?</span>
              <button
                className="btn btn-danger btn-xs"
                onClick={() => {
                  onClearAll();
                  setConfirmClear(false);
                }}
              >
                Apagar
              </button>
              <button className="btn btn-ghost btn-xs" onClick={() => setConfirmClear(false)}>
                Cancelar
              </button>
            </div>
          ) : (
            <button className="btn btn-ghost btn-xs" onClick={() => setConfirmClear(true)}>
              <Trash2 size={13} /> Limpar conversas
            </button>
          ))}

        <div className="user-card">
          <div className="avatar">{session.email[0]?.toUpperCase()}</div>
          <div className="user-info">
            <span className="user-email">{session.email}</span>
            <span className={`badge ${session.accessLevel === "premium" ? "badge-accent" : ""}`}>
              {session.accessLevel === "premium" ? "Administrativo" : "Operacional"}
            </span>
          </div>
          <button className="icon-btn" title="Sair" onClick={onLogout}>
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}
