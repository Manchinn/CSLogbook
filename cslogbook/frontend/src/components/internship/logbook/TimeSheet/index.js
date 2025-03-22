import React, { useState, useEffect } from 'react';
import { Card, Form, Typography, Button, Space, Alert, Tooltip, Skeleton, Result, message } from 'antd';
import { QuestionCircleOutlined, WarningOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import TimeSheetTable from './TimeSheetTable';
import TimeSheetStats from './TimeSheetStats';
import EditModal from './EditModal';
import ViewModal from './ViewModal';
import InstructionModal from './InstructionModal';
import { useTimeSheet } from '../../../../hooks/useTimeSheet';
import dayjs from '../../../../utils/dayjs';
import { DATE_FORMAT_MEDIUM } from '../../../../utils/constants';
import './styles.css';

const { Title, Text } = Typography;

const TimeSheet = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const [isInstructionVisible, setIsInstructionVisible] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  
  const {
    loading,
    initialLoading,
    internshipDates,
    selectedEntry,
    isModalVisible,
    isViewModalVisible,
    handleEdit,
    handleView,
    handleSave,
    handleClose,
    stats,
    dateRange,
    refreshData,
    hasCS05,
    cs05Status
  } = useTimeSheet(form);
  
  useEffect(() => {
    const shouldShow = localStorage.getItem('showTimeSheetGuide') !== 'false';
    setIsInstructionVisible(shouldShow);
  }, []);
  
  useEffect(() => {
    // ถ้าไม่พบข้อมูล CS05 ให้แสดง Alert และ redirect หลังจากนั้น 3 วินาที
    if (!initialLoading && !hasCS05) {
      message.warning('ไม่พบข้อมูลคำร้อง คพ.05 จะพาไปยังหน้าส่งคำร้องในอีก 3 วินาที');
      
      const redirectTimer = setTimeout(() => {
        navigate('/internship-registration/cs05');
      }, 3000);
      
      // ล้าง timer เมื่อ component unmount
      return () => clearTimeout(redirectTimer);
    }
  }, [initialLoading, hasCS05, navigate]);
  
  const handleInstructionClose = () => {
    if (dontShowAgain) {
      localStorage.setItem('showTimeSheetGuide', 'false');
    }
    setIsInstructionVisible(false);
  };
  
  const onCheckboxChange = (e) => {
    setDontShowAgain(e.target.checked);
  };

  // แสดง Skeleton ขณะโหลดข้อมูลเริ่มต้น
  if (initialLoading) {
    return (
      <div className="internship-container">
        <Card>
          <Skeleton active paragraph={{ rows: 4 }} />
        </Card>
      </div>
    );
  }

  // กรณีไม่พบข้อมูล CS05
  if (!hasCS05) {
    return (
      <div className="internship-container">
        <Result
          status="warning"
          icon={<WarningOutlined />}
          title="ไม่พบข้อมูลคำร้อง คพ.05"
          subTitle="คุณจำเป็นต้องส่งคำร้อง คพ.05 ก่อนจึงจะสามารถบันทึกเวลาทำงานได้"
          extra={[
            <Alert
              key="redirect-alert"
              type="warning"
              message="กำลังนำทาง..."
              description="กำลังนำคุณไปยังหน้าส่งคำร้อง คพ.05 โปรดรอสักครู่"
              showIcon
              style={{ marginBottom: 16 }}
            />,
            <Button 
              type="primary" 
              key="cs05-form" 
              onClick={() => navigate('/internship-registration/cs05')}
            >
              ไปที่หน้าส่งคำร้อง คพ.05 ทันที
            </Button>
          ]}
        />
      </div>
    );
  }

  // กรณี CS05 มีแต่ไม่ใช่สถานะ pending หรือ approved - ในช่วงทดสอบยังไม่ใช้เงื่อนไขนี้
  /* 
  if (hasCS05 && cs05Status !== 'pending' && cs05Status !== 'approved') {
    return (
      <div className="internship-container">
        <Result
          status="info"
          icon={<ClockCircleOutlined />}
          title="คำร้อง คพ.05 ยังไม่อยู่ในสถานะที่สามารถบันทึกเวลาทำงานได้"
          subTitle={`สถานะปัจจุบัน: ${cs05Status === 'rejected' ? 'ไม่อนุมัติ' : cs05Status || 'ไม่ทราบสถานะ'}`}
          extra={
            <Button type="primary" onClick={() => navigate('/internship/status')}>
              ดูสถานะคำร้อง
            </Button>
          }
        />
      </div>
    );
  }
  */
  
  // เพิ่มการแสดง Banner เตือนว่าอยู่ในโหมดทดสอบ
  return (
    <div className="internship-container" style={{ position: 'relative', paddingBottom: '50px' }}>
      {cs05Status === 'pending' && (
        <Alert
          type="info"
          message="โหมดทดสอบ: อนุญาตให้ใช้งานแม้สถานะ CS05 เป็น 'รอการพิจารณา'"
          description="ในอนาคตระบบจะอนุญาตให้ใช้งานเฉพาะเมื่อ CS05 ได้รับการอนุมัติแล้วเท่านั้น"
          showIcon
          style={{ marginBottom: 16 }}
          banner
        />
      )}
      
      {dateRange && (
        <Alert
          type="info"
          message={
            <Text>
              กำหนดการฝึกงาน: {dayjs(dateRange.startDate).format(DATE_FORMAT_MEDIUM)} - {dayjs(dateRange.endDate).format(DATE_FORMAT_MEDIUM)}
            </Text>
          }
          description="รายการด้านล่างถูกสร้างขึ้นตามวันที่คุณระบุในแบบฟอร์ม คพ.05 คลิกปุ่มแก้ไขเพื่อกรอกข้อมูลการฝึกงานในแต่ละวัน"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}
      
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
      
      <Tooltip title="คำชี้แจงการฝึกงาน">
        <Button
          type="primary"
          shape="circle"
          icon={<QuestionCircleOutlined />}
          size="large"
          onClick={() => setIsInstructionVisible(true)}
          style={{
            position: 'fixed',
            bottom: '30px',
            right: '30px',
            zIndex: 1000,
            boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
            width: '60px',
            height: '60px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        />
      </Tooltip>
      
      <InstructionModal
        visible={isInstructionVisible}
        onClose={handleInstructionClose}
        dontShowAgain={dontShowAgain}
        onCheckboxChange={onCheckboxChange}
      />
    </div>
  );
};

export default TimeSheet;