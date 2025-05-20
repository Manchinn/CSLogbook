import React from 'react';
import { Card, Alert, Button, Typography } from 'antd'; // Removed unused imports
import { 
  FileTextOutlined,
  FormOutlined
} from '@ant-design/icons';
import ReflectionForm from './ReflectionForm';

// นำเข้า CSS
import '../styles/SkillsPanel.css'; // Adjusted import path

const { Title } = Typography;

/**
 * Component แสดงทักษะและการพัฒนา
 * @param {Object} props
 * @param {Object} props.reflection ข้อมูลบทสรุปการฝึกงาน
 * @param {boolean} props.editingReflection สถานะการแก้ไขบทสรุป
 * @param {Function} props.toggleEditReflection ฟังก์ชันสลับสถานะการแก้ไข
 * @param {Function} props.handleReflectionSave ฟังก์ชันบันทึกบทสรุป
 * @param {Array} props.skillCategories หมวดหมู่ทักษะ
 * @param {Array} props.skillTags แท็กทักษะ
 * @param {Object} props.summaryData ข้อมูลสรุปการฝึกงาน
 */
const SkillsPanel = ({ 
  reflection, 
  editingReflection, 
  toggleEditReflection, 
  handleReflectionSave,
  // skillCategories, // Commented out as it's not used in the provided snippet
  // skillTags, // Commented out as it's not used in the provided snippet
  // summaryData // Commented out as it's not used in the provided snippet
}) => {
  return (
    <Card variant="borderless" className="skills-analysis-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={4}>สรุปทักษะและความรู้ที่ได้รับจากการฝึกงาน</Title>
        
        {reflection && (
          <Button 
            type="primary" 
            onClick={toggleEditReflection}
            icon={editingReflection ? <FileTextOutlined /> : <FormOutlined />}
          >
            {editingReflection ? 'ดูบทสรุป' : 'แก้ไขบทสรุป'}
          </Button>
        )}
        
        {!reflection && !editingReflection && (
          <Button 
            type="primary" 
            onClick={() => toggleEditReflection()} // Corrected: Added arrow function for onClick
            icon={<FormOutlined />}
          >
            เพิ่มบทสรุปการฝึกงาน
          </Button>
        )}
      </div>
      
      {editingReflection ? (
        <ReflectionForm 
          onSave={handleReflectionSave} 
          initialData={reflection} 
        />
      ) : reflection ? (
        <ReflectionForm 
          initialData={reflection} 
          readOnly={true} 
        />
      ) : (
        <Alert
          message="ยังไม่มีบทสรุปการฝึกงาน"
          description="กรุณาคลิกที่ปุ่ม 'เพิ่มบทสรุปการฝึกงาน' เพื่อเพิ่มบทสรุปประสบการณ์การฝึกงานของคุณ"
          type="info"
          showIcon
          style={{ marginBottom: 24 }}
        />
      )}
    </Card>
  );
};

export default SkillsPanel;