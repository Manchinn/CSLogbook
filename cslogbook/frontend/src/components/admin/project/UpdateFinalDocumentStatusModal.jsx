import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Descriptions,
  Form,
  Input,
  Modal,
  Select,
  Space,
  Tag,
  Typography,
  message
} from 'antd';
import { FileSyncOutlined } from '@ant-design/icons';
import documentStatusService, { FINAL_DOCUMENT_STATUS_OPTIONS } from '../../../services/documentStatusService';

const { TextArea } = Input;
const { Text } = Typography;

const UpdateFinalDocumentStatusModal = ({
  visible,
  project,
  onClose,
  onSuccess,
  statusDictionary,
  formatDateTime
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const finalDocument = project?.finalDocument || null;
  const hasDocument = Boolean(finalDocument?.documentId);

  useEffect(() => {
    if (!visible) {
      form.resetFields();
      return;
    }

    form.setFieldsValue({
      status: finalDocument?.status || null,
      comment: ''
    });
  }, [visible, finalDocument, form]);

  const statusMeta = useMemo(() => {
    if (!finalDocument?.status) {
      return null;
    }
    return statusDictionary?.[finalDocument.status] || null;
  }, [finalDocument, statusDictionary]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      if (!project?.projectId && !finalDocument?.documentId) {
        message.error('ไม่พบข้อมูลโครงงานสำหรับอัปเดตสถานะ');
        return;
      }

      setLoading(true);
      if (hasDocument) {
        await documentStatusService.updateStatus(finalDocument.documentId, values);
      } else {
        await documentStatusService.updateProjectFinalStatus(project.projectId, values);
      }
      message.success('อัปเดตสถานะเล่มเอกสารเรียบร้อย');
      form.resetFields();
      onSuccess?.();
    } catch (error) {
      if (error?.errorFields) {
        // validation error ไม่ต้องแจ้งซ้ำ เพราะ antd แสดงในฟอร์มแล้ว
        return;
      }

      if (error?.response?.data?.message) {
        message.error(error.response.data.message);
      } else {
        message.error('เกิดข้อผิดพลาดในการอัปเดตสถานะเล่ม');
      }
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onClose?.();
  };

  const formattedSubmittedAt = finalDocument?.submittedAt && typeof formatDateTime === 'function'
    ? formatDateTime(finalDocument.submittedAt)
    : finalDocument?.submittedAt || '-';

  const formattedReviewDate = finalDocument?.reviewDate && typeof formatDateTime === 'function'
    ? formatDateTime(finalDocument.reviewDate)
    : finalDocument?.reviewDate || '-';

  return (
    <Modal
      title={(
        <Space>
          <FileSyncOutlined />
          <span>อัปเดตสถานะเล่มปริญญานิพนธ์</span>
        </Space>
      )}
      open={visible}
      onOk={handleSubmit}
      onCancel={handleCancel}
      okText="บันทึก"
      okButtonProps={{ loading }}
      cancelText="ยกเลิก"
      confirmLoading={loading}
      destroyOnClose
      width={650}
    >
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        <Alert
          type="info"
          message="คำอธิบาย"
          showIcon
          description={(
            <Space direction="vertical" size={4} style={{ width: '100%' }}>
              <Text>
                • ใช้แบบฟอร์มนี้เมื่อรับเล่มปริญญานิพนธ์แบบออฟไลน์ แล้วต้องการอัปเดตสถานะให้ระบบทราบ
              </Text>
            </Space>
          )}
        />

        <Descriptions column={1} size="small" bordered>
          <Descriptions.Item label="รหัสโครงงาน">#{project?.projectId ?? '-'}</Descriptions.Item>
          <Descriptions.Item label="ชื่อโครงงาน">
            {project?.projectNameTh || project?.projectNameEn || 'ไม่ระบุ'}
          </Descriptions.Item>
          <Descriptions.Item label="สถานะล่าสุด">
            {finalDocument?.status ? (
              <Tag color={statusMeta?.color || 'default'}>
                {statusMeta?.text || finalDocument.status}
              </Tag>
            ) : (
              <Tag color="default">ยังไม่มีสถานะ</Tag>
            )}
          </Descriptions.Item>
          <Descriptions.Item label="เวลาที่บันทึกส่งเล่ม">
            {finalDocument ? formattedSubmittedAt : '-'}
          </Descriptions.Item>
          <Descriptions.Item label="เวลาที่เจ้าหน้าที่ตรวจล่าสุด">
            {finalDocument ? formattedReviewDate : '-'}
          </Descriptions.Item>
          <Descriptions.Item label="เจ้าหน้าที่ผู้ตรวจ">
            {finalDocument?.reviewer
              ? `${finalDocument.reviewer.firstName || ''} ${finalDocument.reviewer.lastName || ''}`.trim() || '-'
              : '-'}
          </Descriptions.Item>
        </Descriptions>
        {!hasDocument && (
          <Alert
            type="info"
            showIcon
            message="สร้างรายการเล่มแบบออฟไลน์"
            description="ระบบจะบันทึกข้อมูลเล่มออฟไลน์ให้อัตโนมัติเมื่อกดบันทึกสถานะ"
          />
        )}
        <Form
          layout="vertical"
          form={form}
          disabled={loading}
        >
          <Form.Item
            label="สถานะเล่มที่ต้องการตั้ง"
            name="status"
            rules={[{ required: true, message: 'กรุณาเลือกสถานะใหม่ของเล่ม' }]}
          >
            <Select
              placeholder="เลือกสถานะ"
              options={FINAL_DOCUMENT_STATUS_OPTIONS}
              allowClear
            />
          </Form.Item>

          <Form.Item
            label="บันทึกเพิ่มเติม (ถ้ามี)"
            name="comment"
          >
            <TextArea rows={4} maxLength={500} showCount placeholder="ระบุหมายเหตุ หรือข้อความถึงนักศึกษา/อาจารย์" />
          </Form.Item>
        </Form>
      </Space>
    </Modal>
  );
};

export default UpdateFinalDocumentStatusModal;
