import type { AccessLevel, Fonte, KnowledgeDoc } from "./types";

export const API_URL: string = import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8000";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, init);
  } catch {
    throw new Error("Não foi possível conectar ao backend. Verifique se o servidor está rodando.");
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.detail ?? `Erro ${response.status} ao chamar ${path}`);
  }
  return data as T;
}

export function checkHealth() {
  return request<{ status: string; documentos_na_base: number }>("/");
}

export function login(email: string, password: string, accessLevel: AccessLevel) {
  return request<{ message: string; accessLevel: AccessLevel }>("/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, accessLevel }),
  });
}

export function ask(pergunta: string, arquivo?: File | null) {
  const form = new FormData();
  form.append("pergunta", pergunta);
  if (arquivo) form.append("arquivo", arquivo);
  return request<{ resposta: string; fontes: Fonte[] }>("/analisar", { method: "POST", body: form });
}

export function listDocuments() {
  return request<{ documentos: KnowledgeDoc[] }>("/documentos");
}

export function uploadDocument(arquivo: File) {
  const form = new FormData();
  form.append("arquivo", arquivo);
  return request<{ mensagem: string; arquivo: string; paginas: number; chunks: number }>("/alimentar-ia", {
    method: "POST",
    body: form,
  });
}

export function deleteDocument(arquivo: string) {
  return request<{ status: string }>(`/documentos/${encodeURIComponent(arquivo)}`, { method: "DELETE" });
}
