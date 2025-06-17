# แนวทางการจัดโครงสร้างโฟลเดอร์ Frontend (Frontend Structure Guide)

เอกสารนี้แสดงแนวทางการจัดโครงสร้างโฟลเดอร์ที่แนะนำสำหรับส่วน Frontend ของโปรเจกต์ CSLogbook เพื่อให้โค้ดมีความเป็นระเบียบ ง่ายต่อการพัฒนาและบำรุงรักษา

## โครงสร้างที่แนะนำ

```
cslogbook/
  frontend/
    package.json
    README.md
    public/
    src/
      assets/                  # รวมทรัพยากรต่างๆ เช่น รูปภาพ ไอคอน
        images/
          logo.svg             # (ย้ายจาก src/logo.svg)
          logo3.svg            # (ย้ายจาก src/logo3.svg)
          ...                  # รูปภาพอื่นๆ (ย้ายจาก src/image/)
        icons/                 # ไอคอนต่างๆ
        styles/                # CSS/SCSS ทั่วไป (ถ้ามี)
      
      components/              # Reusable UI components
        common/                # Components ที่ใช้ทั่วไปในหลายๆส่วน
          Button/
            Button.js
            Button.css
          Card/
            Card.js
            Card.css
          PDFViewer/
            PDFViewer.js       # (ย้ายจาก src/components/PDFViewer.js)
            PDFViewerModal.js  # (ย้ายจาก src/components/PDFViewerModal.js)
          ...
        
        forms/                 # Components เกี่ยวกับฟอร์ม
          LoginForm/           # (ย้ายจาก src/components/LoginForm.js และ LoginForm.css)
            LoginForm.js
            LoginForm.css
          StudentForm/
            StudentForm.js     # (ย้ายจาก src/components/StudentForm.js)
            StudentForm.css
          ...
        
        layout/                # Components เกี่ยวกับ layout
          Header/
            Header.js
            Header.css
          Sidebar/
            Sidebar.js
            Sidebar.css
          Footer/
            Footer.js
            Footer.css
          ...
        
        dashboards/            # (ย้ายจาก src/components/dashboards/)
          student/
            StudentDashboard.js
            StudentStats.js
            ...
          admin/
            AdminDashboard.js
            AdminStats.js
            ...
          teacher/
            TeacherDashboard.js
            ...
        
        internship/            # (ย้ายจาก src/components/internship/)
          LogbookEntry/
            LogbookEntry.js
            LogbookEntry.css
          ApprovalRequestButton/
            ApprovalRequestButton.js
            ApprovalRequestButton.css
          ...
      
      pages/                   # หน้าหลักของแอปพลิเคชัน
        auth/                  # หน้าเกี่ยวกับการ authentication
          Login.js             # หน้าล็อกอิน
          Register.js          # หน้าลงทะเบียน
          ForgotPassword.js    # หน้าลืมรหัสผ่าน
          ...
        
        student/               # หน้าสำหรับนักศึกษา
          Dashboard.js         # หน้าแดชบอร์ดของนักศึกษา
          Profile.js           # หน้าโปรไฟล์ของนักศึกษา
          Internship/          # หน้าเกี่ยวกับการฝึกงาน
            Overview.js        # ภาพรวมการฝึกงาน
            Logbook.js         # หน้าบันทึกการฝึกงาน
            Timeline.js        # หน้าไทม์ไลน์
          ...
        
        admin/                 # หน้าสำหรับผู้ดูแลระบบ
          Dashboard.js         # หน้าแดชบอร์ดของผู้ดูแลระบบ
          StudentManagement.js # หน้าจัดการนักศึกษา
          ...
        
        teacher/               # หน้าสำหรับอาจารย์
          Dashboard.js         # หน้าแดชบอร์ดของอาจารย์
          StudentProgress.js   # หน้าติดตามความก้าวหน้าของนักศึกษา
          ...
        
        NotFound.js            # หน้า 404
        ...
      
      context/                 # React context definitions (เปลี่ยนจาก contexts เป็น context)
        auth/                  # context เกี่ยวกับการยืนยันตัวตน
          AuthContext.js       # (ย้ายจาก src/contexts/AuthContext.js)
          authReducer.js
          authActions.js
        
        internship/            # context เกี่ยวกับการฝึกงาน
          InternshipContext.js # (ย้ายจาก src/contexts/InternshipContext.js)
          ...
        
        student/               # context เกี่ยวกับนักศึกษา
          StudentContext.js
          StudentEligibilityContext.js # (ย้ายจาก src/contexts/StudentEligibilityContext.js)
          ...
      
      hooks/                   # Custom React hooks
        useAuth.js             # Hook สำหรับการจัดการ authentication
        useInternshipStatus.js # (ย้ายจาก src/hooks/useInternshipStatus.js)
        useStudentPermissions.js # (ย้ายจาก src/hooks/useStudentPermissions.js)
        useTimeSheet.js        # (ย้ายจาก src/hooks/useTimeSheet.js)
        admin/                 # (ย้ายจาก src/hooks/admin/)
          useAdminStats.js
          ...
        ...
      
      services/                # API service integrations
        apiClient.js           # (มีอยู่แล้วใน src/services/apiClient.js)
        authService.js         # (ย้ายจาก frontend/services/authService.js)
        adminService.js        # (มีอยู่แล้วใน src/services/adminService.js)
        studentService.js      # (มีอยู่แล้วใน src/services/studentService.js)
        teacherService.js      # (มีอยู่แล้วใน src/services/teacherService.js)
        internshipService.js   # (มีอยู่แล้วใน src/services/internshipService.js)
        curriculumService.js   # (มีอยู่แล้วใน src/services/curriculumService.js)
        emailApprovalService.js # (มีอยู่แล้วใน src/services/emailApprovalService.js)
        timelineService.js     # (มีอยู่แล้วใน src/services/timelineService.js)
        admin/                 # (ย้ายจาก src/services/admin/)
          ...
      
      utils/                   # Utility functions
        constants.js           # (มีอยู่แล้วใน src/utils/constants.js)
        timeUtils.js           # (มีอยู่แล้วใน src/utils/timeUtils.js)
        studentUtils.js        # (มีอยู่แล้วใน src/utils/studentUtils.js)
        adminHelpers.js        # (มีอยู่แล้วใน src/utils/adminHelpers.js)
        adminConstants.js      # (มีอยู่แล้วใน src/utils/adminConstants.js)
        dayjs.js               # (มีอยู่แล้วใน src/utils/dayjs.js)
        validation.js          # เพิ่มใหม่สำหรับฟังก์ชันตรวจสอบความถูกต้องของข้อมูล
        formatting.js          # เพิ่มใหม่สำหรับฟังก์ชันจัดรูปแบบข้อมูล
        ...
      
      App.js                   # Entry point component
      App.css                  # Styles for App component
      index.js                 # Main entry file
      index.css                # Global CSS
      ...
```

