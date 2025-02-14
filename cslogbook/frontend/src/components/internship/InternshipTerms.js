import React, { useState } from "react";
import { Card, Button, Typography } from "antd";
import { useNavigate } from "react-router-dom";
import InternshipSteps from "./InternshipSteps";
import "./InternshipStyles.css"; // Import shared CSS

const { Title, Paragraph } = Typography;

const InternshipTerms = () => {
  const [accepted, setAccepted] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="internship-container">
      <InternshipSteps />
      <Card className="internship-card">
        <Title level={2}>เงื่อนไขการฝึกงาน</Title>
        <Paragraph className="internship-paragraph">
          1. นักศึกษาต้องดำเนินการฝึกงานตามระยะเวลาที่กำหนด และปฏิบัติตามระเบียบของสถานประกอบการ
          <br />
          2. นักศึกษาต้องส่งเอกสารที่เกี่ยวข้องกับการฝึกงานผ่านระบบให้ครบถ้วน
          <br />
          3. หากไม่ปฏิบัติตาม อาจมีผลต่อสถานะการฝึกงานและการจบการศึกษา
          <br />
          4. นักศึกษาต้องทำการรายงานความคืบหน้าในระบบเป็นระยะ
        </Paragraph>
        <br />
        <Button 
          type="primary" 
          onClick={() => navigate("/internship-company")} 
          className="internship-button"
        >
          ยอมรับและดำเนินการต่อ
        </Button>
      </Card>
    </div>
  );
};

export default InternshipTerms;
