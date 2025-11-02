import React, { useState, useEffect, Suspense } from 'react';
import { Form, Input, Button, Card, Typography, Space, message, Result, Spin, Alert } from 'antd';
import { useNavigate } from "react-router-dom";
import { useInternship } from '../../../contexts/InternshipContext';
import internshipService from '../../../services/internshipService';
import { EditOutlined, WarningOutlined } from '@ant-design/icons';
import useInternshipAccess from '../../../hooks/useInternshipAccess';
import "./InternshipStyles.css";

const { Title, Text } = Typography;

const CompanyForm = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { setCompanyInfo } = useInternship();
  
  // ✅ ใช้ useInternshipAccess hook สำหรับตรวจสอบทั้ง CS05 และ ACCEPTANCE_LETTER
  const {
    loading: accessLoading,
    cs05Status,
    acceptanceStatus,
    canEdit,
    cs05Data,
    errorMessage,
    hasCS05,
    isCS05Approved,
    hasAcceptance,
  } = useInternshipAccess();

  const documentId = cs05Data?.documentId;

  const [loading, setLoading] = useState(false);
  const [isDisabled, setIsDisabled] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // ดึงข้อมูลบริษัทเมื่อสามารถแก้ไขได้
  useEffect(() => {
    const fetchCompanyInfo = async () => {
      try {
        // ✅ ตรวจสอบเงื่อนไขการเข้าถึง
        if (!documentId || !canEdit) {
          console.log('Cannot fetch company info: prerequisites not met', {
            documentId,
            hasCS05,
            canEdit
          });
          return;
        }

        setLoading(true);
        console.log('Fetching company info for document:', documentId);
        
        const response = await internshipService.getCompanyInfo(documentId);
        console.log('Company Info Response:', response);

        if (response.success && response.data) {
          const formData = {
            companyName: cs05Data?.companyName || '',
            supervisorName: response.data.supervisorName || '',
            supervisorPosition: response.data.supervisorPosition || '',
            supervisorPhone: response.data.supervisorPhone || '',
            supervisorEmail: response.data.supervisorEmail || ''
          };

          // อัพเดทข้อมูลพร้อมกัน
          form.setFieldsValue(formData);
          setCompanyInfo({
            documentId,
            ...formData
          });
          setIsDisabled(true); // ตั้งเป็นโหมดแสดงผล
        } else {
          // กรณีไม่มีข้อมูล - ให้แก้ไขได้เลย
          const initialFormData = {
            companyName: cs05Data?.companyName || '',
            supervisorName: '',
            supervisorPosition: '',
            supervisorPhone: '',
            supervisorEmail: ''
          };
          
          form.setFieldsValue(initialFormData);
          setIsDisabled(false); // ให้แก้ไขได้
        }
      } catch (error) {
        console.error('Fetch Company Info Error:', error);
        
        // กรณี 404 - ยังไม่มีข้อมูล Company Info
        if (error.response?.status === 404) {
          console.log('No company info found, allowing new entry');
          const initialFormData = {
            companyName: cs05Data?.companyName || '',
            supervisorName: '',
            supervisorPosition: '',
            supervisorPhone: '',
            supervisorEmail: ''
          };
          
          form.setFieldsValue(initialFormData);
          setIsDisabled(false);
        } else {
          message.error('ไม่สามารถดึงข้อมูลผู้ควบคุมงาน');
          
          // ตั้งค่าเริ่มต้นเมื่อเกิดข้อผิดพลาด
          const fallbackFormData = {
            companyName: cs05Data?.companyName || '',
            supervisorName: '',
            supervisorPosition: '',
            supervisorPhone: '',
            supervisorEmail: ''
          };
          
          form.setFieldsValue(fallbackFormData);
          setIsDisabled(false);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchCompanyInfo();
  }, [documentId, hasCS05, canEdit, cs05Data?.companyName, form, setCompanyInfo]); 

  const handleEdit = () => {
    const currentData = {
      companyName: form.getFieldValue('companyName') || '',
      supervisorName: form.getFieldValue('supervisorName') || '',
      supervisorPosition: form.getFieldValue('supervisorPosition') || '',
      supervisorPhone: form.getFieldValue('supervisorPhone') || '',
      supervisorEmail: form.getFieldValue('supervisorEmail') || ''
    };
    setIsDisabled(false);
    setIsEditing(true);
    localStorage.setItem('tempCompanyData', JSON.stringify(currentData));
  };

  const onFinish = async (values) => {
    setLoading(true);
    try {
      console.log('Form values received:', values);
      
      if (!documentId) {
        throw new Error('ไม่พบข้อมูลเอกสาร CS05');
      }

      if (!canEdit) {
        throw new Error(errorMessage || 'ไม่สามารถกรอกข้อมูลได้ กรุณาตรวจสอบสถานะ');
      }

      // ตรวจสอบและจัดการค่าทุกฟิลด์อย่างปลอดภัย
      const supervisorName = values.supervisorName ? values.supervisorName.trim() : '';
      const supervisorPosition = values.supervisorPosition ? values.supervisorPosition.trim() : '';
      const supervisorPhone = values.supervisorPhone ? values.supervisorPhone.trim() : '';
      const supervisorEmail = values.supervisorEmail ? values.supervisorEmail.trim() : '';

      // ตรวจสอบข้อมูลที่จำเป็น
      if (!supervisorName) {
        throw new Error('กรุณากรอกชื่อผู้ควบคุมงาน');
      }
      if (!supervisorPhone) {
        throw new Error('กรุณากรอกเบอร์โทรศัพท์');
      }
      if (!supervisorEmail) {
        throw new Error('กรุณากรอกอีเมลผู้ควบคุมงาน');
      }

      const response = await internshipService.submitCompanyInfo({
        documentId,
        supervisorName,
        supervisorPosition,
        supervisorPhone,
        supervisorEmail
      });

      if (response.success) {
        setCompanyInfo({
          documentId,
          companyName: cs05Data.companyName,
          supervisorName,
          supervisorPosition,
          supervisorPhone,
          supervisorEmail
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

  // ✅ แสดง Skeleton ขณะโหลด
  if (accessLoading) {
    return (
      <div className="internship-container">
        <Card className="internship-card">
          <div style={{ textAlign: 'center', padding: '50px 0' }}>
            <Spin size="large" />
            <div style={{ marginTop: 16 }}>
              <Text type="secondary">กำลังตรวจสอบสิทธิ์การเข้าถึง...</Text>
            </div>
          </div>
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
          <Space>
            <Button type="primary" onClick={() => navigate('/internship-registration/flow')}>
              ไปที่หน้าส่งคำร้อง คพ.05
            </Button>
            <Button onClick={() => navigate('/internship')}>
              กลับหน้าหลัก
            </Button>
          </Space>
        }
      />
    );
  }

  // ✅ กรณีไม่ผ่านเงื่อนไขการเข้าถึง (ทั้ง CS05 และ ACCEPTANCE_LETTER)
  if (!canEdit) {
    // กำหนด message และ status ตามสถานะ
    let resultStatus = 'info';
    let resultTitle = 'ไม่สามารถกรอกข้อมูลได้ในขณะนี้';
    let resultSubTitle = errorMessage || '';
    let extraButtons = [];
    let alertComponent = null;

    // ตรวจสอบ CS05 ก่อน
    if (!hasCS05) {
      resultStatus = 'warning';
      resultTitle = 'ไม่พบข้อมูลคำร้อง คพ.05';
      resultSubTitle = 'คุณจำเป็นต้องส่งคำร้อง คพ.05 ก่อนจึงจะสามารถกรอกข้อมูลสถานประกอบการได้';
      extraButtons = [
        <Button key="cs05" type="primary" onClick={() => navigate('/internship-registration/flow')}>
          ไปที่หน้าส่งคำร้อง คพ.05
        </Button>,
        <Button key="home" onClick={() => navigate('/dashboard')}>
          กลับหน้าหลัก
        </Button>
      ];
    } else if (cs05Status === 'rejected') {
      resultStatus = 'error';
      resultTitle = 'คำร้องขอฝึกงาน(คพ.05)ไม่ได้รับการอนุมัติ';
      resultSubTitle = 'คำร้องของคุณไม่ได้รับการอนุมัติ กรุณาติดต่อเจ้าหน้าที่หรือแก้ไขคำร้องใหม่';
      extraButtons = [
        <Button key="status" onClick={() => navigate('/internship-registration/flow')}>
          ดูสถานะคำร้อง
        </Button>,
        <Button key="resubmit" type="primary" onClick={() => navigate('/internship-registration/flow')}>
          ส่งคำร้องใหม่
        </Button>,
        <Button key="home" onClick={() => navigate('/dashboard')}>
          กลับหน้าหลัก
        </Button>
      ];
    } else if (cs05Status === 'pending') {
      resultStatus = 'warning';
      resultTitle = 'คำร้อง คพ.05 อยู่ระหว่างการพิจารณา';
      resultSubTitle = 'กรุณารอการอนุมัติจากเจ้าหน้าที่ภาควิชาก่อน';
      extraButtons = [
        <Button key="status" type="primary" onClick={() => navigate('/internship-registration/flow')}>
          ดูสถานะคำร้อง
        </Button>,
        <Button key="home" onClick={() => navigate('/dashboard')}>
          กลับหน้าหลัก
        </Button>
      ];
    } else if (isCS05Approved && !hasAcceptance) {
      // CS05 approved แล้ว แต่ยังไม่มี ACCEPTANCE_LETTER
      resultStatus = 'info';
      resultTitle = 'ยังไม่มีหนังสือตอบรับจากบริษัท';
      resultSubTitle = 'กรุณาอัปโหลดหนังสือตอบรับจากบริษัทก่อนจึงจะสามารถกรอกข้อมูลผู้ควบคุมงานได้';
      alertComponent = (
        <Alert
          message="ขั้นตอนต่อไป"
          description="1. พิมพ์หนังสือขอความอนุเคราะห์ไปยื่นต่อบริษัท → 2. อัปโหลดหนังสือตอบรับ → 3. รอการอนุมัติ → 4. กรอกข้อมูลผู้ควบคุมงาน"
          type="info"
          showIcon
          style={{ marginBottom: 16, textAlign: 'left' }}
        />
      );
      extraButtons = [
        <Button key="upload" type="primary" onClick={() => navigate('/internship-registration/flow')}>
          ไปอัปโหลดหนังสือตอบรับ
        </Button>,
        <Button key="home" onClick={() => navigate('/dashboard')}>
          กลับหน้าหลัก
        </Button>
      ];
    } else if (isCS05Approved && acceptanceStatus === 'pending') {
      // ACCEPTANCE_LETTER รอการอนุมัติ
      resultStatus = 'warning';
      resultTitle = 'หนังสือตอบรับอยู่ระหว่างการพิจารณา';
      resultSubTitle = 'กรุณารอการอนุมัติจากเจ้าหน้าที่ภาควิชา';
      extraButtons = [
        <Button key="status" type="primary" onClick={() => navigate('/internship-registration/flow')}>
          ดูสถานะล่าสุด
        </Button>,
        <Button key="home" onClick={() => navigate('/dashboard')}>
          กลับหน้าหลัก
        </Button>
      ];
    } else if (isCS05Approved && acceptanceStatus === 'rejected') {
      // ACCEPTANCE_LETTER ถูกปฏิเสธ
      resultStatus = 'error';
      resultTitle = 'หนังสือตอบรับไม่ได้รับการอนุมัติ';
      resultSubTitle = 'กรุณาอัปโหลดหนังสือตอบรับใหม่';
      extraButtons = [
        <Button key="upload" type="primary" onClick={() => navigate('/internship-registration/flow')}>
          อัปโหลดหนังสือใหม่
        </Button>,
        <Button key="status" onClick={() => navigate('/internship-registration/flow')}>
          ดูสถานะคำร้อง
        </Button>,
        <Button key="home" onClick={() => navigate('/dashboard')}>
          กลับหน้าหลัก
        </Button>
      ];
    } else {
      // สถานะอื่นๆ
      resultStatus = 'info';
      resultTitle = 'ไม่สามารถกรอกข้อมูลได้ในขณะนี้';
      resultSubTitle = errorMessage || `ระบบต้องการให้ CS05 และหนังสือตอบรับได้รับการอนุมัติก่อน`;
      extraButtons = [
        <Button key="status" type="primary" onClick={() => navigate('/internship-registration/flow')}>
          ดูสถานะคำร้อง
        </Button>,
        <Button key="home" onClick={() => navigate('/dashboard')}>
          กลับหน้าหลัก
        </Button>
      ];
    }

    return (
      <div className="internship-container">
        {alertComponent}
        <Result
          status={resultStatus}
          title={resultTitle}
          subTitle={resultSubTitle}
          extra={<Space>{extraButtons}</Space>}
        />
      </div>
    );
  }

  // แสดงฟอร์มเมื่อผ่านการตรวจสอบทุกอย่างแล้ว
  return (
    <div className="internship-container">
      <Card className="internship-card">
        <Space style={{ width: '100%', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <Title level={3}>ข้อมูลสถานประกอบการ</Title>
            {/* แสดงสถานะ CS05 และข้อมูลเพิ่มเติม */}
            <div>
              <Text type="secondary">
                สถานะคำร้อง CS05: {
                  cs05Status === 'pending' ? '🟡 รอการพิจารณา' :
                  cs05Status === 'approved' ? '🟢 อนุมัติแล้ว' :
                  cs05Status === 'rejected' ? '🔴 ไม่อนุมัติ' :
                  '⚪ ไม่ทราบสถานะ'
                }
              </Text>
              <br />
              <Text type="secondary">
                เลขที่เอกสาร: {documentId || 'ไม่ระบุ'}
              </Text>
            </div>
          </div>
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
            name="supervisorPosition"
            label="ตำแหน่งผู้ควบคุมงาน"
            rules={[{ required: false }]}
            initialValue=""
          >
            <Input 
              placeholder="ตำแหน่งผู้ควบคุมงาน" 
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
      <Suspense fallback={
        <div style={{ textAlign: 'center', padding: '50px 0' }}>
          <Spin size="large" />
          <div style={{ marginTop: 16 }}>
            <Text type="secondary">กำลังโหลดข้อมูล...</Text>
          </div>
        </div>
      }>
        <CompanyForm />
      </Suspense>
    </div>
  );
};

export default CompanyInfoForm;