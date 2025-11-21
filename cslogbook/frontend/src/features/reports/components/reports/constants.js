// ค่าคงที่และ helper สำหรับ Dashboard

// academicYearOptions: สร้าง list ย้อนหลังจาก anchorYear คงที่ (ไม่ใช่ year ที่ผู้ใช้เลือก) เพื่อไม่ให้ปีล่าสุดหายไปเมื่อเลือกปีเก่าลง
export const academicYearOptions = (anchorYear, length = 5) => Array.from({ length }, (_, i) => anchorYear - i);

export const kpiExtractors = (overview) => ([
  {
    title: 'นักศึกษารวม',
    value: overview?.students?.total || 0,
    extra: overview?.students?.internshipActive ? `ระหว่างฝึกงาน: ${overview.students.internshipActive}` : ''
  },
  {
    title: 'Internship เอกสารครบ',
    value: overview?.internships?.documentsComplete || 0,
    extra: overview?.internships?.documentsPending ? `รอ: ${overview.internships.documentsPending}` : ''
  },
  {
    title: 'Project ทั้งหมด',
    value: overview?.projects?.total || 0,
    extra: overview?.projects?.proposalSubmitted ? `เสนอแล้ว: ${overview.projects.proposalSubmitted}` : ''
  },
  {
    title: 'อาจารย์ที่ปรึกษา (มีภาระ)',
    value: overview?.advisorLoad?.advisorsWithStudents || 0,
    extra: overview?.advisorLoad?.avgStudentsPerAdvisor ? `เฉลี่ย: ${overview.advisorLoad.avgStudentsPerAdvisor}` : ''
  }
]);
