import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { commonStyles, safeText, formatThaiDate } from './styles/commonStyles';
import { 
  formatThaiDate as formatThaiDateUtil, 
  calculateInternshipDays, 
  formatDurationText 
} from '../../../utils/dateUtils';
import { 
  formatStudentId, 
  formatThaiPhoneNumber,
  formatFullName,
  formatCredits 
} from '../../../utils/thaiFormatter';

// สไตล์เฉพาะสำหรับ CS05
const cs05Styles = StyleSheet.create({
  ...commonStyles,
  
  // หัวเอกสาร CS05
  cs05Header: {
    textAlign: 'center',
    marginBottom: 25,
    borderBottom: '2 solid #000000',
    paddingBottom: 15
  },

  formTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8
  },

  formSubtitle: {
    fontSize: 18,
    marginBottom: 5
  },

  formCode: {
    fontSize: 16,
    color: '#666666'
  },

  // ส่วนข้อมูลนักศึกษา
  studentSection: {
    marginBottom: 20,
    padding: 15,
    border: '1 solid #CCCCCC',
    borderRadius: 5,
    backgroundColor: '#F9F9F9'
  },

  studentTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
    backgroundColor: '#E6E6E6',
    padding: 8,
    borderRadius: 3
  },

  // ส่วนข้อมูลบริษัท
  companySection: {
    marginBottom: 20,
    padding: 15,
    border: '1 solid #CCCCCC',
    borderRadius: 5
  },

  companyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
    backgroundColor: '#E6F3FF',
    padding: 8,
    borderRadius: 3
  },

  // ส่วนระยะเวลา
  periodSection: {
    marginBottom: 20,
    padding: 15,
    border: '1 solid #CCCCCC',
    borderRadius: 5,
    backgroundColor: '#F0F8F0'
  },

  periodTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
    backgroundColor: '#D4E6D4',
    padding: 8,
    borderRadius: 3
  },

  // Checkbox
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10
  },

  checkbox: {
    width: 12,
    height: 12,
    border: '1 solid #000000',
    marginRight: 8,
    textAlign: 'center',
    fontSize: 10
  },

  checkboxChecked: {
    backgroundColor: '#000000',
    color: '#FFFFFF'
  },

  checkboxLabel: {
    fontSize: 14
  }
});

