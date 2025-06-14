import { StyleSheet } from '@react-pdf/renderer';
import { themeColors, fontSizes, spacing } from './themeStyles';

export const letterStyles = StyleSheet.create({
  // เค้าโครงหนังสือ
  letterPage: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 40,
    fontFamily: 'THSarabunNew',
    fontSize: fontSizes.thai.normal,
    lineHeight: 1.8,
    color: '#000000'
  },

  // ส่วนหัวหนังสือ
  letterhead: {
    textAlign: 'center',
    marginBottom: 30,
    paddingBottom: 20,
    borderBottom: '2 solid #000000'
  },

  // โลโก้และตราสัญลักษณ์
  logo: {
    width: 60,
    height: 60,
    marginBottom: 10,
    alignSelf: 'center'
  },

  emblem: {
    width: 50,
    height: 50,
    position: 'absolute',
    top: 20,
    left: 20
  },

  // ชื่อหน่วยงาน
  organizationName: {
    fontSize: fontSizes.thai.large,
    fontWeight: 'bold',
    marginBottom: 5,
    color: themeColors.university.primary
  },

  departmentName: {
    fontSize: fontSizes.thai.medium,
    fontWeight: 'bold',
    marginBottom: 8,
    color: themeColors.gray700
  },

  facultyName: {
    fontSize: fontSizes.thai.medium,
    marginBottom: 8,
    color: themeColors.gray600
  },

  // ที่อยู่และการติดต่อ
  addressLine: {
    fontSize: fontSizes.thai.small,
    marginBottom: 3,
    color: themeColors.gray600
  },

  contactInfo: {
    fontSize: fontSizes.thai.small,
    color: themeColors.gray600
  },

  // หมายเลขหนังสือและวันที่
  documentReference: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 25,
    paddingHorizontal: 20
  },

  documentNumber: {
    fontSize: fontSizes.thai.normal,
    fontWeight: 'bold'
  },

  documentDate: {
    fontSize: fontSizes.thai.normal,
    textAlign: 'right'
  },

  // ส่วนเรื่องและเรียน
  subjectSection: {
    marginBottom: 20
  },

  subjectLine: {
    fontSize: fontSizes.thai.medium,
    marginBottom: 15
  },

  subjectLabel: {
    fontWeight: 'bold',
    marginRight: 10
  },

  salutationSection: {
    marginBottom: 20
  },

  salutationLine: {
    fontSize: fontSizes.thai.medium,
    marginBottom: 8
  },

  salutationLabel: {
    fontWeight: 'bold',
    marginRight: 10
  },

  recipientTitle: {
    marginLeft: 60,
    fontSize: fontSizes.thai.normal,
    color: themeColors.gray700
  },

  // เนื้อหาหนังสือ
  bodySection: {
    marginBottom: 30
  },

  paragraph: {
    fontSize: fontSizes.thai.medium,
    lineHeight: 2,
    textAlign: 'justify',
    marginBottom: 16,
    textIndent: 60, // เยื้องย่อหน้า
    wordSpacing: 2
  },

  paragraphNoIndent: {
    fontSize: fontSizes.thai.medium,
    lineHeight: 2,
    textAlign: 'justify',
    marginBottom: 16,
    wordSpacing: 2
  },

  // รายการ
  listContainer: {
    marginLeft: 60,
    marginBottom: 16
  },

  listItem: {
    fontSize: fontSizes.thai.medium,
    lineHeight: 1.8,
    marginBottom: 8,
    flexDirection: 'row'
  },

  listNumber: {
    minWidth: 30,
    fontWeight: 'bold'
  },

  listContent: {
    flex: 1
  },

  // ข้อมูลนักศึกษา
  studentInfo: {
    marginLeft: 80,
    marginBottom: 16
  },

  studentItem: {
    fontSize: fontSizes.thai.medium,
    lineHeight: 1.8,
    marginBottom: 6,
    flexDirection: 'row'
  },

  studentNumber: {
    minWidth: 25,
    fontWeight: 'bold'
  },

  studentDetails: {
    flex: 1
  },

  // ตาราง
  table: {
    width: '100%',
    marginVertical: 15
  },

  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: themeColors.gray300,
    paddingVertical: 8
  },

  tableCell: {
    flex: 1,
    fontSize: fontSizes.thai.normal,
    paddingHorizontal: 8
  },

  tableHeader: {
    backgroundColor: themeColors.gray100,
    fontWeight: 'bold',
    borderBottomWidth: 2,
    borderBottomColor: themeColors.gray400
  },

  // ส่วนลายเซ็น
  signatureSection: {
    marginTop: 40,
    alignItems: 'flex-end',
    paddingRight: 60
  },

  closingPhrase: {
    fontSize: fontSizes.thai.medium,
    marginBottom: 60,
    textAlign: 'center'
  },

  signatureBlock: {
    alignItems: 'center',
    minWidth: 200
  },

  signatureLine: {
    borderBottomWidth: 1,
    borderBottomColor: '#000000',
    width: 250,
    marginBottom: 8,
    minHeight: 60
  },

  signerName: {
    fontSize: fontSizes.thai.medium,
    fontWeight: 'bold',
    marginBottom: 3,
    textAlign: 'center'
  },

  signerTitle: {
    fontSize: fontSizes.thai.normal,
    textAlign: 'center',
    marginBottom: 3
  },

  signerPosition: {
    fontSize: fontSizes.thai.normal,
    textAlign: 'center'
  },

  signatureDate: {
    fontSize: fontSizes.thai.normal,
    marginTop: 15,
    textAlign: 'center'
  },

  // ส่วนท้าย
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    borderTop: '1 solid #CCCCCC',
    paddingTop: 15
  },

  footerText: {
    fontSize: fontSizes.thai.small,
    color: themeColors.gray500,
    lineHeight: 1.5
  },

  contactFooter: {
    fontSize: fontSizes.thai.small,
    color: themeColors.gray600,
    marginTop: 5
  },

  // สำเนาถึง
  copyToSection: {
    marginTop: 30,
    marginLeft: 60
  },

  copyToLabel: {
    fontSize: fontSizes.thai.normal,
    fontWeight: 'bold',
    marginBottom: 8
  },

  copyToItem: {
    fontSize: fontSizes.thai.normal,
    marginBottom: 5
  },

  // หมายเหตุ
  noteSection: {
    marginTop: 20,
    padding: 15,
    backgroundColor: themeColors.gray100,
    borderLeft: `3 solid ${themeColors.warning}`
  },

  noteLabel: {
    fontSize: fontSizes.thai.normal,
    fontWeight: 'bold',
    marginBottom: 5,
    color: themeColors.warning
  },

  noteText: {
    fontSize: fontSizes.thai.small,
    lineHeight: 1.6,
    color: themeColors.gray700
  },

  // ส่วนประกาศ
  announcementBox: {
    border: `2 solid ${themeColors.university.primary}`,
    borderRadius: 8,
    padding: 20,
    marginVertical: 20,
    backgroundColor: themeColors.university.light
  },

  announcementTitle: {
    fontSize: fontSizes.thai.medium,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 15,
    color: themeColors.university.primary
  },

  // Highlight box
  highlightBox: {
    backgroundColor: themeColors.warning + '20',
    borderLeft: `4 solid ${themeColors.warning}`,
    padding: 12,
    marginVertical: 10
  },

  highlightText: {
    fontSize: fontSizes.thai.normal,
    fontWeight: 'bold',
    color: themeColors.gray700
  },

  // สำหรับหนังสือเร่งด่วน
  urgentMarker: {
    position: 'absolute',
    top: 15,
    right: 15,
    backgroundColor: themeColors.error,
    color: themeColors.white,
    fontSize: fontSizes.thai.small,
    fontWeight: 'bold',
    padding: 8,
    borderRadius: 4,
    transform: 'rotate(15deg)'
  },

  // สำหรับหนังสือลับ
  confidentialMarker: {
    position: 'absolute',
    top: 15,
    left: 15,
    backgroundColor: themeColors.gray700,
    color: themeColors.white,
    fontSize: fontSizes.thai.small,
    fontWeight: 'bold',
    padding: 8,
    borderRadius: 4
  }
});

// ฟังก์ชันช่วยสำหรับจัดรูปแบบหนังสือ
export const letterHelpers = {
  // จัดรูปแบบหมายเลขหนังสือ
  formatDocumentNumber: (type, number, year) => {
    const thaiYear = year + 543;
    const typeMap = {
      official: 'ศธ',
      urgent: 'ด่วน',
      confidential: 'ลับ'
    };
    return `${typeMap[type] || 'ศธ'} ๐๕๒๑.๒(๓)/${number}/${thaiYear}`;
  },

  // จัดรูปแบบที่อยู่
  formatAddress: (address) => {
    return address.split(',').map(line => line.trim());
  },

  // สร้างรายการนักศึกษา
  formatStudentList: (students) => {
    return students.map((student, index) => ({
      number: index + 1,
      text: `${student.fullName} รหัสนักศึกษา ${student.studentCode} ชั้นปีที่ ${student.yearLevel} ห้อง ${student.classroom}`
    }));
  }
};

export default letterStyles;