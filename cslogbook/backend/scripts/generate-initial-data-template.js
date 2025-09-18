/**
 * สคริปต์สร้างไฟล์ Word (.docx) โครงรายงาน Initial/Seed Data
 * - มี Heading, Table, Caption ตามหมวดใน INITIAL_DATA_REFERENCE.md
 * - เอาท์พุต: cslogbook/knowledge/templates/INITIAL_DATA_REFERENCE_template.docx
 *
 * วิธีใช้งาน (จาก VS Code Terminal บน Windows):
 *   cd c:\Users\chinn\CSLog\cslogbook\backend
 *   npm i -D docx
 *   node scripts\generate-initial-data-template.js
 */
const fs = require('fs');
const path = require('path');
const {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  BorderStyle,
  TableOfContents,
} = require('docx');

// ยูทิลิตี้ช่วยสร้างองค์ประกอบซ้ำๆ
const H1 = (text) =>
  new Paragraph({ text, heading: HeadingLevel.HEADING_1, spacing: { after: 200 } });
const H2 = (text) =>
  new Paragraph({ text, heading: HeadingLevel.HEADING_2, spacing: { after: 150 } });
const H3 = (text) =>
  new Paragraph({ text, heading: HeadingLevel.HEADING_3, spacing: { after: 120 } });
const P = (text, opts = {}) =>
  new Paragraph({
    children: [new TextRun({ text, size: 22, ...opts })],
    spacing: { after: 120 },
  });
const Caption = (text) =>
  new Paragraph({
    children: [new TextRun({ text: `Table: ${text}`, italics: true })],
    alignment: AlignmentType.LEFT,
    spacing: { after: 120 },
  });

/** สร้างตารางหัวตาราง + แถวว่างตามที่กำหนด */
function makeTable(headers = [], emptyRows = 3) {
  const headerCells = headers.map(
    (h) =>
      new TableCell({
        children: [
          new Paragraph({
            children: [new TextRun({ text: h, bold: true })],
          }),
        ],
        margins: { top: 100, bottom: 100, left: 100, right: 100 },
      }),
  );

  const rows = [
    new TableRow({ children: headerCells }),
    ...Array.from({ length: emptyRows }).map(
      () =>
        new TableRow({
          children: headers.map(
            () =>
              new TableCell({
                children: [new Paragraph('')], // แถวว่างให้ผู้ใช้เติม
              }),
          ),
        }),
    ),
  ];

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 1, color: 'AAAAAA' },
      bottom: { style: BorderStyle.SINGLE, size: 1, color: 'AAAAAA' },
      left: { style: BorderStyle.SINGLE, size: 1, color: 'AAAAAA' },
      right: { style: BorderStyle.SINGLE, size: 1, color: 'AAAAAA' },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: 'DDDDDD' },
      insideVertical: { style: BorderStyle.SINGLE, size: 1, color: 'DDDDDD' },
    },
    rows,
  });
}

function pageBreak() {
  return new Paragraph({ children: [new TextRun({ text: '' })], pageBreakBefore: true });
}

/**
 * สร้างตารางแบบ Key-Value (2 คอลัมน์) ใช้สำหรับ Document Control ฯลฯ
 * pairs: Array<[key, value]>
 */
function makeKVTable(pairs = []) {
  const headerRow = new TableRow({
    children: [
      new TableCell({
        children: [new Paragraph({ children: [new TextRun({ text: 'Field', bold: true })] })],
        margins: { top: 100, bottom: 100, left: 100, right: 100 },
      }),
      new TableCell({
        children: [new Paragraph({ children: [new TextRun({ text: 'Value', bold: true })] })],
        margins: { top: 100, bottom: 100, left: 100, right: 100 },
      }),
    ],
  });

  const dataRows = pairs.map(([k, v]) =>
    new TableRow({
      children: [
        new TableCell({ children: [new Paragraph(String(k))] }),
        new TableCell({ children: [new Paragraph(String(v))] }),
      ],
    }),
  );

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 1, color: 'AAAAAA' },
      bottom: { style: BorderStyle.SINGLE, size: 1, color: 'AAAAAA' },
      left: { style: BorderStyle.SINGLE, size: 1, color: 'AAAAAA' },
      right: { style: BorderStyle.SINGLE, size: 1, color: 'AAAAAA' },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: 'DDDDDD' },
      insideVertical: { style: BorderStyle.SINGLE, size: 1, color: 'DDDDDD' },
    },
    rows: [headerRow, ...dataRows],
  });
}

