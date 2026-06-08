import { useState } from "react";
import LoginPage from "./pages/LoginPage";
import Dashboard from "./pages/Dashboard";

const PASS = (import.meta.env.VITE_SUPERVISOR_PASSWORD as string) || "WAVE2024";
const SESSION_KEY = "nvcc-auth-v2";

export default function App() {
  const [authed, setAuthed] = useState(() => sessionStorage.getItem(SESSION_KEY) === "supervisor");

  const logout = () => {
    sessionStorage.removeItem(SESSION_KEY);
    setAuthed(false);
  };

  if (authed) return <Dashboard onLogout={logout} />;

  return (
    <LoginPage
      supervisorPassword={PASS}
      onLogin={() => {
        sessionStorage.setItem(SESSION_KEY, "supervisor");
        setAuthed(true);
      }}
    />
  );
}
