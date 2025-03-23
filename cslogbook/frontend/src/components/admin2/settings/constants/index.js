import React, { useState } from 'react';
import { Tabs, Card, Typography, message } from 'antd';
import AcademicSettings from './AcademicSettings';
import EligibilityRules from './EligibilityRules';
import DocumentTypes from './DocumentTypes';
import StatusSettings from './StatusSettings';
import './styles.css';

const { Title } = Typography;
const { TabPane } = Tabs;

const ConstantsSettings = () => {
  const [activeKey, setActiveKey] = useState('1');
  
  return (
    <div className="constants-settings-container">
      <Card>
        <Title level={4}>การตั้งค่าระบบ</Title>
        <p className="settings-description">
          จัดการค่าคงที่และการตั้งค่าพื้นฐานของระบบ
        </p>
        
        <Tabs 
          activeKey={activeKey} 
          onChange={setActiveKey}
          type="card"
          className="settings-tabs"
        >
          <TabPane tab="การศึกษา" key="1">
            <AcademicSettings />
          </TabPane>
          <TabPane tab="เกณฑ์การมีสิทธิ์" key="2">
            <EligibilityRules />
          </TabPane>
          <TabPane tab="ประเภทเอกสาร" key="3">
            <DocumentTypes />
          </TabPane>
          <TabPane tab="สถานะในระบบ" key="4">
            <StatusSettings />
          </TabPane>
        </Tabs>
      </Card>
    </div>
  );
};

export default ConstantsSettings;