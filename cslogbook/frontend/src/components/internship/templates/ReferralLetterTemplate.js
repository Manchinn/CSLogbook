import React from "react";
import { Document, Page, Text, View, Image } from "@react-pdf/renderer";
import letterStyles from "./styles/letterStyles";
import { formatThaiDate } from "../../../utils/dateUtils";
import {
  cleanText,
  formatStudentId,
  formatThaiPhoneNumber,
} from "../../../utils/thaiFormatter";

// หนังสือส่งตัวนักศึกษาเข้าฝึกงาน
const ReferralLetterTemplate = ({ data }) => {
  // ตรวจสอบข้อมูลและกำหนดค่าเริ่มต้นถ้าไม่มีข้อมูล
  const {
    documentNumber = "อว 7105(05)/...",
    documentDateThai = formatThaiDate(new Date(), "DD MMMM BBBB"),
    companyName = "",
    contactPersonName = "",
    contactPersonPosition = "",
    supervisorName = "",
    supervisorPosition = "",
    supervisorPhone = "",
    supervisorEmail = "",
    studentData = [],
    startDateThai = "",
    endDateThai = "",
    internshipDays = 0,
    internshipPosition = "",
    universityName = "มหาวิทยาลัยเทคโนโลยีพระจอมเกล้าพระนครเหนือ",
    facultyName = "คณะวิทยาศาสตร์ประยุกต์",
    departmentName = "ภาควิชาวิทยาการคอมพิวเตอร์และสารสนเทศ",
    address = "1518 ถ.ประชาราษฎร์ 1 เขตบางซื่อ กทม.10800",
    advisorName = "รองศาสตราจารย์ ดร.ธนภัทร์ อนุศาสน์อมรกุล",
    advisorTitle = "หัวหน้าภาควิชาวิทยาการคอมพิวเตอร์และสารสนเทศ",
    staffOfficerName = "นายนที ปัญญาประสิทธิ์",
    staffOfficerEmail = "natee.p@sci.kmutnb.ac.th",
    staffOfficerPhone = "02-555-2000 ต่อ 4602",
  } = data || {};

  return (
    <Document>
      <Page size="A4" style={letterStyles.page}>
        {/* ส่วนหัวหนังสือ */}
        <View style={letterStyles.header}>
          {/* ตราครุฑ */}
          <Image src="/assets/images/garuda.png" style={letterStyles.emblem} />

          {/* เลขที่หนังสือ */}
          <View style={letterStyles.documentNumberContainer}>
            <Text style={letterStyles.documentNumber}>
              ที่ {documentNumber}
            </Text>
          </View>

          {/* ที่อยู่หน่วยงาน */}
          <View style={letterStyles.organizationContainer}>
            <Text style={letterStyles.organizationText}>{departmentName}</Text>
            <Text style={letterStyles.organizationText}>{facultyName}</Text>
            <Text style={letterStyles.organizationText}>{universityName}</Text>
            <Text style={letterStyles.organizationText}>{address}</Text>
          </View>

          {/* วันที่ */}
          <View style={letterStyles.dateContainer}>
            <Text style={letterStyles.dateText}>{documentDateThai}</Text>
          </View>
        </View>

        {/* หัวเรื่อง */}
        <View style={letterStyles.subjectContainer}>
          <Text style={letterStyles.subjectLabel}>เรื่อง</Text>
          <Text style={letterStyles.subjectText}>ส่งตัวนักศึกษาเข้าฝึกงาน</Text>
        </View>

        {/* ผู้รับ */}
        <View style={letterStyles.recipientContainer}>
          <Text style={letterStyles.recipientLabel}>เรียน</Text>
          <View style={letterStyles.recipientTextContainer}>
            <Text style={letterStyles.recipientText}>
              {contactPersonName ? `คุณ ${contactPersonName}` : "ผู้จัดการ"}
              {contactPersonPosition ? ` ตำแหน่ง ${contactPersonPosition}` : ""}
            </Text>
            <Text style={letterStyles.recipientText}>
              {companyName ? `${companyName}` : ""}
            </Text>
          </View>
        </View>

        {/* เนื้อหาจดหมาย */}
        <View style={letterStyles.contentContainer}>
          <Text style={letterStyles.paragraph}>
            {`อ้างถึงหนังสือของท่าน ลงวันที่ ${
              documentDateThai || "..."
            } เรื่อง การตอบรับนักศึกษาเข้าฝึกงาน ภาควิชาวิทยาการคอมพิวเตอร์และสารสนเทศ ขอขอบพระคุณที่ท่านให้ความอนุเคราะห์รับนักศึกษาเข้าฝึกงาน`}
          </Text>

          <Text style={letterStyles.paragraph}>
            {`บัดนี้ภาควิชาวิทยาการคอมพิวเตอร์และสารสนเทศ ขอส่งตัวนักศึกษา จำนวน ${
              studentData.length || 1
            } คน เพื่อเข้าฝึกงาน${
              internshipPosition ? ` ในตำแหน่ง ${internshipPosition}` : ""
            } ตามรายชื่อดังต่อไปนี้`}
          </Text>

          {/* รายชื่อนักศึกษา */}
          <View style={letterStyles.studentListContainer}>
            {studentData && studentData.length > 0 ? (
              studentData.map((student, index) => (
                <View key={index} style={letterStyles.studentRow}>
                  <Text style={letterStyles.studentNumber}>{index + 1}.</Text>
                  <Text style={letterStyles.studentName}>
                    {`${cleanText(student.fullName)}`}
                  </Text>
                  <Text style={letterStyles.studentId}>
                    {`${formatStudentId(student.studentId)}`}
                  </Text>
                </View>
              ))
            ) : (
              <View style={letterStyles.studentRow}>
                <Text style={letterStyles.studentNumber}>1.</Text>
                <Text style={letterStyles.studentName}>
                  ......................................
                </Text>
                <Text style={letterStyles.studentId}>
                  .......................
                </Text>
              </View>
            )}
          </View>

          {/* ข้อมูลการฝึกงาน */}
          <Text style={letterStyles.paragraph}>
            {`ทั้งนี้ นักศึกษาจะเริ่มเข้าฝึกงานตั้งแต่วันที่ ${
              startDateThai || "..."
            } ถึง ${endDateThai || "..."} รวมระยะเวลา ${
              internshipDays || "..."
            } วัน (ไม่น้อยกว่า 40 วัน หรือ 240 ชั่วโมง) ตามที่ได้แจ้งไว้แล้ว`}
          </Text>

          {/* ข้อมูลผู้ควบคุมงาน (ถ้ามี) */}
          {supervisorName && (
            <Text style={letterStyles.paragraph}>
              {`โดยมี${supervisorName}${
                supervisorPosition ? ` ตำแหน่ง ${supervisorPosition}` : ""
              } เป็นผู้ควบคุมการฝึกงาน${
                supervisorPhone
                  ? ` โทรศัพท์ ${formatThaiPhoneNumber(supervisorPhone)}`
                  : ""
              }${supervisorEmail ? ` อีเมล ${supervisorEmail}` : ""}`}
            </Text>
          )}

          <Text style={letterStyles.paragraph}>
            {`ภาควิชาวิทยาการคอมพิวเตอร์และสารสนเทศ ขอความกรุณาจากท่านโปรดให้คำแนะนำและดูแลนักศึกษาในระหว่างการฝึกงาน และหากมีปัญหาใดๆ โปรดติดต่อภาควิชาฯ ตามหมายเลขโทรศัพท์ด้านล่าง`}
          </Text>

          <Text style={letterStyles.paragraph}>
            {`จึงเรียนมาเพื่อโปรดทราบและดำเนินการต่อไป`}
          </Text>

          {/* ลงนาม */}
          <View style={letterStyles.closingContainer}>
            <Text style={letterStyles.closingText}>ขอแสดงความนับถือ</Text>
            <View style={letterStyles.signatureContainer}>
              {/* <Image 
                src="/assets/images/signature.png"
                style={letterStyles.signatureImage}
              /> */}
              {/* <View style={letterStyles.signatureLine}>
                <Text style={{ fontSize: 14, marginBottom: 10 }}>
                  ลงชื่อ..................................................
                </Text>
              </View> */}
              <Text style={letterStyles.signerName}>({advisorName})</Text>
              <Text style={letterStyles.signerPosition}>{advisorTitle}</Text>
            </View>
          </View>

          {/* ส่วนท้าย */}
          <View style={letterStyles.footer}>
            <Text style={letterStyles.footerText}>{departmentName}</Text>
            {staffOfficerName && (
              <Text style={letterStyles.footerText}>
                เจ้าหน้าที่ภาควิชา: {staffOfficerName}
              </Text>
            )}
            {staffOfficerEmail && (
              <Text style={letterStyles.footerText}>
                อีเมล: {staffOfficerEmail}
              </Text>
            )}
            <Text style={letterStyles.footerText}>
              โทร. {staffOfficerPhone || "02-555-2000 ต่อ 4602"}
            </Text>
          </View>
        </View>
      </Page>
    </Document>
  );
};

export default ReferralLetterTemplate;
