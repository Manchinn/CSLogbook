import { StyleSheet } from '@react-pdf/renderer';

// สไตล์สำหรับหนังสือราชการ/หนังสือขอความอนุเคราะห์
const letterStyles = StyleSheet.create({
  page: {
    padding: 42, // ปรับระยะขอบเพื่อให้จัดวางได้ถูกต้อง
    paddingLeft: 75,
    paddingRight: 75,
    paddingTop: 35, 
    paddingBottom: 45,
    fontFamily: 'THSarabunNew',
    fontSize: 14,
    lineHeight: 1.3,
    backgroundColor: '#FFFFFF',
  },
  
  // ส่วนหัวหนังสือ
  header: {
    position: 'relative',
    marginBottom: 25, // เพิ่มระยะห่างระหว่างส่วนหัวกับเนื้อความ
  },
  
  emblem: {
    width: 60, // ปรับขนาดครุฑให้ใหญ่ขึ้นเล็กน้อยตามรูป
    height: 60,
    marginBottom: 10, // เพิ่มระยะห่างระหว่างครุฑกับเลขที่หนังสือ
    alignSelf: 'center',
  },
  
  documentNumberContainer: {
    position: 'absolute',
    top: 20,
    left: 0,
  },
  
  documentNumber: {
    fontSize: 14,
    fontWeight: 'normal',
  },
  
  organizationContainer: {
    position: 'absolute',
    top: 20,
    right: 0,
    alignItems: 'flex-start', // จัดชิดซ้าย (สำหรับองค์ประกอบที่อยู่ด้านขวา)
  },
  
  organizationText: {
    fontSize: 14,
    lineHeight: 1.3,
  },
  
  dateContainer: {
    position: 'absolute',
    top: 115, // ปรับตำแหน่งให้ตรงกับในรูป
    right: 0,
  },
  
  dateText: {
    fontSize: 14,
  },
  
  // หัวเรื่อง
  subjectContainer: {
    flexDirection: 'row',
    marginTop: 0, // ปรับให้เรื่องอยู่ห่างจากวันที่พอเหมาะ
    marginBottom: 5,
  },
  
  subjectLabel: {
    width: 40,
    fontSize: 14,
    fontWeight: 'bold',
  },
  
  subjectText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  
  // ผู้รับ
  recipientContainer: {
    flexDirection: 'row',
    marginBottom: 0, // ลดระยะห่าง
    marginTop: 8, // เพิ่มระยะห่างจากหัวเรื่อง
  },
  
  recipientLabel: {
    width: 40,
    fontSize: 14,
    fontWeight: 'bold',
  },
  
  recipientTextContainer: {
    flex: 1,
  },
  
  recipientText: {
    fontSize: 14,
    lineHeight: 1.5, // เพิ่มระยะห่างระหว่างบรรทัด
  },
  
  // สิ่งที่ส่งมาด้วย
  attachmentContainer: {
    flexDirection: 'row',
    marginTop: 8, // เพิ่มระยะห่างจากส่วนผู้รับ
    marginBottom: 15, // เพิ่มระยะห่างก่อนถึงเนื้อหา
  },
  
  attachmentLabel: {
    width: 85, // ปรับให้กว้างขึ้นเล็กน้อยตามรูป
    fontSize: 14,
    fontWeight: 'normal', // เปลี่ยนเป็นตัวปกติตามรูป
  },
  
  attachmentTextContainer: {
    flex: 1,
  },
  
  attachmentText: {
    fontSize: 14,
  },
  
  // เนื้อหา
  contentContainer: {
    flex: 1,
  },
  
  paragraph: {
    marginBottom: 7, // เพิ่มระยะห่างระหว่างย่อหน้า
    textAlign: 'left',
    fontSize: 14,
    lineHeight: 1.5, // เพิ่มระยะห่างระหว่างบรรทัด
    textIndent: 42, // ย่อหน้า 8 ช่วงตัวอักษร
  },
  
  // รายชื่อนักศึกษา
  studentListContainer: {
    marginBottom: 7,
    marginLeft: 85, // ย้ายรายชื่อไปทางขวาเพื่อให้อยู่ในแนวเดียวกับการย่อหน้า
    marginTop: 2,
  },
  
  studentRow: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  
  studentNumber: {
    width: 30,
    fontSize: 14,
  },
  
  studentName: {
    width: 200, // กว้างขึ้นเพื่อรองรับชื่อยาวๆ
    fontSize: 14,
  },
  
  studentId: {
    fontSize: 14,
  },
  
  // ลงท้าย
  closingContainer: {
    marginTop: 10, // เพิ่มระยะห่างจากเนื้อหา
    alignItems: 'center',
  },
  
  closingText: {
    fontSize: 14,
    marginBottom: 20, // เพิ่มระยะห่างจากลายเซ็น
  },
  
  signatureContainer: {
    alignItems: 'center',
  },
  
  signatureImage: {
    width: 90, // ปรับขนาดลายเซ็นให้ใกล้เคียงกับรูป
    height: 45,
    marginBottom: 3,
  },
  
  signerName: {
    fontSize: 14,
    marginBottom: 3, // เพิ่มระยะห่างระหว่างชื่อและตำแหน่ง
  },
  
  signerPosition: {
    fontSize: 14,
  },
  
  // ส่วนท้าย
  footer: {
    marginTop: 10, // เพิ่มระยะห่างจากส่วนลงนาม
  },
  
  footerText: {
    fontSize: 12,
    marginBottom: 1, // เพิ่มระยะห่างระหว่างบรรทัด
  },
});

export default letterStyles;