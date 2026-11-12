export type AccessLevel = "standard" | "premium";

export interface Session {
  email: string;
  accessLevel: AccessLevel;
}

export interface Fonte {
  arquivo: string;
  pagina?: number | null;
  trecho?: string;
}

export interface Message {
  id: string;
  role: "user" | "ai";
  content: string;
  attachment?: string;
  fontes?: Fonte[];
  error?: boolean;
  createdAt: number;
}

export interface Conversation {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: Message[];
}

export interface KnowledgeDoc {
  arquivo: string;
  chunks: number;
}
