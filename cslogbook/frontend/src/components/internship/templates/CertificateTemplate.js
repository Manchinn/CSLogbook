import React from 'react';
import { Document, Page, Text, View } from '@react-pdf/renderer';
import certificateStyles from './styles/certificateStyles';
import { formatThaiDate } from '../../../utils/dateUtils';
import { formatFullName } from '../../../utils/thaiFormatter';

/**
 * เทมเพลตหนังสือรับรองการฝึกงาน (แนวนอน - ตรงตามรูปแบบมาตรฐาน)
 * @param {Object} props - ข้อมูลสำหรับหนังสือรับรอง
 */
const CertificateTemplate = ({ data = {} }) => {
  // ✅ รับข้อมูลที่เตรียมแล้วจาก OfficialDocumentService.prepareCertificateDataNew
  const defaultData = {
    // ข้อมูลนักศึกษา (จาก prepareCertificateDataNew)
    studentName: '', // จะมาจาก studentInfo.fullName
    studentId: '',   // จะมาจาก studentInfo.studentId
    fullName: '',
    firstName: '',
    lastName: '',
    yearLevel: 4,
    classroom: '',
    
    // ข้อมูลการฝึกงาน
    companyName: '',     // จะมาจาก enhanced company detection
    companyAddress: '',
    internshipStartDate: '',
    internshipEndDate: '',
    totalHours: 240,
    
    // ข้อมูลผู้ควบคุมงาน
    supervisorName: '',
    supervisorPosition: '',
    
    // ข้อมูลเอกสาร
    certificateDate: new Date(),
    isCompleted: true,
    
    // ข้อมูลอนุมัติ
    approvedBy: 'นางสาวจันทิมา อรรฆจิตต์',
    approverTitle: 'นักวิชาการศึกษา',

    // ข้อมูลสถาบัน/เอกสารเพิ่มเติม
    facultyName: 'ภาควิชาวิทยาการคอมพิวเตอร์และสารสนเทศ',
    programName: 'หลักสูตรวิทยาศาสตรบัณฑิต สาขาวิชาวิทยาการคอมพิวเตอร์',
  institutionName: 'คณะวิทยาศาสตร์ประยุกต์',
  certificateNumber: '',
  issueLocation: 'ภาควิชาวิทยาการคอมพิวเตอร์และสารสนเทศ',
  academicYear: '',
    
    // ✅ ผสานข้อมูลที่ส่งเข้ามา
    ...data
  };

  // ✅ จัดรูปแบบข้อมูลให้แสดงผลถูกต้อง
  const studentFullName = formatFullName(
    defaultData.firstName || defaultData.studentName || defaultData.fullName || '',
    defaultData.lastName || '',
  ) || defaultData.studentName || defaultData.fullName || 'ชื่อนักศึกษา';
  
  const studentId = defaultData.studentId || 'รหัสนักศึกษา';
  const companyName = defaultData.companyName || 'สถานที่ฝึกงาน';
  const issueLocation = defaultData.issueLocation || defaultData.facultyName;
  
  const certificateDateThai = formatThaiDate(defaultData.certificateDate);

  // ✅ Enhanced debug logging สำหรับตรวจสอบข้อมูล
  if (process.env.NODE_ENV === 'development') {
    console.log('📄 CertificateTemplate received data:', {
      originalData: data,
      processedData: {
        studentFullName,
        studentId,
        companyName,
        isCompleted: defaultData.isCompleted,
        totalHours: defaultData.totalHours
      },
      debugInfo: defaultData.debug
    });

    // แสดงข้อมูลสำคัญที่ใช้ในการแสดงผล
    console.log('🎯 Key display data:', {
      'ชื่อนักศึกษา': studentFullName,
      'รหัสนักศึกษา': studentId,
      'สถานที่ฝึกงาน': companyName,
      'ชั่วโมงฝึกงาน': defaultData.totalHours,
      'สถานะการเสร็จสิ้น': defaultData.isCompleted ? 'เสร็จสิ้น' : 'ยังไม่เสร็จ'
    });

    // ✅ เพิ่ม Debug สำหรับ Company Detection
    if (defaultData.debug?.companyDetectionLog) {
      console.log('🏢 Company Detection Debug:', defaultData.debug.companyDetectionLog);
    }

    // ตรวจสอบข้อมูลที่หายไป
    const missingData = [];
    if (!studentFullName || studentFullName === 'ชื่อนักศึกษา') missingData.push('ชื่อนักศึกษา');
    if (!studentId || studentId === 'รหัสนักศึกษา') missingData.push('รหัสนักศึกษา');
    if (!companyName || companyName === 'สถานที่ฝึกงาน') missingData.push('สถานที่ฝึกงาน');
    
    if (missingData.length > 0) {
      console.warn('⚠️ Missing data detected:', missingData);
      
      // ✅ แสดงข้อมูลที่มีอยู่ทั้งหมดเพื่อช่วย debug
      console.log('🔍 Available data structure for debugging:', {
        topLevelKeys: Object.keys(data || {}),
        companyRelatedKeys: Object.keys(data || {}).filter(key => 
          key.toLowerCase().includes('company') || 
          key.toLowerCase().includes('internship')
        ),
        nestedObjectKeys: Object.keys(data || {}).reduce((acc, key) => {
          if (data[key] && typeof data[key] === 'object' && !Array.isArray(data[key])) {
            acc[key] = Object.keys(data[key]);
          }
          return acc;
        }, {})
      });
    } else {
      console.log('✅ All required data is available for PDF generation');
    }
  }

  return (
    <Document>
      <Page size="A4" orientation="landscape" style={certificateStyles.page}>
        {/* เส้นขอบตกแต่งและลายน้ำแบบเรียบง่าย */}
        <View style={certificateStyles.decorativeBorder} />
        <Text style={certificateStyles.watermark}>KMUTNB</Text>

        <View style={certificateStyles.contentWrapper}>
          {/* ส่วนหัว */}
          <View style={certificateStyles.header}>
            <Text style={certificateStyles.title}>หนังสือรับรองการฝึกงาน</Text>
          </View>

          {/* ตารางข้อมูลนักศึกษา */}
          <View style={certificateStyles.studentInfoTable}>
            <View style={[certificateStyles.tableRow, certificateStyles.tableRowBorder]}>
              <Text style={certificateStyles.tableCellLabel}>ชื่อ - นามสกุล</Text>
              <Text style={certificateStyles.tableCellValue}>{studentFullName}</Text>
              <Text style={certificateStyles.tableCellLabel}>รหัสนักศึกษา</Text>
              <Text style={certificateStyles.tableCellValue}>{studentId}</Text>
            </View>
            <View style={certificateStyles.tableRow}>
              <Text style={certificateStyles.tableCellLabel}>สถานที่ฝึกงาน</Text>
              <Text style={certificateStyles.tableCellValueWide}>{companyName}</Text>
            </View>
          </View>

          {/* เนื้อหาหลักของเอกสาร */}
          <Text style={certificateStyles.mainParagraph}>
            ภาควิชาวิทยาการคอมพิวเตอร์และสารสนเทศ ขอรับรองว่า นักศึกษาได้ผ่านการฝึกงานภาคสนามตามหลักสูตรที่กำหนด
            {defaultData.totalHours ? ` (ไม่น้อยกว่า ${defaultData.totalHours} ชั่วโมง)` : ' (ไม่น้อยกว่า 240 ชั่วโมง)'}
            และส่งเอกสารหลังเสร็จสิ้นการฝึกงานเป็นที่เรียบร้อยแล้ว
          </Text>

          {/* ส่วนล่าง: กล่องตรวจสอบเอกสาร + ลายเซ็น */}
          <View style={certificateStyles.bottomRow}>
            <View style={certificateStyles.checklistBox}>
              <Text style={certificateStyles.checklistTitle}>ตรวจสอบเอกสาร</Text>

              <View style={certificateStyles.checklistItem}>
                <View style={defaultData.isCompleted ? certificateStyles.checkboxChecked : certificateStyles.checkbox}>
                  {defaultData.isCompleted && <Text style={certificateStyles.checkboxMark}>✓</Text>}
                </View>
                <Text style={certificateStyles.checklistText}>ใบลงเวลาของนักศึกษาฝึกงาน</Text>
              </View>

              <View style={certificateStyles.checklistItem}>
                <View style={defaultData.isCompleted ? certificateStyles.checkboxChecked : certificateStyles.checkbox}>
                  {defaultData.isCompleted && <Text style={certificateStyles.checkboxMark}>✓</Text>}
                </View>
                <Text style={certificateStyles.checklistText}>แบบประเมินผลการฝึกงาน</Text>
              </View>

              <View style={certificateStyles.checklistItem}>
                <View style={defaultData.isCompleted ? certificateStyles.checkboxChecked : certificateStyles.checkbox}>
                  {defaultData.isCompleted && <Text style={certificateStyles.checkboxMark}>✓</Text>}
                </View>
                <Text style={certificateStyles.checklistText}>สมุดบันทึกการปฏิบัติงาน</Text>
              </View>
            </View>

            <View style={certificateStyles.signatureBlock}>
              <Text style={certificateStyles.signatureLabel}>ลงชื่อ..................................................</Text>
              <View style={certificateStyles.signatureLine} />
              <Text style={certificateStyles.signerName}>
                ({defaultData.approvedBy || 'นางสาวจันทิมา อรรฆจิตต์'})
              </Text>
              <Text style={certificateStyles.signerTitle}>
                {defaultData.approverTitle || 'นักวิชาการศึกษา'}
              </Text>
              <Text style={certificateStyles.signatureDate}>
                ออกให้ ณ {issueLocation} วันที่ {certificateDateThai}
              </Text>
            </View>
          </View>

          {/* หมายเหตุ */}
          <Text style={certificateStyles.note}>
            **นักศึกษาส่งเอกสารฉบับนี้แก่อาจารย์ประจำวิชาของนักศึกษาแต่ละภาคการศึกษาด้วย**
          </Text>
        </View>
      </Page>
    </Document>
  );
};

export default CertificateTemplate;