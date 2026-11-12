import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { AlertTriangle, ArrowUp, Check, Copy, FileText, Image as ImageIcon, Paperclip, X } from "lucide-react";
import type { Message } from "../types";

interface Props {
  messages: Message[];
  pending: null | "base" | "arquivo";
  docsCount: number;
  selectedMessageId: string | null;
  onSend: (text: string, file: File | null) => void;
  onSourceClick: (messageId: string, index: number) => void;
}

const SUGGESTIONS = [
  "Resuma os principais pontos dos documentos da base",
  "Quais procedimentos aparecem nos documentos?",
  "Liste as especificações técnicas citadas",
];

const ACCEPTED = ".pdf,.png,.jpg,.jpeg,.webp";

export default function ChatView({ messages, pending, docsCount, selectedMessageId, onSend, onSourceClick }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [draft, setDraft] = useState("");

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length, pending]);

  return (
    <div className="chat">
      <div className="chat-scroll" ref={scrollRef}>
        {messages.length === 0 ? (
          <EmptyState docsCount={docsCount} onPick={setDraft} />
        ) : (
          <div className="thread">
            {messages.map((m) => (
              <MessageRow
                key={m.id}
                message={m}
                selected={m.id === selectedMessageId}
                onSourceClick={(i) => onSourceClick(m.id, i)}
              />
            ))}
            {pending && <TypingRow mode={pending} />}
          </div>
        )}
      </div>

      <Composer
        draft={draft}
        setDraft={setDraft}
        disabled={pending !== null}
        onSend={onSend}
      />
    </div>
  );
}

function EmptyState({ docsCount, onPick }: { docsCount: number; onPick: (s: string) => void }) {
  return (
    <div className="empty">
      <img src="/logo.svg" alt="" width={48} height={48} />
      <h3>Pergunte à sua base de conhecimento</h3>
      <p className="muted">
        {docsCount > 0
          ? `${docsCount} ${docsCount === 1 ? "documento disponível" : "documentos disponíveis"} para consulta. As respostas citam o arquivo e a página de onde vieram.`
          : "A base ainda está vazia. Adicione PDFs no painel à direita, ou anexe um arquivo para uma análise pontual."}
      </p>
      <div className="suggestions">
        {SUGGESTIONS.map((s) => (
          <button key={s} className="suggestion" onClick={() => onPick(s)}>
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}

function MessageRow({
  message,
  selected,
  onSourceClick,
}: {
  message: Message;
  selected: boolean;
  onSourceClick: (index: number) => void;
}) {
  const [copied, setCopied] = useState(false);

  if (message.role === "user") {
    return (
      <div className="msg msg-user">
        <div className="msg-user-bubble">
          {message.attachment && (
            <div className="attachment-chip">
              {/\.(png|jpe?g|webp)$/i.test(message.attachment) ? <ImageIcon size={13} /> : <FileText size={13} />}
              {message.attachment}
            </div>
          )}
          <p>{message.content}</p>
        </div>
      </div>
    );
  }

  const fontes = message.fontes ?? [];

  return (
    <div className={`msg msg-ai ${message.error ? "is-error" : ""} ${selected ? "is-selected" : ""}`}>
      <div className="msg-avatar">
        {message.error ? <AlertTriangle size={16} /> : <img src="/logo.svg" alt="" width={28} height={28} />}
      </div>
      <div className="msg-body">
        <div className="markdown">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
        </div>

        {fontes.length > 0 && (
          <div className="sources-row">
            <span className="sources-label">Fontes</span>
            {fontes.map((f, i) => (
              <button key={i} className="source-chip" onClick={() => onSourceClick(i)} title="Ver trecho no painel">
                <span className="source-num">{i + 1}</span>
                <span className="source-file">{f.arquivo}</span>
                {f.pagina ? <span className="source-page">p.{f.pagina}</span> : null}
              </button>
            ))}
          </div>
        )}

        {!message.error && (
          <div className="msg-actions">
            <button
              className="icon-btn icon-btn-sm"
              title="Copiar resposta"
              onClick={() => {
                navigator.clipboard?.writeText(message.content).then(() => {
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1500);
                });
              }}
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function TypingRow({ mode }: { mode: "base" | "arquivo" }) {
  return (
    <div className="msg msg-ai">
      <div className="msg-avatar">
        <img src="/logo.svg" alt="" width={28} height={28} />
      </div>
      <div className="msg-body typing">
        <span className="dots">
          <i />
          <i />
          <i />
        </span>
        <span className="muted small">{mode === "base" ? "Consultando a base de conhecimento…" : "Analisando o arquivo…"}</span>
      </div>
    </div>
  );
}

function Composer({
  draft,
  setDraft,
  disabled,
  onSend,
}: {
  draft: string;
  setDraft: (s: string) => void;
  disabled: boolean;
  onSend: (text: string, file: File | null) => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const textRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const el = textRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 200) + "px";
  }, [draft]);

  const canSend = draft.trim().length > 0 && !disabled;

  function submit() {
    if (!canSend) return;
    onSend(draft.trim(), file);
    setDraft("");
    setFile(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  function handleKey(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  }

  return (
    <div className="composer-wrap">
      <div className="composer">
        {file && (
          <div className="composer-attachment">
            <FileText size={14} />
            <span>{file.name}</span>
            <span className="muted small">análise pontual, não vai pra base</span>
            <button className="icon-btn icon-btn-sm" onClick={() => setFile(null)} title="Remover anexo">
              <X size={14} />
            </button>
          </div>
        )}
        <div className="composer-row">
          <button
            className="icon-btn"
            title="Anexar arquivo só para esta pergunta (PDF ou imagem)"
            onClick={() => fileRef.current?.click()}
          >
            <Paperclip size={18} />
          </button>
          <input
            ref={fileRef}
            type="file"
            accept={ACCEPTED}
            hidden
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
          <textarea
            ref={textRef}
            rows={1}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKey}
            placeholder={file ? `Pergunte sobre ${file.name}…` : "Pergunte algo sobre os documentos da base…"}
          />
          <button className="send-btn" onClick={submit} disabled={!canSend} title="Enviar (Enter)">
            <ArrowUp size={18} />
          </button>
        </div>
      </div>
      <p className="composer-hint">
        Enter envia · Shift+Enter quebra linha · Sem anexo, a resposta vem da base de conhecimento
      </p>
    </div>
  );
}
