import React from 'react';
import { Card, Form, Input, Button } from 'antd';

// นำเข้า CSS
import '../styles/ReflectionForm.css';

const { TextArea } = Input;

/**
 * Component แบบฟอร์มบันทึกบทสรุปการฝึกงาน
 * @param {Object} props
 * @param {Function} props.onSave ฟังก์ชันที่ทำงานเมื่อกดบันทึก
 * @param {Object} props.initialData ข้อมูลเริ่มต้น
 * @param {boolean} props.readOnly สถานะแสดงอย่างเดียวไม่สามารถแก้ไขได้
 */
const ReflectionForm = ({ onSave, initialData = {}, readOnly = false }) => {
  const [form] = Form.useForm();

  const handleSubmit = async (values) => {
    if (onSave) {
      await onSave(values);
    }
  };

  return (
    <Card className="reflection-form-card">
      <Form
        form={form}
        layout="vertical"
        initialValues={initialData}
        onFinish={handleSubmit}
        disabled={readOnly}
      >
        <Form.Item
          name="learningOutcome"
          label="สิ่งที่ได้เรียนรู้จากการฝึกงาน"
          rules={[{ required: true, message: 'กรุณากรอกสิ่งที่ได้เรียนรู้จากการฝึกงาน' }]}
        >
          <TextArea
            rows={4}
            placeholder="อธิบายสิ่งที่คุณได้เรียนรู้จากการฝึกงานที่ผ่านมา"
            disabled={readOnly}
          />
        </Form.Item>

        <Form.Item
          name="keyLearnings"
          label="ประสบการณ์และทักษะสำคัญ"
          rules={[{ required: true, message: 'กรุณากรอกประสบการณ์และทักษะสำคัญ' }]}
        >
          <TextArea
            rows={4}
            placeholder="ระบุทักษะและประสบการณ์สำคัญที่ได้รับจากการฝึกงาน"
            disabled={readOnly}
          />
        </Form.Item>

        <Form.Item
          name="futureApplication"
          label="การนำไปใช้ในอนาคต"
          rules={[{ required: true, message: 'กรุณากรอกการนำไปใช้ในอนาคต' }]}
        >
          <TextArea
            rows={4}
            placeholder="อธิบายว่าคุณจะนำความรู้และทักษะที่ได้รับไปประยุกต์ใช้อย่างไรในอนาคต"
            disabled={readOnly}
          />
        </Form.Item>

        <Form.Item
          name="improvements"
          label="สิ่งที่ควรพัฒนา/ปรับปรุง"
        >
          <TextArea
            rows={4}
            placeholder="ระบุสิ่งที่คุณคิดว่าควรปรับปรุงหรือพัฒนาเพิ่มเติม"
            disabled={readOnly}
          />
        </Form.Item>

        {!readOnly && (
          <Form.Item>
            <Button type="primary" htmlType="submit">
              บันทึกบทสรุปการฝึกงาน
            </Button>
          </Form.Item>
        )}
      </Form>
    </Card>
  );
};

export default ReflectionForm;
