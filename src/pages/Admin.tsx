import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { getStudents, saveStudents, clearStudents, parseStudentCSV, type Student } from "../lib/students";

const PASSWORD = "NVCC2024";
const AUTH_KEY = "nvcc-admin-auth";

function LoginScreen({ onLogin }: { onLogin: () => void }) {
  const [pw, setPw] = useState("");
  const [err, setErr] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pw === PASSWORD) {
      sessionStorage.setItem(AUTH_KEY, "1");
      onLogin();
    } else {
      setErr(true);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-[#003087] text-white text-2xl font-bold mb-4">N</div>
          <h1 className="text-2xl font-bold text-slate-800">NVCC Admin</h1>
          <p className="text-sm text-slate-500 mt-1">Enter the admin password to continue.</p>
        </div>
        <form onSubmit={submit} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
          <label className="block text-xs font-semibold uppercase tracking-widest text-slate-500 mb-1">Password</label>
          <input
            type="password" autoFocus required
            value={pw} onChange={e => { setPw(e.target.value); setErr(false); }}
            className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-slate-800 focus:outline-none focus:border-[#003087] focus:ring-1 focus:ring-[#003087]/30"
            placeholder="••••••••"
          />
          {err && <p className="mt-2 text-xs text-red-600">Incorrect password.</p>}
          <button type="submit" className="mt-5 w-full bg-[#003087] hover:bg-[#002060] text-white font-semibold rounded-lg py-2.5 text-sm transition">
            Sign in
          </button>
        </form>
        <div className="text-center mt-6">
          <Link to="/" className="text-xs text-slate-400 hover:text-slate-600">← Back to timesheet</Link>
        </div>
      </div>
    </div>
  );
}

export default function Admin() {
  const [authed, setAuthed] = useState(() => sessionStorage.getItem(AUTH_KEY) === "1");
  const [students, setStudents] = useState<Student[]>(() => getStudents());
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [flashMsg, setFlashMsg] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  if (!authed) return <LoginScreen onLogin={() => setAuthed(true)} />;

  const flash = (msg: string) => {
    setFlashMsg(msg);
    setTimeout(() => setFlashMsg(""), 3500);
  };

  const processCSV = (text: string) => {
    const { students: parsed, errors } = parseStudentCSV(text);
    setParseErrors(errors);
    if (parsed.length > 0) {
      saveStudents(parsed);
      setStudents(parsed);
      flash(`✓ Loaded ${parsed.length} student${parsed.length !== 1 ? "s" : ""}`);
    } else if (errors.length === 0) {
      flash("CSV had no data rows.");
    }
  };

  const handleFile = (file: File) => {
    if (!file.name.endsWith(".csv") && file.type !== "text/csv" && file.type !== "text/plain") {
      setParseErrors(["Please upload a .csv file."]);
      return;
    }
    const reader = new FileReader();
    reader.onload = e => processCSV((e.target?.result as string) ?? "");
    reader.readAsText(file);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleClear = () => {
    if (confirm(`Delete all ${students.length} student${students.length !== 1 ? "s" : ""}? This cannot be undone.`)) {
      clearStudents();
      setStudents([]);
      setParseErrors([]);
      flash("All students removed.");
    }
  };

  const logout = () => {
    sessionStorage.removeItem(AUTH_KEY);
    setAuthed(false);
  };

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Top bar */}
      <header className="bg-[#003087] text-white px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-lg font-bold tracking-tight">NVCC Admin</span>
          <span className="text-sm text-blue-200">· Student Management</span>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/" className="text-sm text-blue-200 hover:text-white transition">← Timesheet</Link>
          <button onClick={logout} className="text-sm text-blue-200 hover:text-white transition">Sign out</button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-10 space-y-8">
        {/* Flash */}
        {flashMsg && (
          <div className="rounded-xl bg-green-50 border border-green-200 px-5 py-3 text-sm text-green-700 font-medium">
            {flashMsg}
          </div>
        )}

        {/* Upload card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
          <h2 className="text-lg font-bold text-slate-800 mb-1">Upload Student CSV</h2>
          <p className="text-sm text-slate-500 mb-6">
            CSV format: <code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs font-mono">name, department, type</code>
            &nbsp;— one student per row. Header row is optional.
          </p>

          {/* Drop zone */}
          <div
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileRef.current?.click()}
            className={`border-2 border-dashed rounded-xl px-8 py-12 text-center cursor-pointer transition ${
              dragOver ? "border-[#003087] bg-blue-50" : "border-slate-300 hover:border-[#003087] hover:bg-slate-50"
            }`}
          >
            <svg className="mx-auto mb-3 w-10 h-10 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
            <p className="text-sm font-medium text-slate-600">Drop CSV here or <span className="text-[#003087] underline">click to browse</span></p>
            <p className="text-xs text-slate-400 mt-1">Replaces all current students</p>
            <input ref={fileRef} type="file" accept=".csv,text/csv,text/plain" className="sr-only" onChange={handleFileInput} />
          </div>

          {/* Parse errors */}
          {parseErrors.length > 0 && (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4">
              <p className="text-xs font-semibold text-red-700 uppercase tracking-wide mb-2">Parse errors</p>
              <ul className="text-xs text-red-600 space-y-1 list-disc list-inside">
                {parseErrors.map((e, i) => <li key={i}>{e}</li>)}
              </ul>
            </div>
          )}

          {/* Sample format */}
          <div className="mt-5 rounded-xl bg-slate-50 border border-slate-200 p-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-2">Example CSV</p>
            <pre className="text-xs font-mono text-slate-600 whitespace-pre-wrap">
{`name,department,type
Jane Smith,WIOA Program,Student
Carlos Rivera,WIOA Program,Educational Assistant
Maria Johnson,Career Services,Student`}
            </pre>
          </div>
        </div>

        {/* Current students */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-slate-800">
                Current Students <span className="text-[#003087]">({students.length})</span>
              </h2>
              <p className="text-sm text-slate-400 mt-0.5">Stored in browser — survives page refresh</p>
            </div>
            {students.length > 0 && (
              <button onClick={handleClear} className="text-xs text-red-400 hover:text-red-600 uppercase tracking-widest font-medium transition">
                Clear all
              </button>
            )}
          </div>

          {students.length === 0 ? (
            <p className="text-sm text-slate-400 italic">No students loaded. Upload a CSV above.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left pb-2 text-xs font-semibold uppercase tracking-widest text-slate-400 w-8">#</th>
                  <th className="text-left pb-2 text-xs font-semibold uppercase tracking-widest text-slate-400">Name</th>
                  <th className="text-left pb-2 text-xs font-semibold uppercase tracking-widest text-slate-400">Department</th>
                  <th className="text-left pb-2 text-xs font-semibold uppercase tracking-widest text-slate-400">Type</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {students.map((s, i) => (
                  <tr key={i} className="hover:bg-slate-50">
                    <td className="py-2.5 text-slate-400">{i + 1}</td>
                    <td className="py-2.5 font-medium text-slate-800">{s.name}</td>
                    <td className="py-2.5 text-slate-600">{s.department}</td>
                    <td className="py-2.5">
                      <span className="inline-block rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700">
                        {s.type}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center py-6 text-xs text-slate-400">
        Powered by{" "}
        <a href="https://nova-systems.app" target="_blank" rel="noreferrer" className="hover:text-slate-600 transition">
          Nova Systems
        </a>
      </footer>
    </div>
  );
}
