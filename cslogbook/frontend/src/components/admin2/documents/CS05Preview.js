import React, { useEffect } from 'react';
import { Card, Typography, Row, Col, Divider, Space } from 'antd';
import moment from 'moment';
import 'moment/locale/th';
import dayjs from 'dayjs';
import 'dayjs/locale/th';

const { Title, Paragraph, Text } = Typography;

const CS05Preview = ({ data }) => {
  // Debug ข้อมูลที่ได้รับ
  useEffect(() => {
    console.log("CS05Preview received data:", data);
  }, [data]);

  // สนับสนุนทั้งรูปแบบข้อมูลที่มี data.data และไม่มี
  const documentData = data?.data || data;
  
  // รองรับทั้งรูปแบบข้อมูลแบบ nested และแบบ flat
  const internshipDocument = documentData?.internshipDocument || {};
  
  // Format date with Buddhist calendar year
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return moment(dateString).locale('th').add(543, 'year').format('D MMMM YYYY');
  };

  // รองรับโครงสร้างข้อมูลจากทุก endpoint
  const studentName = 
    documentData?.studentName || 
    (documentData?.Student?.User && `${documentData.Student.User.firstName} ${documentData.Student.User.lastName}`) ||
    (documentData?.owner && `${documentData.owner.firstName} ${documentData.owner.lastName}`) || 
    '-';
    
  const studentCode = 
    documentData?.studentCode || 
    documentData?.Student?.studentCode || 
    '-';
    
  const year = documentData?.year || 3; // ค่าเริ่มต้น ปี 3 ถ้าไม่มีข้อมูล
  
  const totalCredits = documentData?.totalCredits || '81+'; // ค่าเริ่มต้น 81+ ถ้าไม่มีข้อมูล
  
  const companyName = 
    documentData?.companyName || 
    internshipDocument?.companyName || 
    '-';
    
  const companyAddress = 
    documentData?.companyAddress || 
    internshipDocument?.companyAddress || 
    '-';
    
  const startDate = 
    documentData?.startDate || 
    internshipDocument?.startDate || 
    '-';
    
  const endDate = 
    documentData?.endDate || 
    internshipDocument?.endDate || 
    '-';
  
  const createdAt = documentData?.createdAt || new Date();
  
  const transcriptUrl = documentData?.transcriptFilename || documentData?.fileName;

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
              2. สถานที่ตั้ง
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
              ระยะเวลาฝึกงาน <Text underline>{formatDate(startDate)}</Text> ถึง <Text underline>{formatDate(endDate)}</Text>
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
      
      {transcriptUrl && (
        <div style={{ marginTop: '20px', textAlign: 'center' }}>
          <a 
            href={`${process.env.REACT_APP_API_URL}/files/${transcriptUrl}`} 
            target="_blank" 
            rel="noopener noreferrer"
            style={{ fontSize: '16px' }}
          >
            ดูไฟล์ใบแสดงผลการเรียนที่แนบมา (Transcript)
          </a>
        </div>
      )}
    </div>
  );
};

export default CS05Preview;