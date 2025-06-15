import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font, Image } from '@react-pdf/renderer';
import { formatThaiDate, formatOfficialDate } from '../../../utils/dateUtils';
import { formatFullName, formatThaiPhoneNumber } from '../../../utils/thaiFormatter';
import { officialStyles } from './styles/officialStyles';

// ลงทะเบียนฟอนต์ไทย
Font.register({
  family: 'THSarabunNew',
  fonts: [
    { src: '/assets/fonts/THSarabunNew.ttf', fontWeight: 'normal' },
    { src: '/assets/fonts/THSarabunNew-Bold.ttf', fontWeight: 'bold' }
  ]
});

// 🎨 สไตล์เฉพาะสำหรับแบบฟอร์มตอบรับ (ปรับแต่งให้พอดีหน้าเดียว)
const acceptanceStyles = StyleSheet.create({
  page: {
    padding: 35, // ลดจาก 42 เป็น 35
    paddingLeft: 60, // ลดจาก 75 เป็น 60
    paddingRight: 60, // ลดจาก 75 เป็น 60
    paddingTop: 25, // เพิ่มจาก 20 เป็น 25
    paddingBottom: 30, // ลดจาก 45 เป็น 30
    fontFamily: 'THSarabunNew',
    fontSize: 14,
    lineHeight: 1.2, // ลดจาก 1.3 เป็น 1.2
    backgroundColor: '#FFFFFF',
  },
  
  // หัวเอกสารพร้อมโลโก้ - ลดขนาดและระยะห่าง
  header: {
    alignItems: 'center',
    marginBottom: 8 // ลดจาก 5 เป็น 8 เพื่อให้มีพื้นที่เหมาะสม
  },
  
  logo: {
    width: 100, // ลดจาก 100 เป็น 80
    height: 90, // ลดจาก 90 เป็น 70
    marginBottom: 3 // ลดจาก 5 เป็น 3
  },
  
  universityText: {
    fontSize: 14, // ลดจาก 14 เป็น 12
    textAlign: 'center',
    color: '#8B0000',
    marginBottom: 1 // ลดจาก 2 เป็น 1
  },
  
  // หัวข้อเอกสาร - ลดระยะห่าง
  documentTitle: {
    fontSize: 18, // ลดจาก 18 เป็น 16
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 8, // เพิ่มจาก 5 เป็น 8
    marginBottom: 15 // ลดจาก 20 เป็น 15
  },
  
  // ข้อมูลเอกสาร - ลดระยะห่าง
  documentInfoContainer: {
    marginBottom: 18 // ลดจาก 25 เป็น 18
  },
  
  // บรรทัดแรก
  documentInfoRow1: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8, // ลดจาก 12 เป็น 8
    fontSize: 14 // ลดจาก 16 เป็น 14
  },
  
  // ฝั่งซ้าย: ข้อมูลบุคคล
  leftInfo: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  
  // ฝั่งขวา: ข้อมูลสถานประกอบการ
  rightInfo: {
    flex: 1,
    textAlign: 'right',
    marginLeft: 15 // ลดจาก 20 เป็น 15
  },
  
  companyInfoLine: {
    marginBottom: 2, // ลดจาก 3 เป็น 2
    fontSize: 16 // ลดจาก 16 เป็น 14
  },
  
  // บรรทัดที่สอง: วันที่
  dateInfoRow: {
    textAlign: 'right',
    fontSize: 16 // ลดจาก 16 เป็น 14
  },
  
  // ส่วนเรียน - ลดระยะห่าง
  salutation: {
    marginBottom: 15, // ลดจาก 20 เป็น 15
    fontSize: 16 // ลดจาก 16 เป็น 14
  },
  
  // ย่อหน้าหลัก - ลดระยะห่าง
  mainParagraph: {
    textAlign: 'justify',
    textIndent: 40, // ลดจาก 40 เป็น 35
    marginBottom: 12, // ลดจาก 15 เป็น 12
    fontSize: 16, // ลดจาก 16 เป็น 14
    lineHeight: 1.3 // ลดจาก 1.5 เป็น 1.3
  },
  
  // ตัวเลือกการตอบรับ - ลดระยะห่าง
  responseOption: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8, // ลดจาก 12 เป็น 8
    fontSize: 16 // ลดจาก 16 เป็น 14
  },
  
  // ช่อง checkbox
  checkboxContainer: {
    width: 18, // ลดจาก 20 เป็น 18
    alignItems: 'center',
    marginRight: 6, // ลดจาก 8 เป็น 6
    marginTop: 2
  },
  
  // รายการนักศึกษา - ลดระยะห่าง
  studentList: {
    marginLeft: 30, // ลดจาก 35 เป็น 30
    marginVertical: 6, // ลดจาก 8 เป็น 6
    fontSize: 16 // ลดจาก 16 เป็น 14
  },
  
  // ส่วนเหตุผล - ลดระยะห่าง
  reasonSection: {
    marginLeft: 30, // ลดจาก 35 เป็น 30
    marginVertical: 6, // ลดจาก 8 เป็น 6
    fontSize: 16 // ลดจาก 16 เป็น 14
  },
  
  // เส้นประสำหรับกรอก - ลดระยะห่าง
  dotLine: {
    borderBottomWidth: 1,
    borderBottomStyle: 'dotted',
    borderBottomColor: '#000000',
    height: 15, // ลดจาก 18 เป็น 15
    marginBottom: 6 // ลดจาก 8 เป็น 6
  },
  
  // ส่วนลายเซ็น - ลดระยะห่างอย่างมาก
  signatureSection: {
    marginTop: 25, // ลดจาก 40 เป็น 25
    alignItems: 'center'
  },
  
  closingText: {
    fontSize: 16, // ลดจาก 16 เป็น 14
    marginBottom: 20, // ลดจาก 30 เป็น 20
    textAlign: 'left'
  },

  closingText2: {
    fontSize: 16, // ลดจาก 16 เป็น 14
    marginBottom: 40, // ลดจาก 30 เป็น 20
    textAlign: 'center'
  },
  
  signatureLine: {
    borderBottomWidth: 1,
    borderBottomStyle: 'solid',
    borderBottomColor: '#000000',
    width: 200, // ลดจาก 250 เป็น 200
    height: 25, // ลดจาก 35 เป็น 25
    marginBottom: 8 // ลดจาก 10 เป็น 8
  },
  
  signatureText: {
    fontSize: 16, // ลดจาก 16 เป็น 14
    marginBottom: 3, // ลดจาก 5 เป็น 3
    textAlign: 'center'
  },
  
  // Watermark
  watermark: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%) rotate(-45deg)',
    fontSize: 45, // ลดจาก 50 เป็น 45
    color: '#eeeeee',
    zIndex: -1,
    opacity: 0.3
  }
});