// เริ่มประกอบเอกสาร
(async () => {
  // ส่วนหัวเรื่อง/ข้อมูลเอกสาร
  const titleBlock = [
    H1('CSLogbook – Initial/Seed Data Template'),
    P('เอกสารแม่แบบสำหรับจัดทำข้อมูลตั้งต้นของระบบ (Dev/Ops/QA/Analyst ใช้ร่วมกัน)'),
    P('สถานะไฟล์: Draft', { color: '666666' }),
    makeKVTable([
      ['Title', 'CSLogbook Initial/Seed Data'],
      ['Version', '1.0 (Template)'],
      ['Status', 'Draft'],
      ['Owner', 'TODO'],
      ['Reviewer / Approver', 'TODO'],
      ['Last Updated', 'YYYY-MM-DD'],
    ]),
    Caption('Document Control'),
    new TableOfContents('สารบัญ (คลิกขวา -> Update Field ใน Word เพื่ออัปเดต)', {
      hyperlink: true,
      headingStyleRange: '1-3',
    }),
    pageBreak(),
  ];

  // 1) Scope & Boundary
  const scope = [
    H1('1. Scope & Boundary'),
    P('อธิบายสิ่งที่นับเป็นข้อมูลตั้งต้น (Initial/Seed/Reference) และสิ่งที่ไม่รวม'),
    makeTable(['หมวด', 'In Scope', 'Out of Scope', 'Notes'], 3),
    Caption('Scope Decision Matrix'),
    P('Legend ประเภทข้อมูล: Reference / Config / Operational Baseline / Sample'),
  ];

  // 2) Domain Overview
  const domains = [
    H1('2. ระบบย่อย (Domain Overview)'),
    makeTable(['Domain', 'คำอธิบาย', 'ตาราง/ไฟล์หลัก', 'ความสำคัญ', 'Owner'], 8),
    Caption('Domain Overview'),
  ];

  // 3) Master Inventory (Idempotent)
  const inventory = [
    H1('3. Inventory Table (Master List)'),
    P('รายการข้อมูลตั้งต้นทั้งหมดแบบ idempotent (seed ซ้ำได้โดยไม่ซ้ำซ้อน)'),
    makeTable(
      [
        'Code/Slug',
        'ชื่อ',
        'คำอธิบาย',
        'แหล่งที่มา (manual/script)',
        'ที่จัดเก็บ (DB/File)',
        'วิธี seed',
        'Lifecycle (Ref/Config/Op/Sample)',
        'Owner',
        'Risk หากหาย',
        'หมายเหตุ',
      ],
      5,
    ),
    Caption('Master Inventory'),
  ];

  // 4) รายละเอียดเชิงโดเมน
  const d41 = [
    H1('4. รายละเอียดเชิงลึกตามหมวด'),
    H2('4.1 Auth & Roles'),
    P('รายการ role เริ่มต้น, วิธีสร้าง admin เริ่มต้น, Password policy'),
    makeTable(['Role', 'คำอธิบาย', 'Key Permissions', 'Seed/Manual', 'Owner', 'หมายเหตุ'], 3),
    Caption('Roles & Permissions'),
  ];

  const d42 = [
    H2('4.2 Academic Structure'),
    P('ปีการศึกษา/เทอม, หลักสูตร (curriculum), ขั้นตอนเปลี่ยนเทอม'),
    makeTable(['Code', 'ชื่อหลักสูตร', 'ปีเริ่ม', 'Active', 'max_credits', 'วิธี seed', 'หมายเหตุ'], 3),
    Caption('Curriculum Catalog'),
    makeTable(['AY/Sem', 'is_current', 'active_curriculum_id', 'internship_semesters', 'project_semesters', 'หมายเหตุ'], 2),
    Caption('Academic Term Baseline'),
  ];

  const d43 = [
    H2('4.3 Deadlines & Important Dates'),
    P('สคีมา, นโยบายเผยแพร่/แจ้งเตือน, วิธีอัปเดตต่อเทอม'),
    makeTable(
      ['Name', 'Related To', 'AY', 'Sem', 'all_day', 'deadline_at', 'is_published', 'allow_late/grace', 'visibility', 'Critical?'],
      4,
    ),
    Caption('Important Deadlines Catalog'),
  ];

  const d44 = [
    H2('4.4 Internship Master Data'),
    P('ขั้นตอน workflow (10 ขั้น), evaluation rubric, ตารางหลักที่เกี่ยวข้อง'),
    makeTable(['Order', 'Step Key', 'Title', 'Default Status On Reach', 'หมายเหตุ'], 5),
    Caption('Internship Workflow Steps'),
    makeTable(['Rubric Version', 'Section', 'Item Code', 'Label', 'Scale/Weight', 'หมายเหตุ'], 4),
    Caption('Evaluation Rubric (โครง)'),
  ];

  const d45 = [
    H2('4.5 Project / Capstone'),
    makeTable(['Milestone', 'Code', 'Due (AY/Sem)', 'วิธีส่ง', 'Review/Approve By', 'หมายเหตุ'], 3),
    Caption('Project Milestones'),
  ];

  const d46 = [
    H2('4.6 Workflow & Status Dictionaries'),
    P('หลักการตั้งชื่อ, เวอร์ชัน, การ deprecate'),
    makeTable(['Domain', 'Status/Step Key', 'Order', 'Title', 'Deprecated?', 'หมายเหตุ'], 4),
    Caption('Status/Step Dictionary'),
  ];

  const d47 = [
    H2('4.7 Notification & Email Templates'),
    makeTable(['Type', 'is_enabled (default)', 'Channel', 'Owner', 'หมายเหตุ'], 5),
    Caption('Notification Settings (Default)'),
  ];

  const d48 = [
    H2('4.8 Documents / Templates'),
    makeTable(['Path', 'ประเภท', 'ใช้เพื่อ', 'Owner', 'หมายเหตุ'], 4),
    Caption('Document/Template List'),
  ];

  const d49 = [
    H2('4.9 Background Agents & Schedulers'),
    makeTable(['Agent', 'Schedule', 'หน้าที่', 'Config ที่เกี่ยวข้อง', 'Log Location', 'Owner'], 3),
    Caption('Background Agents'),
  ];

  const d410 = [
    H2('4.10 Security & Policy Baseline'),
    makeTable(['Policy/ENV', 'ค่าอ้างอิง', 'ผลกระทบ', 'ที่ตั้งไฟล์', 'หมายเหตุ'], 5),
    Caption('Security & Policy'),
  ];

  // 5) Bootstrap Procedure
  const bootstrap = [
    H1('5. ขั้นตอน Reproduce ฐานข้อมูลเริ่มต้น (Bootstrap Procedure)'),
    P('1) Clone repository'),
    P('2) ตั้งค่า .env.development จาก .env.example'),
    P('3) รัน migration: npx sequelize-cli db:migrate'),
    P('4) รัน seeder: npx sequelize-cli db:seed:all'),
    P('5) ตรวจบัญชี admin, ไฟล์ template, และ smoke test endpoint พื้นฐาน'),
  ];

  // 6) Update Mechanisms
  const updateMech = [
    H1('6. กลไกการอัปเดตหลังเริ่มใช้งาน (Update Mechanisms)'),
    makeTable(['หมวด', 'ช่องทางปรับ (UI/Script/Migration)', 'ความถี่', 'Audit Log', 'ผู้อนุมัติ'], 5),
    Caption('Update Mechanisms'),
  ];

  // 7) Versioning & Audit
  const versionAudit = [
    H1('7. Versioning & Audit Strategy'),
    makeTable(['Entity', 'วิธีทำเวอร์ชัน', 'ตัวอย่าง Tag', 'แหล่งเก็บหลักฐาน'], 4),
    Caption('Versioning Matrix'),
  ];

  // 8) Risks
  const risks = [
    H1('8. ความเสี่ยง (Risks) & จุดต้องตรวจ (Validation Points)'),
    makeTable(['ความเสี่ยง', 'ผลกระทบ', 'วิธีป้องกัน', 'Quick Check', 'Owner'], 5),
    Caption('Risk Register'),
  ];

  // 9) Go-Live Checklist
  const checklist = [
    H1('9. เช็คลิสต์ก่อนประกาศ "พร้อมใช้งาน" (Go-Live Checklist)'),
    P('[ ] Migration ผ่านครบ ไม่มี error'),
    P('[ ] Seeder รันซ้ำได้ ไม่ duplicate'),
    P('[ ] Admin login ใช้งานได้'),
    P('[ ] Deadlines เทอมปัจจุบันครบ'),
    P('[ ] Agents/Schedulers ทำงาน และมี log'),
  ];

  // Appendices
  const appendices = [
    new Paragraph({ children: [new TextRun({ text: '' })], pageBreakBefore: true }),
    H1('ภาคผนวก A: Mapping Environment Variables → Config'),
    makeTable(['ENV VAR', 'ไฟล์/โมดูลใช้', 'ผลกระทบหลัก', 'ค่า default'], 6),
    Caption('ENV Mapping'),

    H1('ภาคผนวก B: รายการไฟล์ Template / Reference'),
    makeTable(['Path', 'ประเภท', 'ใช้เพื่อ', 'Owner', 'หมายเหตุ'], 6),
    Caption('Template/Reference Files'),

    H1('ภาคผนวก C: Permission Matrix (ย่อ)'),
    makeTable(['Role \\ Action', 'Manage Users', 'View Deadlines', 'Edit Deadlines', 'Approve Internship', 'View Reports', 'หมายเหตุ'], 4),
    Caption('Permission Matrix'),

    H1('ภาคผนวก D: ตัวอย่างโครงสร้าง JSON (Evaluation Form)'),
    P('{'),
    P('  "version": 1,'),
    P('  "sections": ['),
    P('    {"title": "Professionalism", "items": [{"code": "PUNCTUAL", "label": "มาตรงเวลา", "scale": 5}]}'),
    P('  ]'),
    P('}'),

    H1('ภาคผนวก E: Core Schema – Document (สรุป)'),
    makeTable(['Column', 'Type', 'Note'], 8),
    Caption('Schema: documents'),

    H1('ภาคผนวก F: Core Schema – Student (สรุป)'),
    makeTable(['Column', 'Type', 'Note'], 10),
    Caption('Schema: students'),
  ];

  const doc = new Document({
    sections: [
      { children: titleBlock },
      { children: scope },
      { children: domains },
      { children: inventory },
      { children: d41 },
      { children: d42 },
      { children: d43 },
      { children: d44 },
      { children: d45 },
      { children: d46 },
      { children: d47 },
      { children: d48 },
      { children: d49 },
      { children: d410 },
      { children: bootstrap },
      { children: updateMech },
      { children: versionAudit },
      { children: risks },
      { children: checklist },
      { children: appendices },
    ],
  });

  // สร้างโฟลเดอร์ปลายทางและเขียนไฟล์
  const outDir = path.resolve(__dirname, '..', '..', 'knowledge', 'templates');
  const outFile = path.join(outDir, 'INITIAL_DATA_REFERENCE_template.docx');
  fs.mkdirSync(outDir, { recursive: true });

  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync(outFile, buffer);
  // แสดงผลลัพธ์ในคอนโซล
  console.log(`Generated: ${outFile}`);
})().catch((err) => {
  console.error('Failed to generate docx:', err);
  process.exit(1);
});