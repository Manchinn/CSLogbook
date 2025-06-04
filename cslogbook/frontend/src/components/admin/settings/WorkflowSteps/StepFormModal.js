import React, { useEffect, useState } from 'react';
import {
  Modal, Form, Input, InputNumber, Switch, Select, Space, Button,
  Row, Col, Alert, Typography, Divider, Tooltip, Card, Tag
} from 'antd';
import { SaveOutlined, InfoCircleOutlined, CloseOutlined } from '@ant-design/icons';
// อัปเดต import path
import workflowStepService from '../../../../services/admin/workflowStepService';

const { TextArea } = Input;
const { Option } = Select;
const { Text, Title } = Typography;

/**
 * Modal สำหรับสร้างและแก้ไขขั้นตอน Workflow
 */
const StepFormModal = ({ 
  visible, 
  editingStep, 
  selectedWorkflowType, 
  onCancel, 
  onSuccess 
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [showDependencyExamples, setShowDependencyExamples] = useState(false);
  
  // เพิ่ม state สำหรับรายการขั้นตอนที่สามารถเลือกได้
  const [availableSteps, setAvailableSteps] = useState([]);
  const [loadingSteps, setLoadingSteps] = useState(false);

  // ตัวเลือกประเภท workflow
  const workflowTypes = [
    { value: 'internship', label: 'การฝึกงาน' },
    { value: 'project', label: 'โครงงานพิเศษ' }
  ];

  /**
   * ฟังก์ชันดึงรายการขั้นตอนที่สามารถเลือกเป็น dependencies
   * ปรับปรุงให้รองรับการแก้ไขที่ดีขึ้น
   */
  const loadAvailableSteps = async (workflowType) => {
    if (!workflowType) return;
    
    try {
      setLoadingSteps(true);
      const response = await workflowStepService.getAllSteps({
        workflowType,
        limit: 1000
      });
      
      const steps = response.data?.steps || [];
      const currentStepOrder = form.getFieldValue('stepOrder') || 1;
      
      let filteredSteps;
      
      if (editingStep) {
        // กรณีแก้ไข: รวมขั้นตอนที่มีอยู่ใน dependencies เดิมด้วย
        // เพื่อให้สามารถแสดงและแก้ไขได้ถูกต้อง
        const existingDependencies = editingStep.dependencies || [];
        
        filteredSteps = steps.filter(step => {
          // ไม่รวมขั้นตอนปัจจุบัน
          if (step.stepId === editingStep.stepId) return false;
          
          // รวมขั้นตอนที่มี stepOrder น้อยกว่า
          if (step.stepOrder < currentStepOrder) return true;
          
          // รวมขั้นตอนที่อยู่ใน dependencies เดิม (เผื่อมีการปรับ stepOrder)
          if (existingDependencies.includes(step.stepKey)) return true;
          
          return false;
        });
      } else {
        // กรณีสร้างใหม่: เลือกได้เฉพาะขั้นตอนก่อนหน้า
        filteredSteps = steps.filter(step => {
          return step.stepOrder < currentStepOrder;
        });
      }
      
      // เรียงตาม stepOrder
      filteredSteps.sort((a, b) => a.stepOrder - b.stepOrder);
      
      console.log('📋 Available steps for dependencies:', filteredSteps);
      setAvailableSteps(filteredSteps);
      
    } catch (error) {
      console.error('Error loading available steps:', error);
      setAvailableSteps([]);
    } finally {
      setLoadingSteps(false);
    }
  };

  // รีเซ็ตฟอร์มเมื่อเปิด/ปิด modal
  useEffect(() => {
    console.log('🔄 Modal visibility changed:', visible);
    console.log('📝 Editing step:', editingStep);
    console.log('🏷️ Selected workflow type:', selectedWorkflowType);
    
    if (visible) {
      if (editingStep) {
        console.log('✏️ Setting up form for editing...');
        
        // แก้ไขขั้นตอนที่มีอยู่
        const formData = {
          workflowType: editingStep.workflowType,
          stepKey: editingStep.stepKey,
          stepOrder: editingStep.stepOrder,
          title: editingStep.title,
          descriptionTemplate: editingStep.descriptionTemplate,
          isRequired: editingStep.isRequired,
          dependencies: editingStep.dependencies || []
        };
        
        console.log('📝 Form data for editing:', formData);
        form.setFieldsValue(formData);
        
        // โหลดรายการขั้นตอนสำหรับ workflow type นี้
        loadAvailableSteps(editingStep.workflowType);
      } else {
        console.log('✨ Setting up form for new step...');
        
        // สร้างขั้นตอนใหม่
        form.resetFields();
        const newFormData = {
          workflowType: selectedWorkflowType,
          isRequired: true,
          stepOrder: 1,
          dependencies: []
        };
        
        console.log('📝 Form data for new step:', newFormData);
        form.setFieldsValue(newFormData);
        
        // โหลดรายการขั้นตอนสำหรับ workflow type นี้
        loadAvailableSteps(selectedWorkflowType);
      }
      setValidationErrors({});
    } else {
      console.log('🚪 Cleaning up modal...');
      form.resetFields();
      setValidationErrors({});
      setAvailableSteps([]);
    }
  }, [visible, editingStep, selectedWorkflowType, form]);

  /**
   * ฟังก์ชันจัดการเมื่อเปลี่ยน workflow type
   */
  const handleWorkflowTypeChange = (workflowType) => {
    // รีเซ็ต dependencies เมื่อเปลี่ยน workflow type
    form.setFieldValue('dependencies', []);
    // โหลดรายการขั้นตอนใหม่
    loadAvailableSteps(workflowType);
  };

  /**
   * ฟังก์ชันจัดการเมื่อเปลี่ยน stepOrder
   */
  const handleStepOrderChange = (stepOrder) => {
    // รีเซ็ต dependencies เมื่อเปลี่ยน stepOrder
    form.setFieldValue('dependencies', []);
    
    // โหลดรายการขั้นตอนใหม่ตาม stepOrder ที่เปลี่ยน
    const workflowType = form.getFieldValue('workflowType');
    if (workflowType) {
      // รอให้ form update ค่า stepOrder ก่อน
      setTimeout(() => {
        loadAvailableSteps(workflowType);
      }, 100);
    }
  };

  /**
   * ฟังก์ชันบันทึกข้อมูล - เพิ่ม debugging และ error handling
   */
  const handleSubmit = async (values) => {
    console.log('🚀 handleSubmit called with values:', values); // Debug log
    
    try {
      setLoading(true);
      setValidationErrors({});

      // ตรวจสอบข้อมูลที่ได้รับจาก form
      console.log('📝 Form values received:', JSON.stringify(values, null, 2));
      
      // ตรวจสอบว่า dependencies เป็น array หรือไม่
      console.log('🔗 Dependencies type:', typeof values.dependencies);
      console.log('🔗 Dependencies value:', values.dependencies);

      // เตรียมข้อมูลก่อนส่ง
      const stepData = {
        ...values,
        // dependencies ส่งเป็น array ตรงๆ
        dependencies: values.dependencies && values.dependencies.length > 0 ? 
          values.dependencies : 
          null
      };

      console.log('📦 Prepared stepData:', JSON.stringify(stepData, null, 2));

      // ตรวจสอบข้อมูลที่จำเป็น
      if (!stepData.workflowType) {
        console.error('❌ Missing workflowType');
        setValidationErrors({ workflowType: 'กรุณาเลือกประเภท workflow' });
        return;
      }

      if (!stepData.stepKey) {
        console.error('❌ Missing stepKey');
        setValidationErrors({ stepKey: 'กรุณากรอกรหัสขั้นตอน' });
        return;
      }

      if (!stepData.title) {
        console.error('❌ Missing title');
        setValidationErrors({ title: 'กรุณากรอกชื่อขั้นตอน' });
        return;
      }

      if (!stepData.stepOrder || stepData.stepOrder < 1) {
        console.error('❌ Invalid stepOrder');
        setValidationErrors({ stepOrder: 'กรุณากรอกลำดับขั้นตอนที่ถูกต้อง' });
        return;
      }

      // ตรวจสอบ dependencies สำหรับขั้นตอนที่ไม่ใช่ขั้นตอนแรก
      if (stepData.stepOrder > 1 && (!stepData.dependencies || stepData.dependencies.length === 0)) {
        console.error('❌ Missing dependencies for step order > 1');
        setValidationErrors({ 
          dependencies: 'ขั้นตอนนี้ควรเลือกขั้นตอนก่อนหน้าอย่างน้อย 1 ขั้นตอน' 
        });
        return;
      }

      // ตรวจสอบ step_key ซ้ำกับระบบ timeline (เฉพาะเมื่อสร้างใหม่)
      if (!editingStep) {
        console.log('🔍 Checking for duplicate stepKey...');
        
        try {
          const existingSteps = await workflowStepService.getAllSteps({
            workflowType: stepData.workflowType,
            limit: 1000
          });
          
          console.log('📋 Existing steps response:', existingSteps);
          
          const duplicateKey = existingSteps.data?.steps?.find(
            step => step.stepKey === stepData.stepKey
          );
          
          if (duplicateKey) {
            console.error('❌ Duplicate stepKey found:', duplicateKey);
            setValidationErrors({ 
              stepKey: `รหัสขั้นตอน "${stepData.stepKey}" มีอยู่แล้วในระบบ` 
            });
            return;
          }
          
          console.log('✅ No duplicate stepKey found');
        } catch (error) {
          console.error('❌ Error checking duplicate stepKey:', error);
          // ไม่ return เพื่อให้ดำเนินการต่อไป
        }
      }

      // ส่งข้อมูลไปยัง API
      console.log('🚀 Sending data to API...');
      
      let response;
      if (editingStep) {
        console.log('📝 Updating existing step:', editingStep.stepId);
        response = await workflowStepService.updateStep(editingStep.stepId, stepData);
      } else {
        console.log('✨ Creating new step');
        response = await workflowStepService.createStep(stepData);
      }

      console.log('✅ API response:', response);

      // ตรวจสอบ response
      if (!response || (!response.success && !response.data)) {
        throw new Error('ไม่ได้รับการตอบกลับจาก API หรือเกิดข้อผิดพลาดในการบันทึกข้อมูล');
      }

      console.log('🎉 Step saved successfully');
      
      // เรียก callback เมื่อสำเร็จ
      onSuccess();
      
    } catch (error) {
      console.error('❌ Error in handleSubmit:', error);
      console.error('❌ Error stack:', error.stack);
      console.error('❌ Error message:', error.message);
      
      // ปรับปรุงการจัดการ error message
      if (error.response) {
        console.error('❌ API Error Response:', error.response);
        console.error('❌ API Error Data:', error.response.data);
        console.error('❌ API Error Status:', error.response.status);
        
        // จัดการ error จาก API response
        const apiError = error.response.data;
        if (apiError.message) {
          if (apiError.message.includes('stepKey') || apiError.message.includes('step_key')) {
            setValidationErrors({ stepKey: apiError.message });
          } else if (apiError.message.includes('stepOrder') || apiError.message.includes('step_order')) {
            setValidationErrors({ stepOrder: apiError.message });
          } else if (apiError.message.includes('Duplicate entry')) {
            setValidationErrors({ 
              stepKey: 'รหัสขั้นตอนนี้มีอยู่แล้วในระบบ กรุณาใช้รหัสอื่น' 
            });
          } else {
            setValidationErrors({ general: apiError.message });
          }
        } else {
          setValidationErrors({ general: 'เกิดข้อผิดพลาดจากเซิร์ฟเวอร์' });
        }
      } else if (error.message) {
        if (error.message.includes('stepKey') || error.message.includes('step_key')) {
          setValidationErrors({ stepKey: error.message });
        } else if (error.message.includes('stepOrder') || error.message.includes('step_order')) {
          setValidationErrors({ stepOrder: error.message });
        } else if (error.message.includes('Duplicate entry')) {
          setValidationErrors({ 
            stepKey: 'รหัสขั้นตอนนี้มีอยู่แล้วในระบบ กรุณาใช้รหัสอื่น' 
          });
        } else {
          setValidationErrors({ general: error.message });
        }
      } else {
        setValidationErrors({ general: 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ กรุณาลองใหม่อีกครั้ง' });
      }
    } finally {
      setLoading(false);
    }
  };

  /**
   * ฟังก์ชันสร้างป้ายกำกับสำหรับขั้นตอนที่เลือก
   */
  const renderSelectedStep = (stepKey, onRemove) => {
    const step = availableSteps.find(s => s.stepKey === stepKey);
    if (!step) return stepKey;
    
    return (
      <Tag
        key={stepKey}
        closable
        onClose={() => onRemove(stepKey)}
        style={{
          marginBottom: 4,
          padding: '4px 8px',
          borderRadius: '4px',
          display: 'inline-flex',
          alignItems: 'center',
          maxWidth: '300px'
        }}
      >
        <Space size={4}>
          <Text strong style={{ fontSize: '12px' }}>
            ลำดับ {step.stepOrder}:
          </Text>
          <Text style={{ fontSize: '12px' }} ellipsis={{ tooltip: step.title }}>
            {step.title}
          </Text>
        </Space>
      </Tag>
    );
  };

  /**
   * ตัวอย่าง dependencies ตาม workflow type
   */
  const getDependencyExamples = (workflowType) => {
    const examples = {
      internship: {
        title: "ตัวอย่างการตั้งค่า Dependencies แบบเป็นลำดับสำหรับการฝึกงาน:",
        cases: [
          {
            stepOrder: 1,
            stepName: "ตรวจสอบคุณสมบัติ",
            dependencies: [],
            reason: "ขั้นตอนแรก - ไม่ต้องเลือก dependencies"
          },
          {
            stepOrder: 2,
            stepName: "ยื่นคำร้องฝึกงาน (CS05)",
            dependencies: ["ลำดับ 1: ตรวจสอบคุณสมบัติ"],
            reason: "ต้องผ่านขั้นตอนที่ 1 ก่อน"
          },
          {
            stepOrder: 3,
            stepName: "อนุมัติจากอาจารย์ที่ปรึกษา",
            dependencies: ["ลำดับ 2: ยื่นคำร้องฝึกงาน (CS05)"],
            reason: "ต้องผ่านขั้นตอนที่ 2 ก่อน"
          },
          {
            stepOrder: 4,
            stepName: "ลงทะเบียนบริษัท",
            dependencies: ["ลำดับ 3: อนุมัติจากอาจารย์ที่ปรึกษา"],
            reason: "ต้องผ่านขั้นตอนที่ 3 ก่อน (หรืออาจเลือกขั้นตอนก่อนหน้าได้หลายขั้นตอน)"
          }
        ]
      },
      project: {
        title: "ตัวอย่างการตั้งค่า Dependencies แบบเป็นลำดับสำหรับโครงงานพิเศษ:",
        cases: [
          {
            stepOrder: 1,
            stepName: "เสนอหัวข้อโครงงาน",
            dependencies: [],
            reason: "ขั้นตอนแรก - ไม่ต้องเลือก dependencies"
          },
          {
            stepOrder: 2,
            stepName: "อนุมัติหัวข้อ",
            dependencies: ["ลำดับ 1: เสนอหัวข้อโครงงาน"],
            reason: "ต้องผ่านขั้นตอนที่ 1 ก่อน"
          },
          {
            stepOrder: 3,
            stepName: "รายงานความก้าวหน้า",
            dependencies: ["ลำดับ 2: อนุมัติหัวข้อ"],
            reason: "ต้องผ่านขั้นตอนที่ 2 ก่อน"
          },
          {
            stepOrder: 4,
            stepName: "สอบป้องกัน",
            dependencies: ["ลำดับ 3: รายงานความก้าวหน้า"],
            reason: "ต้องผ่านขั้นตอนที่ 3 ก่อน (หรืออาจเลือกหลายขั้นตอนก่อนหน้า)"
          }
        ]
      }
    };
    
    return examples[workflowType] || examples.internship;
  };

  // ป้องกัน warning โดยไม่ render Form เมื่อ modal ยังไม่เปิด
  if (!visible) {
    return null;
  }

  return (
    <Modal
      title={
        <Space>
          <InfoCircleOutlined />
          {editingStep ? 'แก้ไขขั้นตอน Workflow' : 'เพิ่มขั้นตอน Workflow ใหม่'}
        </Space>
      }
      open={visible}
      onCancel={onCancel}
      footer={null}
      style={{ top: 20 }}
      width={1200}
      destroyOnClose={true}
    >
      {/* แสดง error ทั่วไป */}
      {validationErrors.general && (
        <Alert
          message="เกิดข้อผิดพลาด"
          description={validationErrors.general}
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        disabled={loading}
        scrollToFirstError
        preserve={false}
      >
        {/* ข้อมูลพื้นฐาน */}
        <Card size="small" title="ข้อมูลพื้นฐาน" style={{ marginBottom: 16 }}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="workflowType"
                label="ประเภท Workflow"
                rules={[{ required: true, message: 'กรุณาเลือกประเภท workflow' }]}
                validateStatus={validationErrors.workflowType ? 'error' : ''}
                help={validationErrors.workflowType}
              >
                <Select 
                  disabled={!!editingStep} 
                  placeholder="เลือกประเภท workflow"
                  onChange={handleWorkflowTypeChange}
                >
                  {workflowTypes.map(type => (
                    <Option key={type.value} value={type.value}>
                      {type.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="stepOrder"
                label="ลำดับขั้นตอน"
                rules={[
                  { required: true, message: 'กรุณากรอกรหัสขั้นตอน' },
                  { type: 'number', min: 1, message: 'ลำดับขั้นตอนต้องมากกว่า 0' }
                ]}
                validateStatus={validationErrors.stepOrder ? 'error' : ''}
                help={validationErrors.stepOrder}
              >
                <InputNumber 
                  min={1} 
                  style={{ width: '100%' }} 
                  placeholder="ลำดับขั้นตอน (เช่น 1, 2, 3)"
                  onChange={handleStepOrderChange}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="stepKey"
            label={
              <Space>
                รหัสขั้นตอน
                <Tooltip title="รหัสที่ใช้ในระบบ ควรเป็นตัวอักษรพิมพ์ใหญ่และ underscore เท่านั้น">
                  <InfoCircleOutlined />
                </Tooltip>
              </Space>
            }
            rules={[
              { required: true, message: 'กรุณากรอกรหัสขั้นตอน' },
              { 
                pattern: /^[A-Z_]+$/, 
                message: 'รหัสขั้นตอนต้องประกอบด้วยตัวอักษรพิมพ์ใหญ่และ underscore เท่านั้น' 
              }
            ]}
            validateStatus={validationErrors.stepKey ? 'error' : ''}
            help={
              <div>
                {validationErrors.stepKey && (
                  <Text type="danger">{validationErrors.stepKey}</Text>
                )}
                {!validationErrors.stepKey && (
                  <Text type="secondary">
                    ตัวอย่าง: INTERNSHIP_CS05_SUBMITTED, PROJECT_PROPOSAL_APPROVED
                  </Text>
                )}
              </div>
            }
          >
            <Input 
              placeholder="เช่น INTERNSHIP_CS05_SUBMITTED"
              disabled={!!editingStep}
            />
          </Form.Item>

          <Form.Item
            name="title"
            label="ชื่อขั้นตอน"
            rules={[{ required: true, message: 'กรุณากรอกชื่อขั้นตอน' }]}
            validateStatus={validationErrors.title ? 'error' : ''}
            help={validationErrors.title}
          >
            <Input 
              placeholder="เช่น ยื่นคำร้องฝึกงาน (คพ.05) หรือ เสนอหัวข้อโครงงานพิเศษ"
            />
          </Form.Item>
        </Card>

        {/* คำอธิบายและการตั้งค่า */}
        <Card size="small" title="คำอธิบายและการตั้งค่า" style={{ marginBottom: 16 }}>
          <Form.Item
            name="descriptionTemplate"
            label="คำอธิบายขั้นตอน"
            rules={[{ required: true, message: 'กรุณากรอกคำอธิบายขั้นตอน' }]}
            validateStatus={validationErrors.descriptionTemplate ? 'error' : ''}
          >
            <TextArea 
              rows={3} 
              placeholder="คำอธิบายที่จะแสดงในระบบ สามารถใช้ตัวแปรได้ เช่น [สถานะ], [วันที่]"
            />
          </Form.Item>
        </Card>

        {/* ขั้นตอนที่ต้องทำก่อน - ปรับปรุงเป็น Multi-Select */}
        <Card size="small" title="ขั้นตอนที่ต้องทำก่อน (Dependencies)" style={{ marginBottom: 16 }}>
          <Alert
            message="หลักการของ Dependencies แบบเป็นลำดับ"
            description={
              <div>
                <p><strong>📋 กฎพื้นฐาน:</strong></p>
                <ul style={{ marginLeft: '20px', marginBottom: '10px' }}>
                  <li><strong>ขั้นตอนแรก (ลำดับ 1):</strong> ไม่ต้องเลือก Dependencies</li>
                  <li><strong>ขั้นตอนอื่นๆ:</strong> เลือกได้เฉพาะขั้นตอนก่อนหน้าเท่านั้น</li>
                  <li><strong>ความเป็นลำดับ:</strong> ป้องกันการข้ามขั้นตอนสำคัญ</li>
                  <li><strong>หลายขั้นตอน:</strong> สามารถเลือกหลายขั้นตอนก่อนหน้าได้</li>
                </ul>
                <p><strong>🛡️ ประโยชน์:</strong> รับประกันว่านักศึกษาจะทำตามลำดับที่กำหนดอย่างเคร่งครัด</p>
              </div>
            }
            type="warning"
            showIcon
            style={{ marginBottom: 16 }}
          />

          {/* แสดงจำนวนขั้นตอนที่สามารถเลือกได้ */}
          {form.getFieldValue('stepOrder') > 1 && (
            <Alert
              message={`💡 สำหรับขั้นตอนที่ ${form.getFieldValue('stepOrder')}`}
              description={
                availableSteps.length > 0 
                  ? `สามารถเลือกได้จากขั้นตอนก่อนหน้า ${availableSteps.length} ขั้นตอน (ลำดับ 1-${form.getFieldValue('stepOrder') - 1})`
                  : 'ยังไม่มีขั้นตอนก่อนหน้าให้เลือก กรุณาสร้างขั้นตอนตามลำดับ'
              }
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />
          )}

          {/* เงื่อนไขเตือนเมื่อไม่มีขั้นตอนก่อนหน้า */}
          {form.getFieldValue('stepOrder') > 1 && availableSteps.length === 0 && (
            <Alert
              message="⚠️ ไม่พบขั้นตอนก่อนหน้า"
              description={
                <div>
                  <p>ไม่พบขั้นตอนใดที่มีลำดับน้อยกว่า {form.getFieldValue('stepOrder')} ในระบบ</p>
                  <p><strong>คำแนะนำ:</strong></p>
                  <ul style={{ marginLeft: '20px' }}>
                    <li>ตรวจสอบว่าได้สร้างขั้นตอนก่อนหน้าแล้วหรือไม่</li>
                    <li>ลองเปลี่ยนลำดับขั้นตอนให้น้อยลง</li>
                    <li>หรือสร้างขั้นตอนตามลำดับที่ถูกต้อง</li>
                  </ul>
                </div>
              }
              type="warning"
              showIcon
              style={{ marginBottom: 16 }}
            />
          )}

          {/* ปุ่มแสดงตัวอย่าง */}
          <div style={{ marginBottom: 16 }}>
            <Button 
              type="link" 
              onClick={() => setShowDependencyExamples(!showDependencyExamples)}
              style={{ padding: 0 }}
            >
              {showDependencyExamples ? '🔼 ซ่อนตัวอย่าง' : '🔽 แสดงตัวอย่าง Dependencies แบบเป็นลำดับ'}
            </Button>
          </div>

          {/* ตัวอย่าง Dependencies */}
          {showDependencyExamples && (
            <Card size="small" style={{ backgroundColor: '#f9f9f9', marginBottom: 16 }}>
              <div>
                <Text strong>{getDependencyExamples(form.getFieldValue('workflowType') || 'internship').title}</Text>
                <div style={{ marginTop: 8 }}>
                  {getDependencyExamples(form.getFieldValue('workflowType') || 'internship').cases.map((example, index) => (
                    <div key={index} style={{ marginBottom: 12, padding: 8, backgroundColor: 'white', borderRadius: 4 }}>
                      <div style={{ marginBottom: 4 }}>
                        <Text strong>ลำดับ {example.stepOrder}: {example.stepName}</Text>
                      </div>
                      <div style={{ marginBottom: 4 }}>
                        <Text type="secondary">Dependencies: </Text>
                        {example.dependencies.length > 0 ? (
                          <div style={{ marginTop: 4 }}>
                            {example.dependencies.map((dep, depIndex) => (
                              <Tag key={depIndex} color="blue" style={{ marginBottom: 2 }}>
                                {dep}
                              </Tag>
                            ))}
                          </div>
                        ) : (
                          <Text type="secondary" italic>ไม่ต้องเลือก</Text>
                        )}
                      </div>
                      <div>
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                          💡 {example.reason}
                        </Text>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          )}

          <Form.Item
            name="dependencies"
            label={
              <Space>
                เลือกขั้นตอนก่อนหน้าที่ต้องทำ
                <Tooltip title="เลือกได้เฉพาะขั้นตอนที่มีลำดับน้อยกว่าขั้นตอนปัจจุบัน">
                  <InfoCircleOutlined />
                </Tooltip>
              </Space>
            }
            validateStatus={validationErrors.dependencies ? 'error' : ''}
            help={
              <div>
                {validationErrors.dependencies && (
                  <Text type="danger">{validationErrors.dependencies}</Text>
                )}
                {!validationErrors.dependencies && (
                  <div>
                    {form.getFieldValue('stepOrder') === 1 ? (
                      <Text type="secondary">
                        ✅ <strong>ขั้นตอนแรก</strong> - ไม่ต้องเลือก dependencies
                      </Text>
                    ) : availableSteps.length > 0 ? (
                      <Text type="secondary">
                        💡 เลือกจากขั้นตอนก่อนหน้า (ลำดับ 1-{form.getFieldValue('stepOrder') - 1}) สามารถเลือกได้หลายขั้นตอน
                      </Text>
                    ) : (
                      <Text type="warning">
                        ⚠️ ไม่มีขั้นตอนก่อนหน้าให้เลือก กรุณาสร้างขั้นตอนตามลำดับ
                      </Text>
                    )}
                  </div>
                )}
              </div>
            }
            rules={[
              {
                validator: (_, value) => {
                  const stepOrder = form.getFieldValue('stepOrder');
                  const currentStepKey = form.getFieldValue('stepKey');
                  
                  // ขั้นตอนแรกไม่ควรมี dependencies
                  if (stepOrder === 1 && value && value.length > 0) {
                    return Promise.reject(new Error('ขั้นตอนแรกไม่ควรมี Dependencies'));
                  }
                  
                  // ขั้นตอนอื่นๆ ควรมี dependencies อย่างน้อย 1 ขั้นตอน
                  if (stepOrder > 1 && (!value || value.length === 0)) {
                    return Promise.reject(new Error('ขั้นตอนนี้ควรเลือกขั้นตอนก่อนหน้าอย่างน้อย 1 ขั้นตอน'));
                  }
                  
                  // ตรวจสอบไม่ให้เลือกตัวเอง
                  if (value && currentStepKey && value.includes(currentStepKey)) {
                    return Promise.reject(new Error('ไม่สามารถเลือกขั้นตอนตัวเองเป็น dependency ได้'));
                  }
                  
                  // ตรวจสอบว่า dependencies ที่เลือกมีอยู่ใน availableSteps
                  if (value && value.length > 0) {
                    const availableStepKeys = availableSteps.map(step => step.stepKey);
                    const invalidDeps = value.filter(dep => !availableStepKeys.includes(dep));
                    
                    if (invalidDeps.length > 0) {
                      return Promise.reject(new Error(`ไม่พบขั้นตอนต่อไปนี้ในระบบ: ${invalidDeps.join(', ')}`));
                    }
                  }
                  
                  return Promise.resolve();
                }
              }
            ]}
          >
            <Select
              mode="multiple"
              placeholder={
                form.getFieldValue('stepOrder') === 1 
                  ? 'ขั้นตอนแรก - ไม่ต้องเลือก' 
                  : availableSteps.length > 0
                    ? 'เลือกขั้นตอนก่อนหน้าที่ต้องทำ (สามารถเลือกได้หลายขั้นตอน)'
                    : 'ไม่มีขั้นตอนก่อนหน้าให้เลือก'
              }
              disabled={form.getFieldValue('stepOrder') === 1 || availableSteps.length === 0}
              loading={loadingSteps}
              optionLabelProp="label"
              filterOption={(input, option) =>
                option?.children?.toLowerCase()?.includes(input.toLowerCase()) ||
                option?.label?.toLowerCase()?.includes(input.toLowerCase())
              }
              style={{ width: '100%' }}
              maxTagCount="responsive"
              tagRender={(props) => {
                const { value, onClose } = props;
                return renderSelectedStep(value, onClose);
              }}
              notFoundContent={
                loadingSteps ? 'กำลังโหลด...' : 
                availableSteps.length === 0 ? 'ไม่มีขั้นตอนก่อนหน้าให้เลือก' : 'ไม่พบข้อมูล'
              }
            >
              {availableSteps.map(step => (
                <Option 
                  key={step.stepKey} 
                  value={step.stepKey}
                  label={`ลำดับ ${step.stepOrder}: ${step.title}`}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <Text strong style={{ color: '#1890ff' }}>
                        ลำดับ {step.stepOrder}:
                      </Text>
                      <Text style={{ marginLeft: 8 }}>
                        {step.title}
                      </Text>
                    </div>
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      {step.stepKey}
                    </Text>
                  </div>
                </Option>
              ))}
            </Select>
          </Form.Item>

          {/* เพิ่มข้อมูลสรุปขั้นตอนที่เลือก */}
          {form.getFieldValue('dependencies') && form.getFieldValue('dependencies').length > 0 && (
            <div style={{ marginTop: 16, padding: 12, backgroundColor: '#f6ffed', border: '1px solid #b7eb8f', borderRadius: 6 }}>
              <Text strong style={{ color: '#52c41a' }}>
                📋 สรุปขั้นตอนที่ต้องทำก่อน:
              </Text>
              <div style={{ marginTop: 8 }}>
                {form.getFieldValue('dependencies').map((depStepKey, index) => {
                  const step = availableSteps.find(s => s.stepKey === depStepKey);
                  return (
                    <div key={depStepKey} style={{ marginBottom: 4 }}>
                      <Text style={{ fontSize: '12px' }}>
                        {index + 1}. <Text strong>ลำดับ {step?.stepOrder}:</Text> {step?.title}
                      </Text>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </Card>

        {/* ปุ่มบันทึก */}
        <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
          <Space>
            <Button onClick={onCancel} disabled={loading}>
              ยกเลิก
            </Button>
            <Button 
              type="primary" 
              htmlType="submit"
              loading={loading}
              icon={<SaveOutlined />}
              disabled={loading}
            >
              {loading ? 'กำลังบันทึก...' : (editingStep ? 'อัปเดต' : 'สร้าง')}
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default StepFormModal;