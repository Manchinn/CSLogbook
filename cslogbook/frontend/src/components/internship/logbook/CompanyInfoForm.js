import React, { useState, useEffect, Suspense } from 'react';
import { Form, Input, Button, Card, Typography, Space, message, Result, Spin, Skeleton } from 'antd';
import { useNavigate } from "react-router-dom";
import { useInternship } from '../../../contexts/InternshipContext';
import internshipService from '../../../services/internshipService';
import { EditOutlined, WarningOutlined, LoadingOutlined } from '@ant-design/icons';
import "./InternshipStyles.css";

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
  const [cs05Status, setCS05Status] = useState(null); // เปลี่ยนจาก isCS05Approved
  const [canEditCompanyInfo, setCanEditCompanyInfo] = useState(false); // เพิ่ม state ใหม่

  // ตรวจสอบสถานะ CS05 เมื่อเข้าหน้านี้
  useEffect(() => {
    const checkCS05Status = async () => {
      setInitialLoading(true);
      try {
        // ถ้ามีข้อมูล CS05 จาก state แล้ว
        if (cs05Data && documentId) {
          setHasCS05(true);
          setCS05Status(cs05Data.status);
          // แก้ไข: อนุญาตให้กรอกข้อมูลได้เมื่อมี CS05 (pending หรือ approved)
          setCanEditCompanyInfo(cs05Data.status === 'pending' || cs05Data.status === 'approved');
          setInitialLoading(false);
          return;
        }

        // ถ้ายังไม่มีข้อมูลใน state ให้เรียก API เพื่อตรวจสอบ
        const response = await internshipService.getCurrentCS05();
        
        if (response.success && response.data) {
          setHasCS05(true);
          setCS05Status(response.data.status);
          setCanEditCompanyInfo(response.data.status === 'pending' || response.data.status === 'approved');
        } else {
          setHasCS05(false);
          setCS05Status(null);
          setCanEditCompanyInfo(false);
        }
      } catch (error) {
        console.error('Check CS05 Error:', error);
        setHasCS05(false);
        setCS05Status(null);
        setCanEditCompanyInfo(false);
      } finally {
        setInitialLoading(false);
      }
    };

    checkCS05Status();
  }, [cs05Data, documentId]);

  // ดึงข้อมูลบริษัทเมื่อสามารถแก้ไขได้
  useEffect(() => {
    const fetchCompanyInfo = async () => {
      try {
        // แก้ไข: ใช้ canEditCompanyInfo แทน isCS05Approved
        if (!documentId || !hasCS05 || !canEditCompanyInfo) {
          console.log('Cannot fetch company info: prerequisites not met');
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
      } finally {
        setLoading(false);
      }
    };

    fetchCompanyInfo();
  }, [documentId, hasCS05, canEditCompanyInfo, cs05Data?.companyName, form, setCompanyInfo]); 

  const handleEdit = () => {
    
    const currentData = {
      companyName: form.getFieldValue('companyName'),
      supervisorName: form.getFieldValue('supervisorName'),
      supervisorPosition: form.getFieldValue('supervisorPosition') , // ใช้ค่าเริ่มต้นเป็น string ว่าง
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
      console.log('Form values received:', values); // เพิ่มบรรทัดนี้เพื่อ debug
      
      if (!documentId) {
        throw new Error('ไม่พบข้อมูลเอกสาร CS05');
      }

      // แก้ไข: ใช้ canEditCompanyInfo แทน isCS05Approved
      if (!canEditCompanyInfo) {
        throw new Error('ไม่สามารถกรอกข้อมูลได้ กรุณาตรวจสอบสถานะคำร้อง CS05');
      }

      // แก้ไข: ตรวจสอบและจัดการค่าทุกฟิลด์อย่างปลอดภัย
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
            <Button type="primary" onClick={() => navigate('/internship-registration/cs05')}>
              ส่งคำร้องใหม่
            </Button>
          </Space>
        }
      />
    );
  }

  // แก้ไข: ไม่ต้องบล็อกเมื่อ status เป็น pending แล้ว
  // กรณีสถานะอื่นๆ ที่ไม่รองรับ
  if (!canEditCompanyInfo) {
    return (
      <Result
        status="info"
        title="ไม่สามารถกรอกข้อมูลได้ในขณะนี้"
        subTitle={`สถานะปัจจุบันของคำร้อง CS05: ${cs05Status || 'ไม่ทราบสถานะ'}`}
        extra={
          <Button type="primary" onClick={() => navigate('/internship/status')}>
            ดูสถานะคำร้อง
          </Button>
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
            {/* แสดงสถานะ CS05 */}
            <Text type="secondary">
              สถานะคำร้อง CS05: {
                cs05Status === 'pending' ? '🟡 รอการพิจารณา' :
                cs05Status === 'approved' ? '🟢 อนุมัติแล้ว' :
                cs05Status === 'rejected' ? '🔴 ไม่อนุมัติ' :
                '⚪ ไม่ทราบสถานะ'
              }
            </Text>
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
            initialValue="" // เพิ่มค่าเริ่มต้น
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
      <Suspense fallback={<Spin tip="กำลังโหลดข้อมูล..." />}>
        <CompanyForm />
      </Suspense>
    </div>
  );
};

export default CompanyInfoForm;