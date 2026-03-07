// config/departmentInfo.js
// ข้อมูลภาควิชา/คณะ/มหาวิทยาลัย — ใช้เป็น constant กลางสำหรับเอกสาร PDF ทุกประเภท

const DEPARTMENT_INFO = {
  // ข้อมูลมหาวิทยาลัย
  universityName: "มหาวิทยาลัยเทคโนโลยีพระจอมเกล้าพระนครเหนือ",
  universityNameEn: "King Mongkut's University of Technology North Bangkok",
  facultyName: "คณะวิทยาศาสตร์ประยุกต์",
  departmentName: "ภาควิชาวิทยาการคอมพิวเตอร์และสารสนเทศ",
  programName: "วิทยาศาสตรบัณฑิต สาขาวิชาวิทยาการคอมพิวเตอร์และสารสนเทศ",

  // หัวหน้าภาควิชา (ผู้ลงนามเอกสาร)
  departmentHead: {
    name: "รองศาสตราจารย์ ดร.ธนภัทร์ อนุศาสน์อมรกุล",
    title: "หัวหน้าภาควิชาวิทยาการคอมพิวเตอร์และสารสนเทศ",
  },
};

module.exports = DEPARTMENT_INFO;
