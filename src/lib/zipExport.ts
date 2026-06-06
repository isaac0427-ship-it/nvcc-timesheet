import JSZip from "jszip";
import type { Student } from "./students";
import type { PayPeriod } from "../data/payPeriods";
import { getPayPeriodDays, formatRangeFull } from "../data/payPeriods";

function buildHTML(student: Student, period: PayPeriod): string {
  const { week1, week2 } = getPayPeriodDays(period);

  const cell = `border:1px solid #000;padding:1.5px 3px`;
  const subCell = `${cell};background:#e0e8f4;-webkit-print-color-adjust:exact;print-color-adjust:exact`;
  const dataRows = [
    ...week1.map((day) => `
    <tr style="height:15pt">
      <td style="${cell};text-align:center;font-weight:bold;font-size:8pt">${day.formatted}</td>
      <td style="${cell};text-align:center;font-weight:bold;font-size:8pt">${day.dayName}</td>
      <td style="${cell}">&nbsp;</td><td style="${cell}">&nbsp;</td>
      <td style="${cell}">&nbsp;</td><td style="${cell}">&nbsp;</td>
      <td style="${cell}">&nbsp;</td><td style="${cell}">&nbsp;</td>
    </tr>`),
    `<tr>
      <td colspan="6" style="${subCell};text-align:right;padding-right:6px;font-size:7pt;letter-spacing:.05em;font-weight:bold">WEEK 1 SUB TOTAL:</td>
      <td style="${subCell}">&nbsp;</td><td style="${subCell}">&nbsp;</td>
    </tr>`,
    ...week2.map((day) => `
    <tr style="height:15pt;background:rgba(0,0,48,.015)">
      <td style="${cell};text-align:center;font-weight:bold;font-size:8pt">${day.formatted}</td>
      <td style="${cell};text-align:center;font-weight:bold;font-size:8pt">${day.dayName}</td>
      <td style="${cell}">&nbsp;</td><td style="${cell}">&nbsp;</td>
      <td style="${cell}">&nbsp;</td><td style="${cell}">&nbsp;</td>
      <td style="${cell}">&nbsp;</td><td style="${cell}">&nbsp;</td>
    </tr>`),
    `<tr>
      <td colspan="6" style="${subCell};text-align:right;padding-right:6px;font-size:7pt;letter-spacing:.05em;font-weight:bold">WEEK 2 SUB TOTAL:</td>
      <td style="${subCell}">&nbsp;</td><td style="${subCell}">&nbsp;</td>
    </tr>`,
  ].join("\n");

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>${student.name} — PP${period.id} Timesheet</title>
<style>
  @page { size: letter portrait; margin: .18in .28in; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, Helvetica, sans-serif; font-size: 9pt; color: #000; }
  .page { background: #FFE4EA; -webkit-print-color-adjust: exact; print-color-adjust: exact; color-adjust: exact; padding: .18in; position: relative; overflow: hidden; }
  .wm { position: fixed; top: 50%; left: 50%; transform: translate(-50%,-50%) rotate(-45deg); font-size: 1.9rem; font-weight: 900; color: rgba(0,0,80,.055); pointer-events: none; white-space: nowrap; text-align: center; line-height: 1.55; letter-spacing: .02em; }
  .body { position: relative; z-index: 1; }
  table { width: 100%; border-collapse: collapse; font-size: 8.5pt; }
  th { background: #1B3A6B; -webkit-print-color-adjust: exact; print-color-adjust: exact; color: white; font-weight: bold; text-align: center; font-size: 7pt; letter-spacing: .04em; border: 1px solid #000; padding: 1.5px 3px; }
  .lbl { font-size: 6.5pt; font-weight: bold; text-transform: uppercase; letter-spacing: .05em; color: #555; }
  .val { font-size: 9pt; font-weight: bold; margin-top: 1px; }
  .ic { border: 1px solid #000; padding: 2px 4px; vertical-align: middle; }
  .subtotal td { background: #e0e8f4; -webkit-print-color-adjust: exact; print-color-adjust: exact; font-size: 7.5pt; font-weight: bold; }
  .sig-box { border: 1px solid #000; padding: 5px 7px; margin-bottom: 4px; }
  .sig-line { border-bottom: 1px solid #000; }
  .payroll { border: 2px solid #000; padding: 5px 9px; font-size: 8pt; min-width: 220px; }
  .payroll-hdr { font-weight: bold; text-align: center; border-bottom: 1px solid #000; padding-bottom: 3px; margin-bottom: 5px; font-size: 7pt; text-transform: uppercase; letter-spacing: .07em; }
</style>
</head>
<body>
<div class="page">
  <div class="wm">VALID ONLY WITH SUPERVISOR SIGNATURE</div>
  <div class="body">
    <div style="display:flex;align-items:center;gap:10px;border-bottom:3px solid #1B3A6B;padding-bottom:6px;margin-bottom:5px">
      <svg width="196" height="48" viewBox="0 0 196 48" xmlns="http://www.w3.org/2000/svg">
        <path d="M4,4 L42,4 L42,28 L23,44 L4,28 Z" fill="#1B3A6B"/>
        <rect x="4" y="18" width="38" height="2.8" fill="white"/>
        <text x="23" y="17" text-anchor="middle" fill="white" font-size="10" font-weight="900" font-family="Arial,sans-serif">CT</text>
        <text x="23" y="30" text-anchor="middle" fill="#C5A028" font-size="6.5" font-weight="700" font-family="Arial,sans-serif" letter-spacing="1.5">STATE</text>
        <text x="50" y="19" fill="#1B3A6B" font-size="15" font-weight="900" font-family="Arial,sans-serif">CT STATE</text>
        <text x="50" y="34" fill="#1B3A6B" font-size="10" font-weight="500" font-family="Arial,sans-serif">Naugatuck Valley</text>
      </svg>
      <div style="flex:1;text-align:center">
        <div style="font-size:11.5pt;font-weight:900;letter-spacing:.04em;color:#1B3A6B">NAUGATUCK VALLEY COMMUNITY COLLEGE</div>
        <div style="font-size:7.5pt;font-weight:700;letter-spacing:.06em;margin-top:1px">FOR EMPLOYEES PAID WITH FUNDS FROM FEDERAL GRANTS</div>
      </div>
      <div style="text-align:right;font-size:7.5pt;min-width:72px">
        <div style="font-weight:bold;font-size:9pt;color:#1B3A6B">FY 2027</div>
        <div>PP ${period.id} / 26</div>
      </div>
    </div>
    <table style="margin-bottom:4px">
      <tbody>
        <tr>
          <td class="ic" style="width:34%"><div class="lbl">Employee Name</div><div class="val">${student.name}</div></td>
          <td class="ic" style="width:34%"><div class="lbl">Department / Program</div><div class="val">${student.department}</div></td>
          <td class="ic" style="width:32%"><div class="lbl">Student ID</div><div class="val">${student.studentId || "—"}</div></td>
        </tr>
        <tr>
          <td class="ic" colspan="2"><div class="lbl">Pay Period</div><div class="val">${formatRangeFull(period)}</div></td>
          <td class="ic"><div class="lbl">Pay Period #</div><div class="val">${period.id} of 26</div></td>
        </tr>
        <tr>
          <td class="ic"><div class="lbl">Account No.</div><div class="val">HB 3500</div></td>
          <td class="ic"><div class="lbl">Grant Title</div><div class="val">WIOA Out Of School</div></td>
          <td class="ic"><div class="lbl">Percentage</div><div class="val">100%</div></td>
        </tr>
        <tr>
          <td class="ic" colspan="3" style="font-size:8pt">
            <span style="font-weight:bold;text-transform:uppercase;letter-spacing:.05em;margin-right:10px;font-size:7pt">Type of Employee:</span>
            <span style="margin-right:4px;font-size:11pt">&#9745;</span>
            <span style="font-weight:bold;margin-right:16px;font-size:8.5pt">Student</span>
            <span style="margin-right:4px;font-size:11pt">&#9744;</span>
            <span style="font-size:8.5pt">Part-Time</span>
            <span style="margin-left:16px;margin-right:4px;font-size:11pt">&#9744;</span>
            <span style="font-size:8.5pt">Full-Time</span>
          </td>
        </tr>
      </tbody>
    </table>
    <table style="margin-bottom:4px">
      <thead>
        <tr>
          <th style="width:7%">Date</th><th style="width:7%">Day</th>
          <th style="width:8%">Time In</th><th style="width:8%">Time Out</th>
          <th style="width:8%">Time In</th><th style="width:8%">Time Out</th>
          <th style="width:10%">Total Hrs</th><th style="width:44%">Comments / Activity Description</th>
        </tr>
      </thead>
      <tbody>
        ${dataRows}
        <tr>
          <td colspan="6" style="border:1px solid #000;padding:1.5px 6px 1.5px 3px;text-align:right;font-weight:bold;font-size:8pt">TOTAL HOURS FOR PAY PERIOD:</td>
          <td style="border:1px solid #000;font-weight:bold">&nbsp;</td>
          <td style="border:1px solid #000">&nbsp;</td>
        </tr>

      </tbody>
    </table>
    <div class="sig-box">
      <p style="font-size:7.5pt;font-style:italic;margin-bottom:7px;line-height:1.3">I certify that the above time record is correct and that I worked the hours stated herein in the performance of my official duties. I further certify that I did not receive payment from any other source for these hours.</p>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:8px">
        <div>
          <div class="lbl" style="margin-bottom:14px">Employee Signature</div>
          <div class="sig-line"></div>
          <div class="lbl" style="margin-top:7px;margin-bottom:14px">Date</div>
          <div class="sig-line"></div>
        </div>
        <div>
          <div class="lbl" style="margin-bottom:14px">Supervisor Signature &amp; Total Hours Verified</div>
          <div style="display:flex;gap:10px;align-items:flex-end">
            <div style="flex:1" class="sig-line"></div>
            <div style="width:60px;text-align:center">
              <div class="lbl" style="font-size:5.5pt;margin-bottom:14px">Total Hrs</div>
              <div class="sig-line"></div>
            </div>
          </div>
          <div class="lbl" style="margin-top:7px;margin-bottom:14px">Date</div>
          <div class="sig-line"></div>
        </div>
      </div>
      <div style="display:grid;grid-template-columns:2fr 1fr;gap:14px">
        <div>
          <div class="lbl" style="margin-bottom:14px">Director / Dean Signature</div>
          <div class="sig-line"></div>
        </div>
        <div>
          <div class="lbl" style="margin-bottom:14px">Date</div>
          <div class="sig-line"></div>
        </div>
      </div>
    </div>
    <div style="display:flex;justify-content:space-between;align-items:flex-end;gap:10px">
      <div style="font-size:6.5pt;color:#777">Powered by <strong>Nova Systems</strong> · nova-systems.app</div>
      <div class="payroll">
        <div class="payroll-hdr">For Payroll Office Only</div>
        <div style="margin-bottom:5px">________ Hrs &nbsp;@&nbsp; $________ = $_________</div>
        <div style="border-top:1px solid #000;padding-top:5px;font-size:7.5pt">Checked by: _____________ &nbsp; Date: __________</div>
      </div>
    </div>
  </div>
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
      .replace(/\s+/g, "_");
    const folder = zip.folder(folderName);
    for (const period of periods) {
      folder?.file(
        `PP${String(period.id).padStart(2, "0")}.html`,
        buildHTML(student, period)
      );
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