## ข้อดีของโครงสร้างที่แนะนำ

1. **การแบ่งหมวดหมู่ที่ชัดเจน:** 
   - แยก components ตามประเภทการใช้งาน (common, forms, layout, etc.)
   - แยกหน้าหลักของแอปไว้ใน pages/

2. **การจัดระเบียบ components:**
   - แต่ละ component มีโฟลเดอร์ของตัวเอง รวม JavaScript และ CSS ไว้ด้วยกัน
   - ทำให้ค้นหาไฟล์ที่เกี่ยวข้องกับ component นั้นๆ ได้ง่าย

3. **การจัดการ context อย่างเป็นระบบ:**
   - แบ่ง context ตามโดเมนของข้อมูล
   - รวม reducer และ actions ไว้ในโฟลเดอร์เดียวกัน

4. **ทรัพยากรอยู่ในที่เหมาะสม:**
   - รูปภาพ ไอคอน และไฟล์ style ถูกเก็บใน assets/
   - แยกตามประเภทเพื่อให้เป็นระเบียบ

5. **การจัดการ services และ utils อย่างเป็นระบบ:**
   - บริการ API ทั้งหมดอยู่ใน services/
   - Utility functions ถูกจัดกลุ่มตามประเภทการใช้งาน

## ตัวอย่างการแก้ไขปัญหาที่พบในโครงสร้างปัจจุบัน

1. **โฟลเดอร์ pages ว่างเปล่า:**
   - ย้าย components ที่ทำหน้าที่เป็นหน้าหลักจาก components/ ไปยัง pages/
   - แบ่งตามประเภทผู้ใช้ เช่น student, admin, teacher

2. **ความไม่สอดคล้องของชื่อโฟลเดอร์:**
   - เปลี่ยน `contexts` เป็น `context` ตามมาตรฐาน
   - เปลี่ยน `image` เป็น `assets/images`

3. **การจัดเก็บไฟล์ service:**
   - ย้าย `authService.js` จาก `frontend/services/` ไปยัง `frontend/src/services/`

4. **การจัดการไฟล์ static:**
   - ย้าย logo.svg และ logo3.svg ไปไว้ใน assets/images/

## แนวทางการย้ายไฟล์

ควรย้ายไฟล์ทีละส่วนและทดสอบหลังการย้ายแต่ละครั้ง เพื่อให้แน่ใจว่าไม่มีผลกระทบต่อการทำงานของระบบ ดังนี้:

1. สร้างโครงสร้างโฟลเดอร์ใหม่
2. ย้ายไฟล์ที่เกี่ยวข้อง
3. อัปเดตเส้นทาง import ในโค้ด
4. ทดสอบว่าระบบยังทำงานได้อย่างถูกต้อง
5. หากทุกอย่างเรียบร้อย ให้ลบโฟลเดอร์เดิมที่ไม่จำเป็น

การจัดโครงสร้างให้เป็นระเบียบจะช่วยให้ทีมทำงานร่วมกันได้ง่ายขึ้น และทำให้การพัฒนาและบำรุงรักษาโค้ดในระยะยาวมีประสิทธิภาพมากขึ้น
