import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    padding: 32,
    fontSize: 12,
    fontFamily: 'THSarabunNew'
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 6
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 12,
    marginBottom: 4
  },
  metaNote: {
    fontSize: 11,
    color: '#555555',
    marginBottom: 2
  },
  table: {
    marginTop: 12,
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#333333'
  },
  tableRow: {
    flexDirection: 'row'
  },
  tableHeaderCell: {
    padding: 6,
    backgroundColor: '#E6F4FF',
    borderRightWidth: 1,
    borderColor: '#333333',
    fontWeight: 'bold'
  },
  tableBodyCell: {
    padding: 6,
    borderRightWidth: 1,
    borderTopWidth: 1,
    borderColor: '#333333'
  },
  lastCell: {
    borderRightWidth: 0
  },
  colIndex: {
    width: 35,
    flexGrow: 0,
    textAlign: 'center'
  },
  colName: {
    flexGrow: 2.2
  },
  colCategory: {
    flexGrow: 1.6
  },
  colYear: {
    flexGrow: 1.1
  },
  colSchedule: {
    flexGrow: 2.2
  },
  colStatus: {
    flexGrow: 1.3
  },
  colType: {
    flexGrow: 1.2
  },
  emptyCell: {
    padding: 10,
    textAlign: 'center'
  }
});

const ImportantDeadlinesReport = ({ records = [], meta = {} }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <Text style={styles.headerTitle}>รายงานสรุปกำหนดการสำคัญ</Text>
      <View style={styles.metaRow}>
        <Text>ปีการศึกษา: {meta.academicYearLabel || 'ทั้งหมด'}</Text>
        <Text>ภาคการศึกษา: {meta.semesterLabel || 'ทั้งหมด'}</Text>
      </View>
      {meta.categorySummary && <Text style={styles.metaNote}>หมวดที่เลือก: {meta.categorySummary}</Text>}
      {meta.generatedAt && <Text style={styles.metaNote}>สร้างเมื่อ: {meta.generatedAt}</Text>}

      <View style={styles.table}>
        <View style={styles.tableRow}>
          <View style={[styles.tableHeaderCell, styles.colIndex]}>
            <Text>ลำดับ</Text>
          </View>
          <View style={[styles.tableHeaderCell, styles.colName]}>
            <Text>กิจกรรม</Text>
          </View>
          <View style={[styles.tableHeaderCell, styles.colCategory]}>
            <Text>หมวด</Text>
          </View>
          <View style={[styles.tableHeaderCell, styles.colYear]}>
            <Text>ปี / ภาค</Text>
          </View>
          <View style={[styles.tableHeaderCell, styles.colSchedule]}>
            <Text>กำหนดการ</Text>
          </View>
          <View style={[styles.tableHeaderCell, styles.colStatus]}>
            <Text>สถานะ</Text>
          </View>
          <View style={[styles.tableHeaderCell, styles.colType, styles.lastCell]}>
            <Text>ประเภท</Text>
          </View>
        </View>
        {records.length === 0 ? (
          <View style={styles.tableRow}>
            <View style={[styles.tableBodyCell, styles.lastCell, { flexGrow: 1 }]}>
              <Text style={styles.emptyCell}>ไม่พบข้อมูลกำหนดการ</Text>
            </View>
          </View>
        ) : (
          records.map((record, index) => (
            <View style={styles.tableRow} key={record.id || index}>
              <View style={[styles.tableBodyCell, styles.colIndex]}>
                <Text>{index + 1}</Text>
              </View>
              <View style={[styles.tableBodyCell, styles.colName]}>
                <Text>{record.name}</Text>
              </View>
              <View style={[styles.tableBodyCell, styles.colCategory]}>
                <Text>{record.categoryLabel}</Text>
              </View>
              <View style={[styles.tableBodyCell, styles.colYear]}>
                <Text>{record.academicYearDisplay}</Text>
              </View>
              <View style={[styles.tableBodyCell, styles.colSchedule]}>
                <Text>{record.scheduleText}</Text>
              </View>
              <View style={[styles.tableBodyCell, styles.colStatus]}>
                <Text>{record.statusText}</Text>
              </View>
              <View style={[styles.tableBodyCell, styles.colType, styles.lastCell]}>
                <Text>{record.deadlineTypeLabel}</Text>
              </View>
            </View>
          ))
        )}
      </View>
    </Page>
  </Document>
);

export default ImportantDeadlinesReport;
