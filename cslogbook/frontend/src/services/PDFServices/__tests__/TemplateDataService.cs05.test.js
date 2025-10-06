import TemplateDataService from '../TemplateDataService';

// ชุดทดสอบสำหรับ prepareCS05Data (โครงสร้าง formData ต้องตรงกับ service จริง)
describe('TemplateDataService.prepareCS05Data', () => {
  test('รวมข้อมูลฟอร์มพื้นฐานเป็น payload สำหรับ CS05 ได้', () => {
    const formData = {
      // service คาดหวัง studentData เป็น array
      studentData: [
        {
          fullName: 'สมชาย ทดสอบ',
          studentId: '650000001',
          yearLevel: 3,
          classroom: 'SCI-COMP',
          phoneNumber: '0123456789',
          totalCredits: 90
        }
      ],
      companyName: 'ACME Co.,Ltd.',
      companyAddress: 'Bangkok',
      internshipPosition: 'Intern Developer',
      startDate: '2025-06-01',
      endDate: '2025-07-31',
      jobDescription: 'พัฒนาระบบภายใน',
      additionalRequirements: 'มีพื้นฐาน React'
    };

    const data = TemplateDataService.prepareCS05Data(formData, { status: 'draft' });

    expect(data).toBeDefined();
    // ตรวจ studentData array
    expect(Array.isArray(data.studentData)).toBe(true);
    expect(data.studentData[0].fullName).toContain('สมชาย');
    // ตรวจบริษัท
    expect(data.companyName).toBe('ACME Co.,Ltd.');
    // ตรวจวันเริ่ม / สิ้นสุด
    expect(data.startDate).toBe('2025-06-01');
    expect(data.endDate).toBe('2025-07-31');
    // ตรวจคำนวณวัน (มิ.ย. 30 วัน + ก.ค. 31 วัน = 61 วัน) ใช้ util calculateInternshipDays (ต้องเช็คว่าฟังก์ชันรวมวันแรก/ท้ายอย่างไร)
    expect(typeof data.internshipDays).toBe('number');
    expect(data.status).toBe('draft');
  });

  test('โยน error เมื่อตัวแปรหลักหาย', () => {
    expect(() => TemplateDataService.prepareCS05Data(null)).toThrow(/ไม่มีข้อมูล/);
  });
});
