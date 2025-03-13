import React, { useState, useEffect } from "react";
import { Steps, Button, Modal, Typography, Divider, Checkbox } from "antd";
import { useLocation } from "react-router-dom";
import {
  CheckCircleOutlined,
  FormOutlined,
  UploadOutlined,
  QuestionCircleOutlined,
} from "@ant-design/icons";
import "./InternshipStyles.css";

const { Step } = Steps;
const { Title, Paragraph } = Typography;

const InternshipSteps = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  useEffect(() => {
    const shouldShow = localStorage.getItem('showInternshipGuide') !== 'false';
    setIsModalVisible(shouldShow);
  }, []);

  const showModal = () => {
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    if (dontShowAgain) {
      localStorage.setItem('showInternshipGuide', 'false');
    }
    setIsModalVisible(false);
  };

  const onCheckboxChange = (e) => {
    setDontShowAgain(e.target.checked);
  };

  return (
    <div className="internship-steps-container">
      <Button
        type="primary"
        onClick={showModal}
        icon={<QuestionCircleOutlined />}
        style={{ margin: "auto" }}
      >
        คำชี้แจงการฝึกงาน
      </Button>

      <Modal
        title="คำชี้แจงการฝึกงาน"
        open={isModalVisible}
        onCancel={handleCancel}
        width={1200}
        centered
        styles={{
          body: {
            maxHeight: 'calc(100vh - 250px)',
            overflowY: 'auto',
            paddingRight: 24,
          },
          mask: {
            backgroundColor: 'rgba(0, 0, 0, 0.65)'
          },
          content: {
            top: '5%',
            padding: '20px 24px'
          }
        }}
        footer={[
          <Checkbox 
            key="dont-show" 
            onChange={onCheckboxChange}
            checked={dontShowAgain}
          >
            ไม่ต้องแสดงหน้านี้อีก
          </Checkbox>,
          <Button key="ok" type="primary" onClick={handleCancel}>
            ตกลง
          </Button>
        ]}
      >
        <Typography>
          
        <Title level={4}>คำชี้แจงการบันทึกการปฏิบัติงาน</Title>
          <Paragraph>
            <ol>
              <li>
              นักศึกษำทุกคน ต้องบันทึกกำรปฏิบัติงำนในแบบบันทึกกำรปฏิบัติงำนทุกวันตำมลักษณะงำนที่มอบหมำยเป็นเรื่องๆ

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
              <li>นักศึกษาจะต้องปฏิบัติงานรวมทั้งสิ้น 240 ชั่วโมง ขึ้นไป</li>
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
              <li>ต้องปฏิบัติงาน 240 ชั่วโมงขึ้นไป ถึงจะถือว่าผ่านการฝึกงาน</li>
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
    </div>
  );
};

export default InternshipSteps;
