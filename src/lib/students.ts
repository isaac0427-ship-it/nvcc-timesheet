const STORAGE_KEY = "nvcc-students-v2";

export interface Student {
  name: string;
  department: string;
  studentId: string;
  workLocation: string;
}

export function getStudents(): Student[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Student[];
    return parsed.map((s) => ({ ...s, workLocation: ((s as unknown) as Record<string, unknown>)["workLocation"] as string ?? "" }));
  } catch {
    return [];
  }
}

export function saveStudents(students: Student[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(students));
}

export function clearStudents(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function parseStudentCSV(text: string): { students: Student[]; errors: string[] } {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (!lines.length) return { students: [], errors: ["CSV file is empty"] };

  const students: Student[] = [];
  const errors: string[] = [];
  let startLine = 0;

  const firstLower = lines[0].toLowerCase();
  if (firstLower.startsWith("name") || firstLower.includes("department") || firstLower.includes("student")) {
    startLine = 1;
  }

  for (let i = startLine; i < lines.length; i++) {
    const cols = splitCSVLine(lines[i]);
    if (cols.length < 2) {
      errors.push(`Row ${i + 1}: expected name, department[, studentId, workLocation] — got "${lines[i]}"`);
      continue;
    }
    const name = cols[0].trim();
    const department = cols[1].trim();
    const studentId = (cols[2] ?? "").trim();
    const workLocation = (cols[3] ?? "").trim();
    if (!name) { errors.push(`Row ${i + 1}: empty name`); continue; }
    students.push({ name, department, studentId, workLocation });
  }

  return { students, errors };
}

function splitCSVLine(line: string): string[] {
  const cols: string[] = [];
  let current = "";
  let inQuote = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuote && line[i + 1] === '"') { current += '"'; i++; }
      else inQuote = !inQuote;
    } else if (ch === "," && !inQuote) {
      cols.push(current); current = "";
    } else {
      current += ch;
    }
  }
  cols.push(current);
  return cols;
}