const CS05PDFTemplate = ({ data, showWatermark = false }) => {
  // ใช้ utils ใหม่สำหรับจัดรูปแบบข้อมูล
  const formattedStartDate = formatThaiDateUtil(data.startDate, 'DD MMMM BBBB');
  const formattedEndDate = formatThaiDateUtil(data.endDate, 'DD MMMM BBBB');
  const internshipDays = calculateInternshipDays(data.startDate, data.endDate);
  const durationText = formatDurationText(data.startDate, data.endDate);
  
  return (
    <Document>
      <Page size="A4" style={cs05Styles.page}>
        {/* Watermark */}
        {showWatermark && (
          <Text style={cs05Styles.watermark}>
            {data.status === 'draft' ? 'ร่าง - DRAFT' : 'อนุมัติแล้ว - APPROVED'}
          </Text>
        )}

        {/* หัวเอกสาร */}
        <View style={cs05Styles.cs05Header}>
          <Text style={cs05Styles.formTitle}>
            แบบฟอร์มคำร้องขอฝึกงาน
          </Text>
          <Text style={cs05Styles.formSubtitle}>
            คณะวิทยาศาสตร์ประยุกต์
          </Text>
          <Text style={cs05Styles.formSubtitle}>
            มหาวิทยาลัยเทคโนโลยีพระจอมเกล้าพระนครเหนือ
          </Text>
          <Text style={cs05Styles.formCode}>
            (คพ.05)
          </Text>
        </View>

        {/* เลขที่เอกสาร */}
        <View style={cs05Styles.dateSection}>
          <Text>
            เลขที่เอกสาร: คพ.05-{safeText(data.documentId, 'XXXX')}/2567
          </Text>
          <Text>
            วันที่: {formatThaiDate(data.createdDate || new Date())}
          </Text>
        </View>

        {/* ข้อมูลบริษัท/หน่วยงาน */}
        <View style={cs05Styles.companySection}>
          <Text style={cs05Styles.companyTitle}>
            ข้อมูลสถานประกอบการ
          </Text>
          
          <View style={cs05Styles.row}>
            <Text style={cs05Styles.label}>ชื่อบริษัท/หน่วยงาน:</Text>
            <Text style={cs05Styles.value}>
              {safeText(data.companyName, '.......................................')}
            </Text>
          </View>
          
          <View style={cs05Styles.row}>
            <Text style={cs05Styles.label}>ที่อยู่:</Text>
            <Text style={cs05Styles.value}>
              {safeText(data.companyAddress, '.......................................')}
            </Text>
          </View>
          
          <View style={cs05Styles.row}>
            <Text style={cs05Styles.label}>ตำแหน่งที่ขอฝึกงาน:</Text>
            <Text style={cs05Styles.value}>
              {safeText(data.internshipPosition, '.......................................')}
            </Text>
          </View>
          
          <View style={cs05Styles.row}>
            <Text style={cs05Styles.label}>ผู้ติดต่อ/HR:</Text>
            <Text style={cs05Styles.value}>
              {safeText(data.contactPersonName, '.......................................')}
            </Text>
          </View>
          
          <View style={cs05Styles.row}>
            <Text style={cs05Styles.label}>ตำแหน่ง:</Text>
            <Text style={cs05Styles.value}>
              {safeText(data.contactPersonPosition, '.......................................')}
            </Text>
          </View>
        </View>

        {/* ข้อมูลนักศึกษา */}
        <View style={cs05Styles.studentSection}>
          <Text style={cs05Styles.studentTitle}>
            ข้อมูลนักศึกษา
          </Text>
          
          {/* Checkbox สำหรับฝึกงาน 2 คน */}
          <View style={cs05Styles.checkboxContainer}>
            <View style={[
              cs05Styles.checkbox, 
              data.hasTwoStudents && cs05Styles.checkboxChecked
            ]}>
              <Text>{data.hasTwoStudents ? '✓' : ''}</Text>
            </View>
            <Text style={cs05Styles.checkboxLabel}>ฝึกงาน 2 คน</Text>
          </View>

          {/* รายการนักศึกษา - ใช้ utils ใหม่ */}
          {data.studentData?.map((student, index) => (
            <View key={index} style={{ marginBottom: 15, paddingLeft: 20 }}>
              <Text style={cs05Styles.textBold}>
                นักศึกษาคนที่ {index + 1}
              </Text>
              
              <View style={cs05Styles.row}>
                <Text style={cs05Styles.label}>ชื่อ-นามสกุล:</Text>
                <Text style={cs05Styles.value}>
                  {formatFullName(student.firstName, student.lastName, student.title) || safeText(student.fullName)}
                </Text>
              </View>
              
              <View style={cs05Styles.row}>
                <Text style={cs05Styles.label}>รหัสนักศึกษา:</Text>
                <Text style={cs05Styles.value}>
                  {formatStudentId(student.studentId)}
                </Text>
              </View>
              
              <View style={cs05Styles.row}>
                <Text style={cs05Styles.label}>ชั้นปี:</Text>
                <Text style={cs05Styles.value}>
                  ปี {safeText(student.yearLevel)}
                </Text>
              </View>
              
              <View style={cs05Styles.row}>
                <Text style={cs05Styles.label}>ห้อง:</Text>
                <Text style={cs05Styles.value}>
                  {safeText(student.classroom)}
                </Text>
              </View>
              
              <View style={cs05Styles.row}>
                <Text style={cs05Styles.label}>เบอร์โทรศัพท์:</Text>
                <Text style={cs05Styles.value}>
                  {formatThaiPhoneNumber(student.phoneNumber)}
                </Text>
              </View>
              
              <View style={cs05Styles.row}>
                <Text style={cs05Styles.label}>หน่วยกิตสะสม:</Text>
                <Text style={cs05Styles.value}>
                  {formatCredits(student.totalCredits)}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* ระยะเวลาการฝึกงาน - ใช้ utils ใหม่ */}
        <View style={cs05Styles.periodSection}>
          <Text style={cs05Styles.periodTitle}>
            ระยะเวลาการฝึกงาน
          </Text>
          
          <View style={cs05Styles.row}>
            <Text style={cs05Styles.label}>วันที่เริ่มต้น:</Text>
            <Text style={cs05Styles.value}>
              {formattedStartDate || '.......................................'}
            </Text>
          </View>
          
          <View style={cs05Styles.row}>
            <Text style={cs05Styles.label}>วันที่สิ้นสุด:</Text>
            <Text style={cs05Styles.value}>
              {formattedEndDate || '.......................................'}
            </Text>
          </View>
          
          <View style={cs05Styles.row}>
            <Text style={cs05Styles.label}>รวมจำนวนวัน:</Text>
            <Text style={cs05Styles.value}>
              {internshipDays || '...........'} วัน
            </Text>
          </View>
          
          <View style={cs05Styles.row}>
            <Text style={cs05Styles.label}>ระยะเวลา:</Text>
            <Text style={cs05Styles.value}>
              {durationText || '...........'}
            </Text>
          </View>
        </View>

        {/* ข้อมูลเพิ่มเติม */}
        {(data.jobDescription || data.additionalRequirements) && (
          <View style={cs05Styles.infoBox}>
            <Text style={cs05Styles.sectionTitle}>ข้อมูลเพิ่มเติม</Text>
            
            {data.jobDescription && (
              <View style={cs05Styles.field}>
                <Text style={cs05Styles.textBold}>ลักษณะงาน:</Text>
                <Text style={cs05Styles.text}>{safeText(data.jobDescription)}</Text>
              </View>
            )}
            
            {data.additionalRequirements && (
              <View style={cs05Styles.field}>
                <Text style={cs05Styles.textBold}>ข้อกำหนดเพิ่มเติม:</Text>
                <Text style={cs05Styles.text}>{safeText(data.additionalRequirements)}</Text>
              </View>
            )}
          </View>
        )}

        {/* ลายเซ็น */}
        <View style={cs05Styles.signatureSection}>
          <View style={cs05Styles.signatureBox}>
            <Text style={cs05Styles.signatureLabel}>ลายเซ็นนักศึกษา</Text>
            <View style={cs05Styles.signatureLine} />
            <Text style={cs05Styles.signatureName}>
              ({safeText(data.studentData?.[0]?.fullName, '.......................................')})
            </Text>
            <Text style={cs05Styles.textSmall}>
              วันที่ ....../....../......
            </Text>
          </View>
        </View>

        {/* Footer */}
        <View style={[cs05Styles.footer, { position: 'absolute', bottom: 20 }]}>
          <Text style={cs05Styles.footerText}>
            แบบฟอร์ม คพ.05 - คณะวิทยาศาสตร์ประยุกต์ มหาวิทยาลัยเทคโนโลยีพระจอมเกล้าพระนครเหนือ
          </Text>
        </View>
      </Page>
    </Document>
  );
};

export default CS05PDFTemplate;