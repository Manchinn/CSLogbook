import React, { useState } from 'react';
import { Tabs, Card, Typography } from 'antd';
import AcademicSettings from './academic/AcademicSettings';
import StatusSettings from './StatusSettings';
import CurriculumSettings from './CurriculumSettings';
import NotificationSettings from './NotificationSettings'; // เพิ่ม import
import WorkflowStepManagement from '../WorkflowSteps/WorkflowStepManagement';
import './styles.css';

const { Title } = Typography;

const ConstantsSettings = () => {
  const [activeKey, setActiveKey] = useState('1');
  
  const items = [
    {
      key: '1',
      label: 'หลักสูตรการศึกษา',
      children: <CurriculumSettings />
    },
    {
      key: '2',
      label: 'ปีการศึกษา/ภาคเรียน',
      children: <AcademicSettings />
    },
    {
      key: '3',
      label: 'สถานะนักศึกษา',
      children: <StatusSettings />
    },
    {
      key: '4',
      label: 'การแจ้งเตือน',
      children: <NotificationSettings /> // เพิ่มแท็บการแจ้งเตือน
    },
    {
      key: '5',
      label: 'ขั้นตอน Workflow',
      children: <WorkflowStepManagement />
    }
  ];
  
  return (
    <div className="constants-settings-container">
      <Card>
        <Title level={4}>การตั้งค่าระบบ</Title>
        <p className="settings-description">
          จัดการค่าคงที่และการตั้งค่าพื้นฐานของระบบ เลือกโมดูลที่ต้องการแก้ไข
        </p>
        
        <Tabs 
          items={items}
          activeKey={activeKey} 
          onChange={setActiveKey}
          type="card"
          className="settings-tabs"
        />
      </Card>
    </div>
  );
};

export default ConstantsSettings;