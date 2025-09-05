import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { commonStyles, safeText, formatThaiDate } from './styles/commonStyles';
import { formatThaiDate as formatThaiDateUtil, calculateInternshipDays } from '../../../utils/dateUtils';
import { 
  formatStudentId, 
  formatThaiPhoneNumber, 
  formatCredits,
  formatDocumentStatus 
} from '../../../utils/thaiFormatter';

const summaryStyles = StyleSheet.create({
  ...commonStyles,
  
  summaryHeader: {
    textAlign: 'center',
    marginBottom: 25,
    padding: 20,
    backgroundColor: '#F0F8FF',
    borderRadius: 8,
    border: '1 solid #4A90E2'
  },

  summaryTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 10
  },

  summarySubtitle: {
    fontSize: 16,
    color: '#34495E',
    marginBottom: 5
  },

  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 20,
    paddingHorizontal: 10
  },

  statBox: {
    width: '30%',
    textAlign: 'center',
    padding: 15,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    border: '1 solid #DEE2E6'
  },

  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007BFF',
    marginBottom: 5
  },

  statLabel: {
    fontSize: 12,
    color: '#6C757D'
  },

  studentList: {
    marginTop: 20
  },

  studentItem: {
    marginBottom: 15,
    padding: 15,
    backgroundColor: '#FFFFFF',
    border: '1 solid #E9ECEF',
    borderRadius: 5
  },

  studentName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 8
  },

  studentDetail: {
    fontSize: 13,
    color: '#495057',
    marginBottom: 3
  },

  companyInfo: {
    backgroundColor: '#E8F5E8',
    padding: 10,
    marginTop: 8,
    borderRadius: 4,
    borderLeft: '3 solid #28A745'
  },

  statusBadge: {
    display: 'inline-block',
    padding: '2 6',
    borderRadius: 3,
    fontSize: 11,
    fontWeight: 'bold'
  }
});

const StudentSummaryTemplate = ({ data }) => {
  const totalStudents = data.students?.length || 0;
  const totalCompanies = [...new Set(data.students?.map(s => s.companyName))].length || 0;
  const completedInternships = data.students?.filter(s => s.status === 'completed').length || 0;

  return (
    <Document>
      <Page size="A4" style={summaryStyles.page}>
        {/* หัวรายงาน */}
        <View style={summaryStyles.summaryHeader}>
          <Text style={summaryStyles.summaryTitle}>
            รายงานสรุปนักศึกษาฝึกงาน
          </Text>
          <Text style={summaryStyles.summarySubtitle}>
            คณะวิทยาศาสตร์ประยุกต์ มหาวิทยาลัยเทคโนโลยีพระจอมเกล้าพระนครเหนือ
          </Text>
          <Text style={summaryStyles.summarySubtitle}>
            ประจำปีการศึกษา {safeText(data.academicYear, '2567')}
          </Text>
          <Text style={summaryStyles.textSmall}>
            สร้างรายงานเมื่อ: {formatThaiDateUtil(new Date(), 'DD MMMM BBBB')}
          </Text>
        </View>

        {/* สถิติสรุป */}
        <View style={summaryStyles.statsContainer}>
          <View style={summaryStyles.statBox}>
            <Text style={summaryStyles.statNumber}>{totalStudents}</Text>
            <Text style={summaryStyles.statLabel}>นักศึกษาทั้งหมด</Text>
          </View>
          
          <View style={summaryStyles.statBox}>
            <Text style={summaryStyles.statNumber}>{totalCompanies}</Text>
            <Text style={summaryStyles.statLabel}>บริษัท/หน่วยงาน</Text>
          </View>
          
          <View style={summaryStyles.statBox}>
            <Text style={summaryStyles.statNumber}>{completedInternships}</Text>
            <Text style={summaryStyles.statLabel}>เสร็จสิ้นแล้ว</Text>
          </View>
        </View>

        <View style={summaryStyles.divider} />

        {/* รายชื่อนักศึกษา - ใช้ utils ใหม่ */}
        <Text style={summaryStyles.subtitle}>รายชื่อนักศึกษาฝึกงาน</Text>
        
        <View style={summaryStyles.studentList}>
          {data.students?.map((student, index) => {
            const statusInfo = formatDocumentStatus(student.status);
            const internshipDays = calculateInternshipDays(student.startDate, student.endDate);
            
            return (
              <View key={index} style={summaryStyles.studentItem}>
                <Text style={summaryStyles.studentName}>
                  {index + 1}. {safeText(student.fullName)}
                </Text>
                
                <Text style={summaryStyles.studentDetail}>
                  รหัสนักศึกษา: {formatStudentId(student.studentCode)}
                </Text>
                
                <Text style={summaryStyles.studentDetail}>
                  ชั้นปี: {safeText(student.yearLevel)} | ห้อง: {safeText(student.classroom)}
                </Text>
                
                <Text style={summaryStyles.studentDetail}>
                  เบอร์โทรศัพท์: {formatThaiPhoneNumber(student.phoneNumber)}
                </Text>
                
                <Text style={summaryStyles.studentDetail}>
                  หน่วยกิตสะสม: {formatCredits(student.totalCredits)}
                </Text>

                {/* ข้อมูลบริษัท */}
                <View style={summaryStyles.companyInfo}>
                  <Text style={summaryStyles.studentDetail}>
                    <Text style={summaryStyles.textBold}>บริษัท:</Text> {safeText(student.companyName)}
                  </Text>
                  
                  <Text style={summaryStyles.studentDetail}>
                    <Text style={summaryStyles.textBold}>ตำแหน่ง:</Text> {safeText(student.internshipPosition)}
                  </Text>
                  
                  <Text style={summaryStyles.studentDetail}>
                    <Text style={summaryStyles.textBold}>ระยะเวลา:</Text> {formatThaiDateUtil(student.startDate, 'short')} - {formatThaiDateUtil(student.endDate, 'short')}
                  </Text>
                  
                  <Text style={summaryStyles.studentDetail}>
                    <Text style={summaryStyles.textBold}>จำนวนวัน:</Text> {internshipDays} วัน
                  </Text>
                  
                  <Text style={summaryStyles.studentDetail}>
                    <Text style={summaryStyles.textBold}>สถานะ:</Text> {statusInfo.icon} {statusInfo.text}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>

        {/* Footer */}
        <View style={[summaryStyles.footer, { position: 'absolute', bottom: 20 }]}>
          <Text style={summaryStyles.footerText}>
            รายงานสรุปนักศึกษาฝึกงาน - คณะวิทยาศาสตร์ประยุกต์ มหาวิทยาลัยเทคโนโลยีพระจอมเกล้าพระนครเหนือ
          </Text>
          <Text style={summaryStyles.textSmall}>
            สร้างโดยระบบ CSLogbook | {formatThaiDateUtil(new Date(), 'short')}
          </Text>
        </View>
      </Page>
    </Document>
  );
};

export default StudentSummaryTemplate;