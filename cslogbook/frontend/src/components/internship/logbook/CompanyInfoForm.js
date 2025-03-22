import React, { useState, useEffect, Suspense } from 'react';
import { Form, Input, Button, Card, Typography, Space, message, Result, Spin, Skeleton } from 'antd';
import { useNavigate } from "react-router-dom";
import { useInternship } from '../../../contexts/InternshipContext';
import internshipService from '../../../services/internshipService';
import { EditOutlined, WarningOutlined, LoadingOutlined } from '@ant-design/icons';
import "./InternshipStyles.css"; // Import shared CSS

const { Title, Text, Paragraph } = Typography;

const validateCompanyData = (data) => {
  return data?.supervisorName && data?.supervisorPhone && data?.supervisorEmail;
};

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

  // ตรวจสอบสถานะ CS05 เมื่อเข้าหน้านี้
  useEffect(() => {
    const checkCS05Status = async () => {
      setInitialLoading(true);
      try {
        // ถ้ามีข้อมูล CS05 จาก state แล้ว
        if (cs05Data && documentId) {
          setHasCS05(true);
          setIsCS05Approved(cs05Data.status === 'pending'); /* ค่อยแก้ไขเป็น approve */
          setInitialLoading(false);
          return;
        }

        // ถ้ายังไม่มีข้อมูลใน state ให้เรียก API เพื่อตรวจสอบ
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
    };

    checkCS05Status();
  }, [cs05Data, documentId]);

  // ดึงข้อมูลบริษัทเมื่อมี documentId (เฉพาะเมื่อมี CS05 และได้รับการอนุมัติแล้ว)
  useEffect(() => {
    const fetchCompanyInfo = async () => {
      try {
        if (!documentId || !hasCS05 || !isCS05Approved) {
          console.log('Cannot fetch company info: prerequisites not met');
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
  }, [documentId, hasCS05, isCS05Approved, cs05Data?.companyName, form, setCompanyInfo]); 

  const handleEdit = () => {
    // เก็บข้อมูลปัจจุบันไว้กรณียกเลิกการแก้ไข
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
      // ตรวจสอบว่ามี documentId และได้รับอนุมัติแล้ว
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
        
        // ลบข้อมูลชั่วคราวหลังจากบันทึกเสร็จ
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

  // Replace the current loading state with Skeleton
  if (initialLoading) {
    return (
      <div className="internship-container">
        <Card className="internship-card">
          <Skeleton active avatar paragraph={{ rows: 4 }} />
        </Card>
      </div>
    );
  }

  // กรณียังไม่มีการส่ง CS05
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

  // กรณี CS05 ยังไม่ได้รับการอนุมัติ
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
            <Button type="primary" onClick={() => navigate('/internship/status')}> {/* รอแก้ไขให้ไปดูหน้า ตรวจสอบสถานะ */}
              ดูสถานะคำร้อง
            </Button>
          </Space>
        }
      />
    );
  }

  // แสดงฟอร์มเมื่อผ่านการตรวจสอบทุกอย่างแล้ว
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