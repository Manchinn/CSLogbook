import { StyleSheet } from '@react-pdf/renderer';
import { formatThaiDate } from '../../../../utils/dateUtils';
import { cleanText } from '../../../../utils/thaiFormatter';


export { formatThaiDate, cleanText };
export const safeText = cleanText; // alias สำหรับ backward compatibility

export const commonStyles = StyleSheet.create({
  // หน้าพื้นฐาน
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 40,
    fontFamily: 'Sarabun',
    fontSize: 14,
    lineHeight: 1.6,
    color: '#000000'
  },

  // ข้อความพื้นฐาน
  text: {
    fontSize: 14,
    lineHeight: 1.6,
    marginBottom: 5
  },

  textBold: {
    fontSize: 14,
    fontWeight: 'bold',
    lineHeight: 1.6
  },

  textSmall: {
    fontSize: 12,
    lineHeight: 1.5
  },

  // หัวข้อต่างๆ
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#000000'
  },

  subtitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333333'
  },

  sectionTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 10,
    marginTop: 15,
    color: '#000000'
  },

  // เลย์เอาต์
  container: {
    width: '100%'
  },

  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8
  },

  column: {
    flexDirection: 'column'
  },

  // ช่องข้อมูล
  field: {
    marginBottom: 10
  },

  label: {
    fontSize: 14,
    fontWeight: 'bold',
    minWidth: 120,
    marginRight: 10
  },

  value: {
    fontSize: 14,
    flex: 1
  },

  // เส้นแบ่ง
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: '#CCCCCC',
    marginVertical: 15
  },

  solidDivider: {
    borderBottomWidth: 2,
    borderBottomColor: '#000000',
    marginVertical: 20
  },

  // กล่องข้อมูล
  infoBox: {
    border: '1 solid #CCCCCC',
    borderRadius: 5,
    padding: 15,
    marginVertical: 10,
    backgroundColor: '#F9F9F9'
  },

  // ตาราง
  table: {
    width: '100%',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#000000',
    marginVertical: 10
  },

  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#000000',
    minHeight: 25,
    alignItems: 'center'
  },

  tableCell: {
    flex: 1,
    padding: 8,
    fontSize: 13,
    textAlign: 'left'
  },

  tableCellCenter: {
    flex: 1,
    padding: 8,
    fontSize: 13,
    textAlign: 'center'
  },

  tableHeader: {
    backgroundColor: '#F0F0F0',
    fontWeight: 'bold'
  },

  // ลายเซ็น
  signatureSection: {
    marginTop: 40,
    flexDirection: 'row',
    justifyContent: 'space-between'
  },

  signatureBox: {
    width: '45%',
    textAlign: 'center',
    minHeight: 80
  },

  signatureLine: {
    borderBottomWidth: 1,
    borderBottomColor: '#000000',
    marginBottom: 5,
    minHeight: 50
  },

  signatureLabel: {
    fontSize: 13,
    marginBottom: 10
  },

  signatureName: {
    fontSize: 13,
    marginTop: 5
  },

  // วันที่
  dateSection: {
    textAlign: 'right',
    marginBottom: 20
  },

  // Footer
  footer: {
    textAlign: 'center',
    fontSize: 12,
    color: '#666666',
    paddingTop: 15
  },

  footerText: {
    fontSize: 12,
    color: '#666666',
    lineHeight: 1.4
  },

  // Watermark
  watermark: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%) rotate(-45deg)',
    fontSize: 48,
    color: '#F0F0F0',
    fontWeight: 'bold',
    zIndex: -1
  }
});