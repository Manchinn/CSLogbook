import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

// ✅ Utils - ใช้ที่มีอยู่แล้ว
import { formatThaiDate } from '../../../utils/dateUtils';
import { formatFullName, cleanText } from '../../../utils/thaiFormatter';

// ✅ Styles - ใช้ที่มีอยู่แล้ว
import { commonStyles, officialStyles } from './styles';

// ✅ สร้าง styles สำหรับ Certificate
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    padding: 40,
    fontFamily: 'THSarabunNew',
  },
  title: {
    fontSize: 24,
    textAlign: 'center',
    marginBottom: 20,
    fontWeight: 'bold',
  },
  content: {
    fontSize: 16,
    lineHeight: 1.5,
    marginBottom: 10,
  },
  signature: {
    marginTop: 40,
    textAlign: 'center',
  },
  watermark: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%) rotate(-45deg)',
    fontSize: 72,
    color: '#f0f0f0',
    zIndex: -1,
  },
});

/**
 * ✅ Template สำหรับหนังสือรับรองการฝึกงาน
 * @param {Object} props - ข้อมูลที่ส่งมา
 * @param {Object} props.data - ข้อมูลหนังสือรับรอง
 * @param {boolean} props.isPreview - เป็น preview หรือไม่
 */
const CertificateTemplate = ({ data, isPreview = false }) => {
  // ✅ ตรวจสอบข้อมูลและใส่ค่าเริ่มต้น
  const certificateData = {
    studentName: cleanText(data?.studentName || ''),
    studentId: cleanText(data?.studentId || ''),
    companyName: cleanText(data?.companyName || ''),
    startDate: data?.startDate || '',
    endDate: data?.endDate || '',
    totalHours: data?.totalHours || 0,
    totalDays: data?.totalDays || 0,
    supervisorName: cleanText(data?.supervisorName || ''),
    supervisorPosition: cleanText(data?.supervisorPosition || ''),
    internshipPosition: cleanText(data?.internshipPosition || 'การฝึกงาน'),
    ...data
  };

  // ✅ ฟังก์ชันสร้างเลขที่หนังสือรับรอง
  const generateCertificateNumber = () => {
    const year = new Date().getFullYear() + 543; // พ.ศ.
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    const random = Math.floor(Math.random() * 999).toString().padStart(3, '0');
    return `อว 7105(16)/${month}${year.toString().slice(-2)}-${random}`;
  };

  // ✅ ฟังก์ชันคำนวณจำนวนวัน
  const calculateDays = () => {
    if (certificateData.totalDays) return certificateData.totalDays;
    if (certificateData.startDate && certificateData.endDate) {
      const start = new Date(certificateData.startDate);
      const end = new Date(certificateData.endDate);
      const diffTime = Math.abs(end - start);
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }
    return Math.ceil(certificateData.totalHours / 8) || 0;
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* ✅ Watermark สำหรับ Preview */}
        {isPreview && (
          <View style={styles.watermark}>
            <Text>ตัวอย่าง</Text>
          </View>
        )}

        {/* ✅ หัวเรื่องหนังสือรับรอง */}
        <View>
          <Text style={styles.title}>
            หนังสือรับรองการฝึกงาน
          </Text>
          
          <View style={{ marginBottom: 20 }}>
            <Text style={{ fontSize: 14, textAlign: 'left' }}>
              เลขที่: {generateCertificateNumber()}
            </Text>
            <Text style={{ fontSize: 14, textAlign: 'right' }}>
              วันที่: {formatThaiDate(new Date(), 'DD MMMM BBBB')}
            </Text>
          </View>
        </View>

        {/* ✅ เนื้อหาหนังสือรับรอง */}
        <View>
          <Text style={styles.content}>
            ข้าพเจ้าขอรับรองว่า
          </Text>
          
          <Text style={[styles.content, { marginLeft: 40 }]}>
            นาย/นาง/นางสาว {certificateData.studentName || '........................'}
          </Text>
          
          <Text style={[styles.content, { marginLeft: 40 }]}>
            รหัสนักศึกษา {certificateData.studentId || '........................'}
          </Text>
          
          <Text style={styles.content}>
            นักศึกษาสาขาวิชาวิทยาการคอมพิวเตอร์และสารสนเทศ คณะวิทยาศาสตร์ประยุกต์
          </Text>
          
          <Text style={styles.content}>
            มหาวิทยาลัยเทคโนโลยีพระจอมเกล้าพระนครเหนือ
          </Text>
          
          <Text style={styles.content}>
            ได้เข้าฝึกงานด้าน{certificateData.internshipPosition} ณ {certificateData.companyName || '........................'}
          </Text>
          
          {certificateData.startDate && certificateData.endDate ? (
            <Text style={styles.content}>
              ตั้งแต่วันที่ {formatThaiDate(certificateData.startDate, 'DD MMMM BBBB')} ถึงวันที่ {formatThaiDate(certificateData.endDate, 'DD MMMM BBBB')}
            </Text>
          ) : (
            <Text style={styles.content}>
              ตั้งแต่วันที่ ........................ ถึงวันที่ ........................
            </Text>
          )}
          
          <Text style={styles.content}>
            รวม {calculateDays()} วัน เป็นเวลา {certificateData.totalHours} ชั่วโมง
          </Text>
          
          <Text style={styles.content}>
            โดยมีผลการปฏิบัติงานในระดับที่น่าพอใจ
          </Text>
          
          {certificateData.supervisorName && (
            <Text style={styles.content}>
              ภายใต้การดูแลของ {certificateData.supervisorName} 
              {certificateData.supervisorPosition && ` ตำแหน่ง ${certificateData.supervisorPosition}`}
            </Text>
          )}
          
          <Text style={styles.content}>
            จึงออกหนังสือรับรองนี้ให้ไว้เป็นหลักฐาน
          </Text>
        </View>

        {/* ✅ ลายเซ็นและตรายาง */}
        <View style={styles.signature}>
          <Text style={styles.content}>
            ออกให้ ณ วันที่ {formatThaiDate(new Date(), 'DD MMMM BBBB')}
          </Text>
          
          <View style={{ marginTop: 40 }}>
            <Text style={styles.content}>
              ผู้ช่วยศาสตราจารย์ ดร.อภิชาต บุญมา
            </Text>
            <Text style={styles.content}>
              หัวหน้าภาควิชาวิทยาการคอมพิวเตอร์และสารสนเทศ
            </Text>
            <Text style={styles.content}>
              คณะวิทยาศาสตร์ประยุกต์
            </Text>
            <Text style={styles.content}>
              มหาวิทยาลัยเทคโนโลยีพระจอมเกล้าพระนครเหนือ
            </Text>
          </View>
        </View>
      </Page>
    </Document>
  );
};

export default CertificateTemplate;