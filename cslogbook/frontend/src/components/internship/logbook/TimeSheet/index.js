import React, { useState, useEffect } from 'react';
import { Card, Form, Modal, Typography, Divider, Checkbox, Button, Space, Alert } from 'antd';
import { PlusOutlined, InfoCircleOutlined } from '@ant-design/icons';
import TimeSheetTable from './TimeSheetTable';
import TimeSheetStats from './TimeSheetStats';
import EditModal from './EditModal';
import ViewModal from './ViewModal';
import QuickActions from './QuickActions';
import InstructionModal from './InstructionModal';
import { useTimeSheet } from '../../../../hooks/useTimeSheet';
import dayjs from 'dayjs';
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
    <div className="internship-container">
      <div className="internship-header">
        <Space align="center" style={{ marginBottom: '20px', display: 'flex', justifyContent: 'right' }}>
          <Space>
            <Button 
              onClick={() => setIsInstructionVisible(true)}
            >
              คำชี้แจงการฝึกงาน
            </Button>
          </Space>
        </Space>
      </div>
      
      {dateRange && (
        <>
          <Alert
            type="info"
            message={
              <Text>
                กำหนดการฝึกงาน: {dayjs(dateRange.startDate).format('DD/MM/YYYY')} - {dayjs(dateRange.endDate).format('DD/MM/YYYY')}
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