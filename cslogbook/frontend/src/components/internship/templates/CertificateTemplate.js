import React from 'react';
import { Document, Page, Text, View } from '@react-pdf/renderer';
import certificateStyles from './styles/certificateStyles'; // ✅ เปลี่ยนเป็น default import เหมือน letterStyles
import { formatThaiDate } from '../../../utils/dateUtils';
import { formatFullName } from '../../../utils/thaiFormatter';

/**
 * เทมเพลตหนังสือรับรองการฝึกงาน (แนวนอน)
 * @param {Object} props - ข้อมูลสำหรับหนังสือรับรอง
 */
const CertificateTemplate = ({ data = {} }) => {
  // ข้อมูลเริ่มต้น
  const defaultData = {
    studentName: '',
    studentId: '',
    studentYear: '',
    studentClass: '',
    companyName: '',
    companyAddress: '',
    internshipStartDate: '',
    internshipEndDate: '',
    supervisorName: '',
    supervisorPosition: '',
    advisorName: '',
    certificateDate: new Date(),
    isCompleted: true, // สำหรับแสดง checkbox ที่เช็คแล้ว
    ...data
  };

  // จัดรูปแบบข้อมูล
  const studentFullName = formatFullName(
    defaultData.studentName,
    '',
    defaultData.studentTitle || 'นาย/นาง/นางสาว'
  );
  
  const startDateThai = formatThaiDate(defaultData.internshipStartDate);
  const endDateThai = formatThaiDate(defaultData.internshipEndDate);
  const certificateDateThai = formatThaiDate(defaultData.certificateDate);
  
  // คำนวณจำนวณวันฝึกงาน
  const calculateDuration = (startDate, endDate) => {
    if (!startDate || !endDate) return '';
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  };
  
  const durationDays = calculateDuration(defaultData.internshipStartDate, defaultData.internshipEndDate);

  return (
    <Document>
      <Page size="A4" orientation="landscape" style={certificateStyles.page}>
        {/* เส้นขอบตกแต่ง */}
        <View style={certificateStyles.decorativeBorder} />
        <View style={certificateStyles.innerBorder} />
        
        {/* หัวข้อหลัก */}
        <View style={certificateStyles.header}>
          <Text style={certificateStyles.title}>หนังสือรับรองการฝึกงาน</Text>
        </View>
        
        {/* ตารางข้อมูลนักศึกษา */}
        <View style={certificateStyles.studentInfoTable}>
          <View style={certificateStyles.tableRow}>
            <Text style={certificateStyles.tableCellLabel}>ชื่อ - นามสกุล</Text>
            <Text style={certificateStyles.tableCellValue}>{studentFullName}</Text>
            <Text style={certificateStyles.tableCellLabel}>รหัสนักศึกษา</Text>
            <Text style={certificateStyles.tableCellValueLast}>{defaultData.studentId}</Text>
          </View>
          <View style={certificateStyles.tableRowLast}>
            <Text style={certificateStyles.tableCellLabel}>สถานที่ฝึกงาน</Text>
            <Text style={certificateStyles.tableCellCompany}>
              {defaultData.companyName}
            </Text>
          </View>
        </View>
        
        {/* เนื้อหาหลัก */}
        <View style={certificateStyles.mainContent}>
          <Text style={certificateStyles.contentText}>
            ภาควิชาวิทยาการคอมพิวเตอร์และสารสนเทศ ขอรับรองว่า นักศึกษาได้ผ่านการฝึกงานภาคสนาม
            ตามหลักสูตรที่กำหนด (ไม่น้อยกว่า 240 ชั่วโมง) และส่งเอกสารหลังเสร็จสิ้นการฝึกงานเป็นที่เรียบร้อยแล้ว
          </Text>
        </View>
        
        {/* ส่วนตรวจสอบเอกสาร */}
        <View style={certificateStyles.checkboxSection}>
          <Text style={certificateStyles.checkboxTitle}>ตรวจสอบเอกสาร</Text>
          
          <View style={certificateStyles.checkboxItem}>
            <View style={defaultData.isCompleted ? certificateStyles.checkboxChecked : certificateStyles.checkbox}>
              {defaultData.isCompleted && <Text style={{ color: '#ffffff', fontSize: 10 }}>✓</Text>}
            </View>
            <Text style={certificateStyles.checkboxText}>ใบลงเวลาของนักศึกษาฝึกงาน</Text>
          </View>
          
          <View style={certificateStyles.checkboxItem}>
            <View style={defaultData.isCompleted ? certificateStyles.checkboxChecked : certificateStyles.checkbox}>
              {defaultData.isCompleted && <Text style={{ color: '#ffffff', fontSize: 10 }}>✓</Text>}
            </View>
            <Text style={certificateStyles.checkboxText}>แบบประเมินผลการฝึกงาน</Text>
          </View>
          
          <View style={certificateStyles.checkboxItem}>
            <View style={defaultData.isCompleted ? certificateStyles.checkboxChecked : certificateStyles.checkbox}>
              {defaultData.isCompleted && <Text style={{ color: '#ffffff', fontSize: 10 }}>✓</Text>}
            </View>
            <Text style={certificateStyles.checkboxText}>สมุดบันทึกการปฏิบัติงาน</Text>
          </View>
        </View>
        
        {/* ส่วนลายเซ็น */}
        <View style={certificateStyles.signatureSection}>
          <View style={certificateStyles.signatureBox}>
            <Text style={certificateStyles.signatureLabel}>ลงชื่อ..................................................</Text>
            <View style={certificateStyles.signatureLine} />
            <Text style={certificateStyles.signerName}>
              ({defaultData.supervisorName || 'นางสาวจันทิมา อรรฆจิตต์'})
            </Text>
            <Text style={certificateStyles.signerTitle}>นักวิชาการศึกษา</Text>
          </View>
          
          <View style={certificateStyles.signatureBox}>
            <Text style={certificateStyles.signatureLabel}>ลงชื่อ..................................................</Text>
            <View style={certificateStyles.signatureLine} />
            <Text style={certificateStyles.signerName}>
              ({defaultData.advisorName || 'ผู้ช่วยศาสตราจารย์ ดร.อภิชาต บุญมา'})
            </Text>
            <Text style={certificateStyles.signerTitle}>หัวหน้าภาควิชาวิทยาการคอมพิวเตอร์และสารสนเทศ</Text>
          </View>
        </View>
        
        {/* วันที่ */}
        <View style={certificateStyles.dateSection}>
          <Text>วันที่ {certificateDateThai}</Text>
        </View>
        
        {/* หมายเหตุ */}
        <View style={certificateStyles.noteSection}>
          <Text>**นักศึกษาส่งเอกสารฉบับนี้แก่อาจารย์ประจำวิชาของนักศึกษาแต่ละภาคการศึกษาด้วย**</Text>
        </View>
      </Page>
    </Document>
  );
};

export default CertificateTemplate;