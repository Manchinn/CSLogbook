import React from "react";
import { Steps } from "antd";
import { useLocation } from "react-router-dom";
import { CheckCircleOutlined, FormOutlined, UploadOutlined, EyeOutlined } from "@ant-design/icons";
import "./InternshipStyles.css"; // Import shared CSS

const { Step } = Steps;

const InternshipSteps = () => {
  const location = useLocation();

  const getCurrentStep = () => {
    switch (location.pathname) {
      case "/internship-terms":
        return 0;
      case "/internship-company":
        return 1;
      case "/internship-documents":
        return 2;
      case "/internship-review":
        return 3;
      default:
        return 0;
    }
  };

  return (
    <div className="internship-steps-container">
      <Steps 
        current={getCurrentStep()} 
        size="default" 
        labelPlacement="horizontal"
        className="internship-steps"
      >
        <Step 
          title={<span className="internship-step-title">เงื่อนไข</span>} 
          description="ยอมรับเงื่อนไขการฝึกงาน"
          icon={<CheckCircleOutlined />} 
        />
        <Step 
          title={<span className="internship-step-title">ข้อมูลสถานประกอบการ</span>} 
          description="กรอกข้อมูลบริษัทที่ฝึกงาน" 
          icon={<FormOutlined />} 
        />
        <Step 
          title={<span className="internship-step-title">อัปโหลดเอกสาร</span>} 
          description="แนบไฟล์เอกสารที่จำเป็น" 
          icon={<UploadOutlined />} 
        />
        <Step 
          title={<span className="internship-step-title">ตรวจสอบและยืนยัน</span>} 
          description="ตรวจสอบและยืนยันข้อมูลก่อนส่ง" 
          icon={<EyeOutlined />} 
        />
      </Steps>
    </div>
  );
};

export default InternshipSteps;
