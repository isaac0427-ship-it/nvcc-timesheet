import JSZip from "jszip";
import type { Student } from "./students";
import type { PayPeriod } from "../data/payPeriods";
import { getPayPeriodDays, formatRangeFull } from "../data/payPeriods";

function buildHTML(student: Student, period: PayPeriod): string {
  const { week1, week2 } = getPayPeriodDays(period);

  const ic = `border:1px solid #000;padding:2px 4px;vertical-align:middle`;
  const sub = `${ic};background:#e0e8f4;-webkit-print-color-adjust:exact;print-color-adjust:exact`;
  const lbl = `font-size:6.5pt;font-weight:bold;text-transform:uppercase;letter-spacing:.05em;color:#555`;
  const val = `font-size:9pt;font-weight:bold;margin-top:1px`;
  const blankLine = `${val};border-bottom:1px solid #000;min-width:100px;display:block`;

  const nameCell = student.name
    ? `<div style="${val}">${student.name}</div>`
    : `<div style="${blankLine}">&nbsp;</div>`;
  const deptCell = student.department
    ? `<div style="${val}">${student.department}</div>`
    : `<div style="${blankLine}">&nbsp;</div>`;

  const sigLbl = `font-size:6.5pt;font-weight:bold;text-transform:uppercase;letter-spacing:.05em;color:#444;margin-bottom:18px`;
  const sigLine = `border-bottom:1px solid #000;margin-bottom:4px`;
  const dateLbl = `font-size:6pt;font-weight:bold;text-transform:uppercase;letter-spacing:.05em;color:#555;margin-top:6px;margin-bottom:12px`;

  const week1Rows = week1.map((day) => `
    <tr style="height:15pt">
      <td style="${ic};text-align:center;font-weight:bold;font-size:8pt">${day.formatted}</td>
      <td style="${ic};text-align:center;font-weight:bold;font-size:8pt">${day.dayName}</td>
      <td style="${ic}">&nbsp;</td><td style="${ic}">&nbsp;</td><td style="${ic}">&nbsp;</td>
      <td style="${ic}">&nbsp;</td><td style="${ic}">&nbsp;</td>
      <td style="${ic}">&nbsp;</td><td style="${ic}">&nbsp;</td>
    </tr>`).join("");

  const week2Rows = week2.map((day) => `
    <tr style="height:15pt;background:rgba(0,0,48,.015)">
      <td style="${ic};text-align:center;font-weight:bold;font-size:8pt">${day.formatted}</td>
      <td style="${ic};text-align:center;font-weight:bold;font-size:8pt">${day.dayName}</td>
      <td style="${ic}">&nbsp;</td><td style="${ic}">&nbsp;</td><td style="${ic}">&nbsp;</td>
      <td style="${ic}">&nbsp;</td><td style="${ic}">&nbsp;</td>
      <td style="${ic}">&nbsp;</td><td style="${ic}">&nbsp;</td>
    </tr>`).join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>${student.name || "Blank"} — PP${period.id} Timesheet</title>
<style>
  @page { size: letter portrait; margin: .18in .28in; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, Helvetica, sans-serif; font-size: 9pt; color: #000; }
  .page { background: #FFE4EA; -webkit-print-color-adjust: exact; print-color-adjust: exact; color-adjust: exact; padding: .18in; }
  table { width: 100%; border-collapse: collapse; font-size: 8.5pt; }
  th { background: #1B3A6B; -webkit-print-color-adjust: exact; print-color-adjust: exact; color: white; font-weight: bold; text-align: center; font-size: 7pt; letter-spacing: .04em; border: 1px solid #000; padding: 1.5px 3px; }
  .ts-row { height: 15pt; }
</style>
</head>
<body>
<div class="page">
  <!-- Header -->
  <div style="display:flex;align-items:center;gap:8px;border-bottom:3px solid #1B3A6B;padding-bottom:5px;margin-bottom:4px">
    <svg width="180" height="44" viewBox="0 0 180 44" xmlns="http://www.w3.org/2000/svg">
      <path d="M4,2 L38,2 L38,26 L21,40 L4,26 Z" fill="#1B3A6B"/>
      <rect x="4" y="16" width="34" height="2.5" fill="white"/>
      <text x="21" y="15" text-anchor="middle" fill="white" font-size="9" font-weight="900" font-family="Arial,sans-serif">CT</text>
      <text x="21" y="28" text-anchor="middle" fill="#C5A028" font-size="6" font-weight="700" font-family="Arial,sans-serif" letter-spacing="1.5">STATE</text>
      <text x="46" y="18" fill="#1B3A6B" font-size="14" font-weight="900" font-family="Arial,sans-serif">CT STATE</text>
      <text x="46" y="32" fill="#1B3A6B" font-size="9.5" font-weight="500" font-family="Arial,sans-serif">Naugatuck Valley</text>
    </svg>
    <div style="flex:1;text-align:center">
      <div style="font-size:11pt;font-weight:900;letter-spacing:.04em;color:#1B3A6B">NAUGATUCK VALLEY COMMUNITY COLLEGE</div>
      <div style="font-size:7.5pt;font-weight:700;letter-spacing:.07em;margin-top:2px">FOR EMPLOYEES PAID WITH FUNDS FROM FEDERAL GRANTS</div>
    </div>
    <div style="text-align:right;font-size:7.5pt;min-width:68px">
      <div style="font-weight:bold;font-size:9pt;color:#1B3A6B">FY 2027</div>
      <div>PP ${period.id} / 26</div>
    </div>
  </div>
  <!-- Employee info -->
  <table style="margin-bottom:3px">
    <tbody>
      <tr>
        <td style="${ic};width:38%"><div style="${lbl}">Employee Name</div>${nameCell}</td>
        <td style="${ic};width:38%"><div style="${lbl}">Department / Program</div>${deptCell}</td>
        <td style="${ic};width:24%"><div style="${lbl}">Pay Period</div><div style="${val}">${formatRangeFull(period)}</div></td>
      </tr>
      <tr>
        <td style="${ic};font-size:8pt" colspan="3">
          <span style="font-weight:bold;text-transform:uppercase;letter-spacing:.05em;margin-right:10px;font-size:7pt">Type of Employee:</span>
          <span style="margin-right:3px;font-size:11pt">&#9745;</span><span style="font-weight:bold;margin-right:14px;font-size:8.5pt">Student</span>
          <span style="margin-right:3px;font-size:11pt">&#9744;</span><span style="margin-right:14px;font-size:8.5pt">Educational Assistant</span>
          <span style="margin-right:3px;font-size:11pt">&#9744;</span><span style="margin-right:14px;font-size:8.5pt">Full Time</span>
          <span style="margin-right:3px;font-size:11pt">&#9744;</span><span style="font-size:8.5pt">Part Time</span>
        </td>
      </tr>
    </tbody>
  </table>
  <!-- Time table -->
  <table style="margin-bottom:3px">
    <thead>
      <tr>
        <th style="width:7%">Date</th><th style="width:7%">Day</th>
        <th style="width:8%">In</th><th style="width:8%">Out</th>
        <th style="width:7%">Meal</th>
        <th style="width:8%">In</th><th style="width:8%">Out</th>
        <th style="width:10%">Total Hours</th>
        <th style="width:37%">Comments</th>
      </tr>
    </thead>
    <tbody>
      ${week1Rows}
      <tr>
        <td colspan="7" style="${sub};text-align:right;padding-right:6px;font-size:7pt;letter-spacing:.05em">SUB TOTAL:</td>
        <td style="${sub}">&nbsp;</td><td style="${sub}">&nbsp;</td>
      </tr>
      ${week2Rows}
      <tr>
        <td colspan="7" style="${sub};text-align:right;padding-right:6px;font-size:7pt;letter-spacing:.05em">SUB TOTAL:</td>
        <td style="${sub}">&nbsp;</td><td style="${sub}">&nbsp;</td>
      </tr>
    </tbody>
  </table>
  <!-- Activities -->
  <div style="border:1px solid #000;padding:3px 6px;margin-bottom:3px;font-size:8pt">
    <span style="font-weight:bold;text-transform:uppercase;letter-spacing:.08em;font-size:6.5pt;margin-right:12px">Activities:</span>
    <span style="margin-right:16px"><span style="font-size:6.5pt;font-weight:bold;text-transform:uppercase;color:#555">Account No.:</span> <strong>HB 3500</strong></span>
    <span style="margin-right:16px"><span style="font-size:6.5pt;font-weight:bold;text-transform:uppercase;color:#555">Grant Title:</span> <strong>WIOA Out Of School</strong></span>
    <span><span style="font-size:6.5pt;font-weight:bold;text-transform:uppercase;color:#555">Percentage:</span> <strong>100%</strong></span>
  </div>
  <!-- Certification + Signatures -->
  <div style="border:1px solid #000;padding:5px 7px;margin-bottom:3px">
    <p style="font-size:7pt;font-style:italic;margin-bottom:8px;line-height:1.35">I certify that the above time record is correct and that I worked the hours stated herein in the performance of my official duties. I further certify that I did not receive payment from any other source for these hours.</p>
    <!-- Row 1: Employee + Supervisor -->
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:6px">
      <div>
        <div style="${sigLbl}">Employee Signature</div>
        <div style="${sigLine}"></div>
        <div style="${dateLbl}">Date</div>
        <div style="${sigLine}"></div>
      </div>
      <div>
        <div style="${sigLbl}">Supervisor Signature</div>
        <div style="${sigLine}"></div>
        <div style="${dateLbl}">Date</div>
        <div style="${sigLine}"></div>
      </div>
    </div>
    <!-- Row 2: Educational Assistant + WAVE Coordinator -->
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
      <div>
        <div style="${sigLbl}">Educational Assistant Signature</div>
        <div style="${sigLine}"></div>
        <div style="${dateLbl}">Date</div>
        <div style="${sigLine}"></div>
      </div>
      <div>
        <div style="${sigLbl}">WAVE Coordinator Signature</div>
        <div style="display:flex;gap:8px;align-items:flex-end;margin-bottom:4px">
          <div style="flex:1;${sigLine}"></div>
          <div style="width:64px;text-align:center;flex-shrink:0">
            <div style="font-size:5.5pt;font-weight:bold;text-transform:uppercase;letter-spacing:.05em;color:#444;margin-bottom:14px">Total Hours</div>
            <div style="${sigLine}"></div>
          </div>
        </div>
        <div style="${dateLbl}">Date</div>
        <div style="${sigLine}"></div>
      </div>
    </div>
  </div>
  <!-- Footer -->
  <div style="text-align:right;font-size:5.5pt;color:#aaa;margin-top:2px">Nova Systems</div>
</div>
<script>window.onload = function(){ window.print(); };</script>
</body>
</html>`;
}

export async function downloadTimesheetsZip(
  students: Student[],
  periods: PayPeriod[],
  onProgress?: (done: number, total: number) => void
): Promise<void> {
  const zip = new JSZip();
  const total = students.length * periods.length;
  let done = 0;

  for (const student of students) {
    const folderName = student.name
      .replace(/[^a-z0-9 ]/gi, "")
      .trim()
      .replace(/\s+/g, "_") || "Blank";
    const folder = zip.folder(folderName);
    for (const period of periods) {
      folder?.file(`PP${String(period.id).padStart(2, "0")}.html`, buildHTML(student, period));
      done++;
      onProgress?.(done, total);
    }
  }

  const blob = await zip.generateAsync({ type: "blob" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `timesheets_FY2027_${new Date().toISOString().slice(0, 10)}.zip`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
