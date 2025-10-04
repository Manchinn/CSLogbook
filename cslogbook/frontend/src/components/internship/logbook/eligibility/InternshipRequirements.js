import React from 'react';
import { Card, Typography, Divider, Collapse, Timeline, List, Space, Alert } from 'antd';
import {
  CalendarOutlined,
  FileTextOutlined,
  BookOutlined,
  BankOutlined,
  RocketOutlined,
  CheckCircleOutlined,
  ExperimentOutlined,
} from '@ant-design/icons';
import './styles.css';

const { Title, Text } = Typography;
const { Panel } = Collapse;

const InternshipRequirements = () => {
  // ข้อมูลขั้นตอนการฝึกงาน
  const internshipSteps = [
    {
      title: 'ตรวจสอบคุณสมบัติ',
      description: 'ตรวจสอบว่าคุณมีคุณสมบัติครบถ้วนสำหรับการฝึกงานหรือไม่',
      icon: <CheckCircleOutlined />
    },
    {
      title: 'ส่งคำร้อง คพ.05',
      description: 'กรอกและส่งแบบคำร้องขอฝึกงาน คพ.05 ผ่านระบบ',
      icon: <FileTextOutlined />
    },
    {
      title: 'รอการอนุมัติ',
      description: 'รออาจารย์ที่ปรึกษาและเจ้าหน้าที่อนุมัติคำร้อง',
      icon: <CalendarOutlined />
    },
    {
      title: 'ฝึกงาน',
      description: 'เข้าฝึกงานตามวันเวลาที่กำหนด และบันทึกข้อมูลการฝึกงานทุกวัน',
      icon: <BankOutlined />
    },
    {
      title: 'ส่งรายงานฝึกงาน',
      description: 'เมื่อฝึกงานครบกำหนด ให้จัดทำรายงานสรุปผลการฝึกงาน',
      icon: <BookOutlined />
    },
    {
      title: 'รับการประเมิน',
      description: 'รับการประเมินจากพี่เลี้ยงและอาจารย์ที่ปรึกษา',
      icon: <RocketOutlined />
    }
  ];

  // ข้อกำหนดคุณสมบัติ
  const qualificationRequirements = [
    'ต้องผ่านการเรียนมาแล้วอย่างน้อย 81 หน่วยกิต',
    'ต้องเป็นนักศึกษาชั้นปีที่ 3 ขึ้นไป',
    'ต้องเรียนรายวิชาพื้นฐานในหลักสูตรครบตามที่กำหนด',
    'ต้องมีเกรดเฉลี่ยสะสม (GPA) ไม่ต่ำกว่า 2.00',
    'ต้องผ่านการอนุมัติจากอาจารย์ที่ปรึกษา'
  ];

  // ข้อกำหนดเอกสารที่ต้องส่งในระบบ
  const documentRequirements = [
    'คพ.05 - แบบคำร้องขอฝึกงาน',
    'หนังสือตอบรับจากสถานประกอบการ',
    'ข้อมูลติดต่อของสถานประกอบการและพี่เลี้ยง',
    'ใบลงเวลาการปฏิบัติงาน (ต้องบันทึกทุกวันในระบบ)',
    'รายงานสรุปผลการฝึกงาน (หลังฝึกงานเสร็จ)',
    'แบบประเมินผลการฝึกงาน (สำหรับพี่เลี้ยง)'
  ];

  // ข้อกำหนดการประเมินผล
  const evaluationRequirements = [
    'ประเมินจากการสังเกตการณ์ของพี่เลี้ยง (50%)',
    'ประเมินจากการบันทึกการปฏิบัติงานประจำวัน (30%)',
    'ประเมินจากรายงานสรุปผลการฝึกงาน (20%)',
    'ต้องได้คะแนนรวมไม่น้อยกว่า 60% จึงจะถือว่าผ่าน (S)',
    'ต้องมีชั่วโมงฝึกงานไม่น้อยกว่า 240 ชั่วโมง'
  ];

  return (
    <div className="requirements-container">
      <Card title="ข้อกำหนดการฝึกงาน" variant="borderless">
        <Alert
          message="สำคัญ: ข้อกำหนดการฝึกงานนี้ใช้สำหรับนักศึกษาภาควิทยาการคอมพิวเตอร์และสารสนเทศ คณะวิทยาศาสตร์ประยุกต์ มหาวิทยาลัยเทคโนโลยีพระจอมเกล้าพระนครเหนือ เท่านั้น"
          description="ข้อมูลอาจมีการเปลี่ยนแปลงได้ โปรดตรวจสอบกับฝ่ายวิชาการเพื่อให้ได้ข้อมูลล่าสุด"
          type="info"
          showIcon
          style={{ marginBottom: 20 }}
        />

        <Title level={4}><CalendarOutlined /> ขั้นตอนการฝึกงาน</Title>
        <Timeline 
          items={internshipSteps.map((step, index) => ({
            color: index === internshipSteps.length - 1 ? 'green' : 'blue',
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
            header={<Space><CheckCircleOutlined /> คุณสมบัติผู้ฝึกงาน</Space>} 
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
        </Collapse>

        <Alert
          message="คำแนะนำสำหรับนักศึกษาฝึกงาน"
          description={
            <div>
              <Title level={5}>ข้อปฏิบัติขณะฝึกงาน</Title>
              <ul>
                <li>แต่งกายสุภาพ ถูกต้องตามระเบียบของสถานประกอบการ</li>
                <li>ตรงต่อเวลา มีระเบียบวินัย</li>
                <li>ปฏิบัติตามกฎระเบียบของสถานประกอบการอย่างเคร่งครัด</li>
                <li>มีความรับผิดชอบต่อหน้าที่ที่ได้รับมอบหมาย</li>
                <li>รักษาความลับของสถานประกอบการ</li>
                <li>บันทึกการปฏิบัติงานทุกวันอย่างละเอียด</li>
                <li>หากมีปัญหาให้แจ้งพี่เลี้ยงและอาจารย์ที่ปรึกษาทันที</li>
              </ul>

              <Title level={5}>การเตรียมตัวก่อนฝึกงาน</Title>
              <ul>
                <li>ศึกษาข้อมูลของสถานประกอบการให้เข้าใจ</li>
                <li>ทบทวนความรู้ที่เกี่ยวข้องกับงานที่จะไปฝึก</li>
                <li>เตรียมเอกสารต่างๆ ให้พร้อมก่อนไปฝึกงาน</li>
                <li>วางแผนการเดินทาง ที่พัก และค่าใช้จ่ายต่างๆ</li>
                <li>ขออนุญาตผู้ปกครองและแจ้งให้ทราบถึงรายละเอียดการฝึกงาน</li>
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

export default InternshipRequirements;