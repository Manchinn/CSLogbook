import React, { useState } from 'react';
import { Tabs, Card, Typography, message } from 'antd';
import AcademicSettings from './AcademicSettings';
import StatusSettings from './StatusSettings';
import CurriculumSettings from './CurriculumSettings';
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
    }
  ];
  
  return (
    <div className="constants-settings-container">
      <Card>
        <Title level={4}>การตั้งค่าระบบ</Title>
        <p className="settings-description">
          จัดการค่าคงที่และการตั้งค่าพื้นฐานของระบบ
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