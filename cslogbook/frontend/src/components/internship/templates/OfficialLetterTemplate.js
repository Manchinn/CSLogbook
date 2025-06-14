import React from 'react';
import { Document, Page, Text, View } from '@react-pdf/renderer';
import { commonStyles, safeText, formatThaiDate } from './styles/commonStyles';
import { officialStyles } from './styles/officialStyles';
import { formatThaiDate as formatThaiDateUtil } from '../../../utils/dateUtils';
import { formatStudentId, formatFullName } from '../../../utils/thaiFormatter';

const OfficialLetterTemplate = ({ data }) => {
  return (
    <Document>
      <Page size="A4" style={commonStyles.page}>
        {/* หัวจดหมายราชการ */}
        <View style={officialStyles.officialHeader}>
          <Text style={officialStyles.universityName}>
            มหาวิทยาลัยเทคโนโลยีพระจอมเกล้าพระนครเหนือ
          </Text>
          <Text style={officialStyles.facultyName}>
            คณะวิทยาศาสตร์ประยุกต์
          </Text>
          <Text style={officialStyles.departmentName}>
            ภาควิชาวิทยาการคอมพิวเตอร์และเทคโนโลยีสารสนเทศ
          </Text>
          <Text style={officialStyles.address}>
            ๑๕๑๘ ถนนประชาราษฎร ๑ แขวงวงศ์สว่าง เขตบางซื่อ กรุงเทพฯ ๑๐๘๐๐
          </Text>
          <Text style={officialStyles.address}>
            โทร ๐-๒๕๕๕-๒๐๐๐ ต่อ ๔๖๐๒ 
          </Text>
        </View>

        {/* เลขที่หนังสือและวันที่ - ใช้ utils ใหม่ */}
        <Text style={officialStyles.documentNumber}>
          ศธ ๐๕๒๑.๒(๓)/{safeText(data.documentNumber, new Date().getFullYear() + 543)}
        </Text>
        <Text style={officialStyles.documentDate}>
          {formatThaiDateUtil(data.documentDate || new Date(), 'DD MMMM BBBB')}
        </Text>

        {/* เรื่อง */}
        <View style={officialStyles.subject}>
          <Text>
            <Text style={officialStyles.subjectLabel}>เรื่อง</Text> ขอความอนุเคราะห์รับนักศึกษาเข้าฝึกงาน
          </Text>
        </View>

        {/* เรียน */}
        <View style={officialStyles.salutation}>
          <Text>
            <Text style={officialStyles.salutationLabel}>เรียน</Text> {safeText(data.contactPersonName)}
          </Text>
          <Text style={{ marginLeft: 50, marginTop: 5 }}>
            {safeText(data.contactPersonPosition)} {safeText(data.companyName)}
          </Text>
        </View>

        {/* เนื้อหาจดหมาย */}
        <Text style={officialStyles.paragraph}>
          ด้วยคณะวิทยาศาสตร์ประยุกต์ มหาวิทยาลัยเทคโนโลยีพระจอมเกล้าพระนครเหนือ
          มีนโยบายให้นักศึกษาหลักสูตรวิทยาศาสตรบัณฑิต สาขาวิชาวิทยาการคอมพิวเตอร์และเทคโนโลยีสารสนเทศ
          ได้ฝึกงานในสถานประกอบการจริง เพื่อให้นักศึกษาได้เรียนรู้และพัฒนาทักษะการทำงาน
        </Text>

        <Text style={officialStyles.paragraph}>
          ในการนี้ คณะฯ จึงขอความอนุเคราะห์จาก{safeText(data.companyName)} 
          รับนักศึกษาเข้าฝึกงานในช่วงวันที่ {formatThaiDateUtil(data.startDate, 'DD MMMM BBBB')} 
          ถึงวันที่ {formatThaiDateUtil(data.endDate, 'DD MMMM BBBB')} รวม {safeText(data.internshipDuration)} วัน 
          จำนวน {data.studentData?.length || 1} คน ดังรายชื่อต่อไปนี้
        </Text>

        {/* รายชื่อนักศึกษา - ใช้ utils ใหม่ */}
        {data.studentData?.map((student, index) => (
          <Text key={index} style={officialStyles.listItem}>
            {index + 1}. {formatFullName(student.firstName, student.lastName, student.title) || safeText(student.fullName)} 
            รหัสนักศึกษา {formatStudentId(student.studentId)} 
            ชั้นปีที่ {safeText(student.yearLevel)} 
            ห้อง {safeText(student.classroom)}
          </Text>
        ))}

        <Text style={officialStyles.paragraph}>
          ทั้งนี้ คณะฯ จะมีอาจารย์ที่ปรึกษาโครงการ คือ {safeText(data.advisorName, 'อาจารย์ที่ปรึกษา')} 
          เป็นผู้ประสานงานและติดตามการฝึกงานของนักศึกษา
        </Text>

        <Text style={officialStyles.paragraph}>
          จึงเรียนมาเพื่อโปรดพิจารณา หากได้รับความอนุเคราะห์จากท่าน 
          คณะฯ จะได้ประโยชน์อย่างยิ่ง และขอขอบพระคุณมา ณ โอกาสนี้
        </Text>

        {/* ลายเซ็นและตำแหน่ง */}
        <View style={officialStyles.officialSignature}>
          <Text style={officialStyles.signatureTitle}>ขอแสดงความนับถือ</Text>
          
          <Text style={officialStyles.signatureNameOfficial}>
            (.................................................)
          </Text>
          <Text style={officialStyles.signaturePosition}>
            ผู้อำนวยการสำนักส่งเสริมวิชาการและงานทะเบียน
          </Text>
          <Text style={officialStyles.signaturePosition}>
            ปฏิบัติราชการแทนคณบดีคณะวิทยาศาสตร์ประยุกต์
          </Text>
        </View>

        {/* ส่วนท้าย */}
        <View style={officialStyles.footer}>
          <Text style={commonStyles.footerText}>
            กรณีมีข้อสงสัย กรุณาติดต่อ เจ้าหน้าที่ภาควิชาวิทยาการคอมพิวเตอร์และเทคโนโลยีสารสนเทศ
            โทรศัพท์ ๐-๒๕๕๕-๒๐๐๐ ต่อ ๔๖๐๒
          </Text>
        </View>
      </Page>
    </Document>
  );
};

export default OfficialLetterTemplate;