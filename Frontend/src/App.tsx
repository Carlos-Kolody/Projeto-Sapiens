import { useState } from "react";
import LoginScreen from "./components/LoginScreen";
import Workspace from "./components/Workspace";
import { loadSession, saveSession, useTheme } from "./storage";
import type { Session } from "./types";

export default function App() {
  const [session, setSession] = useState<Session | null>(loadSession);
  const [theme, toggleTheme] = useTheme();

  const handleLogin = (s: Session) => {
    saveSession(s);
    setSession(s);
  };

  const handleLogout = () => {
    saveSession(null);
    setSession(null);
  };

  if (!session) return <LoginScreen onLogin={handleLogin} />;
  return <Workspace session={session} onLogout={handleLogout} theme={theme} onToggleTheme={toggleTheme} />;
}
