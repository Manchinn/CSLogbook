import React from 'react';
import { Modal, Form, Input, TimePicker, Row, Col, InputNumber } from 'antd';

const EditModal = ({ visible, loading, entry, form, onOk, onCancel }) => {
  return (
    <Modal
      title="แก้ไขข้อมูลการฝึกงาน"
      open={visible}
      onOk={onOk}
      onCancel={onCancel}
      confirmLoading={loading}
    >
      <Form form={form} layout="vertical">
        {/* Form items here */}
      </Form>
    </Modal>
  );
};

export default EditModal;