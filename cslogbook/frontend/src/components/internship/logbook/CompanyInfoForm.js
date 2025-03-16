import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Card, Typography, Space, message, Result } from 'antd';
import { useNavigate } from "react-router-dom";
import { useInternship } from '../../../contexts/InternshipContext';
import internshipService from '../../../services/internshipService';
import { EditOutlined } from '@ant-design/icons';
import "./InternshipStyles.css"; // Import shared CSS

const { Title } = Typography;

const validateCompanyData = (data) => {
  return data?.supervisorName && data?.supervisorPhone && data?.supervisorEmail;
};

const CompanyInfoForm = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { state, setCompanyInfo } = useInternship();
  const cs05Data = state?.registration?.cs05?.data;
  const documentId = cs05Data?.documentId;

  const [loading, setLoading] = useState(false);
  const [isDisabled, setIsDisabled] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // ลบ hasFetched state

  // แก้ไข useEffect สำหรับการดึงข้อมูล
  useEffect(() => {
    const fetchCompanyInfo = async () => {
      try {
        if (!documentId) {
          console.log('No document ID found');
          return;
        }

        setLoading(true);
        console.log('Fetching company info for document:', documentId);
        
        const response = await internshipService.getCompanyInfo(documentId);
        console.log('Company Info Response:', response);

        if (response.success && response.data) {
          const formData = {
            companyName: cs05Data.companyName,
            supervisorName: response.data.supervisorName,
            supervisorPhone: response.data.supervisorPhone,
            supervisorEmail: response.data.supervisorEmail
          };

          // อัพเดทข้อมูลพร้อมกัน
          form.setFieldsValue(formData);
          setCompanyInfo({
            documentId,
            ...formData
          });
          setIsDisabled(true);
        } else {
          // กรณีไม่มีข้อมูล
          form.setFieldsValue({
            companyName: cs05Data.companyName,
            supervisorName: '',
            supervisorPhone: '',
            supervisorEmail: ''
          });
          setIsDisabled(false);
        }
      } catch (error) {
        console.error('Fetch Company Info Error:', error);
        message.error('ไม่สามารถดึงข้อมูลผู้ควบคุมงาน');
      } finally {
        setLoading(false);
      }
    };

    fetchCompanyInfo();
  }, [documentId, cs05Data?.companyName]); // ลดจำนวน dependencies

  const handleEdit = () => {
    // เก็บข้อมูลปัจจุบันไว้กรณียกเลิกการแก้ไข
    const currentData = {
      supervisorName: form.getFieldValue('supervisorName'),
      supervisorPhone: form.getFieldValue('supervisorPhone'),
      supervisorEmail: form.getFieldValue('supervisorEmail')
    };
    setIsDisabled(false);
    setIsEditing(true);
    localStorage.setItem('tempCompanyData', JSON.stringify(currentData));
  };

  const onFinish = async (values) => {
    setLoading(true);
    try {
      // Validate ข้อมูลก่อนส่ง
      if (!documentId) {
        throw new Error('ไม่พบข้อมูลเอกสาร CS05');
      }

      const response = await internshipService.submitCompanyInfo({
        documentId,
        supervisorName: values.supervisorName.trim(),
        supervisorPhone: values.supervisorPhone.trim(),
        supervisorEmail: values.supervisorEmail.trim()
      });

      if (response.success) {
        setCompanyInfo({
          documentId,
          companyName: cs05Data.companyName,
          supervisorName: values.supervisorName,
          supervisorPhone: values.supervisorPhone,
          supervisorEmail: values.supervisorEmail
        });
        message.success(isEditing ? 'แก้ไขข้อมูลสำเร็จ' : 'บันทึกข้อมูลสำเร็จ');
        setIsDisabled(true);
        setIsEditing(false);
      } else {
        throw new Error(response.message || 'ไม่สามารถบันทึกข้อมูล');
      }
    } catch (error) {
      console.error('Submit Error:', error);
      message.error(error.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    } finally {
      setLoading(false);
    }
  };

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
                    // ดึงข้อมูลที่เก็บไว้มาใส่กลับในฟอร์ม
                    const tempData = JSON.parse(localStorage.getItem('tempCompanyData'));
                    form.setFieldsValue(tempData);
                    setIsDisabled(true);
                    setIsEditing(false);
                    localStorage.removeItem('tempCompanyData');
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