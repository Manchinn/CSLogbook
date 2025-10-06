# โครงสร้างไฟล์ระบบโครงงานพิเศษ (Project/Capstone) - cslogbook

## 1. Frontend (React)
**ที่ตั้ง:** `frontend/src/components/project/`

```plaintext
project/
  eligibility/
    index.js                // ตรวจสอบคุณสมบัติ/สิทธิ์ลงโครงงาน
    ProjectEligibilityCheck.js
    ProjectRequirements.js
  register/
    ProjectRegisterForm.js  // ฟอร์มลงทะเบียนโครงงาน
    helpers.js
  logbook/
    ProjectLogbookTable.js  // ตาราง logbook โครงงาน
    ProjectLogbookForm.js
  documents/
    ProposalUpload.js       // อัปโหลดข้อเสนอโครงงาน
    ReportUpload.js         // อัปโหลดรายงาน
    DocumentList.js
  evaluation/
    CommitteeEvaluationForm.js // ฟอร์มประเมินโดยกรรมการ
    AdvisorEvaluationForm.js   // ฟอร์มประเมินโดยอาจารย์ที่ปรึกษา
  summary/
    ProjectSummary.js       // สรุปผลโครงงาน
    ReflectionForm.js       // ฟอร์มสะท้อนผล
  status/
    ProjectStatusCheck.js   // ตรวจสอบสถานะโครงงาน/เอกสาร
  shared/
    ProjectStyles.css
    ProjectHelpers.js
  templates/
    ProposalTemplate.js
    ReportTemplate.js
  hooks/
    useProjectSummary.js
    useProjectRegister.js
  services/
    projectService.js
  utils/
    projectUtils.js
  styles/
    ProjectStyles.css
  ProjectRoutes.js          // รวมเส้นทาง/route ของโครงงาน
  ProjectDashboard.js       // Dashboard โครงงาน
```

---

## 2. Backend (Node.js/Express)
**ที่ตั้ง:** `backend/controllers/project/`, `backend/models/`, `backend/routes/`, `backend/services/`, `backend/middleware/`

```plaintext
controllers/
  project/
    projectController.js         // Logic หลักของโครงงาน
    logbookController.js         // จัดการ logbook โครงงาน
    evaluationController.js      // การประเมินโครงงาน
    documentController.js        // อัปโหลด/ดาวน์โหลดเอกสาร
    summaryController.js         // สรุปผล/ดาวน์โหลด PDF

models/
  Project.js
  ProjectLogbook.js
  ProjectDocument.js
  ProjectEvaluation.js

routes/
  projectRoutes.js               // เส้นทาง API ของโครงงาน

services/
  projectService.js

middleware/
  projectEligibilityMiddleware.js // (ถ้ามี)

migrations/
  20250512000000-create-projects.js
  20250512000001-create-project-logbooks.js
  20250512000002-create-project-evaluations.js

seeders/
  20250512000010-seed-default-projects.js

templates/
  projectProposalTemplate.html
  projectReportTemplate.html
```

---

## 3. หมายเหตุ
- สามารถปรับเปลี่ยนชื่อไฟล์/โฟลเดอร์ได้ตามความเหมาะสมกับทีมและฟีเจอร์จริง
- ถ้าฟีเจอร์โครงงานกับฝึกงานคล้ายกัน สามารถ reuse component/service ได้
- แนะนำให้แยกโค้ดฝั่ง project ออกจาก internship เพื่อความชัดเจนและดูแลง่าย
- สามารถเพิ่มไฟล์ README.md ในแต่ละโฟลเดอร์เพื่ออธิบายหน้าที่ของแต่ละส่วน

---

**ตัวอย่างไฟล์เปล่า (สำหรับเริ่มต้น)**
```javascript
// frontend/src/components/project/register/ProjectRegisterForm.js
import React from "react";
const ProjectRegisterForm = () => <div>Project Register Form (โครงสร้างเปล่า)</div>;
export default ProjectRegisterForm;
```

```javascript
// backend/controllers/project/projectController.js
exports.registerProject = (req, res) => {
  // TODO: เพิ่ม logic การลงทะเบียนโครงงาน
  res.json({ message: "ยังไม่ได้ implement" });
};
