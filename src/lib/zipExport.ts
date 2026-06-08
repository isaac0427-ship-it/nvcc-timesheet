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

  const sigLine = `border-bottom:1px solid #000;margin-bottom:4px`;

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
    <svg width="42" height="44" viewBox="0 0 42 44" xmlns="http://www.w3.org/2000/svg">
      <path d="M2,2 L40,2 L40,28 L21,42 L2,28 Z" fill="#1B3A6B"/>
      <rect x="2" y="17" width="38" height="2.5" fill="white"/>
      <text x="21" y="16" text-anchor="middle" fill="white" font-size="10" font-weight="900" font-family="Arial,sans-serif">CT</text>
      <text x="21" y="29" text-anchor="middle" fill="#C5A028" font-size="6.5" font-weight="700" font-family="Arial,sans-serif" letter-spacing="1.5">STATE</text>
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
        <td style="${ic};width:36%"><div style="${lbl}">Employee Name</div>${nameCell}</td>
        <td style="${ic};width:36%"><div style="${lbl}">Department / Program</div>${deptCell}</td>
        <td style="${ic};width:28%"><div style="${lbl}">Work Location / School</div><div style="${val}">${student.workLocation || "&nbsp;"}</div></td>
      </tr>
      <tr>
        <td style="${ic}" colspan="3"><div style="${lbl}">Pay Period</div><div style="${val}">${formatRangeFull(period)}</div></td>
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
  <!-- Total Hours box -->
  <div style="display:flex;justify-content:flex-end;margin-bottom:3px">
    <div style="border:2px solid #1B3A6B;padding:4px 10px;display:flex;align-items:center;gap:10px">
      <span style="font-size:7.5pt;font-weight:900;text-transform:uppercase;letter-spacing:.07em;color:#1B3A6B">Total Hours For Pay Period:</span>
      <div style="border-bottom:1.5px solid #000;width:64px">&nbsp;</div>
    </div>
  </div>
  <!-- Certification + Signatures -->
  <div style="border:1px solid #000;padding:5px 7px;margin-bottom:3px">
    <p style="font-size:6.5pt;font-style:italic;margin-bottom:5px;line-height:1.35">I certify that the above time record is correct and that I worked the hours stated herein in the performance of my official duties. I further certify that I did not receive payment from any other source for these hours.</p>
    <div>
      ${["Employee","Supervisor","Educational Assistant","WAVE Coordinator"].map(title => `
      <div style="padding:5px 6px 5px 6px;border-top:1px solid #ccc">
        <div style="font-size:6.5pt;font-weight:900;text-transform:uppercase;letter-spacing:.06em;color:#1B3A6B;margin-bottom:5px">${title}</div>
        <div style="font-size:5.5pt;font-weight:bold;text-transform:uppercase;letter-spacing:.04em;color:#666;margin-bottom:8px;margin-top:4px">Name</div>
        <div style="${sigLine}"></div>
        <div style="font-size:5.5pt;font-weight:bold;text-transform:uppercase;letter-spacing:.04em;color:#666;margin-bottom:8px;margin-top:4px">Signature</div>
        <div style="${sigLine}"></div>
        <div style="font-size:5.5pt;font-weight:bold;text-transform:uppercase;letter-spacing:.04em;color:#666;margin-bottom:8px;margin-top:4px">Date</div>
        <div style="${sigLine}"></div>
      </div>`).join("")}
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
