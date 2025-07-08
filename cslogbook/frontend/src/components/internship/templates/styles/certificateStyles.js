import { StyleSheet } from '@react-pdf/renderer';
import { themeColors, fontSizes, spacing } from './themeStyles';

const certificateStyles = StyleSheet.create({
  // หน้ากระดาษแนวนอน
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    padding: 30,
    fontFamily: 'THSarabunNew', // ✅ ใช้ Sarabun เหมือน letterStyles
    fontSize: 16,
    lineHeight: 1.4,
  },
  
  // หัวข้อหลัก
  header: {
    alignItems: 'center',
    marginBottom: 25,
  },
  
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: themeColors.university.primary,
  },
  
  // ตารางข้อมูลนักศึกษา
  studentInfoTable: {
    border: '2px solid #000',
    marginBottom: 20,
    borderRadius: 3,
  },
  
  tableRow: {
    flexDirection: 'row',
    borderBottom: '1px solid #000',
    minHeight: 35,
  },
  
  tableRowLast: {
    flexDirection: 'row',
    minHeight: 35,
  },
  
  tableCellLabel: {
    width: '25%',
    padding: 8,
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    borderRight: '1px solid #000',
    backgroundColor: '#f8f9fa',
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  tableCellValue: {
    width: '25%',
    padding: 8,
    fontSize: 14,
    textAlign: 'center',
    borderRight: '1px solid #000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  tableCellValueLast: {
    width: '25%',
    padding: 8,
    fontSize: 14,
    textAlign: 'center',
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  tableCellCompany: {
    width: '75%',
    padding: 8,
    fontSize: 14,
    textAlign: 'left',
    paddingLeft: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  // เนื้อหาหลัก
  mainContent: {
    marginBottom: 30,
    lineHeight: 1.8,
    paddingHorizontal: 10,
  },
  
  contentText: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'justify',
    textIndent: 50,
    lineHeight: 1.8,
  },
  
  // ส่วนการตรวจสอบเอกสาร
  checkboxSection: {
    marginBottom: 30,
    padding: 15,
    border: '2px solid #000',
    borderRadius: 3,
    backgroundColor: '#fafafa',
  },
  
  checkboxTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
    color: themeColors.university.primary,
  },
  
  checkboxItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    paddingLeft: 20,
  },
  
  checkbox: {
    width: 16,
    height: 16,
    border: '2px solid #000',
    marginRight: 12,
    backgroundColor: '#ffffff',
    borderRadius: 2,
  },
  
  checkboxChecked: {
    width: 16,
    height: 16,
    border: '2px solid #000',
    marginRight: 12,
    backgroundColor: '#000000',
    borderRadius: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  checkboxText: {
    fontSize: 14,
    flex: 1,
    lineHeight: 1.4,
  },
  
  // ส่วนลายเซ็น
  signatureSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 50,
    paddingHorizontal: 40,
  },
  
  signatureBox: {
    width: '45%',
    alignItems: 'center',
  },
  
  signatureLabel: {
    fontSize: 14,
    marginBottom: 50,
    textAlign: 'center',
  },
  
  signatureLine: {
    width: '85%',
    height: 1,
    backgroundColor: '#000',
    marginBottom: 8,
  },
  
  signerName: {
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 3,
    fontWeight: 'bold',
  },
  
  signerTitle: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 1.3,
  },
  
  // วันที่และหมายเหตุ
  dateSection: {
    position: 'absolute',
    bottom: 60,
    right: 50,
    fontSize: 14,
    textAlign: 'center',
  },
  
  noteSection: {
    position: 'absolute',
    bottom: 20,
    left: 30,
    right: 30,
    fontSize: 11,
    fontStyle: 'italic',
    textAlign: 'center',
    color: '#666666',
  },
  
  // เส้นขอบตกแต่ง
  decorativeBorder: {
    position: 'absolute',
    top: 15,
    left: 15,
    right: 15,
    bottom: 15,
    border: '3px solid #1a365d',
    borderRadius: 8,
  },
  
  innerBorder: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    bottom: 20,
    border: '1px solid #4a5568',
    borderRadius: 5,
  },
});

// ✅ Export เป็น default เหมือน letterStyles
export default certificateStyles;