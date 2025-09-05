import { StyleSheet } from '@react-pdf/renderer';

export const officialStyles = StyleSheet.create({
  // หัวเอกสารทางการ
  officialHeader: {
    textAlign: 'center',
    marginBottom: 30,
    borderBottom: '2 solid #000000',
    paddingBottom: 15
  },

  universityName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 5
  },

  facultyName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5
  },

  departmentName: {
    fontSize: 16,
    marginBottom: 10
  },

  address: {
    fontSize: 14,
    marginBottom: 3
  },

  // เลขที่เอกสาร
  documentNumber: {
    textAlign: 'right',
    fontSize: 14,
    marginBottom: 15
  },

  // วันที่เอกสาร
  documentDate: {
    textAlign: 'right',
    fontSize: 14,
    marginBottom: 25
  },

  // เรื่อง
  subject: {
    marginBottom: 15,
    fontSize: 16
  },

  subjectLabel: {
    fontWeight: 'bold'
  },

  // เรียน
  salutation: {
    marginBottom: 15,
    fontSize: 16
  },

  salutationLabel: {
    fontWeight: 'bold'
  },

  // เนื้อหาจดหมาย
  paragraph: {
    marginBottom: 15,
    textAlign: 'justify',
    fontSize: 16,
    lineHeight: 1.8,
    textIndent: 50
  },

  // รายการ
  listItem: {
    marginBottom: 8,
    fontSize: 16,
    lineHeight: 1.6,
    textIndent: 50
  },

  // ลายเซ็นทางการ
  officialSignature: {
    marginTop: 50,
    textAlign: 'center'
  },

  signatureTitle: {
    fontSize: 16,
    marginBottom: 60
  },

  signatureNameOfficial: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5
  },

  signaturePosition: {
    fontSize: 15,
    marginBottom: 3
  },

  // ส่วนท้าย
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    fontSize: 12,
    color: '#666666',
    borderTop: '1 solid #CCCCCC',
    paddingTop: 15
  },

  // ตราประทับ
  seal: {
    width: 80,
    height: 80,
    marginVertical: 20
  }
});