import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Card, Typography, Space, message, Result } from 'antd';
import { useNavigate } from "react-router-dom";
import { useInternship } from '../../../contexts/InternshipContext';
import internshipService from '../../../services/internshipService';
import { EditOutlined } from '@ant-design/icons';
import "./InternshipStyles.css"; // Import shared CSS

const { Title } = Typography;

const CompanyInfoForm = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { state, setCompanyInfo } = useInternship(); // ดึง state มาด้วย
  const [loading, setLoading] = useState(false);
  const [isDisabled, setIsDisabled] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const documentId = state?.registration?.company?.data?.documentId;

  // ดึงข้อมูล CS05 จาก state แทนการเรียก API
  const cs05Data = state?.registration?.cs05?.data;

  useEffect(() => {
    if (cs05Data) {
      form.setFieldsValue({
        companyName: cs05Data.companyName
      });
    }
  }, [form, cs05Data]);

  // เพิ่ม useEffect สำหรับการแสดงข้อมูลผู้ควบคุมงาน
  useEffect(() => {
    const companyData = state?.registration?.company?.data;
    if (companyData) {
      form.setFieldsValue({
        supervisorName: companyData.supervisorName,
        supervisorPhone: companyData.supervisorPhone,
        supervisorEmail: companyData.supervisorEmail
      });
      setIsDisabled(true);
    }
  }, [form, state]);

  const handleEdit = () => {
    setIsDisabled(false);
    setIsEditing(true);
  };

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const response = await internshipService.submitCompanyInfo({
        supervisorName: values.supervisorName,
        supervisorPhone: values.supervisorPhone,
        supervisorEmail: values.supervisorEmail,
        documentId: documentId
      });

      if (response.success) {
        setCompanyInfo({
          companyName: cs05Data?.companyName, // ใช้ค่าจาก CS05
          supervisorName: values.supervisorName,
          supervisorPhone: values.supervisorPhone,
          supervisorEmail: values.supervisorEmail
        });
        message.success(isEditing ? 'แก้ไขข้อมูลผู้ควบคุมงานสำเร็จ' : 'บันทึกข้อมูลผู้ควบคุมงานสำเร็จ');
        setIsDisabled(true);
        setIsEditing(false);
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      message.error(error.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    } finally {
      setLoading(false);
    }
  };

  // ถ้ายังไม่มีข้อมูล CS05 ให้แสดง message แจ้งเตือน
  if (!cs05Data) {
    return (
      <div className="internship-container">
        <Card className="internship-card">
          <Result
            status="warning"
            title="กรุณายื่นแบบฟอร์ม คพ.05 ก่อนบันทึกข้อมูลผู้ควบคุมงาน"
            extra={
              <Button type="primary" onClick={() => navigate('/internship-registration/cs05')}>
                ไปยังหน้ายื่น คพ.05
              </Button>
            }
          />
        </Card>
      </div>
    );
  }

  return (
    <div className="internship-container">
      <Card className="internship-card">
        <Space style={{ width: '100%', justifyContent: 'space-between', marginBottom: 20 }}>
          <Title level={3}>ข้อมูลสถานประกอบการ</Title>
          {isDisabled && (
            <Button 
              type="primary" 
              onClick={handleEdit}
              icon={<EditOutlined />}
            >
              แก้ไขข้อมูลผู้ควบคุมงาน
            </Button>
          )}
        </Space>
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
        >
          <Form.Item
            name="companyName"
            label="ชื่อสถานประกอบการ"
          >
            <Input 
              disabled={true} // ล็อคไม่ให้แก้ไขตลอด
              placeholder="ชื่อบริษัท"
            />
          </Form.Item>

          {/* แยกส่วนข้อมูลผู้ควบคุมงาน */}
          <div style={{ marginTop: 24 }}>
            <Title level={5}>ข้อมูลผู้ควบคุมงาน</Title>
          </div>

          <Form.Item
            name="supervisorName"
            label="ชื่อผู้ควบคุมงาน"
            rules={[{ required: true, message: 'กรุณากรอกชื่อผู้ควบคุมงาน' }]}
          >
            <Input 
              placeholder="ชื่อผู้ควบคุมงาน" 
              disabled={isDisabled}
            />
          </Form.Item>
          <Form.Item
            name="supervisorPhone"
            label="เบอร์โทรศัพท์"
            rules={[{ required: true, message: 'กรุณากรอกเบอร์โทรศัพท์' }]}
          >
            <Input 
              placeholder="เบอร์โทรศัพท์" 
              disabled={isDisabled}
            />
          </Form.Item>
          <Form.Item
            name="supervisorEmail"
            label="อีเมลผู้ควบคุมงาน"
            rules={[
              { required: true, message: 'กรุณากรอกอีเมล' },
              { type: 'email', message: 'กรุณากรอกอีเมลให้ถูกต้อง' }
            ]}
          >
            <Input 
              placeholder="อีเมล" 
              disabled={isDisabled}
            />
          </Form.Item>
          <Form.Item>
            <Space style={{ display: 'flex', justifyContent: 'space-between' }}>
              <Button 
                type="default" 
                onClick={() => {
                  if (isEditing) {
                    setIsDisabled(true);
                    setIsEditing(false);
                    form.setFieldsValue(state?.registration?.company?.data);
                  } else {
                    navigate(-1);
                  }
                }}
              >
                {isEditing ? 'ยกเลิก' : 'ย้อนกลับ'}
              </Button>
              {!isDisabled && (
                <Button 
                  type="primary" 
                  htmlType="submit"
                  loading={loading}
                >
                  {isEditing ? 'บันทึกการแก้ไข' : 'บันทึกข้อมูล'}
                </Button>
              )}
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default CompanyInfoForm;