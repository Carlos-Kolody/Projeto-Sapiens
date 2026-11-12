import { useEffect, useRef, useState, type DragEvent } from "react";
import { CheckCircle2, FileText, Loader2, Lock, RefreshCw, Trash2, UploadCloud, X, XCircle } from "lucide-react";
import { deleteDocument, uploadDocument } from "../api";
import type { KnowledgeDoc, Message } from "../types";

interface Props {
  docs: KnowledgeDoc[];
  docsError: string | null;
  canManage: boolean;
  sourceMessage: Message | null;
  highlightedSource: number | null;
  onRefresh: () => Promise<void> | void;
  onClose: () => void;
}

type UploadState =
  | { status: "idle" }
  | { status: "uploading"; name: string }
  | { status: "done"; text: string }
  | { status: "error"; text: string };

export default function KnowledgePanel({
  docs,
  docsError,
  canManage,
  sourceMessage,
  highlightedSource,
  onRefresh,
  onClose,
}: Props) {
  const [upload, setUpload] = useState<UploadState>({ status: "idle" });
  const [dragging, setDragging] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const sourceRefs = useRef<(HTMLDivElement | null)[]>([]);

  const fontes = sourceMessage?.fontes ?? [];
  const citedFiles = new Set(fontes.map((f) => f.arquivo));

  useEffect(() => {
    if (highlightedSource !== null) {
      sourceRefs.current[highlightedSource]?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [highlightedSource, sourceMessage]);

  async function handleFiles(files: FileList | null) {
    const pdfs = Array.from(files ?? []).filter((f) => f.name.toLowerCase().endsWith(".pdf"));
    if (pdfs.length === 0) {
      setUpload({ status: "error", text: "Só PDFs podem ir para a base." });
      return;
    }
    for (const file of pdfs) {
      setUpload({ status: "uploading", name: file.name });
      try {
        const res = await uploadDocument(file);
        setUpload({ status: "done", text: res.mensagem });
      } catch (err) {
        setUpload({ status: "error", text: `${file.name}: ${(err as Error).message}` });
        break;
      }
    }
    await onRefresh();
  }

  function onDrop(e: DragEvent) {
    e.preventDefault();
    setDragging(false);
    if (canManage && upload.status !== "uploading") handleFiles(e.dataTransfer.files);
  }

  async function handleDelete(name: string) {
    setConfirmDelete(null);
    try {
      await deleteDocument(name);
    } finally {
      await onRefresh();
    }
  }

  const totalChunks = docs.reduce((n, d) => n + d.chunks, 0);

  return (
    <aside className="panel">
      <header className="panel-header">
        <h3>Base de conhecimento</h3>
        <button className="icon-btn icon-btn-sm" onClick={() => onRefresh()} title="Atualizar lista">
          <RefreshCw size={14} />
        </button>
        <button className="icon-btn icon-btn-sm" onClick={onClose} title="Fechar painel">
          <X size={14} />
        </button>
      </header>

      <section className="panel-section">
        <div className="stats">
          <div>
            <strong>{docs.length}</strong>
            <span>documentos</span>
          </div>
          <div>
            <strong>{totalChunks}</strong>
            <span>trechos indexados</span>
          </div>
        </div>

        {canManage ? (
          <div
            className={`dropzone ${dragging ? "is-dragging" : ""} ${upload.status === "uploading" ? "is-busy" : ""}`}
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            onClick={() => upload.status !== "uploading" && fileRef.current?.click()}
          >
            {upload.status === "uploading" ? (
              <>
                <Loader2 size={18} className="spin" />
                <span>
                  Indexando <b>{upload.name}</b>…
                </span>
              </>
            ) : (
              <>
                <UploadCloud size={18} />
                <span>
                  Arraste PDFs aqui ou <u>clique para enviar</u>
                </span>
              </>
            )}
            <input
              ref={fileRef}
              type="file"
              accept=".pdf"
              multiple
              hidden
              onChange={(e) => {
                handleFiles(e.target.files);
                e.target.value = "";
              }}
            />
          </div>
        ) : (
          <div className="notice">
            <Lock size={14} />
            <span>Só o perfil Administrativo adiciona ou remove documentos.</span>
          </div>
        )}

        {upload.status === "done" && (
          <div className="feedback is-ok">
            <CheckCircle2 size={14} /> {upload.text}
          </div>
        )}
        {upload.status === "error" && (
          <div className="feedback is-error">
            <XCircle size={14} /> {upload.text}
          </div>
        )}
        {docsError && <div className="feedback is-error">{docsError}</div>}

        <ul className="doc-list">
          {docs.length === 0 && !docsError && <li className="muted small pad">Nenhum documento na base ainda.</li>}
          {docs.map((d) => (
            <li key={d.arquivo} className={`doc-item ${citedFiles.has(d.arquivo) ? "is-cited" : ""}`}>
              <FileText size={15} className="doc-icon" />
              <div className="doc-info">
                <span className="doc-name" title={d.arquivo}>
                  {d.arquivo}
                </span>
                <span className="doc-meta">{d.chunks} trechos</span>
              </div>
              {canManage &&
                (confirmDelete === d.arquivo ? (
                  <span className="confirm-row">
                    <button className="btn btn-danger btn-xs" onClick={() => handleDelete(d.arquivo)}>
                      Remover
                    </button>
                    <button className="btn btn-ghost btn-xs" onClick={() => setConfirmDelete(null)}>
                      Não
                    </button>
                  </span>
                ) : (
                  <button
                    className="icon-btn icon-btn-sm doc-delete"
                    title="Remover da base"
                    onClick={() => setConfirmDelete(d.arquivo)}
                  >
                    <Trash2 size={13} />
                  </button>
                ))}
            </li>
          ))}
        </ul>
      </section>

      <section className="panel-section panel-sources">
        <div className="section-label">Fontes da resposta</div>
        {fontes.length === 0 ? (
          <p className="muted small">
            Quando a IA responder usando a base, os trechos usados aparecem aqui. Clique numa fonte da resposta para
            destacá-la.
          </p>
        ) : (
          <div className="source-cards">
            {fontes.map((f, i) => (
              <div
                key={i}
                ref={(el) => {
                  sourceRefs.current[i] = el;
                }}
                className={`source-card ${highlightedSource === i ? "is-highlighted" : ""}`}
              >
                <div className="source-card-head">
                  <span className="source-num">{i + 1}</span>
                  <span className="source-file" title={f.arquivo}>
                    {f.arquivo}
                  </span>
                  {f.pagina ? <span className="source-page">p.{f.pagina}</span> : null}
                </div>
                {f.trecho && <p className="source-snippet">{f.trecho}</p>}
              </div>
            ))}
          </div>
        )}
      </section>
    </aside>
  );
}
