import React from 'react';
import { Card, Typography, Divider, Collapse, Timeline, List, Space, Alert } from 'antd';
import {
  CalendarOutlined,
  FileTextOutlined,
  BookOutlined,
  BankOutlined,
  WarningOutlined,
  UserOutlined,
  RocketOutlined,
  CheckCircleOutlined,
  ExperimentOutlined,
  TeamOutlined,
  CodeOutlined,
  ReadOutlined,
  FileSearchOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';
import './styles.css';

const { Title, Paragraph, Text } = Typography;
const { Panel } = Collapse;

const ProjectRequirements = () => {
  // ข้อมูลขั้นตอนการทำโครงงานพิเศษ
  const projectSteps = [
    {
      title: 'เลือกหัวข้อโครงงานและอาจารย์ที่ปรึกษา',
      description: 'ปรึกษาและกำหนดหัวข้อโครงงานร่วมกับอาจารย์ที่ปรึกษา',
      icon: <TeamOutlined />
    },
    {
      title: 'ส่งแบบเสนอหัวข้อโครงงาน',
      description: 'กรอกแบบฟอร์มเสนอหัวข้อโครงงานและส่งผ่านระบบ',
      icon: <FileTextOutlined />
    },
    {
      title: 'จัดทำเอกสารข้อเสนอโครงงาน (Proposal)',
      description: 'จัดทำรายละเอียดโครงงาน วัตถุประสงค์ ขอบเขต และแผนการดำเนินงาน',
      icon: <ReadOutlined />
    },
    {
      title: 'สอบหัวข้อโครงงาน',
      description: 'นำเสนอหัวข้อโครงงานต่อคณะกรรมการ',
      icon: <RocketOutlined />
    },
    {
      title: 'พัฒนาโครงงาน',
      description: 'ดำเนินการพัฒนาโครงงานตามแผนงาน และบันทึก Logbook อย่างสม่ำเสมอ',
      icon: <CodeOutlined />
    },
    {
      title: 'จัดทำรายงานฉบับสมบูรณ์',
      description: 'จัดทำเอกสารรายงานโครงงานฉบับสมบูรณ์',
      icon: <BookOutlined />
    },
    {
      title: 'สอบปริญญานิพนธ์',
      description: 'นำเสนอและสาธิตผลงานต่อคณะกรรมการ',
      icon: <FileSearchOutlined />
    }
  ];

  // ข้อกำหนดคุณสมบัติ
  const qualificationRequirements = [
    'ต้องผ่านการเรียนมาแล้วอย่างน้อย 95 หน่วยกิต',
    'ต้องมีหน่วยกิตสะสมในสาขาอย่างน้อย 47 หน่วยกิต',
    'ต้องเป็นนักศึกษาชั้นปีที่ 4 หรือเทียบเท่า',
    'ต้องลงทะเบียนเรียนวิชาโครงงานพิเศษ 1 และ 2 ตามลำดับ',
    'ต้องมีอาจารย์ที่ปรึกษาโครงงานอย่างน้อย 1 ท่าน',
    'กรณีที่หลักสูตรกำหนด ต้องผ่านการฝึกงานภาคอุตสาหกรรมก่อน'
  ];

  // ข้อกำหนดเอกสารที่ต้องส่งในระบบ
  const documentRequirements = [
    'แบบเสนอหัวข้อโครงงานพิเศษ',
    'เอกสารข้อเสนอโครงงาน (Proposal)',
    'รายงานความก้าวหน้า (Progress Report)',
    'บันทึก Logbook การทำงานอย่างสม่ำเสมอ',
    'รายงานโครงงานฉบับสมบูรณ์',
    'ซอร์สโค้ด/ไฟล์โปรแกรม/ผลงาน',
    'เอกสารคู่มือการใช้งาน (ถ้ามี)'
  ];

  // ข้อกำหนดการประเมินผล
  const evaluationRequirements = [
    'การสอบข้อเสนอโครงงาน (สัดส่วน 10%)',
    'ความก้าวหน้าของโครงงาน (สัดส่วน 20%)',
    'การรายงานและการประชุมกับอาจารย์ที่ปรึกษา (สัดส่วน 10%)',
    'คุณภาพของรายงานฉบับสมบูรณ์ (สัดส่วน 20%)',
    'การนำเสนอและสาธิตผลงาน (สัดส่วน 20%)',
    'คุณภาพของซอฟต์แวร์/ผลงาน (สัดส่วน 20%)'
  ];

  const projectTypes = [
    {
      title: 'โครงงานพัฒนาซอฟต์แวร์',
      description: 'เน้นการพัฒนาซอฟต์แวร์หรือแอปพลิเคชันเพื่อแก้ปัญหาหรือตอบสนองความต้องการ'
    },
    {
      title: 'โครงงานวิจัย',
      description: 'เน้นการศึกษาวิจัยหัวข้อเฉพาะทางด้านคอมพิวเตอร์หรือเทคโนโลยีสารสนเทศ'
    },
    {
      title: 'โครงงานฮาร์ดแวร์',
      description: 'เน้นการออกแบบและพัฒนาอุปกรณ์ฮาร์ดแวร์หรือระบบฝังตัว'
    },
    {
      title: 'โครงงานวิเคราะห์และออกแบบระบบ',
      description: 'เน้นการวิเคราะห์และออกแบบระบบสารสนเทศหรือแก้ปัญหาทางธุรกิจ'
    }
  ];

  return (
    <div className="requirements-container">
      <Card title="ข้อกำหนดโครงงานพิเศษ" bordered={false}>
        <Alert
          message="สำคัญ: ข้อกำหนดโครงงานพิเศษนี้ใช้สำหรับนักศึกษาภาควิชาวิทยาการคอมพิวเตอร์และสารสนเทศ คณะวิทยาศาสตร์ประยุกต์ มหาวิทยาลัยเทคโนโลยีพระจอมเกล้าพระนครเหนือ เท่านั้น"
          description="ข้อมูลอาจมีการเปลี่ยนแปลงได้ โปรดตรวจสอบกับอาจารย์ที่ปรึกษาหรือฝ่ายวิชาการเพื่อให้ได้ข้อมูลล่าสุด"
          type="info"
          showIcon
          style={{ marginBottom: 20 }}
        />

        <Title level={4}><CalendarOutlined /> ขั้นตอนการทำโครงงานพิเศษ</Title>
        <Timeline 
          items={projectSteps.map((step, index) => ({
            color: index === projectSteps.length - 1 ? 'green' : 'blue',
            children: (
              <>
                <Space align="baseline">
                  {step.icon}
                  <Text strong>{step.title}</Text>
                </Space>
                <div style={{ paddingLeft: 24 }}>
                  <Text type="secondary">{step.description}</Text>
                </div>
              </>
            )
          }))}
        />

        <Divider />

        <Collapse defaultActiveKey={['1']} style={{ marginBottom: 24 }}>
          <Panel 
            header={<Space><CheckCircleOutlined /> คุณสมบัติผู้ลงทะเบียนโครงงานพิเศษ</Space>} 
            key="1"
          >
            <List
              bordered
              dataSource={qualificationRequirements}
              renderItem={(item) => (
                <List.Item>
                  <Text>{item}</Text>
                </List.Item>
              )}
            />
          </Panel>

          <Panel 
            header={<Space><FileTextOutlined /> เอกสารที่ต้องส่ง</Space>} 
            key="2"
          >
            <List
              bordered
              dataSource={documentRequirements}
              renderItem={(item) => (
                <List.Item>
                  <Text>{item}</Text>
                </List.Item>
              )}
            />
          </Panel>

          <Panel 
            header={<Space><RocketOutlined /> การประเมินผล</Space>} 
            key="3"
          >
            <List
              bordered
              dataSource={evaluationRequirements}
              renderItem={(item) => (
                <List.Item>
                  <Text>{item}</Text>
                </List.Item>
              )}
            />
          </Panel>
          
          <Panel
            header={<Space><CodeOutlined /> ประเภทของโครงงานพิเศษ</Space>}
            key="4"
          >
            <List
              bordered
              dataSource={projectTypes}
              renderItem={(item) => (
                <List.Item>
                  <div>
                    <Text strong>{item.title}</Text>
                    <br />
                    <Text>{item.description}</Text>
                  </div>
                </List.Item>
              )}
            />
          </Panel>
        </Collapse>

        <Alert
          message="คำแนะนำสำหรับการทำโครงงานพิเศษ"
          description={
            <div>
              <Title level={5}>การเลือกหัวข้อและขอบเขตโครงงาน</Title>
              <ul>
                <li>เลือกหัวข้อที่อยู่ในความสนใจและความถนัดของตนเอง</li>
                <li>ปรึกษาอาจารย์ที่ปรึกษาก่อนตัดสินใจเลือกหัวข้อ</li>
                <li>กำหนดขอบเขตโครงงานให้ชัดเจนและเหมาะสมกับระยะเวลา</li>
                <li>พิจารณาทรัพยากรที่จำเป็นต้องใช้และความเป็นไปได้ในการทำโครงงาน</li>
                <li>เลือกโครงงานที่มีคุณค่าและประโยชน์ในการนำไปใช้</li>
              </ul>

              <Title level={5}>การวางแผนการทำงาน</Title>
              <ul>
                <li>วางแผนการทำงานอย่างเป็นระบบ ตั้งแต่เริ่มต้นจนจบโครงงาน</li>
                <li>แบ่งงานเป็นส่วนย่อยๆ และกำหนดเวลาแล้วเสร็จของแต่ละส่วน</li>
                <li>ประชุมกับอาจารย์ที่ปรึกษาอย่างสม่ำเสมอ (อย่างน้อย 2 สัปดาห์/ครั้ง)</li>
                <li>บันทึก Logbook ทุกครั้งที่มีการดำเนินงานหรือประชุม</li>
                <li>เผื่อเวลาสำหรับการแก้ไขปัญหาที่อาจเกิดขึ้นระหว่างการพัฒนา</li>
              </ul>

              <Title level={5}>การเขียนรายงาน</Title>
              <ul>
                <li>ศึกษารูปแบบและโครงสร้างรายงานให้เข้าใจก่อนเริ่มเขียน</li>
                <li>เขียนบทแรกๆ ควบคู่ไปกับการพัฒนาโครงงาน ไม่ควรรอให้พัฒนาเสร็จแล้วค่อยเขียนทั้งหมด</li>
                <li>อ้างอิงแหล่งข้อมูลอย่างถูกต้องตามรูปแบบที่กำหนด</li>
                <li>ตรวจสอบการสะกดคำและไวยากรณ์ให้ถูกต้อง</li>
                <li>ให้อาจารย์ที่ปรึกษาตรวจสอบรายงานก่อนจัดทำฉบับสมบูรณ์</li>
              </ul>
            </div>
          }
          type="warning"
          icon={<ExperimentOutlined />}
          showIcon
          style={{ marginTop: 16 }}
        />

      </Card>
    </div>
  );
};

export default ProjectRequirements;