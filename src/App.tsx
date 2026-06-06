import { useState } from "react";
import LoginPage from "./pages/LoginPage";
import Dashboard from "./pages/Dashboard";

type View = "login" | "tracy";

const TRACY_EMAIL = "tracy.mahar@ctstate.edu";
const TRACY_PASS  = import.meta.env.VITE_SUPERVISOR_PASSWORD as string ?? "";
const SESSION_KEY = "nvcc-auth-v2";

export default function App() {
  const [view, setView] = useState<View>(() =>
    sessionStorage.getItem(SESSION_KEY) === "tracy" ? "tracy" : "login"
  );

  const handleLogin = () => {
    sessionStorage.setItem(SESSION_KEY, "tracy");
    setView("tracy");
  };

  const handleLogout = () => {
    sessionStorage.removeItem(SESSION_KEY);
    setView("login");
  };

  if (view === "tracy") {
    return <Dashboard onLogout={handleLogout} />;
  }

  return (
    <LoginPage
      tracyEmail={TRACY_EMAIL}
      tracyPassword={TRACY_PASS}
      onLoginTracy={handleLogin}
    />
  );
}
