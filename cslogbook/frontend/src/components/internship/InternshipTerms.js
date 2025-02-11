import React, { useState } from "react";
import { Card, Button, Typography, Checkbox, Steps  } from "antd";
import { useNavigate } from "react-router-dom";
import InternshipSteps from "./InternshipSteps";

const { Title, Paragraph } = Typography;
const { Step } = Steps;


const InternshipTerms = () => {
  const [accepted, setAccepted] = useState(false);
  const navigate = useNavigate();

  return (
    <div style={{ 
      maxWidth: '100%',
      justifyContent: 'center',  
      alignItems: 'center', 
      minHeight: '55vh', 
      backgroundColor: '#f5f5f5', 
      padding: '20px',
    }}>
      <InternshipSteps />
      <Card style={{ 
        width: '100%', 
        maxWidth: '90%', 
        padding: 10, 
        borderRadius: 10, 
        boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
        marginLeft: '30px',
        margin: '20px auto',
      }}>
        <Title level={2}>เงื่อนไขการฝึกงาน</Title>
        <Paragraph style={{ textAlign: "left", fontSize: "16px" }}>
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
          style={{ marginTop: "10px",fontSize: "18px", padding: "20px" }}
        >
          ยอมรับและดำเนินการต่อ
        </Button>
      </Card>
    </div>
  );
};

export default InternshipTerms;
