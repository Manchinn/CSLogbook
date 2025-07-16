import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from "@react-pdf/renderer";
import { formatThaiDate, formatDurationText } from "../../../utils/dateUtils";
import {
  formatFullName,
  formatThaiPhoneNumber,
} from "../../../utils/thaiFormatter";

const InternshipLogbookTemplate = ({ logbookData, summaryData, userInfo }) => {
  // 🔧 ฟังก์ชันจัดการข้อมูลนักศึกษา (ปรับปรุงให้แข็งแกร่งและรองรับกรณีต่างๆ)
  const getStudentInfo = () => {
    let studentData = null;

    // 🆕 ลำดับที่ 1: ให้ความสำคัญกับข้อมูลที่ประมวลผลแล้วจาก summaryData.studentData ก่อน
    if (
      summaryData?.studentData &&
      Array.isArray(summaryData.studentData) &&
      summaryData.studentData.length > 0
    ) {
      const processedData = summaryData.studentData[0];
      if (
        processedData &&
        (processedData.firstName ||
          processedData.lastName ||
          processedData.fullName)
      ) {
        studentData = {
          firstName: processedData.firstName || "",
          lastName: processedData.lastName || "",
          fullName: processedData.fullName || "",
          studentId: processedData.studentId || "",
          yearLevel: processedData.yearLevel || "",
          classroom: processedData.classroom || "",
          phoneNumber: processedData.phoneNumber || "",
          title: processedData.title || "",
        };
        console.log(
          "✅ Using student data from summaryData.studentData:",
          studentData
        );
      }
    }

    // ลำดับที่ 2: ใช้ userInfo ถ้าไม่มีข้อมูลจาก studentData
    if (
      !studentData &&
      userInfo &&
      (userInfo.firstName || userInfo.lastName || userInfo.fullName)
    ) {
      studentData = {
        firstName: userInfo.firstName || "",
        lastName: userInfo.lastName || "",
        fullName: userInfo.fullName || "",
        studentId: userInfo.studentId || userInfo.student_id || "",
        yearLevel: userInfo.yearLevel || userInfo.year_level || "",
        classroom: userInfo.classroom || userInfo.class || "",
        phoneNumber: userInfo.phoneNumber || userInfo.phone || "",
        title: userInfo.title || "",
      };
      //console.log('✅ Using student data from userInfo:', studentData);
    }

    // ลำดับที่ 3: ใช้ summaryData.studentInfo (สำหรับข้อมูลเก่า)
    if (!studentData && summaryData?.studentInfo) {
      const info = summaryData.studentInfo;
      studentData = {
        firstName: info.firstName || info.first_name || "",
        lastName: info.lastName || info.last_name || "",
        fullName: info.fullName || info.full_name || "",
        studentId: info.studentId || info.student_id || "",
        yearLevel: info.yearLevel || info.year_level || "",
        classroom: info.classroom || info.class || "",
        phoneNumber: info.phoneNumber || info.phone || "",
        title: info.title || "",
      };
      //console.log('✅ Using student data from summaryData.studentInfo:', studentData);
    }

    // ลำดับที่ 4: ลองดึงข้อมูลจาก logbookData ถ้ามี
    if (
      !studentData &&
      logbookData?.studentData &&
      Array.isArray(logbookData.studentData) &&
      logbookData.studentData.length > 0
    ) {
      const logStudentData = logbookData.studentData[0];
      if (
        logStudentData &&
        (logStudentData.firstName ||
          logStudentData.lastName ||
          logStudentData.fullName)
      ) {
        studentData = {
          firstName: logStudentData.firstName || "",
          lastName: logStudentData.lastName || "",
          fullName: logStudentData.fullName || "",
          studentId: logStudentData.studentId || "",
          yearLevel: logStudentData.yearLevel || "",
          classroom: logStudentData.classroom || "",
          phoneNumber: logStudentData.phoneNumber || "",
          title: logStudentData.title || "",
        };
        //console.log('✅ Using student data from logbookData.studentData:', studentData);
      }
    }

    // ✅ ลำดับที่ 5: สร้างข้อมูลเริ่มต้นถ้าไม่มีข้อมูลใดๆ
    if (!studentData) {
      //console.warn('⚠️ No student data found in any source, using default values');
      studentData = {
        firstName: "",
        lastName: "",
        fullName: "นักศึกษา",
        studentId: "ไม่ระบุ",
        yearLevel: "",
        classroom: "",
        phoneNumber: "",
        title: "",
      };
    }

    // ✅ ตรวจสอบและปรับปรุงข้อมูลที่ขาดหาย
    if (!studentData.fullName || studentData.fullName.trim() === "") {
      if (studentData.firstName || studentData.lastName) {
        studentData.fullName =
          formatFullName(
            studentData.firstName,
            studentData.lastName,
            studentData.title
          ) || "นักศึกษา";
      } else {
        studentData.fullName = "นักศึกษา";
      }
    }

    if (!studentData.studentId || studentData.studentId.trim() === "") {
      studentData.studentId = "ไม่ระบุ";
    }

    //console.log('🎯 Final processed student data:', studentData);
    return studentData;
  };

  const studentInfo = getStudentInfo();

  const getStudentName = () => {
    const student = getStudentInfo();
    if (!student) return "นักศึกษา";

    // ตรวจสอบ fullName ก่อน
    if (
      student.fullName &&
      student.fullName.trim() !== "" &&
      student.fullName !== "นักศึกษา"
    ) {
      return student.fullName.trim();
    }

    // ถ้าไม่มี fullName ให้ใช้ formatFullName
    const formattedName = formatFullName(
      student.firstName,
      student.lastName,
      student.title
    );
    return formattedName && formattedName.trim() !== ""
      ? formattedName
      : "นักศึกษา";
  };

  // 🎨 Styles ที่ปรับปรุงให้ตรงตามแบบฟอร์ม PDF
  const styles = StyleSheet.create({
    // 📄 หน้าเอกสารแบบฟอร์มจริง
    page: {
      fontFamily: "THSarabunNew",
      fontSize: 14,
      padding: 25,
      lineHeight: 1.4,
      color: "#000000",
      backgroundColor: "#ffffff",
    },

    // 🏛️ ส่วนหัวแบบฟอร์มจริง - มีกรอบ
    headerBox: {
      border: "1 solid #000000",
      padding: 10,
      marginBottom: 10,
      textAlign: "center",
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
    },

    // 📝 ข้อความส่วนหัว
    headerTextContainer: {
      flex: 1,
      textAlign: "center",
    },

    logo: {
      width: 100, // ลดจาก 100 เป็น 80
      height: 90, // ลดจาก 90 เป็น 70
      marginBottom: 3, // ลดจาก 5 เป็น 3
    },

    documentTitle: {
      fontSize: 22,
      fontWeight: "bold",
      textDecoration: "underline",
      marginBottom: 5,
    },

    // 📋 ส่วนข้อมูลแบบฟอร์ม - มีช่องให้กรอก
    infoSection: {
      border: "1 solid #000000",
      padding: 10,
      marginBottom: 15,
    },

    sectionHeader: {
      fontSize: 14,
      fontWeight: "bold",
      textAlign: "center",
      marginBottom: 12,
      textDecoration: "underline",
    },

    // 📝 ฟิลด์ข้อมูลแบบมีเส้นให้กรอก
    fieldRow: {
      flexDirection: "row",
      marginBottom: 8,
      alignItems: "center",
    },

    fieldLabel: {
      fontSize: 14,
      fontWeight: "bold",
      width: "45%",
    },

    fieldValue: {
      fontSize: 14,
      width: "70%",
      borderBottom: "1 dotted #000000",
      paddingBottom: 2,
      minHeight: 15,
    },

    fieldValueBox: {
      border: "1 solid #000000",
      padding: 4,
      minHeight: 20,
      fontSize: 14,
    },

    // 📊 ตารางแบบฟอร์มจริง - เส้นชัดเจน
    logTable: {
      border: "2 solid #000000",
      marginTop: 20,
      marginBottom: 20,
    },

    tableTitle: {
      fontSize: 14,
      fontWeight: "bold",
      textAlign: "center",
      backgroundColor: "#e8e8e8",
      padding: 8,
      borderBottom: "1 solid #000000",
    },

    // 🎯 หัวตารางแบบฟอร์ม
    tableHeaderRow: {
      flexDirection: "row",
      backgroundColor: "#f0f0f0",
      borderBottom: "1 solid #000000",
    },

    tableDataRow: {
      flexDirection: "row",
      borderBottom: "1 solid #000000",
      minHeight: 35,
    },

    // 📅 คอลัมน์ตารางตามแบบฟอร์มจริง
    colNo: {
      width: "6%",
      borderRight: "1 solid #000000",
      padding: 4,
      justifyContent: "center",
      alignItems: "center",
    },

    colDate: {
      width: "12%",
      borderRight: "1 solid #000000",
      padding: 4,
      justifyContent: "center",
    },

    colTime: {
      width: "12%",
      borderRight: "1 solid #000000",
      padding: 4,
      justifyContent: "center",
    },

    colWork: {
      width: "35%",
      borderRight: "1 solid #000000",
      padding: 4,
      justifyContent: "flex-start",
    },

    colKnowledge: {
      width: "25%",
      borderRight: "1 solid #000000",
      padding: 4,
      justifyContent: "flex-start",
    },

    colHours: {
      width: "12%",
      padding: 4,
      justifyContent: "center",
      alignItems: "center",
    },

    // 📝 ข้อความในตาราง
    tableHeaderText: {
      fontSize: 13,
      fontWeight: "bold",
      textAlign: "center",
    },

    tableCellText: {
      fontSize: 12,
      textAlign: "left",
      lineHeight: 1.2,
    },

    tableCellTextCenter: {
      fontSize: 12,
      textAlign: "center",
    },

    // 🎯 แถวสรุปแบบฟอร์ม
    summaryRow: {
      backgroundColor: "#e8e8e8",
      borderTop: "1 solid #000000",
    },

    summaryText: {
      fontSize: 13,
      fontWeight: "bold",
      textAlign: "center",
    },

    // ✏️ ส่วนลายเซ็นแบบฟอร์มจริง
    signatureSection: {
      marginTop: 30,
      border: "1 solid #000000",
      padding: 10,
    },

    signatureTitle: {
      fontSize: 12,
      fontWeight: "bold",
      textAlign: "center",
      marginBottom: 20,
    },

    signatureGrid: {
      flexDirection: "row",
      justifyContent: "space-between",
    },

    signatureBox: {
      width: "48%",
      textAlign: "center",
    },

    signatureLine: {
      fontSize: 12,
      marginBottom: 30,
      textAlign: "center",
    },

    signatureLabel: {
      fontSize: 11,
      textAlign: "center",
      marginBottom: 5,
    },

    dateSignature: {
      fontSize: 11,
      textAlign: "center",
      marginTop: 10,
    },

    // 💡 ส่วนสรุปแบบฟอร์ม
    summarySection: {
      border: "1 solid #000000",
      padding: 10,
      marginTop: 20,
    },

    summaryTitle: {
      fontSize: 14,
      fontWeight: "bold",
      textAlign: "center",
      marginBottom: 15,
      textDecoration: "underline",
    },

    reflectionText: {
      fontSize: 14,
      lineHeight: 1.5,
      textAlign: "left",
      marginBottom: 10,
    },

    // 🔢 หมายเลขหน้า
    pageNumber: {
      position: "absolute",
      bottom: 20,
      right: 30,
      fontSize: 10,
    },

    // 🎨 Utility classes
    textCenter: { textAlign: "center" },
    textLeft: { textAlign: "left" },
    textRight: { textAlign: "right" },
    bold: { fontWeight: "bold" },
    underline: { textDecoration: "underline" },
  });

  // 📊 คำนวณสถิติ - ปรับปรุงให้ใช้ summaryData
  const totalDays =
    summaryData?.statistics?.totalDays || logbookData?.entries?.length || 0;
  const totalHours =
    summaryData?.statistics?.totalHours ||
    logbookData?.entries?.reduce((sum, entry) => {
      const hours =
        entry.approvedHours || entry.totalHours || entry.workHours || 0;
      return sum + parseFloat(hours);
    }, 0) ||
    0;

  // 🔧 ฟังก์ชันช่วย
  const truncateText = (text, maxLength = 80) => {
    if (!text) return "";
    return text.length > maxLength
      ? text.substring(0, maxLength) + "..."
      : text;
  };

  const chunkArray = (array, size) => {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  };

  // ✅ แบ่งข้อมูลตารางเป็นหน้าๆ (15 รายการต่อหน้าตามแบบฟอร์ม)
  const logEntries = logbookData?.entries || [];
  const entriesPerPage = 15;
  const entryChunks = chunkArray(logEntries, entriesPerPage);

  return (
    <Document>
      {/* 📄 หน้าแรก: ข้อมูลทั่วไปแบบฟอร์มจริง */}
      <Page size="A4" style={styles.page}>
        {/* 🏛️ ส่วนหัวใหม่ - มีโลโก้และภาควิชา */}
        <View style={styles.headerBox}>
          <Image style={styles.logo} src="/assets/images/cs-kmutnb.png" />
          <View style={styles.headerTextContainer}>
            <Text style={styles.documentTitle}>สมุดบันทึกการฝึกงาน</Text>
          </View>
        </View>

        {/* 📝 ข้อมูลนักศึกษาแบบไม่มี dots */}
        <View style={styles.infoSection}>
          <Text style={styles.sectionHeader}>ข้อมูลนักศึกษา</Text>

          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>ชื่อ-นามสกุล</Text>
            <View style={styles.fieldValue}>
              <Text>{getStudentName()}</Text>
            </View>
          </View>

          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>รหัสนักศึกษา</Text>
            <View style={styles.fieldValue}>
              <Text>{studentInfo?.studentId || ""}</Text>
            </View>
          </View>

          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>ชั้นปี</Text>
            <View style={styles.fieldValue}>
              <Text>{studentInfo?.yearLevel || ""}</Text>
            </View>
            <Text style={[styles.fieldLabel, { marginLeft: 20 }]}>ห้อง</Text>
            <View style={styles.fieldValue}>
              <Text>{studentInfo?.classroom || ""}</Text>
            </View>
          </View>

          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>เบอร์โทรศัพท์</Text>
            <View style={styles.fieldValue}>
              <Text>
                {formatThaiPhoneNumber(studentInfo?.phoneNumber) || ""}
              </Text>
            </View>
          </View>
        </View>

        {/* 🏢 ข้อมูลสถานประกอบการแบบไม่มี dots */}
        <View style={styles.infoSection}>
          <Text style={styles.sectionHeader}>ข้อมูลสถานประกอบการ</Text>

          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>ชื่อบริษัท/หน่วยงาน</Text>
            <View style={styles.fieldValue}>
              <Text>{summaryData?.companyName || ""}</Text>
            </View>
          </View>

          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>ที่อยู่</Text>
            <View style={[styles.fieldValue, { minHeight: 35 }]}>
              <Text>{summaryData?.companyAddress || ""}</Text>
            </View>
          </View>

          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>ชื่อผู้ควบคุมงาน</Text>
            <View style={styles.fieldValue}>
              <Text>{summaryData?.supervisorName || ""}</Text>
            </View>
          </View>

          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>ตำแหน่ง</Text>
            <View style={styles.fieldValue}>
              <Text>{summaryData?.supervisorPosition || ""}</Text>
            </View>
          </View>
        </View>

        {/* 📅 ข้อมูลระยะเวลาฝึกงานแบบไม่มี dots */}
        <View style={styles.infoSection}>
          <Text style={styles.sectionHeader}>ระยะเวลาการฝึกงาน</Text>

          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>วันเริ่มฝึกงาน</Text>
            <View style={styles.fieldValue}>
              <Text>
                {formatThaiDate(summaryData?.startDate, "DD MMMM BBBB") || ""}
              </Text>
            </View>
          </View>

          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>วันสิ้นสุดการฝึกงาน</Text>
            <View style={styles.fieldValue}>
              <Text>
                {formatThaiDate(summaryData?.endDate, "DD MMMM BBBB") || ""}
              </Text>
            </View>
          </View>

          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>ระยะเวลาทั้งหมด</Text>
            <View style={styles.fieldValue}>
              <Text>
                {formatDurationText(
                  summaryData?.startDate,
                  summaryData?.endDate
                ) || ""}
              </Text>
            </View>
          </View>

          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>จำนวนชั่วโมงรวม</Text>
            <View style={styles.fieldValue}>
              <Text>{totalHours} ชั่วโมง</Text>
            </View>
          </View>
        </View>

        {/* 🔢 หมายเลขหน้า */}
        <Text style={styles.pageNumber}>หน้า 1</Text>
      </Page>

      {/* 📋 หน้าตารางบันทึกรายวันแบบฟอร์มจริง */}
      {entryChunks.length > 0 ? (
        entryChunks.map((chunk, chunkIndex) => (
          <Page key={chunkIndex} size="A4" style={styles.page}>
            <View style={styles.logTable}>
              {/* 🎯 หัวข้อตาราง */}
              <View style={styles.tableTitle}>
                <Text>บันทึกการปฏิบัติงานรายวัน</Text>
              </View>

              {/* 📊 หัวตาราง */}
              <View style={styles.tableHeaderRow}>
                <View style={styles.colNo}>
                  <Text style={styles.tableHeaderText}>ลำดับ</Text>
                </View>
                <View style={styles.colDate}>
                  <Text style={styles.tableHeaderText}>วัน/เดือน/ปี</Text>
                </View>
                <View style={styles.colTime}>
                  <Text style={styles.tableHeaderText}>เวลา</Text>
                </View>
                <View style={styles.colWork}>
                  <Text style={styles.tableHeaderText}>
                    ลักษณะงานที่ปฏิบัติ
                  </Text>
                </View>
                <View style={styles.colKnowledge}>
                  <Text style={styles.tableHeaderText}>ความรู้ที่ได้รับ</Text>
                </View>
                <View style={styles.colHours}>
                  <Text style={styles.tableHeaderText}>จำนวนชั่วโมง</Text>
                </View>
              </View>

              {/* 📝 แถวข้อมูล */}
              {chunk.map((entry, index) => {
                const globalIndex = chunkIndex * entriesPerPage + index + 1;
                return (
                  <View key={index} style={styles.tableDataRow}>
                    <View style={styles.colNo}>
                      <Text style={styles.tableCellTextCenter}>
                        {globalIndex}
                      </Text>
                    </View>
                    <View style={styles.colDate}>
                      <Text style={styles.tableCellTextCenter}>
                        {formatThaiDate(entry.workDate, "DD/MM/BBBB") || ""}
                      </Text>
                    </View>
                    <View style={styles.colTime}>
                      <Text style={styles.tableCellTextCenter}>
                        {entry.timeIn && entry.timeOut
                          ? `${entry.timeIn}-${entry.timeOut}`
                          : ""}
                      </Text>
                    </View>
                    <View style={styles.colWork}>
                      <Text style={styles.tableCellText}>
                        {truncateText(
                          entry.activities ||
                            entry.workDescription ||
                            entry.description ||
                            "",
                          120
                        )}
                      </Text>
                    </View>
                    <View style={styles.colKnowledge}>
                      <Text style={styles.tableCellText}>
                        {truncateText(
                          entry.learnings ||
                            entry.knowledgeGained ||
                            entry.learningOutcome ||
                            "",
                          100
                        )}
                      </Text>
                    </View>
                    <View style={styles.colHours}>
                      <Text style={styles.tableCellTextCenter}>
                        {entry.approvedHours ||
                          entry.totalHours ||
                          entry.workHours ||
                          0}
                      </Text>
                    </View>
                  </View>
                );
              })}

              {/* 🎯 เติมแถวว่างให้ครบ 15 แถว (ตามแบบฟอร์ม) */}
              {Array.from(
                { length: Math.max(0, entriesPerPage - chunk.length) },
                (_, i) => (
                  <View key={`empty-${i}`} style={styles.tableDataRow}>
                    <View style={styles.colNo}>
                      <Text style={styles.tableCellTextCenter}>
                        {chunkIndex * entriesPerPage + chunk.length + i + 1}
                      </Text>
                    </View>
                    <View style={styles.colDate}>
                      <Text> </Text>
                    </View>
                    <View style={styles.colTime}>
                      <Text> </Text>
                    </View>
                    <View style={styles.colWork}>
                      <Text> </Text>
                    </View>
                    <View style={styles.colKnowledge}>
                      <Text> </Text>
                    </View>
                    <View style={styles.colHours}>
                      <Text> </Text>
                    </View>
                  </View>
                )
              )}

              {/* 🎯 แถวสรุปแบบแยกชัดเจน */}
              <View style={[styles.tableDataRow, styles.summaryRow]}>
                <View
                  style={[
                    styles.colNo,
                    styles.colDate,
                    styles.colTime,
                    { flexDirection: "row" },
                  ]}
                >
                  <Text style={styles.summaryText}>รวมหน้านี้</Text>
                </View>
                <View style={styles.colKnowledge}>
                  <Text style={styles.summaryText}>
                    {chunk.reduce(
                      (sum, entry) => sum + parseFloat(entry.workHours || 0),
                      0
                    )}{" "}
                    ชั่วโมง
                  </Text>
                </View>
                <View style={styles.colWork}>
                  <Text style={styles.summaryText}>รวมสะสม (รวมหน้าก่อน)</Text>
                </View>
                <View style={styles.colHours}>
                  <Text style={styles.summaryText}>
                    {/* คำนวณชั่วโมงรวมสะสม */}
                    {(() => {
                      const currentHours = chunk.reduce(
                        (sum, entry) => sum + parseFloat(entry.workHours || 0),
                        0
                      );
                      const previousHours = entryChunks
                        .slice(0, chunkIndex)
                        .reduce(
                          (total, prevChunk) =>
                            total +
                            prevChunk.reduce(
                              (sum, entry) =>
                                sum + parseFloat(entry.workHours || 0),
                              0
                            ),
                          0
                        );
                      return previousHours + currentHours;
                    })()}{" "}
                    ชั่วโมง
                  </Text>
                </View>
              </View>
            </View>

            {/* 🔢 หมายเลขหน้า */}
            <Text style={styles.pageNumber}>หน้า {chunkIndex + 2}</Text>
          </Page>
        ))
      ) : (
        // 📝 หน้าตารางว่างเมื่อไม่มีข้อมูล
        <Page size="A4" style={styles.page}>
          <View style={styles.logTable}>
            <View style={styles.tableTitle}>
              <Text>บันทึกการปฏิบัติงานรายวัน</Text>
            </View>

            <View style={styles.tableHeaderRow}>
              <View style={styles.colNo}>
                <Text style={styles.tableHeaderText}>ลำดับ</Text>
              </View>
              <View style={styles.colDate}>
                <Text style={styles.tableHeaderText}>วัน/เดือน/ปี</Text>
              </View>
              <View style={styles.colTime}>
                <Text style={styles.tableHeaderText}>เวลา</Text>
              </View>
              <View style={styles.colWork}>
                <Text style={styles.tableHeaderText}>ลักษณะงานที่ปฏิบัติ</Text>
              </View>
              <View style={styles.colKnowledge}>
                <Text style={styles.tableHeaderText}>ความรู้ที่ได้รับ</Text>
              </View>
              <View style={styles.colHours}>
                <Text style={styles.tableHeaderText}>จำนวนชั่วโมง</Text>
              </View>
            </View>

            {/* แถวว่าง 15 แถว */}
            {Array.from({ length: 15 }, (_, i) => (
              <View key={i} style={styles.tableDataRow}>
                <View style={styles.colNo}>
                  <Text style={styles.tableCellTextCenter}>{i + 1}</Text>
                </View>
                <View style={styles.colDate}>
                  <Text> </Text>
                </View>
                <View style={styles.colTime}>
                  <Text> </Text>
                </View>
                <View style={styles.colWork}>
                  <Text> </Text>
                </View>
                <View style={styles.colKnowledge}>
                  <Text> </Text>
                </View>
                <View style={styles.colHours}>
                  <Text> </Text>
                </View>
              </View>
            ))}

            <View style={[styles.tableDataRow, styles.summaryRow]}>
              <View
                style={[
                  styles.colNo,
                  styles.colDate,
                  styles.colTime,
                  styles.colWork,
                  { flexDirection: "row" },
                ]}
              >
                <Text style={styles.summaryText}>รวมชั่วโมงหน้านี้</Text>
              </View>
              <View style={styles.colKnowledge}>
                <Text style={styles.summaryText}>0 ชั่วโมง</Text>
              </View>
              <View style={styles.colHours}>
                <Text style={styles.summaryText}>0</Text>
              </View>
            </View>
          </View>

          <Text style={styles.pageNumber}>หน้า 2</Text>
        </Page>
      )}

      {/* 💭 หน้าสรุปประสบการณ์แบบฟอร์ม */}
      <Page size="A4" style={styles.page}>
        <View style={styles.summarySection}>
          <Text style={styles.summaryTitle}>
            สรุปประสบการณ์ที่ได้รับจากการฝึกงาน
          </Text>

          <Text style={styles.reflectionText}>
            {summaryData?.reflection?.experience ||
              "ประสบการณ์ที่ได้รับจากการฝึกงานในครั้งนี้ ทำให้ผมได้เรียนรู้และเข้าใจการทำงานจริงในสภาพแวดล้อมของบริษัท ได้ฝึกทักษะการทำงานเป็นทีม การแก้ไขปัญหา และการประยุกต์ใช้ความรู้ทางทฤษฎีมาใช้ในการปฏิบัติงานจริง"}
          </Text>

          <Text style={[styles.reflectionText, { marginTop: 20 }]}>
            <Text style={styles.bold}>ความรู้และทักษะที่ได้รับ:</Text>
          </Text>
          <Text style={styles.reflectionText}>
            {summaryData?.reflection?.skillsLearned ||
              "- ทักษะด้านการเขียนโปรแกรม\n- การใช้เครื่องมือพัฒนาซอฟต์แวร์\n- การทำงานร่วมกับทีม\n- การจัดการเวลาและการแก้ไขปัญหา"}
          </Text>

          <Text style={[styles.reflectionText, { marginTop: 20 }]}>
            <Text style={styles.bold}>ปัญหาและอุปสรรค:</Text>
          </Text>
          <Text style={styles.reflectionText}>
            {summaryData?.reflection?.challenges ||
              "ในช่วงแรกของการฝึกงาน ผมประสบปัญหาในการปรับตัวเข้ากับสภาพแวดล้อมการทำงานและการเข้าใจระบบงานของบริษัท แต่ด้วยความช่วยเหลือจากพี่ๆ ในทีมและการศึกษาหาความรู้เพิ่มเติม ทำให้สามารถแก้ไขปัญหาและปรับตัวได้ดีขึ้น"}
          </Text>

          <Text style={[styles.reflectionText, { marginTop: 20 }]}>
            <Text style={styles.bold}>ข้อเสนอแนะ:</Text>
          </Text>
          <Text style={styles.reflectionText}>
            {summaryData?.reflection?.suggestions ||
              "ขอขอบคุณบริษัทที่ให้โอกาสในการฝึกงาน และหวังว่าจะได้นำความรู้และประสบการณ์ที่ได้รับไปประยุกต์ใช้ในการศึกษาและการทำงานในอนาคต"}
          </Text>
        </View>

        {/* 🎯 สถิติสรุป */}
        <View style={[styles.infoSection, { marginTop: 20 }]}>
          <Text style={styles.sectionHeader}>สรุปสถิติการฝึกงาน</Text>

          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>จำนวนวันที่ฝึกงาน</Text>
            <View style={styles.fieldValue}>
              <Text>{totalDays} วัน</Text>
            </View>
            <Text style={[styles.fieldLabel, { marginLeft: 20 }]}>
              จำนวนชั่วโมงรวม
            </Text>
            <View style={styles.fieldValue}>
              <Text>{totalHours} ชั่วโมง</Text>
            </View>
          </View>
        </View>

        <Text style={styles.pageNumber}>
          หน้า {entryChunks.length > 0 ? entryChunks.length + 2 : 3}
        </Text>
      </Page>
    </Document>
  );
};

export default InternshipLogbookTemplate;
