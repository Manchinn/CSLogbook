import React from 'react';
import { Modal, Typography, List, Checkbox, Button, Divider } from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';

const { Title, Paragraph, Text } = Typography;

const InstructionModal = ({ visible, onClose, dontShowAgain, onCheckboxChange }) => {
  return (
    <Modal
      title={
        <span>
          <InfoCircleOutlined style={{ marginRight: 8 }} />
          คำชี้แจงการบันทึกการฝึกงาน
        </span>
      }
      style={{ top: 20 }}
      open={visible}
      onCancel={onClose}
      width={1000}
      footer={[
        <Checkbox 
          key="dont-show" 
          onChange={onCheckboxChange}
          checked={dontShowAgain}
        >
          ไม่ต้องแสดงหน้านี้อีก
        </Checkbox>,
        <Button key="ok" type="primary" onClick={onClose}>
          ตกลง
        </Button>
      ]}
    >
      <Typography>
        <Title level={4}>คำชี้แจงการบันทึกการปฏิบัติงานประจำวัน</Title>
        <Paragraph>
          <ol>
            <li>
              นักศึกษาทุกคน ต้องบันทึกการปฏิบัติงานในแบบบันทึกการปฏิบัติงานทุกวันตามลักษณะงานที่มอบหมายเป็นเรื่องๆ
            </li>
            <li>
              แบบบันทึกการปฏิบัติงานจะเป็นหลักฐานให้ภาควิชาฯ
              ได้ทราบว่าได้ปฏิบัติงานอะไรบ้างเพื่อเป็นประโยชน์ต่อการปฏิบัติงานและตรงกับสาขาวิชาชีพของนักศึกษาเอง
            </li>
            <li>
              การจดบันทึกต่างๆ จะต้องเขียนให้สะอาด เรียบร้อย
              ตัวอักษรถูกต้องอ่านง่ายและเข้าใจง่าย
            </li>
            <li>
              การลงเวลาปฏิบัติงาน ให้เรียงตามลำดับวันที่
              ถ้าวันใดหยุดให้เขียนว่าหยุดและวันสำคัญต่างๆ เขียนให้ชัดเจน
            </li>
            <li>นักศึกษาจะต้องปฏิบัติงานรวมทั้งสิ้น 240 ชั่วโมง ขึ้นไป (สามารถบันทึกเกิน 240 ชั่วโมงได้)</li>
          </ol>
        </Paragraph>

        <Divider />
        <Title level={4}>ข้อแนะนำเกี่ยวกับการปฏิบัติงาน</Title>
        <Paragraph>
          นักศึกษาที่ออกปฏิบัติงานในหน่วยงาน หรือสถานประกอบการต่างๆ
          ซึ่งเปรียบเสมือนนักศึกษาเป็นตัวแทนของภาควิชาฯ
          ดังนั้นจึงขอให้นักศึกษาถือปฏิบัติตนให้เหมาะสมกับเป็นนักศึกษาที่ดีและมีคุณภาพทั้งตัวบุคคล
          ผลงาน เพื่อรักษาชื่อเสียงของภาควิชาฯ และมหาวิทยาลัยให้ดีสืบไป
        </Paragraph>
        <Divider />
        <Title level={4}>ข้อปฏิบัติของนักศึกษา</Title>
        <Paragraph>
          <ul>
            <li>ต้องปฏิบัติงานอย่างน้อย 240 ชั่วโมงขึ้นไป ถึงจะถือว่าผ่านการฝึกงาน (สามารถฝึกงานและบันทึกชั่วโมงเกินจากนี้ได้)</li>
            <li>
              ต้องแต่งกายด้วยเครื่องแบบนักศึกษาของสถานศึกษาหรือเครื่องแบบที่สถานประกอบการกำหนด
            </li>
            <li>ต้องปฏิบัติตามกฎระเบียบของสถานประกอบการอย่างเคร่งครัด</li>
            <li>ต้องมีความซื่อสัตย์สุจริต ต่อหน้าที่ต่อตนเองและผู้อื่น</li>
            <li>
              ห้ามลาใดๆ ทั้งสิ้น หากมีความจำเป็นจริงๆ
              จะต้องแจ้งให้หัวหน้าสถานประกอบการทราบทุกครั้ง
            </li>
          </ul>
        </Paragraph>
      </Typography>
    </Modal>
  );
};

export default InstructionModal;