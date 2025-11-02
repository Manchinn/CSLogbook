import React, { useState } from 'react';
import { Modal, Form, Input, Select, message } from 'antd';
import { studentService } from '../../services/studentService';

const { Option } = Select;

const CLASSROOM_OPTIONS = ['RA', 'RB', 'RC', 'DA', 'DB', 'CSB'];

const ContactInfoEditModal = ({ visible, onCancel, student, onSuccess }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      // ใช้ studentCode แทน studentId เพราะ API route ใช้ studentCode
      const response = await studentService.updateContactInfo(student.studentCode, {
        phoneNumber: values.phoneNumber,
        classroom: values.classroom
      });

      if (response.success) {
        message.success('อัปเดตข้อมูลติดต่อสำเร็จ');
        form.resetFields();
        onSuccess();
        onCancel();
      }
    } catch (error) {
      if (error.errorFields) {
        // Validation error
        return;
      }
      console.error('Error updating contact info:', error);
      message.error('ไม่สามารถอัปเดตข้อมูลติดต่อได้: ' + (error.message || 'กรุณาลองใหม่อีกครั้ง'));
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onCancel();
  };

  // Set initial values when modal opens
  React.useEffect(() => {
    if (visible && student) {
      form.setFieldsValue({
        phoneNumber: student.phoneNumber || '',
        classroom: student.classroom || undefined
      });
    }
  }, [visible, student, form]);

  return (
    <Modal
      title="แก้ไขข้อมูลติดต่อ"
      open={visible}
      onOk={handleSubmit}
      onCancel={handleCancel}
      confirmLoading={loading}
      okText="บันทึก"
      cancelText="ยกเลิก"
      destroyOnHidden
    >
      <Form
        form={form}
        layout="vertical"
        preserve={false}
      >
        <Form.Item
          label="เบอร์โทรศัพท์"
          name="phoneNumber"
          rules={[
            {
              pattern: /^[0-9]{10}$/,
              message: 'กรุณากรอกเบอร์โทรศัพท์ให้ถูกต้อง (10 หลัก)'
            }
          ]}
        >
          <Input
            placeholder="กรอกเบอร์โทรศัพท์ (เช่น 0812345678)"
            maxLength={10}
            allowClear
          />
        </Form.Item>

        <Form.Item
          label="ห้องเรียน"
          name="classroom"
        >
          <Select
            placeholder="เลือกห้องเรียน"
            allowClear
          >
            {CLASSROOM_OPTIONS.map(classroom => (
              <Option key={classroom} value={classroom}>
                {classroom}
              </Option>
            ))}
          </Select>
        </Form.Item>

        <div style={{ marginTop: 16, padding: 12, backgroundColor: '#f0f0f0', borderRadius: 4 }}>
          <p style={{ margin: 0, fontSize: 12, color: '#666' }}>
            <strong>หมายเหตุ:</strong> ไม่สามารถแก้ไขอีเมลได้ หากต้องการเปลี่ยนแปลงกรุณาติดต่อเจ้าหน้าที่
          </p>
        </div>
      </Form>
    </Modal>
  );
};

export default ContactInfoEditModal;
