import React, { useState, useEffect } from 'react';
import { Card, Form, Modal, Typography, Divider, Checkbox, Button } from 'antd';
import TimeSheetTable from './TimeSheetTable';
import TimeSheetStats from './TimeSheetStats';
import EditModal from './EditModal';
import ViewModal from './ViewModal';
import { useTimeSheet } from '../../../../hooks/useTimeSheet';
import './styles.css';

const { Title, Paragraph } = Typography;


const TimeSheet = () => {
  const [form] = Form.useForm();
  const [isInstructionVisible, setIsInstructionVisible] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  
  const {
    loading,
    internshipDates,
    selectedEntry,
    isModalVisible,
    isViewModalVisible,
    handleEdit,
    handleView,
    handleSave,
    handleClose,
    stats
  } = useTimeSheet(form);
  
  useEffect(() => {
    const shouldShow = localStorage.getItem('showTimeSheetGuide') !== 'false';
    setIsInstructionVisible(shouldShow);
  }, []);
  
  const handleInstructionClose = () => {
    if (dontShowAgain) {
      localStorage.setItem('showTimeSheetGuide', 'false');
    }
    setIsInstructionVisible(false);
  };
  
  const onCheckboxChange = (e) => {
    setDontShowAgain(e.target.checked);
  };

  return (
    <div className="internship-container">
      <div className="internship-header">
        <Button 
          type="primary" 
          onClick={() => setIsInstructionVisible(true)}
          style={{ marginLeft: '10px' }}
        >
          คำชี้แจงการฝึกงาน
        </Button>
      </div>
      <TimeSheetStats stats={stats} />
      <Card>
        <TimeSheetTable 
          data={internshipDates}
          loading={loading}
          onEdit={handleEdit}
          onView={handleView}
        />
        <EditModal
          visible={isModalVisible}
          loading={loading}
          entry={selectedEntry}
          form={form}
          onOk={handleSave}
          onCancel={handleClose}
        />
        <ViewModal
          visible={isViewModalVisible}
          entry={selectedEntry}
          onClose={handleClose}
        />
      </Card>
      
      {/* คำชี้แจงการบันทึกเวลา Modal */}
      <Modal
        title="คำชี้แจงการบันทึกเวลาการปฏิบัติงาน"
        open={isInstructionVisible}
        onCancel={handleInstructionClose}
        width={1000}
        centered
        styles={{
          body: {
            maxHeight: 'calc(100vh - 250px)',
            overflowY: 'auto',
            paddingRight: 24,
          },
          mask: {
            backgroundColor: 'rgba(0, 0, 0, 0.65)'
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
          <Button key="ok" type="primary" onClick={handleInstructionClose}>
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

export default TimeSheet;