import { useState, type FormEvent } from "react";
import { BarChart3, Loader2, Wrench } from "lucide-react";
import { login } from "../api";
import type { AccessLevel, Session } from "../types";

const LEVELS: { id: AccessLevel; label: string; hint: string; Icon: typeof Wrench }[] = [
  { id: "standard", label: "Operacional", hint: "Consulta a base", Icon: Wrench },
  { id: "premium", label: "Administrativo", hint: "Gerencia a base", Icon: BarChart3 },
];

export default function LoginScreen({ onLogin }: { onLogin: (s: Session) => void }) {
  const [level, setLevel] = useState<AccessLevel>("standard");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email.trim(), password, level);
      onLogin({ email: email.trim(), accessLevel: level });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login">
      <div className="login-grid" aria-hidden />
      <form className="login-card" onSubmit={handleSubmit}>
        <div className="login-brand">
          <img src="/logo.svg" alt="" width={40} height={40} />
          <div>
            <h1>Sapiens</h1>
            <p>Assistente de conhecimento com IA</p>
          </div>
        </div>

        <fieldset className="level-picker">
          <legend>Perfil de acesso</legend>
          {LEVELS.map(({ id, label, hint, Icon }) => (
            <button
              type="button"
              key={id}
              className={`level-option ${level === id ? "is-selected" : ""}`}
              onClick={() => setLevel(id)}
              aria-pressed={level === id}
            >
              <Icon size={16} />
              <span className="level-label">{label}</span>
              <span className="level-hint">{hint}</span>
            </button>
          ))}
        </fieldset>

        <label className="field">
          <span>E-mail</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={level === "premium" ? "admin@sapiens.dev" : "usuario@sapiens.dev"}
            autoComplete="username"
            required
          />
        </label>

        <label className="field">
          <span>Senha</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••"
            autoComplete="current-password"
            required
          />
        </label>

        {error && <div className="form-error">{error}</div>}

        <button className="btn btn-primary btn-block" disabled={loading}>
          {loading ? <Loader2 size={16} className="spin" /> : null}
          Entrar
        </button>
      </form>
    </div>
  );
}
