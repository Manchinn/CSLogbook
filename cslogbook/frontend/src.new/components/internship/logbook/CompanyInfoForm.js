import React, { useState, useEffect, Suspense, useCallback } from 'react';
import { Form, Input, Button, Card, Typography, Space, message, Result, Spin, Skeleton } from 'antd';
import { useNavigate } from "react-router-dom";
import { useInternship } from '../../../../context/internship/InternshipContext'; // Updated import path
import internshipService from '../../../../services/internshipService'; // Updated import path
import { EditOutlined, WarningOutlined } from '@ant-design/icons'; // Removed LoadingOutlined as it's not used
import "./InternshipStyles.css"; 

const { Title, Paragraph } = Typography; // Removed Text as it's not used

const CompanyForm = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { state, setCompanyInfo } = useInternship();
  const cs05Data = state?.registration?.cs05?.data;
  const documentId = cs05Data?.documentId;

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [isDisabled, setIsDisabled] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [hasCS05, setHasCS05] = useState(false);
  const [isCS05Approved, setIsCS05Approved] = useState(false);

  const checkCS05Status = useCallback(async () => {
    setInitialLoading(true);
    try {
      if (cs05Data && documentId) {
        setHasCS05(true);
        setIsCS05Approved(cs05Data.status === 'pending' || cs05Data.status === 'approved');
        setInitialLoading(false);
        return;
      }
      const response = await internshipService.getCurrentCS05();
      if (response.success && response.data) {
        setHasCS05(true);
        setIsCS05Approved(response.data.status === 'approved');
      } else {
        setHasCS05(false);
        setIsCS05Approved(false);
      }
    } catch (error) {
      console.error('Check CS05 Error:', error);
      setHasCS05(false);
      setIsCS05Approved(false);
    } finally {
      setInitialLoading(false);
    }
  }, [cs05Data, documentId]);

  useEffect(() => {
    checkCS05Status();
  }, [checkCS05Status]);

  const fetchCompanyInfo = useCallback(async () => {
    try {
      if (!documentId || !hasCS05 || !isCS05Approved) {
        console.log('Cannot fetch company info: prerequisites not met');
        return;
      }
      setLoading(true);
      const response = await internshipService.getCompanyInfo(documentId);
      if (response.success && response.data) {
        const formData = {
          companyName: cs05Data.companyName,
          supervisorName: response.data.supervisorName,
          supervisorPhone: response.data.supervisorPhone,
          supervisorEmail: response.data.supervisorEmail
        };
        form.setFieldsValue(formData);
        setCompanyInfo({
          documentId,
          ...formData
        });
        setIsDisabled(true);
      } else {
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
  }, [documentId, hasCS05, isCS05Approved, cs05Data?.companyName, form, setCompanyInfo]);

  useEffect(() => {
    fetchCompanyInfo();
  }, [fetchCompanyInfo]);

  const handleEdit = () => {
    const currentData = {
      companyName: form.getFieldValue('companyName'),
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
      if (!documentId) {
        throw new Error('ไม่พบข้อมูลเอกสาร CS05');
      }
      if (!isCS05Approved) {
        throw new Error('คำร้อง CS05 ยังไม่ได้รับการอนุมัติ');
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
          supervisorName: values.supervisorName.trim(),
          supervisorPhone: values.supervisorPhone.trim(),
          supervisorEmail: values.supervisorEmail.trim()
        });
        message.success(isEditing ? 'แก้ไขข้อมูลสำเร็จ' : 'บันทึกข้อมูลสำเร็จ');
        setIsDisabled(true);
        setIsEditing(false);
        localStorage.removeItem('tempCompanyData');
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

  if (initialLoading) {
    return (
      <div className="internship-container">
        <Card className="internship-card">
          <Skeleton active avatar paragraph={{ rows: 4 }} />
        </Card>
      </div>
    );
  }

  if (!hasCS05) {
    return (
      <Result
        status="warning"
        icon={<WarningOutlined />}
        title="ยังไม่มีข้อมูลคำร้อง คพ.05"
        subTitle="คุณจำเป็นต้องส่งคำร้อง คพ.05 ก่อนจึงจะสามารถกรอกข้อมูลสถานประกอบการได้"
        extra={
          <Button type="primary" onClick={() => navigate('/internship-registration/cs05')}>
            ไปที่หน้าส่งคำร้อง คพ.05
          </Button>
        }
      />
    );
  }

  if (!isCS05Approved) {
    return (
      <Result
        status="info"
        title="คำร้อง คพ.05 ยังไม่ได้รับการอนุมัติ"
        subTitle={`สถานะปัจจุบัน: ${cs05Data?.status === 'pending' ? 'รอการพิจารณา' : cs05Data?.status === 'rejected' ? 'ไม่อนุมัติ' : cs05Data?.status}`}
        extra={
          <Space direction="vertical" align="center">
            <Paragraph>
              คุณจำเป็นต้องรอให้คำร้อง คพ.05 ได้รับการอนุมัติก่อนจึงจะสามารถกรอกข้อมูลสถานประกอบการได้
            </Paragraph>
            <Button type="primary" onClick={() => navigate('/internship/status')}>
              ดูสถานะคำร้อง
            </Button>
          </Space>
        }
      />
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
              disabled={true} 
              placeholder="ชื่อบริษัท"
            />
          </Form.Item>

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
                    const tempData = JSON.parse(localStorage.getItem('tempCompanyData') || '{}');
                    if (tempData) {
                      form.setFieldsValue(tempData);
                    }
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

const CompanyInfoForm = () => {
  return (
    <div className="internship-container">
      <Suspense fallback={<Spin tip="กำลังโหลดข้อมูล..." />}>
        <CompanyForm />
      </Suspense>
    </div>
  );
};

export default CompanyInfoForm;