const AcceptanceLetterTemplate = ({ data, isBlank = false }) => {
  // ข้อมูลที่ใช้ในเอกสาร
  const documentDate = formatOfficialDate(data?.documentDate || new Date());
  const student = data?.studentData?.[0] || {};
  const company = data || {};

  // 🆕 ฟังก์ชันแสดงข้อมูลหรือเส้นประ
  const displayFieldOrDots = (value, dotLength = 30) => {
    if (isBlank || !value) {
      return '..'.repeat(dotLength);
    }
    return value;
  };

  // 🆕 ฟังก์ชันแสดงวันที่หรือเส้นประ
  const displayDateOrDots = (dateValue) => {
    if (isBlank || !dateValue) {
      return '...........';
    }
    return formatThaiDate(dateValue, 'DD MMMM BBBB');
  };

    // 🆕 ฟังก์ชันสำหรับช่วงวันที่ (วันเริ่ม ถึง วันสิ้นสุด)
  const displayDateRangeOrDots = (startDate, endDate, dotLengthEach = 25) => {
    if (isBlank || !startDate || !endDate) {
      const dots = '.'.repeat(dotLengthEach);
      return `${dots} ถึง ${dots}`;
    }
    const startDateThai = formatThaiDate(startDate, 'DD MMMM BBBB');
    const endDateThai = formatThaiDate(endDate, 'DD MMMM BBBB');
    return `${startDateThai} ถึง ${endDateThai}`;
  };

  return (
    <Document>
      <Page size="A4" style={acceptanceStyles.page}>
        {/* Watermark สำหรับแบบฟอร์มว่าง */}
        {isBlank && (
          <View style={acceptanceStyles.watermark}>
            <Text>แบบฟอร์ม</Text>
          </View>
        )}

        {/* หัวเอกสารพร้อมโลโก้ */}
        <View style={acceptanceStyles.header}>
          <Image style={acceptanceStyles.logo} src="/assets/images/cs-kmutnb.png" />
        </View>

        {/* หัวข้อเอกสาร */}
        <Text style={acceptanceStyles.documentTitle}>แบบตอบรับนักศึกษาเข้าฝึกงาน</Text>

        {/* 🔧 ข้อมูลเอกสาร - ใช้ข้อมูลจริงถ้ามี */}
        <View style={acceptanceStyles.documentInfoContainer}>
          <View style={acceptanceStyles.documentInfoRow1}>
            <View style={acceptanceStyles.rightInfo}>
              <Text style={acceptanceStyles.companyInfoLine}>
                ชื่อหน่วยงาน {displayFieldOrDots(company.companyName, 25)}
              </Text>
              <Text style={acceptanceStyles.companyInfoLine}>
                สถานที่ตั้ง {displayFieldOrDots(company.companyAddress, 28)}
              </Text>
              <Text style={acceptanceStyles.companyInfoLine}>
                โทรศัพท์ {displayFieldOrDots(company.contactPhone || company.phoneNumber, 30)}
              </Text>
            </View>
          </View>

          <Text style={acceptanceStyles.dateInfoRow}>
            วันที่ {displayDateOrDots(company.documentDate)} เดือน .................... พ.ศ. ..................
          </Text>
        </View>

        {/* ส่วนเรียน */}
        <View style={acceptanceStyles.salutation}>
          <Text>เรียน   หัวหน้าภาควิชาวิทยาการคอมพิวเตอร์และสารสนเทศ</Text>
        </View>

        {/* 🔧 เนื้อหาหลัก - ใช้ข้อมูลจริง */}
        <Text style={acceptanceStyles.mainParagraph}>
          ตามหนังสือของภาควิชาวิทยาการคอมพิวเตอร์และสารสนเทศ ที่ อว 7105(05)/{displayFieldOrDots(company.documentNumber, 8)} ลง
          วันที่ {displayDateOrDots(company.letterDate)} เดือน ......................... พ.ศ. ............ เรื่อง ขอความอนุเคราะห์รับนักศึกษาเข้าฝึกงานนั้น ทางหน่วยงานได้
          พิจารณาแล้ว   ดังนี้
        </Text>

        {/* 🔧 ตัวเลือกการตอบรับ - ยินดีรับ */}
        <View style={acceptanceStyles.responseOption}>
          <View style={acceptanceStyles.checkboxContainer}>
            <Text>(  )</Text>
          </View>
          <Text>
            ยินดีรับนักศึกษาเข้าฝึกงานจำนวน {displayFieldOrDots(data?.studentData?.length?.toString(), 3)} คน 
            โดยเริ่มตั้งแต่วันที่ {displayDateRangeOrDots(company.startDate, company.endDate, 30)} ดังมีรายชื่อต่อไปนี้
          </Text>
        </View>
        
        {/* 🔧 รายชื่อนักศึกษา - ใช้ข้อมูลจริง */}
        <Text style={acceptanceStyles.studentList}>
          1.ชื่อ {displayFieldOrDots(student.fullName, 35)} โดยให้ฝึกงานที่แผนก {displayFieldOrDots(company.internshipPosition, 20)}
        </Text>
        
        {/* นักศึกษาคนที่ 2 (ถ้ามี) */}
        <Text style={acceptanceStyles.studentList}>
          2.ชื่อ {displayFieldOrDots(data?.studentData?.[1]?.fullName, 35)} โดยให้ฝึกงานที่แผนก {displayFieldOrDots(company.internshipPosition, 20)}
        </Text>
        
        {/* ตัวเลือกการตอบรับ - ไม่สามารถรับ */}
        <View style={[acceptanceStyles.responseOption, { marginTop: 10 }]}>
          <View style={acceptanceStyles.checkboxContainer}>
            <Text>(  )</Text>
          </View>
          <Text>ไม่สามารถรับนักศึกษาเข้าฝึกงานได้</Text>
        </View>
        
        {/* ส่วนเหตุผล */}
        <Text style={acceptanceStyles.reasonSection}>
          เพราะ {displayFieldOrDots('', 50)}
        </Text>
        <Text style={acceptanceStyles.reasonSection}>
          {displayFieldOrDots('', 50)}
        </Text>
        
        {/* เส้นประสำหรับกรอกข้อมูลเพิ่มเติม */}
        <View style={[acceptanceStyles.dotLine, { marginLeft: 30 }]}></View>

        {/* ส่วนลายเซ็น */}
        <View style={acceptanceStyles.signatureSection}>
          <Text style={acceptanceStyles.closingText}>จึงเรียนมาเพื่อโปรดทราบ</Text>
          <Text style={acceptanceStyles.closingText2}>ขอแสดงความนับถือ</Text>
                    
          <Text style={acceptanceStyles.signatureText}>(.................................................)</Text>
          <Text style={acceptanceStyles.signatureText}>
            ตำแหน่ง {displayFieldOrDots(company.contactPersonPosition, 25)}
          </Text>
          <Text style={acceptanceStyles.signatureText}>วันที่.......................................................</Text>
        </View>
      </Page>
    </Document>
  );
};

export default AcceptanceLetterTemplate;