import React, { useState, useEffect } from 'react';
import { Card, Form, Typography, Button, Space, Alert, Tooltip } from 'antd';
import { QuestionCircleOutlined } from '@ant-design/icons';
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
    stats,
    dateRange,
    refreshData
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
    <div className="internship-container" style={{ position: 'relative', paddingBottom: '50px' }}>
      
      {dateRange && (
        <>
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
        </>
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