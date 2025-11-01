import React from 'react';
import { Card, Alert, Typography, Button } from 'antd';
import { 
  FileTextOutlined,
  FormOutlined
} from '@ant-design/icons';
import ReflectionForm from './ReflectionForm';

// นำเข้า CSS
import '../styles/SkillsPanel.css';

const { Title } = Typography;

/**
 * Component แสดงทักษะและการพัฒนา
 * @param {Object} props
 * @param {Object} props.reflection ข้อมูลบทสรุปการฝึกงาน
 * @param {boolean} props.editingReflection สถานะการแก้ไขบทสรุป
 * @param {Function} props.toggleEditReflection ฟังก์ชันสลับสถานะการแก้ไข
 * @param {Function} props.handleReflectionSave ฟังก์ชันบันทึกบทสรุป
 * @param {Array} props.skillCategories หมวดหมู่ทักษะ (ยังไม่ได้ใช้งานในปัจจุบัน)
 * @param {Array} props.skillTags แท็กทักษะ (ยังไม่ได้ใช้งานในปัจจุบัน)
 * @param {Object} props.summaryData ข้อมูลสรุปการฝึกงาน
 */
const SkillsPanel = ({ 
  reflection, 
  editingReflection, 
  toggleEditReflection, 
  handleReflectionSave,
  // skillCategories, // ยังไม่ได้ใช้งานในปัจจุบัน
  // skillTags, // ยังไม่ได้ใช้งานในปัจจุบัน
  summaryData
}) => {
  // ตรวจสอบว่าผู้ควบคุมงานได้ประเมินผลการฝึกงานแล้วหรือยัง
  const isSupervisorEvaluated = summaryData?.status === 'supervisor_evaluated';

  // กำหนดว่าฟอร์มควรจะอยู่ในโหมดอ่านอย่างเดียวหรือไม่
  // จะเป็น read-only ถ้าผู้ควบคุมงานประเมินแล้ว หรือ ถ้าไม่ได้อยู่ในโหมดแก้ไขและมีข้อมูล reflection อยู่แล้ว
  // const isFormReadOnly = isSupervisorEvaluated || (!editingReflection && reflection); // ตัวแปรนี้ถูกคำนวณแต่ไม่ได้ใช้โดยตรง จะใช้ isSupervisorEvaluated ในการตัดสินใจแทน

  // กำหนดว่าจะแสดงปุ่ม "แก้ไขบทสรุป" หรือไม่
  // แสดงเมื่อมีข้อมูล reflection, ไม่ได้ถูกประเมินโดยผู้ควบคุมงาน, และไม่ได้อยู่ในโหมดแก้ไข
  const showEditButton = reflection && !isSupervisorEvaluated && !editingReflection;
  
  // กำหนดว่าจะแสดงปุ่ม "ยกเลิกการแก้ไข" หรือไม่
  // แสดงเมื่อมีข้อมูล reflection, ไม่ได้ถูกประเมินโดยผู้ควบคุมงาน, และอยู่ในโหมดแก้ไข
  const showCancelEditButton = reflection && !isSupervisorEvaluated && editingReflection;

  // กำหนดว่าจะแสดงปุ่ม "เพิ่มบทสรุปการฝึกงาน" หรือไม่
  // แสดงเมื่อยังไม่มีข้อมูล reflection, ไม่ได้อยู่ในโหมดแก้ไข, และยังไม่ได้ถูกประเมินโดยผู้ควบคุมงาน
  const showAddButton = !reflection && !editingReflection && !isSupervisorEvaluated;

  return (
    <Card variant="borderless" className="skills-analysis-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={4}>สรุปทักษะและความรู้ที่ได้รับจากการฝึกงาน</Title>
        
        {showEditButton && (
          <Button 
            type="primary" 
            onClick={toggleEditReflection}
            icon={<FormOutlined />}
          >
          </Button>
        )}

        {showCancelEditButton && (
          <Button 
            onClick={toggleEditReflection} // ใช้ toggleEditReflection เพื่อยกเลิก
            icon={<FileTextOutlined />}
          >
            ยกเลิกการแก้ไข
          </Button>
        )}
        
        {showAddButton && (
          <Button 
            type="primary" 
            onClick={toggleEditReflection} 
            icon={<FormOutlined />}
          >
            เพิ่มบทสรุปการฝึกงาน
          </Button>
        )}
      </div>
      
      { (editingReflection && !isSupervisorEvaluated) ? (
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
          description={
            isSupervisorEvaluated 
              ? "นักศึกษายังไม่ได้บันทึกบทสรุปการฝึกงานไว้ก่อนการประเมินผล" 
              : "กรุณาคลิกที่ปุ่ม 'เพิ่มบทสรุปการฝึกงาน' เพื่อเพิ่มบทสรุปประสบการณ์การฝึกงานของคุณ"
          }
          type="info"
          showIcon
          style={{ marginBottom: 24 }}
        />
      )}
    </Card>
  );
};

export default SkillsPanel;
