import React from 'react';
import { Card, Steps } from 'antd';
import { LaptopOutlined, ExperimentOutlined, BookOutlined, UserOutlined } from '@ant-design/icons';
import { calculateMainProgress } from './helpers';

const { Step } = Steps;

// คอมโพเนนต์สำหรับแสดงเส้นทางการศึกษาหลัก
const EducationPath = ({ student }) => {
  return (
    <Card 
      title="เส้นทางการศึกษาของคุณ" 
      bordered={false}
      bodyStyle={{ padding: '24px' }}
    >
      <Steps 
        current={calculateMainProgress(student)}
        size="default"
      >
        <Step 
          title="ฝึกงาน" 
          description={student.internshipStatus === 'completed' ? 'เสร็จสิ้น' : 'กำลังดำเนินการ'} 
          icon={<LaptopOutlined />}
        />
        <Step 
          title="โครงงานพิเศษ 1" 
          description={student.projectEligible ? 'พร้อมดำเนินการ' : 'รอคุณสมบัติ'}
          disabled={!student.projectEligible}
          icon={<ExperimentOutlined />}
        />
        <Step 
          title="โครงงานพิเศษ 2" 
          description="รอดำเนินการ"
          disabled={!student.projectEligible} 
          icon={<BookOutlined />}
        />
        <Step 
          title="สำเร็จการศึกษา" 
          description="รอดำเนินการ" 
          icon={<UserOutlined />}
        />
      </Steps>
    </Card>
  );
};

export default EducationPath;