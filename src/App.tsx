import { useState } from "react";
import LoginPage from "./pages/LoginPage";
import Dashboard from "./pages/Dashboard";
import StudentPortal from "./pages/StudentPortal";

type View = "login" | "supervisor" | "student";

const PASS = (import.meta.env.VITE_SUPERVISOR_PASSWORD as string) ?? "";
const SESSION_KEY = "nvcc-auth-v2";

export default function App() {
  const [view, setView] = useState<View>(() => {
    const s = sessionStorage.getItem(SESSION_KEY);
    if (s === "supervisor") return "supervisor";
    if (s === "student") return "student";
    return "login";
  });

  const logout = () => {
    sessionStorage.removeItem(SESSION_KEY);
    setView("login");
  };

  if (view === "supervisor") return <Dashboard onLogout={logout} />;
  if (view === "student") return <StudentPortal onBack={logout} />;

  return (
    <LoginPage
      supervisorPassword={PASS}
      onLoginSupervisor={() => {
        sessionStorage.setItem(SESSION_KEY, "supervisor");
        setView("supervisor");
      }}
      onLoginStudent={() => {
        sessionStorage.setItem(SESSION_KEY, "student");
        setView("student");
      }}
    />
  );
}
