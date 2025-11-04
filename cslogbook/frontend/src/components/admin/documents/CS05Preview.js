import React from 'react';
import { Card, Typography, Divider, Space } from 'antd';
import dayjs from 'dayjs';
import 'dayjs/locale/th';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import buddhistEra from 'dayjs/plugin/buddhistEra';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(buddhistEra);
dayjs.locale('th');

const { Title, Paragraph, Text } = Typography;

const CS05Preview = ({ data }) => {
  // สนับสนุนทั้งรูปแบบข้อมูลที่มี data.data และไม่มี
  const documentData = data?.data || data;
  
  // รองรับทั้งรูปแบบข้อมูลแบบ nested และแบบ flat
  const internshipDocument = documentData?.internshipDocument || {};
  
  // Helper function to extract filename from full path
  const getFilenameFromPath = (filePath) => {
    if (!filePath) return null;
    return filePath.split(/[\\/]/).pop(); // รองรับทั้ง \ และ /
  };
  
  // Format date with Buddhist calendar year and Asia/Bangkok timezone
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return dayjs.tz(dateString, 'Asia/Bangkok').format('D MMMM BBBB');
  };

  // รองรับโครงสร้างข้อมูลจากทุก endpoint
  const studentName = 
    documentData?.studentName || 
    documentData?.fullName ||
    (documentData?.owner && `${documentData.owner.firstName} ${documentData.owner.lastName}`) || 
    (internshipDocument?.studentName) ||
    (documentData?.user && `${documentData.user.firstName} ${documentData.user.lastName}`) ||
    (documentData?.User && `${documentData.User.firstName} ${documentData.User.lastName}`) ||
    '-';
    
  // ปรับปรุงการดึงข้อมูลรหัสนักศึกษา - แก้ไขตามโครงสร้างข้อมูลที่ได้รับจริง
  const getStudentCode = () => {
    const possibleStudentCodes = [
      documentData?.owner?.student?.studentCode,
    ];
    
    // กรองเฉพาะค่าที่ไม่ว่าง และไม่เป็น undefined หรือ null
    const validCodes = possibleStudentCodes.filter(code => code && code !== 'undefined' && code !== 'null');
    
    if (validCodes.length > 0) {
      return validCodes[0];
    }
    
    return '-';
  };
  
  const studentCode = getStudentCode();

  // คำนวณชั้นปีจากข้อมูลโดยตรง
  const getStudentYear = () => {
    // 1. ดึงจากข้อมูลโดยตรง (ใช้กรณีที่มีข้อมูลชั้นปีอยู่แล้ว)
    if (documentData?.owner?.student?.studentYear) {
      return documentData.owner.student.studentYear;
    }
    
    // 2. ถ้าไม่มี ใช้การคำนวณจากรหัสนักศึกษา
    if (studentCode && studentCode !== '-' && studentCode.length >= 2) {
      try {
        const currentDate = new Date();
        const currentYear = currentDate.getFullYear() + 543; // พ.ศ.
        
        // รหัสนักศึกษา 2 หลักแรกมักเป็นปีที่เข้าเรียน เช่น 64XXXXXXXX เข้าปี 2564
        const studentCodePrefix = studentCode.substring(0, 2);
        // ตรวจสอบว่าเป็นตัวเลขหรือไม่
        if (/^\d+$/.test(studentCodePrefix)) {
          const enrollmentYear = parseInt(studentCodePrefix) + 2500; // พ.ศ. ที่เข้าเรียน
          
          // คำนวณชั้นปี = ปีปัจจุบัน - ปีที่เข้าเรียน + 1
          let calculatedYear = currentYear - enrollmentYear + 1;
          
          // ปรับค่าตามช่วงเวลาของปีการศึกษา
          const currentMonth = currentDate.getMonth() + 1; // มกราคม = 1, ธันวาคม = 12
          if (currentMonth >= 1 && currentMonth <= 7) {
            calculatedYear -= 1; // ลดชั้นปีลง 1 เพราะยังไม่ขึ้นปีการศึกษาใหม่
          }
          
          // ตรวจสอบว่าชั้นปีอยู่ในช่วงที่เป็นไปได้
          if (calculatedYear < 1) calculatedYear = 1;
          if (calculatedYear > 8) calculatedYear = 8;
          
          return calculatedYear;
        }
      } catch (e) {
        // Failed to calculate year from student code
      }
    }
    
    // 3. ถ้ามีหน่วยกิต ให้ประมาณชั้นปีจากหน่วยกิต
    const credits = parseInt(documentData?.owner?.student?.totalCredits) || 0;
    if (credits > 0) {
      if (credits >= 127) return 4;
      if (credits >= 95) return 4;
      if (credits >= 81) return 3;
      if (credits >= 30) return 2;
      return 1;
    }
    
    // 4. ใช้ค่าเริ่มต้น (ชั้นปีที่ 3 เพราะนักศึกษาชั้นปีที่ 3 มักลงฝึกงาน)
    return 3;
  };
  
  // เรียกใช้ฟังก์ชันดึงชั้นปี
  const year = getStudentYear();
  
  // ดึงข้อมูลหน่วยกิตจากข้อมูลนักศึกษา (ใช้ของจริงที่มาจาก API)
  const getTotalCredits = () => {
    // พยายามดึงจากข้อมูลนักศึกษาโดยตรง
    const credits = documentData?.owner?.student?.totalCredits;
    
    if (credits && !isNaN(parseInt(credits))) {
      return parseInt(credits);
    }
    
    return '81+'; // ค่าเริ่มต้นถ้าไม่มีข้อมูล
  };
  
  const totalCredits = getTotalCredits();
  
  const companyName = 
    documentData?.companyName || 
    internshipDocument?.companyName || 
    '-';
    
  const companyAddress = 
    documentData?.companyAddress || 
    internshipDocument?.companyAddress || 
    '-';
  
  const position = 
    internshipDocument?.internshipPosition || 
    documentData?.internshipPosition || 
    documentData?.position ||
    '-';
    
  const startDate = 
    documentData?.startDate || 
    internshipDocument?.startDate || 
    '-';
    
  const endDate = 
    documentData?.endDate || 
    internshipDocument?.endDate || 
    '-';
  
  const createdAt = documentData?.createdAt || documentData?.created_at; // Use only database value
  
  const transcriptFilename = getFilenameFromPath(documentData?.filePath) || documentData?.fileName;

  return (
    <div className="cs05-preview-container" style={{ padding: '20px', backgroundColor: 'white' }}>
      <Card 
        bordered={false}
        style={{ width: '100%', maxWidth: '900px', margin: '0 auto' }}
      >
        <div style={{ textAlign: 'right', marginBottom: '16px' }}>
          <Title level={5} style={{ margin: 0 }}>คพ.05</Title>
        </div>

        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <Title level={4} style={{ margin: 0, fontWeight: 'bold' }}>
            คำร้องขอให้ภาควิชาฯ ออกหนังสือขอความอนุเคราะห์รับนักศึกษาเข้าฝึกงาน
          </Title>
          <Paragraph style={{ margin: 0, marginTop: '8px' }}>
            ภาควิชาวิทยาการคอมพิวเตอร์และสารสนเทศ
          </Paragraph>
          <Paragraph style={{ margin: 0 }}>
            วันที่ {formatDate(createdAt)}
          </Paragraph>
        </div>

        <Paragraph style={{ textIndent: '2em', fontSize: '16px', marginBottom: '8px' }}>
          <Text strong>เรื่อง</Text> ขอให้ภาควิชาฯออกหนังสือราชการ
        </Paragraph>
        
        <Paragraph style={{ textIndent: '2em', fontSize: '16px', marginBottom: '16px' }}>
          <Text strong>เรียน</Text> หัวหน้าภาควิชาวิทยาการคอมพิวเตอร์และสารสนเทศ
        </Paragraph>

        <Paragraph style={{ textIndent: '2em', fontSize: '16px', marginBottom: '24px' }}>
          ด้วยข้าพเจ้า มีความประสงค์ขอให้ภาควิชาฯ ออกหนังสือราชการเพื่อขอความอนุเคราะห์เข้ารับการฝึกงาน
          ตามรายละเอียดดังนี้
        </Paragraph>

        <Space direction="vertical" size="small" style={{ width: '100%', marginBottom: '24px' }}>
          <Paragraph style={{ fontSize: '16px' }}>
            ข้าพเจ้า <Text underline>{studentName}</Text> รหัสนักศึกษา <Text underline>{studentCode}</Text>
          </Paragraph>
          
          <Paragraph style={{ fontSize: '16px' }}>
            ชั้นปีที่ <Text underline>{year}</Text> หน่วยกิตสะสมทั้งหมด <Text underline>{totalCredits}</Text>
          </Paragraph>
        </Space>
        
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <div>
            <Paragraph style={{ fontSize: '16px', marginBottom: '8px' }}>
              1. ขอความอนุเคราะห์ฝึกงาน ชื่อบริษัท/หน่วยงาน
            </Paragraph>
            <Card
              size="small"
              bordered
              style={{ borderRadius: '4px', backgroundColor: '#f9f9f9' }}
            >
              <Paragraph style={{ margin: 0 }}>{companyName}</Paragraph>
            </Card>
          </div>

          <div>
            <Paragraph style={{ fontSize: '16px', marginBottom: '8px' }}>
              2. ตำแหน่งที่ขอฝึกงาน
            </Paragraph>
            <Card
              size="small"
              bordered={false}
              style={{ borderRadius: '4px', backgroundColor: '#f9f9f9' }}
            >
              <Paragraph style={{ margin: 0 }}>
                {position !== '-' ? position : <Text type="secondary" italic>ไม่ได้ระบุตำแหน่ง</Text>}
              </Paragraph>
            </Card>
          </div>

          <div>
            <Paragraph style={{ fontSize: '16px', marginBottom: '8px' }}>
              3. สถานที่ตั้ง
            </Paragraph>
            <Card
              size="small"
              bordered
              style={{ borderRadius: '4px', backgroundColor: '#f9f9f9' }}
            >
              <Paragraph style={{ margin: 0, whiteSpace: 'pre-line' }}>{companyAddress}</Paragraph>
            </Card>
          </div>

          <div>
            <Paragraph style={{ fontSize: '16px' }}>
              4. ระยะเวลาฝึกงาน <Text underline>{formatDate(startDate)}</Text> ถึง <Text underline>{formatDate(endDate)}</Text>
            </Paragraph>
          </div>
        </Space>

        <Divider dashed />

        <div style={{ marginBottom: '24px' }}>
          <Title level={5}>หมายเหตุ</Title>
          <Paragraph>
            1. นักศึกษาจะต้องฝึกงานไม่ต่ำกว่า 240 ชั่วโมง (ไม่ต่ำกว่า 40 วันทำการ ไม่นับ วันหยุดราชการ ขา สาย ลา)
          </Paragraph>
          <Paragraph>
            2. โดยนักศึกษาต้องแนบเอกสารใบแสดงผลการเรียน มาเพื่อยืนยันว่ามีจำนวนหน่วยกิตรวมทั้งหมด ณ วันที่ยื่นเอกสารไม่ต่ำกว่า 81 หน่วยกิต (นักศึกษาสามารถพรินต์ผลการเรียนได้จากระบบ REG)
          </Paragraph>
        </div>

        <Paragraph style={{ textIndent: '2em', fontSize: '16px' }}>
          จึงเรียนมาเพื่อโปรดพิจารณา
        </Paragraph>
      </Card>
    </div>
  );
};

export default CS05Preview;