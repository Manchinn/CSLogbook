/**
 * Utility script for migrating legacy feature importsให้สอดคล้องกับ barrel exports
 * การทำงาน: ค้นหาไฟล์ .js/.jsx ใต้ src แล้วแทนที่ path ตาม mapping ด้านล่าง
 * หมายเหตุ: สคริปต์จะแก้เฉพาะ path ไม่ได้เปลี่ยนรูปแบบ default/named import
 *           หลังรันแล้วยังต้องตรวจสอบ diff และปรับโค้ดให้ถูกต้องเสมอ
 */

const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '../src');

const importMappings = [
  { from: "features/auth/components/LoginForm", to: "features/auth" },
  { from: "features/admin-dashboard/pages/AdminDashboard", to: "features/admin-dashboard" },
  { from: "features/user-management/components/StudentProfile", to: "features/user-management" },
  { from: "features/user-management/components/ProjectPairs", to: "features/user-management" },
  { from: "features/internship/components/student-view/TimeSheet", to: "features/internship" },
  { from: "features/internship/components/student-view/Summary/Summary", to: "features/internship" },
  { from: "features/internship/components/student-view/EligibilityCheck", to: "features/internship" },
  { from: "features/internship/components/student-view/RegistrationFlow/InternshipRegistrationFlow", to: "features/internship" },
  { from: "features/project/components/student-view/ProjectManagement", to: "features/project" },
  { from: "features/project/components/student-view/Phase1Dashboard/Phase1Dashboard", to: "features/project" },
  { from: "features/project/components/student-view/Phase2Dashboard/Phase2Dashboard", to: "features/project" },
  { from: "features/project/components/shared/EligibilityCheck", to: "features/project" },
  { from: "features/project/components/teacher-view/TopicExamOverview/TopicExamOverview", to: "features/project" },
  { from: "features/project/components/teacher-view/AdvisorQueue/AdvisorKP02Queue", to: "features/project" },
  { from: "features/project/components/teacher-view/AdvisorQueue/StaffKP02Queue", to: "features/project" },
  { from: "features/project/components/teacher-view/ThesisQueue/AdvisorThesisQueue", to: "features/project" },
  { from: "features/project/components/teacher-view/ThesisQueue/StaffThesisQueue", to: "features/project" },
  { from: "features/project/components/teacher-view/SystemTestQueue/AdvisorQueue", to: "features/project" },
  { from: "features/project/components/teacher-view/SystemTestQueue/StaffQueue", to: "features/project" },
];

const targetExtensions = new Set(['.js', '.jsx']);

function collectFiles(directory) {
  const entries = fs.readdirSync(directory, { withFileTypes: true });
  const files = [];
  entries.forEach((entry) => {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectFiles(fullPath));
      return;
    }
    if (entry.isFile() && targetExtensions.has(path.extname(entry.name))) {
      files.push(fullPath);
    }
  });
  return files;
}

function applyMappings(content) {
  let updated = false;
  let nextContent = content;

  importMappings.forEach(({ from, to }) => {
    if (nextContent.includes(from)) {
      nextContent = nextContent.split(from).join(to);
      updated = true;
    }
  });

  return { updated, content: nextContent };
}

function updateFile(filePath) {
  const original = fs.readFileSync(filePath, 'utf8');
  const { updated, content } = applyMappings(original);
  if (!updated) {
    return false;
  }
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Updated imports in ${path.relative(rootDir, filePath)}`);
  return true;
}

function run() {
  const files = collectFiles(rootDir);
  let updatedCount = 0;
  files.forEach((filePath) => {
    if (updateFile(filePath)) {
      updatedCount += 1;
    }
  });

  console.log(`\nImport update complete. ${updatedCount} file(s) modified.`);
  console.log('ตรวจสอบ diff และแก้ไขรูปแบบ import (default → named) ด้วยตัวเองก่อน commit ทุกครั้ง');
}

run();

