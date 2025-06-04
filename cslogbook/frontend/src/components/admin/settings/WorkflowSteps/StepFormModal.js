import React, { useEffect, useState } from 'react';
import {
  Modal, Form, Input, InputNumber, Switch, Select, Space, Button,
  Row, Col, Alert, Typography, Divider, Tooltip, Card
} from 'antd';
import { SaveOutlined, InfoCircleOutlined } from '@ant-design/icons';
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

  // ตัวเลือกประเภท workflow
  const workflowTypes = [
    { value: 'internship', label: 'การฝึกงาน' },
    { value: 'project', label: 'โครงงานพิเศษ' }
  ];

  // รีเซ็ตฟอร์มเมื่อเปิด/ปิด modal
  useEffect(() => {
    if (visible) {
      if (editingStep) {
        // แก้ไขขั้นตอนที่มีอยู่
        form.setFieldsValue({
          workflowType: editingStep.workflowType,
          stepKey: editingStep.stepKey,
          stepOrder: editingStep.stepOrder,
          title: editingStep.title,
          descriptionTemplate: editingStep.descriptionTemplate,
          isRequired: editingStep.isRequired,
          dependencies: editingStep.dependencies ? JSON.stringify(editingStep.dependencies, null, 2) : ''
        });
      } else {
        // สร้างขั้นตอนใหม่
        form.resetFields();
        form.setFieldsValue({
          workflowType: selectedWorkflowType,
          isRequired: true,
          stepOrder: 1
        });
      }
      setValidationErrors({});
    } else {
      form.resetFields();
      setValidationErrors({});
    }
  }, [visible, editingStep, selectedWorkflowType, form]);

  /**
   * ฟังก์ชันบันทึกข้อมูล
   */
  const handleSubmit = async (values) => {
    try {
      setLoading(true);
      setValidationErrors({});

      // เตรียมข้อมูลก่อนส่ง
      const stepData = {
        ...values,
        // แปลง dependencies จาก string เป็น array ถ้ามี
        dependencies: values.dependencies ? 
          JSON.parse(values.dependencies) : 
          null
      };

      // ตรวจสอบความถูกต้องของข้อมูล
      const validation = workflowStepService.validateStepData(stepData);
      if (!validation.isValid) {
        setValidationErrors(validation.errors);
        return;
      }

      // ส่งข้อมูลไปยัง API
      if (editingStep) {
        await workflowStepService.updateStep(editingStep.stepId, stepData);
      } else {
        await workflowStepService.createStep(stepData);
      }

      // เรียก callback เมื่อสำเร็จ
      onSuccess();
    } catch (error) {
      console.error('Error saving step:', error);
      // แสดง error ในรูปแบบ validation หากเป็น field-specific error
      if (error.message.includes('stepKey')) {
        setValidationErrors({ stepKey: error.message });
      } else if (error.message.includes('stepOrder')) {
        setValidationErrors({ stepOrder: error.message });
      } else {
        setValidationErrors({ general: error.message });
      }
    } finally {
      setLoading(false);
    }
  };

  /**
   * ฟังก์ชันสร้าง stepKey อัตโนมัติจากชื่อขั้นตอน
   */
  const generateStepKey = (title, workflowType) => {
    if (!title) return '';
    
    const prefix = workflowType === 'internship' ? 'INTERNSHIP_' : 'PROJECT_';
    const suffix = title
      .replace(/[^ก-๙a-zA-Z0-9\s]/g, '') // เอาตัวอักษรพิเศษออก
      .replace(/\s+/g, '_') // แทนที่ space ด้วย underscore
      .toUpperCase();
    
    return prefix + suffix;
  };

  /**
   * ฟังก์ชันจัดการการเปลี่ยนแปลงของชื่อขั้นตอน
   */
  const handleTitleChange = (e) => {
    const title = e.target.value;
    const workflowType = form.getFieldValue('workflowType');
    
    // สร้าง stepKey อัตโนมัติเฉพาะเมื่อสร้างใหม่
    if (!editingStep && title && workflowType) {
      const generatedKey = generateStepKey(title, workflowType);
      form.setFieldValue('stepKey', generatedKey);
    }
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
      style={{ top: 30 }}
      width={1000}
      destroyOnHidden={true}
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
        preserve={false} // ป้องกันการเก็บค่าในฟอร์มเมื่อปิด modal
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
                <Select disabled={!!editingStep} placeholder="เลือกประเภท workflow">
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
                  { required: true, message: 'กรุณากรอกลำดับขั้นตอน' },
                  { type: 'number', min: 1, message: 'ลำดับขั้นตอนต้องมากกว่า 0' }
                ]}
                validateStatus={validationErrors.stepOrder ? 'error' : ''}
                help={validationErrors.stepOrder}
              >
                <InputNumber 
                  min={1} 
                  style={{ width: '100%' }} 
                  placeholder="ลำดับขั้นตอน (เช่น 1, 2, 3)"
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
            help={validationErrors.stepKey || 'ตัวอย่าง: INTERNSHIP_CS05_SUBMITTED'}
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
              placeholder="เช่น ยื่นคำร้องฝึกงาน (คพ.05)"
              onChange={handleTitleChange}
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
            help={validationErrors.descriptionTemplate || 'คำอธิบายที่จะแสดงในระบบ สามารถใช้ตัวแปรได้ เช่น [สถานะ], [วันที่]'}
          >
            <TextArea 
              rows={3} 
              placeholder="คำอธิบายที่จะแสดงในระบบ สามารถใช้ตัวแปรได้ เช่น [สถานะ], [วันที่]"
            />
          </Form.Item>
        </Card>

        {/* ขั้นตอนที่ต้องทำก่อน */}
        <Card size="small" title="ขั้นตอนที่ต้องทำก่อน (Dependencies)" style={{ marginBottom: 16 }}>
          <Form.Item
            name="dependencies"
            label={
              <Space>
                Dependencies (JSON Format)
                <Tooltip title='รายการขั้นตอนที่ต้องทำให้เสร็จก่อน ในรูปแบบ JSON Array เช่น ["STEP_1", "STEP_2"]'>
                  <InfoCircleOutlined />
                </Tooltip>
              </Space>
            }
            validateStatus={validationErrors.dependencies ? 'error' : ''}
            help={validationErrors.dependencies || 'ตัวอย่าง: ["INTERNSHIP_ELIGIBILITY_CHECK", "INTERNSHIP_CS05_SUBMITTED"] หรือเว้นว่างถ้าไม่มี'}
          >
            <TextArea 
              rows={3} 
              placeholder='["STEP_KEY_1", "STEP_KEY_2"] หรือเว้นว่างถ้าไม่มี'
            />
          </Form.Item>
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
            >
              {editingStep ? 'อัปเดต' : 'สร้าง'}
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default StepFormModal;