import React from "react";
import { Steps } from "antd";
import { useLocation } from "react-router-dom";
import { CheckCircleOutlined, FormOutlined, UploadOutlined, EyeOutlined } from "@ant-design/icons";

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
    <div style={{
      width: "100%",
      padding: "15px 0",
      backgroundColor: "#f8f8f8",
      borderRadius: "10px",
      textAlign: "center",
      display: "flex",
      justifyContent: "center",
    }}>
      <Steps 
        current={getCurrentStep()} 
        size="default" 
        labelPlacement="horizontal"
        style={{ 
            width: "85%", 
            maxWidth: 1000 
        }}>
            
        <Step 
          title={<span style={{ fontWeight: "bold" }}>เงื่อนไข</span>} 
          description="ยอมรับเงื่อนไขการฝึกงาน"
          icon={<CheckCircleOutlined />} 
        />
        <Step 
          title={<span style={{ fontWeight: "bold" }}>ข้อมูลสถานประกอบการ</span>} 
          description="กรอกข้อมูลบริษัทที่ฝึกงาน" 
          icon={<FormOutlined />} 
        />
        <Step 
          title={<span style={{ fontWeight: "bold" }}>อัปโหลดเอกสาร</span>} 
          description="แนบไฟล์เอกสารที่จำเป็น" 
          icon={<UploadOutlined />} 
        />
        <Step 
          title={<span style={{ fontWeight: "bold" }}>ตรวจสอบและยืนยัน</span>} 
          description="ตรวจสอบและยืนยันข้อมูลก่อนส่ง" 
          icon={<EyeOutlined />} 
        />
      </Steps>
    </div>
  );
};

export default InternshipSteps;
