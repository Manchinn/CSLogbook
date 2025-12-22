import React, { useState, useMemo, useEffect } from 'react';
import { Card, Typography, Divider, Collapse, Timeline, List, Space, Alert } from 'antd';
import {
  CalendarOutlined,
  FileTextOutlined,
  BookOutlined,
  RocketOutlined,
  CheckCircleOutlined,
  ExperimentOutlined,
  TeamOutlined,
  CodeOutlined,
  ReadOutlined,
  FileSearchOutlined
} from '@ant-design/icons';
import { getProjectRequirements } from 'utils/studentUtils';
import styles from './EligibilityCheck.module.css';

const { Title, Text } = Typography;
const { Panel } = Collapse;

const ProjectRequirements = () => {
  const [eligibilityCriteria, setEligibilityCriteria] = useState(null);

  // ใช้ค่าจาก constants
  const DEFAULT_REQUIREMENTS = getProjectRequirements(null);

  // Simulate fetching data or setting it after component mounts
  useEffect(() => {
    // In a real application, you would fetch this data from an API
    // For demonstration, we'll use values from constants
    const timer = setTimeout(() => {
      setEligibilityCriteria({ 
        minTotalCredits: DEFAULT_REQUIREMENTS.MIN_TOTAL_CREDITS, 
        minMajorCredits: DEFAULT_REQUIREMENTS.MIN_MAJOR_CREDITS 
      });
    }, 1000); // Simulate 1 second delay

    return () => clearTimeout(timer); // Cleanup timer on unmount
  }, [DEFAULT_REQUIREMENTS.MIN_TOTAL_CREDITS, DEFAULT_REQUIREMENTS.MIN_MAJOR_CREDITS]); // Empty dependency array ensures this effect runs only once on mount

  // ข้อมูลขั้นตอนการทำโครงงานพิเศษและปริญญานิพนธ์
  const projectSteps = [
    {
      title: 'เลือกหัวข้อโครงงานและปรึกษาอาจารย์',
      description: 'ปรึกษาและกำหนดหัวข้อโครงงานร่วมกับอาจารย์',
      icon: <TeamOutlined />
    },
    {
      title: 'ส่งแบบเสนอหัวข้อโครงงาน',
      description: 'กรอกแบบฟอร์มเสนอหัวข้อโครงงานและส่งผ่านระบบ',
      icon: <FileTextOutlined />
    },
    {
      title: 'สอบหัวข้อโครงงานพิเศษ',
      description: 'นำเสนอหัวข้อโครงงานพิเศษต่อคณะกรรมการ -> ผ่าน',
      icon: <RocketOutlined />
    },
    {
      title: 'พัฒนาโครงงานพิเศษ1',
      description: 'ดำเนินการพัฒนาโครงงานตามแผนงาน และบันทึก Logbook อย่างสม่ำเสมอ',
      icon: <CodeOutlined />
    },
    {
      title: 'สอบความคืบหน้าโครงงานพิเศษ (โครงงานพิเศษ1)',
      description: 'นำเสนอโครงงานพิเศษ1ต่อคณะกรรมการ -> ผ่าน',
      icon: <ReadOutlined />
    },
    {
      title: 'พัฒนาโครงงานพิเศษ2/ปริญญานิพนธ์',
      description: 'ดำเนินการพัฒนาโครงงานตามแผนงาน และบันทึก Logbook อย่างสม่ำเสมอ',
      icon: <CodeOutlined />
    },
    {
      title: 'สอบป้องกันปริญญานิพนธ์ (สอบโครงงานพิเศษ 2)',
      description: 'นำเสนอและสาธิตผลงานต่อคณะกรรมการ',
      icon: <FileSearchOutlined />
    },
    {
      title: 'ส่งปริญญานิพนธ์ฉบับสมบูรณ์ตามระยะเวลาที่ภาควิชากำหนด',
      description: '',
      icon: <BookOutlined />
    }
  ];

  // ข้อกำหนดคุณสมบัติ (ใช้ค่าจาก DEFAULT_REQUIREMENTS)
  const qualificationRequirements = useMemo(() => {
    if (!eligibilityCriteria) {
      // Return placeholder text or an empty array while data is loading
      return [
        `กำลังโหลดข้อกำหนดหน่วยกิตรวม... (ค่าเริ่มต้น: ${DEFAULT_REQUIREMENTS.MIN_TOTAL_CREDITS} หน่วยกิต)`,
        `กำลังโหลดข้อกำหนดหน่วยกิตในสาขา... (ค่าเริ่มต้น: ${DEFAULT_REQUIREMENTS.MIN_MAJOR_CREDITS} หน่วยกิต)`,
        'ต้องเป็นนักศึกษาชั้นปีที่ 4 หรือเทียบเท่า',
        'ต้องลงทะเบียนเรียนวิชาโครงงานพิเศษ 1 และ 2 ตามลำดับ',
        'ต้องมีอาจารย์ที่ปรึกษาโครงงานอย่างน้อย 1 ท่าน',
      ];
    }
    return [
      `ต้องผ่านการเรียนมาแล้วอย่างน้อย ${eligibilityCriteria.minTotalCredits} หน่วยกิต`,
      `ต้องมีหน่วยกิตสะสมในสาขาอย่างน้อย ${eligibilityCriteria.minMajorCredits} หน่วยกิต`,
      'ต้องเป็นนักศึกษาชั้นปีที่ 4 หรือเทียบเท่า',
      'ต้องลงทะเบียนเรียนวิชาโครงงานพิเศษ 1 และ 2 ตามลำดับ',
      'ต้องมีอาจารย์ที่ปรึกษาโครงงานอย่างน้อย 1 ท่าน',
    ];
  }, [eligibilityCriteria, DEFAULT_REQUIREMENTS.MIN_TOTAL_CREDITS, DEFAULT_REQUIREMENTS.MIN_MAJOR_CREDITS]); // Recalculate when eligibilityCriteria changes

  // ข้อกำหนดเอกสารที่ต้องส่งในระบบ
  const documentRequirements = [
    'แบบฟอร์มยื่นสอบหัวข้อโครงงานพิเศษ พร้อมเอกสารข้อเสนอโครงงาน (Proposal)',
    'คพ.02 - แบบฟอร์มขอสอบโครงงานพิเศษ 1 พร้อมรายงานบทที่ 1-3',
    'แจ้งความประสงค์สอบล่วงหน้า 30 วัน (สำหรับสอบปริญญานิพนธ์)',
    'คพ.02 - แบบฟอร์มขอสอบปริญญานิพนธ์ พร้อมรายงานฉบับสมบูรณ์',
    'บันทึกการประชุมกับอาจารย์ที่ปรึกษา (Logbook) อย่างสม่ำเสมอ',
    'เอกสารแก้ไขตามข้อเสนอแนะของกรรมการ (ถ้ามี)',
    'ซอร์สโค้ด/ไฟล์โปรแกรม/ผลงาน',
    'เอกสารคู่มือการใช้งาน (User Manual)'
  ];

  return (
    <div className={styles.requirementsContainer}>
      <Card title="ข้อกำหนดโครงงานพิเศษ" variant="borderless">
        <Alert
          message="สำคัญ: ข้อกำหนดโครงงานพิเศษนี้ใช้สำหรับนักศึกษาภาควิชาวิทยาการคอมพิวเตอร์และสารสนเทศ คณะวิทยาศาสตร์ประยุกต์ มหาวิทยาลัยเทคโนโลยีพระจอมเกล้าพระนครเหนือ เท่านั้น"
          description="ข้อมูลอาจมีการเปลี่ยนแปลงได้ โปรดตรวจสอบกับอาจารย์ที่ปรึกษาหรือฝ่ายวิชาการเพื่อให้ได้ข้อมูลล่าสุด"
          type="info"
          showIcon
          style={{ marginBottom: 20 }}
        />

        <Title level={4}><CalendarOutlined /> ขั้นตอนการทำโครงงานพิเศษ (โครงงานพิเศษ 1 และ 2)</Title>
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