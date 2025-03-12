import React from "react";
import { Steps } from "antd";
import { useLocation } from "react-router-dom";
import { CheckCircleOutlined, FormOutlined, UploadOutlined } from "@ant-design/icons";
import "./InternshipStyles.css"; // Import shared CSS

const { Step } = Steps;

const InternshipSteps = () => {
  const location = useLocation();

  const getCurrentStep = () => {
    switch (location.pathname) {
      case "/internship-registration/cs05":
        return 0;
      case "/internship-logbook/timesheet":
        return 1;
      case "/internship-summary":
        return 2;
      default:
        return 0;
    }
  };

  return (
    <div className="internship-steps-container">
      <Steps current={getCurrentStep()} className="internship-steps">
        <Step 
          title={<span className="internship-step-title">ลงทะเบียน</span>}
          description="กรอก คพ.05" 
        />
        <Step 
          title={<span className="internship-step-title">บันทึกการฝึกงาน</span>}
          description="บันทึกประจำวัน"
        />
        <Step 
          title={<span className="internship-step-title">สรุปผล</span>}
          description="สรุปการฝึกงาน"
        />
      </Steps>
    </div>
  );
};

export default InternshipSteps;
