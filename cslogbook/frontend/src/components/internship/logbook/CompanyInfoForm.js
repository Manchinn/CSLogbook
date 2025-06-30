import React, { useState, useEffect, Suspense } from 'react';
import { Form, Input, Button, Card, Typography, Space, message, Result, Spin } from 'antd';
import { useNavigate } from "react-router-dom";
import { useInternship } from '../../../contexts/InternshipContext';
import internshipService from '../../../services/internshipService';
import { EditOutlined, WarningOutlined } from '@ant-design/icons';
import "./InternshipStyles.css";

const { Title, Text, Paragraph } = Typography;

const validateCompanyData = (data) => {
  return data?.supervisorName && data?.supervisorPhone && data?.supervisorEmail;
};

const CompanyForm = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { state, setCompanyInfo, setCS05Data } = useInternship(); // เพิ่ม setCS05Data
  
  // แก้ไข: ไม่พึ่งพาข้อมูลจาก Context อย่างเดียว
  const [cs05Data, setLocalCS05Data] = useState(state?.registration?.cs05?.data || null);
  const documentId = cs05Data?.documentId;

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [isDisabled, setIsDisabled] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [hasCS05, setHasCS05] = useState(false);
  const [cs05Status, setCS05Status] = useState(null);
  const [canEditCompanyInfo, setCanEditCompanyInfo] = useState(false);

  // แก้ไข: ตรวจสอบสถานะ CS05 โดยเรียก API โดยตรง
  useEffect(() => {
    const checkCS05Status = async () => {
      setInitialLoading(true);
      try {
        // แก้ไข: เรียก API เพื่อดึงข้อมูล CS05 ทุกครั้ง ไม่พึ่งพา Context
        console.log('Fetching CS05 data directly...');
        const response = await internshipService.getCurrentCS05();
        
        if (response.success && response.data) {
          const fetchedCS05Data = response.data;
          
          // อัพเดทข้อมูลทั้งใน state ท้องถิ่นและ Context
          setLocalCS05Data(fetchedCS05Data);
          setCS05Data(fetchedCS05Data); // อัพเดท Context ด้วย
          
          setHasCS05(true);
          setCS05Status(fetchedCS05Data.status);
          setCanEditCompanyInfo(
            fetchedCS05Data.status === 'pending' || 
            fetchedCS05Data.status === 'approved'
          );
          
          console.log('CS05 data loaded:', {
            documentId: fetchedCS05Data.documentId,
            status: fetchedCS05Data.status,
            companyName: fetchedCS05Data.companyName
          });
        } else {
          // ไม่มีข้อมูล CS05
          setLocalCS05Data(null);
          setHasCS05(false);
          setCS05Status(null);
          setCanEditCompanyInfo(false);
          
          console.log('No CS05 data found');
        }
      } catch (error) {
        console.error('Check CS05 Error:', error);
        
        // กรณี 404 - ยังไม่มีข้อมูล CS05
        if (error.response?.status === 404) {
          setLocalCS05Data(null);
          setHasCS05(false);
          setCS05Status(null);
          setCanEditCompanyInfo(false);
        } else {
          // ข้อผิดพลาดอื่นๆ - แสดงข้อความแต่ไม่บล็อกการใช้งาน
          message.error('ไม่สามารถตรวจสอบสถานะ CS05 ได้');
          setHasCS05(false);
          setCanEditCompanyInfo(false);
        }
      } finally {
        setInitialLoading(false);
      }
    };

    checkCS05Status();
  }, []); // ไม่พึ่งพา dependencies จาก Context

  // ดึงข้อมูลบริษัทเมื่อสามารถแก้ไขได้
  useEffect(() => {
    const fetchCompanyInfo = async () => {
      try {
        if (!documentId || !hasCS05 || !canEditCompanyInfo) {
          console.log('Cannot fetch company info: prerequisites not met', {
            documentId,
            hasCS05,
            canEditCompanyInfo
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
  }, [documentId, hasCS05, canEditCompanyInfo, cs05Data?.companyName, form, setCompanyInfo]); 

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

      if (!canEditCompanyInfo) {
        throw new Error('ไม่สามารถกรอกข้อมูลได้ กรุณาตรวจสอบสถานะคำร้อง CS05');
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

  // แสดง Skeleton ขณะโหลด
  if (initialLoading) {
    return (
      <div className="internship-container">
        <Card className="internship-card">
          <div style={{ textAlign: 'center', padding: '50px 0' }}>
            <Spin size="large" />
            <div style={{ marginTop: 16 }}>
              <Text type="secondary">กำลังตรวจสอบข้อมูล CS05...</Text>
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

  // กรณี CS05 ถูกปฏิเสธ
  if (cs05Status === 'rejected') {
    return (
      <Result
        status="error"
        title="คำร้อง คพ.05 ไม่ได้รับการอนุมัติ"
        subTitle="คำร้องของคุณไม่ได้รับการอนุมัติ กรุณาติดต่ออาจารย์ที่ปรึกษาหรือแก้ไขคำร้องใหม่"
        extra={
          <Space>
            <Button onClick={() => navigate('/internship/status')}>
              ดูสถานะคำร้อง
            </Button>
            <Button type="primary" onClick={() => navigate('/internship-registration/flow')}>
              ส่งคำร้องใหม่
            </Button>
            <Button onClick={() => navigate('/internship')}>
              กลับหน้าหลัก
            </Button>
          </Space>
        }
      />
    );
  }

  // กรณีสถานะอื่นๆ ที่ไม่รองรับ
  if (!canEditCompanyInfo) {
    return (
      <Result
        status="info"
        title="ไม่สามารถกรอกข้อมูลได้ในขณะนี้"
        subTitle={`สถานะปัจจุบันของคำร้อง CS05: ${cs05Status || 'ไม่ทราบสถานะ'}`}
        extra={
          <Space>
            <Button type="primary" onClick={() => navigate('/internship/status')}>
              ดูสถานะคำร้อง
            </Button>
            <Button onClick={() => navigate('/internship')}>
              กลับหน้าหลัก
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