const STORAGE_KEY = "nvcc-students";

export interface Student {
  name: string;
  department: string;
  type: string;
}

export function getStudents(): Student[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as Student[];
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
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  if (!lines.length) return { students: [], errors: ["CSV file is empty"] };

  const students: Student[] = [];
  const errors: string[] = [];
  let startLine = 0;

  // Detect and skip header row
  const firstLower = lines[0].toLowerCase();
  if (firstLower.startsWith("name") || firstLower.includes("department") || firstLower.includes("type")) {
    startLine = 1;
  }

  for (let i = startLine; i < lines.length; i++) {
    const line = lines[i];
    const cols = splitCSVLine(line);
    if (cols.length < 2) {
      errors.push(`Line ${i + 1}: expected at least 2 columns (name, department), got "${line}"`);
      continue;
    }
    const name = cols[0].trim();
    const department = cols[1].trim();
    const type = (cols[2] ?? "Student").trim() || "Student";
    if (!name) {
      errors.push(`Line ${i + 1}: empty name`);
      continue;
    }
    students.push({ name, department, type });
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
      if (inQuote && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuote = !inQuote;
      }
    } else if (ch === "," && !inQuote) {
      cols.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  cols.push(current);
  return cols;
}
