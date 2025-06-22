import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import { formatThaiDate, calculateInternshipDays, formatDurationText } from '../../../utils/dateUtils';
import { formatFullName, formatThaiPhoneNumber, toThaiDigits } from '../../../utils/thaiFormatter';

const InternshipLogbookTemplate = ({ logbookData, summaryData, userInfo }) => {
  const styles = StyleSheet.create({
    page: {
      fontFamily: 'THSarabunNew',
      fontSize: 16,
      padding: 40,
      lineHeight: 1.6,
    },
    
    // ส่วนหัวเอกสาร
    header: {
      textAlign: 'center',
      marginBottom: 30,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: '#1890ff',
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 18,
      color: '#595959',
      marginBottom: 20,
    },
    
    // ข้อมูลพื้นฐาน
    infoSection: {
      marginBottom: 25,
      padding: 15,
      backgroundColor: '#f8f9fa',
      borderRadius: 6,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#1890ff',
      marginBottom: 12,
      borderBottom: '2 solid #1890ff',
      paddingBottom: 4,
    },
    infoRow: {
      flexDirection: 'row',
      marginBottom: 6,
    },
    infoLabel: {
      width: 120,
      fontWeight: 'bold',
      color: '#595959',
    },
    infoValue: {
      flex: 1,
      color: '#262626',
    },
    
    // สถิติสรุป
    statsContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 25,
    },
    statBox: {
      width: '30%',
      padding: 12,
      backgroundColor: '#e6f7ff',
      borderRadius: 6,
      textAlign: 'center',
    },
    statNumber: {
      fontSize: 24,
      fontWeight: 'bold',
      color: '#1890ff',
      marginBottom: 4,
    },
    statLabel: {
      fontSize: 12,
      color: '#595959',
    },
    
    // ตารางบันทึกรายวัน
    table: {
      display: 'table',
      width: 'auto',
      marginBottom: 25,
      borderStyle: 'solid',
      borderWidth: 1,
      borderColor: '#d9d9d9',
    },
    tableRow: {
      flexDirection: 'row',
    },
    tableHeader: {
      backgroundColor: '#1890ff',
    },
    tableHeaderCell: {
      padding: 8,
      borderStyle: 'solid',
      borderWidth: 0.5,
      borderColor: '#ffffff',
      fontSize: 14,
      fontWeight: 'bold',
      color: '#ffffff',
      textAlign: 'center',
    },
    tableCell: {
      padding: 6,
      borderStyle: 'solid',
      borderWidth: 0.5,
      borderColor: '#d9d9d9',
      fontSize: 12,
      lineHeight: 1.4,
    },
    
    // คอลัมน์ตาราง
    dateCol: { width: '12%' },
    timeCol: { width: '15%' },
    activityCol: { width: '40%' },
    knowledgeCol: { width: '25%' },
    statusCol: { width: '8%' },
    
    // ส่วนสรุปประสบการณ์
    reflectionSection: {
      marginTop: 30,
      padding: 20,
      backgroundColor: '#f0f9ff',
      borderRadius: 8,
    },
    reflectionTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#1890ff',
      marginBottom: 15,
      textAlign: 'center',
    },
    reflectionText: {
      fontSize: 14,
      lineHeight: 1.6,
      textAlign: 'justify',
      marginBottom: 12,
    },
    
    // ส่วนท้าย
    footer: {
      marginTop: 40,
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    signatureBox: {
      width: '45%',
      textAlign: 'center',
    },
    signatureLine: {
      borderBottom: '1 solid #000000',
      height: 50,
      marginBottom: 8,
    },
    signatureLabel: {
      fontSize: 14,
      color: '#595959',
    },
    
    // Utility classes
    textCenter: { textAlign: 'center' },
    textRight: { textAlign: 'right' },
    bold: { fontWeight: 'bold' },
    small: { fontSize: 12 },
    primary: { color: '#1890ff' },
    success: { color: '#52c41a' },
    warning: { color: '#faad14' },
  });

  // คำนวณสถิติ
  const totalDays = logbookData?.entries?.length || 0;
  const totalHours = logbookData?.entries?.reduce((sum, entry) => {
    const hours = entry.approvedHours || entry.totalHours || 0;
    return sum + hours;
  }, 0) || 0;
  const averageHours = totalDays > 0 ? (totalHours / totalDays).toFixed(1) : 0;

  return (
    <Document>
      {/* หน้าแรก: ข้อมูลทั่วไปและสถิติ */}
      <Page size="A4" style={styles.page}>
        {/* หัวเรื่อง */}
        <View style={styles.header}>
          <Text style={styles.title}>บันทึกการฝึกงาน</Text>
          <Text style={styles.subtitle}>
            {summaryData?.companyName || 'สถานประกอบการ'}
          </Text>
          <Text style={styles.small}>
            ภาควิชาวิทยาการคอมพิวเตอร์และสารสนเทศ มหาวิทยาลัยพะเยา
          </Text>
        </View>

        {/* ข้อมูลนักศึกษา */}
        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>📋 ข้อมูลนักศึกษา</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>ชื่อ-นามสกุล:</Text>
            <Text style={styles.infoValue}>
              {formatFullName(userInfo?.firstName, userInfo?.lastName, userInfo?.title)}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>รหัสนักศึกษา:</Text>
            <Text style={styles.infoValue}>{userInfo?.studentId}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>ชั้นปี:</Text>
            <Text style={styles.infoValue}>ปี {userInfo?.yearLevel}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>ห้อง:</Text>
            <Text style={styles.infoValue}>{userInfo?.classroom || '-'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>เบอร์โทรศัพท์:</Text>
            <Text style={styles.infoValue}>
              {formatThaiPhoneNumber(userInfo?.phoneNumber)}
            </Text>
          </View>
        </View>

        {/* ข้อมูลสถานประกอบการ */}
        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>🏢 ข้อมูลสถานประกอบการ</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>ชื่อบริษัท:</Text>
            <Text style={styles.infoValue}>{summaryData?.companyName}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>ที่อยู่:</Text>
            <Text style={styles.infoValue}>{summaryData?.companyAddress}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>ผู้ควบคุมงาน:</Text>
            <Text style={styles.infoValue}>{summaryData?.supervisorName}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>ตำแหน่ง:</Text>
            <Text style={styles.infoValue}>{summaryData?.supervisorPosition}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>เบอร์โทรศัพท์:</Text>
            <Text style={styles.infoValue}>
              {formatThaiPhoneNumber(summaryData?.supervisorPhone)}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>อีเมล:</Text>
            <Text style={styles.infoValue}>{summaryData?.supervisorEmail}</Text>
          </View>
        </View>

        {/* ระยะเวลาฝึกงาน */}
        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>📅 ระยะเวลาฝึกงาน</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>วันเริ่มฝึกงาน:</Text>
            <Text style={styles.infoValue}>
              {formatThaiDate(summaryData?.startDate)}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>วันสิ้นสุด:</Text>
            <Text style={styles.infoValue}>
              {formatThaiDate(summaryData?.endDate)}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>ระยะเวลา:</Text>
            <Text style={styles.infoValue}>
              {formatDurationText(summaryData?.startDate, summaryData?.endDate)}
            </Text>
          </View>
        </View>

        {/* สถิติสรุป */}
        <View style={styles.statsContainer}>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{toThaiDigits(totalDays.toString())}</Text>
            <Text style={styles.statLabel}>วันที่ฝึกงาน</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{toThaiDigits(totalHours.toString())}</Text>
            <Text style={styles.statLabel}>ชั่วโมงรวม</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{toThaiDigits(averageHours)}</Text>
            <Text style={styles.statLabel}>ชั่วโมงเฉลี่ย/วัน</Text>
          </View>
        </View>
      </Page>

      {/* หน้าถัดไป: ตารางบันทึกรายวัน */}
      <Page size="A4" style={styles.page}>
        <Text style={[styles.sectionTitle, styles.textCenter, { marginBottom: 20 }]}>
          📊 บันทึกการฝึกงานรายวัน
        </Text>

        <View style={styles.table}>
          {/* Header */}
          <View style={[styles.tableRow, styles.tableHeader]}>
            <Text style={[styles.tableHeaderCell, styles.dateCol]}>วันที่</Text>
            <Text style={[styles.tableHeaderCell, styles.timeCol]}>เวลา</Text>
            <Text style={[styles.tableHeaderCell, styles.activityCol]}>กิจกรรมที่ทำ</Text>
            <Text style={[styles.tableHeaderCell, styles.knowledgeCol]}>ความรู้ที่ได้รับ</Text>
            <Text style={[styles.tableHeaderCell, styles.statusCol]}>ชั่วโมง</Text>
          </View>

          {/* Data Rows */}
          {logbookData?.entries?.map((entry, index) => (
            <View key={index} style={styles.tableRow}>
              <Text style={[styles.tableCell, styles.dateCol, styles.textCenter]}>
                {formatThaiDate(entry.workDate, 'DD/MM')}
              </Text>
              <Text style={[styles.tableCell, styles.timeCol, styles.textCenter]}>
                {entry.timeIn} - {entry.timeOut}
              </Text>
              <Text style={[styles.tableCell, styles.activityCol]}>
                {entry.activities || entry.workDescription || '-'}
              </Text>
              <Text style={[styles.tableCell, styles.knowledgeCol]}>
                {entry.learnings || entry.knowledgeGained || '-'}
              </Text>
              <Text style={[styles.tableCell, styles.statusCol, styles.textCenter, styles.primary]}>
                {toThaiDigits((entry.approvedHours || entry.totalHours || 0).toString())}
              </Text>
            </View>
          ))}

          {/* Summary Row */}
          <View style={[styles.tableRow, { backgroundColor: '#f0f9ff' }]}>
            <Text style={[styles.tableCell, styles.dateCol, styles.bold, styles.textCenter]}>
              รวม
            </Text>
            <Text style={[styles.tableCell, styles.timeCol]}></Text>
            <Text style={[styles.tableCell, styles.activityCol, styles.bold]}>
              บันทึกการฝึกงานทั้งหมด {toThaiDigits(totalDays.toString())} วัน
            </Text>
            <Text style={[styles.tableCell, styles.knowledgeCol]}></Text>
            <Text style={[styles.tableCell, styles.statusCol, styles.bold, styles.textCenter, styles.success]}>
              {toThaiDigits(totalHours.toString())}
            </Text>
          </View>
        </View>

        {/* ข้อมูลเพิ่มเติม */}
        <View style={[styles.infoSection, { marginTop: 20 }]}>
          <Text style={styles.small}>
            💡 <Text style={styles.bold}>หมายเหตุ:</Text> บันทึกนี้สร้างจากระบบ CSLogbook 
            เมื่อวันที่ {formatThaiDate(new Date())} 
            โดยมีข้อมูลการฝึกงานทั้งหมด {toThaiDigits(totalDays.toString())} วัน 
            รวม {toThaiDigits(totalHours.toString())} ชั่วโมง
          </Text>
        </View>
      </Page>

      {/* หน้าสุดท้าย: สรุปประสบการณ์และลายเซ็น */}
      {logbookData?.reflection && (
        <Page size="A4" style={styles.page}>
          <View style={styles.reflectionSection}>
            <Text style={styles.reflectionTitle}>✨ สรุปประสบการณ์การฝึกงาน</Text>
            
            {logbookData.reflection.experience && (
              <View style={{ marginBottom: 15 }}>
                <Text style={[styles.bold, { marginBottom: 8 }]}>🎯 ประสบการณ์ที่ได้รับ:</Text>
                <Text style={styles.reflectionText}>
                  {logbookData.reflection.experience}
                </Text>
              </View>
            )}

            {logbookData.reflection.skillsLearned && (
              <View style={{ marginBottom: 15 }}>
                <Text style={[styles.bold, { marginBottom: 8 }]}>🚀 ทักษะที่ได้รับ:</Text>
                <Text style={styles.reflectionText}>
                  {logbookData.reflection.skillsLearned}
                </Text>
              </View>
            )}

            {logbookData.reflection.challenges && (
              <View style={{ marginBottom: 15 }}>
                <Text style={[styles.bold, { marginBottom: 8 }]}>⚡ ปัญหาและการแก้ไข:</Text>
                <Text style={styles.reflectionText}>
                  {logbookData.reflection.challenges}
                </Text>
              </View>
            )}

            {logbookData.reflection.suggestions && (
              <View style={{ marginBottom: 15 }}>
                <Text style={[styles.bold, { marginBottom: 8 }]}>💡 ข้อเสนอแนะ:</Text>
                <Text style={styles.reflectionText}>
                  {logbookData.reflection.suggestions}
                </Text>
              </View>
            )}
          </View>

          {/* ส่วนลายเซ็น */}
          <View style={styles.footer}>
            <View style={styles.signatureBox}>
              <View style={styles.signatureLine}></View>
              <Text style={styles.signatureLabel}>ลงชื่อ ........................... นักศึกษา</Text>
              <Text style={[styles.signatureLabel, { marginTop: 8 }]}>
                ({formatFullName(userInfo?.firstName, userInfo?.lastName)})
              </Text>
              <Text style={[styles.signatureLabel, { marginTop: 8 }]}>
                วันที่ {formatThaiDate(new Date())}
              </Text>
            </View>

            <View style={styles.signatureBox}>
              <View style={styles.signatureLine}></View>
              <Text style={styles.signatureLabel}>ลงชื่อ ........................... ผู้ควบคุมงาน</Text>
              <Text style={[styles.signatureLabel, { marginTop: 8 }]}>
                ({summaryData?.supervisorName || '..............................'})
              </Text>
              <Text style={[styles.signatureLabel, { marginTop: 8 }]}>
                วันที่ ...............................
              </Text>
            </View>
          </View>

          {/* ส่วนท้ายสุด */}
          <View style={[styles.textCenter, { marginTop: 30, paddingTop: 20, borderTop: '1 solid #d9d9d9' }]}>
            <Text style={[styles.small, { color: '#8c8c8c' }]}>
              เอกสารนี้สร้างจากระบบ CSLogbook - ระบบติดตามความก้าวหน้าของนักศึกษา
            </Text>
            <Text style={[styles.small, { color: '#8c8c8c', marginTop: 4 }]}>
              ภาควิชาวิทยาการคอมพิวเตอร์และสารสนเทศ มหาวิทยาลัยพะเยา
            </Text>
          </View>
        </Page>
      )}
    </Document>
  );
};

export default InternshipLogbookTemplate;