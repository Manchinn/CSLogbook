import { StyleSheet } from '@react-pdf/renderer';
import { themeColors } from './themeStyles';

const certificateStyles = StyleSheet.create({
  // หน้ากระดาษแนวนอน - โทนเรียบง่าย เหมือนตัวอย่างอ้างอิง
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    padding: 36,
    fontFamily: 'THSarabunNew',
    fontSize: 18,
    lineHeight: 1.35,
  },

  decorativeBorder: {
    position: 'absolute',
    top: 26,
    left: 26,
    right: 26,
    bottom: 26,
    border: '1.6px solid #2d2d2d',
    borderRadius: 6,
  },

  watermark: {
    position: 'absolute',
    top: '25%',
    left: 0,
    right: 0,
    textAlign: 'center',
    fontSize: 110,
    color: 'rgba(226, 36, 43, 0.08)',
    fontWeight: 'bold',
    letterSpacing: 8,
    textTransform: 'uppercase',
  },

  contentWrapper: {
    flex: 1,
    justifyContent: 'space-between',
  },

  header: {
    alignItems: 'center',
    marginBottom: 18,
  },

  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111111',
  },

  certificateNumber: {
    fontSize: 16,
    color: '#444444',
    marginTop: 4,
  },

  studentInfoTable: {
    border: '1.6px solid #000000',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 18,
  },

  tableRow: {
    flexDirection: 'row',
    minHeight: 38,
  },

  tableRowBorder: {
    borderBottom: '1.1px solid #000000',
  },

  tableCellLabel: {
    width: '25%',
    borderRight: '1.1px solid #000000',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f7f7f7',
    fontWeight: 'bold',
    fontSize: 18,
    paddingVertical: 6,
  },

  tableCellValue: {
    width: '25%',
    borderRight: '1.1px solid #000000',
    justifyContent: 'center',
    alignItems: 'center',
    fontSize: 18,
    paddingVertical: 6,
  },

  tableCellValueWide: {
    width: '75%',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    fontSize: 18,
  },

  mainParagraph: {
    fontSize: 18,
    textAlign: 'justify',
    marginBottom: 22,
  },

  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },

  checklistBox: {
    width: '45%',
    border: '1.4px solid #000000',
    borderRadius: 4,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#ffffff',
  },

  checklistTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'left',
    marginBottom: 10,
    color: '#111111',
  },

  checklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },

  checkbox: {
    width: 18,
    height: 18,
    border: '1.4px solid #000000',
    borderRadius: 2,
    marginRight: 10,
  },

  checkboxChecked: {
    width: 18,
    height: 18,
    border: '1.4px solid #000000',
    borderRadius: 2,
    marginRight: 10,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },

  checkboxMark: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
  },

  checklistText: {
    fontSize: 18,
    flex: 1,
  },

  signatureBlock: {
    width: '40%',
    alignItems: 'center',
  },

  signatureLine: {
    width: '100%',
    height: 1.2,
    backgroundColor: '#000000',
    marginBottom: 4,
  },

  signatureLabel: {
    fontSize: 18,
    marginBottom: 24,
  },

  signerName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: themeColors.university.primary,
  },

  signerTitle: {
    fontSize: 17,
  },

  signatureDate: {
    fontSize: 18,
    marginTop: 12,
    textAlign: 'center',
  },

  note: {
    textAlign: 'center',
    fontSize: 16,
    color: '#444444',
    marginTop: 12,
  },
});

export default certificateStyles;