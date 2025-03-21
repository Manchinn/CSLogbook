import React from 'react';
import { Modal, Typography, List } from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';

const { Title, Paragraph, Text } = Typography;

const InstructionModal = ({ visible, onClose }) => {
  const instructions = [
    {
      title: 'การบันทึกข้อมูล',
      items: [
        'บันทึกข้อมูลทุกวันที่มีการฝึกงาน',
        'ระบุเวลาเข้า-ออกงานตามความเป็นจริง',
        'กรอกรายละเอียดงานที่ได้รับมอบหมาย',
        'ระบุสิ่งที่ได้เรียนรู้จากการทำงาน'
      ]
    },
    {
      title: 'การส่งงาน',
      items: [
        'ตรวจสอบความถูกต้องของข้อมูลก่อนส่ง',
        'ส่งบันทึกให้หัวหน้างานตรวจสอบทุกสัปดาห์',
        'แก้ไขตามคำแนะนำของหัวหน้างานและอาจารย์ที่ปรึกษา'
      ]
    },
    {
      title: 'ข้อควรระวัง',
      items: [
        'ห้ามบันทึกข้อมูลย้อนหลังเกิน 7 วัน',
        'ห้ามแก้ไขข้อมูลที่ผ่านการอนุมัติแล้ว',
        'ระบุปัญหาและวิธีแก้ไขทุกครั้งที่พบปัญหา'
      ]
    }
  ];

  return (
    <Modal
      title={
        <span>
          <InfoCircleOutlined style={{ marginRight: 8 }} />
          คำชี้แจงการบันทึกการฝึกงาน
        </span>
      }
      open={visible}
      onCancel={onClose}
      footer={null}
      width={700}
    >
      <Typography>
        <Paragraph>
          <Text strong>
            การบันทึกการฝึกงานเป็นส่วนสำคัญในการประเมินผลการฝึกงาน 
            กรุณาอ่านและปฏิบัติตามคำชี้แจงอย่างเคร่งครัด
          </Text>
        </Paragraph>

        {instructions.map((section, index) => (
          <div key={index} style={{ marginBottom: 24 }}>
            <Title level={4}>{section.title}</Title>
            <List
              size="small"
              bordered
              dataSource={section.items}
              renderItem={(item) => (
                <List.Item>
                  <Text>{item}</Text>
                </List.Item>
              )}
            />
          </div>
        ))}

        <Paragraph type="warning" style={{ marginTop: 24 }}>
          หมายเหตุ: การบันทึกข้อมูลไม่ครบถ้วนหรือไม่ตรงตามความเป็นจริง 
          อาจส่งผลต่อการประเมินผลการฝึกงาน
        </Paragraph>
      </Typography>
    </Modal>
  );
};

export default InstructionModal;