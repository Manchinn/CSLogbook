import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    padding: 36,
    fontSize: 12,
    fontFamily: 'THSarabunNew',
    backgroundColor: '#ffffff'
  },
  headerContainer: {
    marginBottom: 14,
    textAlign: 'center'
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#0d47a1',
    marginBottom: 4
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#333333',
    marginBottom: 6
  },
  metaNote: {
    fontSize: 11,
    color: '#555555',
    marginBottom: 2
  },
  table: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#0d47a1',
    borderStyle: 'solid',
    borderRadius: 6,
    overflow: 'hidden'
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#0d47a1'
  },
  headerCell: {
    padding: 8,
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold'
  },
  row: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e7ff'
  },
  rowAlt: {
    backgroundColor: '#f5f9ff'
  },
  cell: {
    padding: 8,
    fontSize: 12,
    color: '#222222'
  },
  cellActivity: {
    flex: 2.1
  },
  cellDate: {
    flex: 1.5
  },
  cellNote: {
    flex: 1.8
  },
  emptyRow: {
    paddingVertical: 20,
    justifyContent: 'center',
    alignItems: 'center'
  },
  textWrap: {
    flexWrap: 'wrap',
    lineHeight: 1.4
  }
});

const ImportantDeadlinesReport = ({ records = [], meta = {} }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>{meta.title || 'กำหนดการโครงงานพิเศษและปริญญานิพนธ์'}</Text>
        {meta.periodLabel && <Text style={styles.headerSubtitle}>{meta.periodLabel}</Text>}
        {meta.categorySummary && <Text style={styles.metaNote}>หมวดที่เลือก: {meta.categorySummary}</Text>}
        {meta.generatedAt && <Text style={styles.metaNote}>จัดทำเมื่อ: {meta.generatedAt}</Text>}
      </View>

      <View style={styles.table}>
        <View style={styles.tableHeader}>
          <View style={[styles.headerCell, styles.cellActivity]}>
            <Text>กิจกรรม</Text>
          </View>
          <View style={[styles.headerCell, styles.cellDate]}>
            <Text>วันที่</Text>
          </View>
          <View style={[styles.headerCell, styles.cellNote]}>
            <Text>หมายเหตุ</Text>
          </View>
        </View>

        {records.length === 0 ? (
          <View style={[styles.row, styles.emptyRow]}>
            <Text>ไม่พบข้อมูลกำหนดการ</Text>
          </View>
        ) : (
          records.map((record, index) => (
            <View
              key={record.id || index}
              style={[styles.row, index % 2 === 1 && styles.rowAlt]}
            >
              <View style={[styles.cell, styles.cellActivity]}>
                <Text style={styles.textWrap}>{record.activity}</Text>
              </View>
              <View style={[styles.cell, styles.cellDate]}>
                <Text style={styles.textWrap}>{record.dateDetail}</Text>
              </View>
              <View style={[styles.cell, styles.cellNote]}>
                <Text style={styles.textWrap}>{record.note || '-'}</Text>
              </View>
            </View>
          ))
        )}
      </View>
    </Page>
  </Document>
);

export default ImportantDeadlinesReport;
