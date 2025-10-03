import React, { useState } from 'react';
import {
  Modal,
  Form,
  Radio,
  Input,
  Checkbox,
  message,
  Divider,
  Descriptions,
  Tag,
  Space,
  Alert
} from 'antd';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  UserOutlined,
  FileTextOutlined
} from '@ant-design/icons';
import projectExamResultService from '../../../services/projectExamResultService';

const { TextArea } = Input;

/**
 * Modal สำหรับบันทึกผลสอบโครงงานพิเศษ
 */
const RecordExamResultModal = ({ visible, project, onClose, onSuccess }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  /**
   * Handle form submit
   */
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      const examData = {
        examType: 'PROJECT1',
        result: values.result,
        notes: values.notes || null,
        score: values.score || null,
        requireScopeRevision: values.result === 'PASS' ? values.requireScopeRevision || false : false
      };

      await projectExamResultService.recordExamResult(project.projectId, examData);
      
      message.success('บันทึกผลสอบสำเร็จ');
      form.resetFields();
      onSuccess();
    } catch (error) {
      if (error.response?.data?.message) {
        message.error(error.response.data.message);
      } else {
        message.error('เกิดข้อผิดพลาดในการบันทึกผลสอบ');
      }
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle modal close
   */
  const handleCancel = () => {
    form.resetFields();
    setResult(null);
    onClose();
  };

  return (
    <Modal
      title={
        <Space>
          <FileTextOutlined />
          บันทึกผลสอบโครงงานพิเศษ 1
        </Space>
      }
      open={visible}
      onOk={handleSubmit}
      onCancel={handleCancel}
      okText="บันทึกผล"
      cancelText="ยกเลิก"
      confirmLoading={loading}
      width={700}
      destroyOnClose
    >
      {/* ข้อมูลโครงงาน */}
      <Alert
        message="ข้อมูลโครงงาน"
        description={
          <Descriptions column={1} size="small">
            <Descriptions.Item label="รหัสโครงงาน">
              <Tag color="blue">#{project.projectId}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="ชื่อโครงงาน">
              {project.projectNameTh || 'ไม่ระบุ'}
            </Descriptions.Item>
            <Descriptions.Item label="นักศึกษา">
              {project.members && project.members.length > 0 ? (
                <Space direction="vertical" size="small">
                  {project.members.map((member, idx) => (
                    <div key={idx}>
                      <UserOutlined style={{ marginRight: 4 }} />
                      {member.student?.user?.firstName} {member.student?.user?.lastName}
                      {member.role === 'LEADER' && (
                        <Tag color="blue" style={{ marginLeft: 8 }}>
                          หัวหน้า
                        </Tag>
                      )}
                    </div>
                  ))}
                </Space>
              ) : (
                'ไม่มีข้อมูล'
              )}
            </Descriptions.Item>
            <Descriptions.Item label="อาจารย์ที่ปรึกษา">
              {project.advisor?.user
                ? `${project.advisor.user.firstName} ${project.advisor.user.lastName}`
                : 'ไม่ระบุ'}
            </Descriptions.Item>
          </Descriptions>
        }
        type="info"
        showIcon
        style={{ marginBottom: 24 }}
      />

      <Divider />

      {/* ฟอร์มบันทึกผล */}
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          result: null,
          requireScopeRevision: false
        }}
      >
        <Form.Item
          name="result"
          label="ผลการสอบ"
          rules={[{ required: true, message: 'กรุณาเลือกผลการสอบ' }]}
        >
          <Radio.Group onChange={(e) => setResult(e.target.value)} size="large">
            <Space direction="vertical">
              <Radio value="PASS">
                <Space>
                  <CheckCircleOutlined style={{ color: '#52c41a' }} />
                  <span style={{ fontWeight: 'bold' }}>ผ่าน</span>
                </Space>
              </Radio>
              <Radio value="FAIL">
                <Space>
                  <CloseCircleOutlined style={{ color: '#ff4d4f' }} />
                  <span style={{ fontWeight: 'bold' }}>ไม่ผ่าน</span>
                </Space>
              </Radio>
            </Space>
          </Radio.Group>
        </Form.Item>

        {/* แสดงเฉพาะเมื่อเลือก "ผ่าน" */}
        {result === 'PASS' && (
          <Form.Item name="requireScopeRevision" valuePropName="checked">
            <Checkbox>
              <strong>ต้องแก้ไข Scope</strong> (นักศึกษาจะต้องส่งเอกสารปรับปรุง Scope ก่อนดำเนินการต่อ)
            </Checkbox>
          </Form.Item>
        )}

        <Form.Item
          name="score"
          label="คะแนน (ถ้ามี)"
        >
          <Input
            type="number"
            min={0}
            max={100}
            step={0.01}
            placeholder="ระบุคะแนน เช่น 85.50"
            style={{ width: 200 }}
          />
        </Form.Item>

        <Form.Item
          name="notes"
          label="หมายเหตุ / ข้อเสนอแนะจากคณะกรรมการ"
        >
          <TextArea
            rows={4}
            placeholder="ระบุหมายเหตุหรือข้อเสนอแนะ (ถ้ามี)"
            maxLength={1000}
            showCount
          />
        </Form.Item>
      </Form>

      {result && (
        <Alert
          message={
            result === 'PASS'
              ? '✅ เมื่อบันทึกผลแล้ว นักศึกษาจะสามารถเข้าสู่ Phase 2 (ปริญญานิพนธ์) ได้'
              : '❌ เมื่อบันทึกผลแล้ว นักศึกษาจะต้องรับทราบผล จากนั้นโครงงานจะถูก archive'
          }
          type={result === 'PASS' ? 'success' : 'warning'}
          showIcon
          style={{ marginTop: 16 }}
        />
      )}
    </Modal>
  );
};

export default RecordExamResultModal;
