import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
} from "@react-pdf/renderer";
import letterStyles from "./styles/letterStyles";
import { formatThaiDate } from "../../../utils/dateUtils";
import {
  cleanText,
  formatStudentId,
  formatFullName,
} from "../../../utils/thaiFormatter";

// ตัวอย่างหนังสือขอความอนุเคราะห์รับนักศึกษาเข้าฝึกงาน
const OfficialLetterTemplate = ({ data }) => {
  // ตรวจสอบข้อมูลและกำหนดค่าเริ่มต้นถ้าไม่มีข้อมูล
  const {
    documentNumber = "อว 7105(05)/...",
    documentDate = new Date(),
    documentDateThai = formatThaiDate(new Date(), "DD MMMM BBBB"),
    companyName = "",
    contactPersonName = "",
    contactPersonPosition = "",
    studentData = [],
    startDate = "",
    endDate = "",
    startDateThai = "",
    endDateThai = "",
    internshipDays = 0,
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
          <Text style={letterStyles.subjectText}>
            ขอความอนุเคราะห์รับนักศึกษาเข้าฝึกงาน
          </Text>
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

        {/* สิ่งที่ส่งมาด้วย */}
        <View style={letterStyles.attachmentContainer}>
          <Text style={letterStyles.attachmentLabel}>สิ่งที่ส่งมาด้วย</Text>
          <View style={letterStyles.attachmentTextContainer}>
            <Text style={letterStyles.attachmentText}>
              1. หนังสือแจ้งผลการตอบรับนักศึกษาเข้าฝึกงาน
            </Text>
          </View>
        </View>

        {/* เนื้อหาจดหมาย */}
        <View style={letterStyles.contentContainer}>
          <Text style={letterStyles.paragraph}>
            {`ด้วยภาควิชาวิทยาการคอมพิวเตอร์และสารสนเทศ คณะวิทยาศาสตร์ประยุกต์ มหาวิทยาลัยเทคโนโลยีพระจอมเกล้าพระนครเหนือ  ทำการสอนหลักสูตรวิทยาการคอมพิวเตอรระดับปริญญาตรี และมีนโยบายที่จะส่งเสริมนักศึกษาให้มีประสบการณ์ทางด้านปฏิบัติงานจริง นอกเหนือจากการเรียนในชั้นเรียน จึงกำหนดให้นักศึกษาในหลักสูตรต้องเข้ารับการฝึกงานในภาคการศึกษาฤดูร้อน ทั้งนี้เพื่อเป็นการวางแผนให้นักศึกษาที่จะสำเร็จการศึกษาออกไปประกอบวิชาชีพ เป็นผู้ที่มีความสามารถในการปฏิบัติงาน ได้อย่างมีประสิทธิภาพ`
            }
          </Text>
          <Text style={letterStyles.paragraph}>
            {`ภาควิชาวิทยาการคอมพิวเตอร์และสารสนเทศ ได้พิจารณาแล้วเห็นว่าหน่วยงานของท่านเป็นหน่วยงานที่มีประสิทธิภาพทางด้านคอมพิวเตอร์และสารสนเทศ ภาควิชาวิทยาการคอมพิวเตอร์และสารสนเทศ จึงใคร่ขอความอนุเคราะห์ทางหน่วยงานของท่าน รับนักศึกษาเพื่อฝึกงาน จำนวน ${studentData.length || 1} คน คือ`}
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
                <Text style={letterStyles.studentNumber}></Text>
                <Text style={letterStyles.studentName}></Text>
                <Text style={letterStyles.studentId}></Text>
              </View>
            )}
          </View>

          {/* วันที่ฝึกงาน */}
          <Text style={letterStyles.paragraph}>
            {`โดยเริ่มตั้งแต่วันที่ ${
              startDateThai || "2 มกราคม 2568"
            } ถึง ${endDateThai || "4 มีนาคม 2568"} รวมระยะเวลาทั้งสิ้น ${
              internshipDays || "60"
            } วัน (หรือจนกวาจะครบ 240 ชั่วโมง) เพื่อให้การจัดตารางฝึกงานของนักศึกษาเป็นไปด้วยความเรียบร้อย ภาควิชาฯใคร่ขอความกรุณาโปรดพิจารณาให้ความอนุเคราะห์จักขอบพระคุณยิ่ง`}
          </Text>

          {/* ลงนาม */}
          <View style={letterStyles.closingContainer}>
            <Text style={letterStyles.closingText}>ขอแสดงความนับถือ</Text>
            <View style={letterStyles.signatureContainer}>
              <Image 
                src="/assets/images/signature.png"
                style={letterStyles.signatureImage}
              />
              <Text style={letterStyles.signerName}>({advisorName})</Text>
              <Text style={letterStyles.signerPosition}>{advisorTitle}</Text>
            </View>
          </View>

          {/* ส่วนท้าย */}
          <View style={letterStyles.footer}>
            <Text style={letterStyles.footerText}>{departmentName}</Text>
            {staffOfficerName && (
              <Text style={letterStyles.footerText}>เจ้าหน้าที่ภาควิชา: {staffOfficerName}</Text>
            )}
            {staffOfficerEmail && (
              <Text style={letterStyles.footerText}>อีเมล: {staffOfficerEmail}</Text>
            )}
            <Text style={letterStyles.footerText}>
              โทร. {staffOfficerPhone || '02-555-2000 ต่อ 4602'}
            </Text>
          </View>
        </View>
      </Page>
    </Document>
  );
};

export default OfficialLetterTemplate;
