import React, { useState, useEffect } from "react";
import { Steps, Button, Modal, Typography, Divider } from "antd";
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

  // เพิ่ม useEffect เพื่อแสดง Modal เมื่อโหลดหน้า
  useEffect(() => {
    setIsModalVisible(true);
  }, []); // empty dependency array means this runs once when component mounts

  const showModal = () => {
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
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
        visible={isModalVisible}
        onCancel={handleCancel}
        width={600}
        footer={null}
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
          <Button key="ok" type="primary" onClick={handleCancel} >
            ตกลง
          </Button>
        </Typography>
      </Modal>
    </div>
  );
};

export default InternshipSteps;
