import { StyleSheet } from '@react-pdf/renderer';
import { themeColors, fontSizes, spacing } from './themeStyles';

const certificateStyles = StyleSheet.create({
  // หน้ากระดาษแนวนอน - ใช้ฟอนต์ THSarabunNew
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    padding: 15,
    fontFamily: 'THSarabunNew', 
    fontSize: 18,
    lineHeight: 1.3,
  },
  
  // หัวข้อหลัก
  header: {
    alignItems: 'center',
    marginBottom: 12,
  },
  
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
    color: themeColors.university.primary,
  },
  
  // ตารางข้อมูลนักศึกษา
  studentInfoTable: {
    border: '2px solid #000',
    marginBottom: 12,
    borderRadius: 3,
  },
  
  tableRow: {
    flexDirection: 'row',
    borderBottom: '1px solid #000',
    minHeight: 32,
  },
  
  tableRowLast: {
    flexDirection: 'row',
    minHeight: 32,
  },
  
  tableCellLabel: {
    width: '25%',
    padding: 6,
    fontSize: 17,
    fontWeight: 'bold',
    textAlign: 'center',
    borderRight: '1px solid #000',
    backgroundColor: '#f8f9fa',
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  tableCellValue: {
    width: '25%',
    padding: 6,
    fontSize: 17,
    textAlign: 'center',
    borderRight: '1px solid #000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  tableCellValueLast: {
    width: '25%',
    padding: 6,
    fontSize: 17,
    textAlign: 'center',
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  tableCellCompany: {
    width: '75%',
    padding: 6,
    fontSize: 17,
    textAlign: 'left',
    paddingLeft: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  // เนื้อหาหลัก
  mainContent: {
    marginBottom: 12,
    lineHeight: 1.5,
    paddingHorizontal: 6,
  },
  
  contentText: {
    fontSize: 18,
    marginBottom: 12,
    textAlign: 'justify',
    textIndent: 40,
    lineHeight: 1.5,
  },
  
  // ✅ ส่วนล่าง - container สำหรับ checkbox และ signature
  bottomSection: {
    flexDirection: 'row', // แถวเดียวกัน
    justifyContent: 'space-between', // กระจายซ้าย-ขวา
    alignItems: 'flex-start', // จัดให้อยู่ด้านบน
    marginBottom: 15,
    gap: 20, // ระยะห่างระหว่างสองส่วน
  },
  
  // ส่วนการตรวจสอบเอกสาร - ด้านซ้าย
  checkboxSection: {
    width: '55%', // ให้พื้นที่มากกว่าลายเซ็น
    padding: 10,
    border: '2px solid #000',
    borderRadius: 3,
    backgroundColor: '#fafafa',
    marginBottom: 0, // ลบ marginBottom เพราะอยู่ใน bottomSection แล้ว
  },
  
  checkboxTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
    color: themeColors.university.primary,
  },
  
  checkboxItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    paddingLeft: 15,
  },
  
  checkbox: {
    width: 18,
    height: 18,
    border: '2px solid #000',
    marginRight: 10,
    backgroundColor: '#ffffff',
    borderRadius: 2,
  },
  
  checkboxChecked: {
    width: 18,
    height: 18,
    border: '2px solid #000',
    marginRight: 10,
    backgroundColor: '#000000',
    borderRadius: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  checkboxText: {
    fontSize: 17,
    flex: 1,
    lineHeight: 1.3,
  },
  
  // ส่วนลายเซ็น - ด้านขวา
  signatureSection: {
    width: '40%', // ให้พื้นที่น้อยกว่า checkbox
    flexDirection: 'column', // เปลี่ยนเป็น column
    justifyContent: 'center', // จัดกึ่งกลางแนวตั้ง
    alignItems: 'center',
    marginTop: 0, // ลบ marginTop
    paddingHorizontal: 10, // ลด padding
  },
  
  signatureBox: {
    width: '100%', // ใช้ความกว้างเต็ม
    alignItems: 'center',
    padding: 6,
  },
  
  signatureLabel: {
    fontSize: 17,
    marginBottom: 25,
    textAlign: 'center',
  },
  
  signatureLine: {
    width: '95%',
    height: 1,
    backgroundColor: '#000',
    marginBottom: 6,
  },
  
  signerName: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 3,
    fontWeight: 'bold',
  },
  
  signerTitle: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 1.2,
    paddingHorizontal: 3,
  },
  
  // วันที่และหมายเหตุ
  dateSection: {
    position: 'absolute',
    bottom: 35,
    right: 40,
    fontSize: 17,
    textAlign: 'center',
  },
  
  noteSection: {
    position: 'absolute',
    bottom: 15,
    left: 20,
    right: 20,
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'center',
    color: '#666666',
  },
  
  // เส้นขอบตกแต่ง
  decorativeBorder: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    bottom: 10,
    border: '3px solid #1a365d',
    borderRadius: 6,
  },
  
  innerBorder: {
    position: 'absolute',
    top: 15,
    left: 15,
    right: 15,
    bottom: 15,
    border: '1px solid #4a5568',
    borderRadius: 4,
  },
});

export default certificateStyles;