import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, Button, Space, Alert, Typography, Steps } from 'antd';
import { MailOutlined, KeyOutlined, CheckCircleTwoTone } from '@ant-design/icons';
import passwordService from 'features/auth/services/passwordService';
import { useAuth } from 'contexts/AuthContext';

// Updated policy: ต้องมี a-z, A-Z, ตัวเลข ความยาว ≥ 8 (ไม่บังคับอักขระพิเศษ)
const PASSWORD_POLICY_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,64}$/;

// Modal เปลี่ยนรหัสผ่าน (Two-step: current+new -> OTP confirm)
const PasswordChangeModal = ({ open, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(0); // 0=init,1=otp,2=done
  const [otpCooldown, setOtpCooldown] = useState(0);
  const [messageInfo, setMessageInfo] = useState(null); // {type,text}
  const [formInit] = Form.useForm();
  const [formOtp] = Form.useForm();
  const { logout } = useAuth();

  useEffect(() => {
    let timer;
  if (otpCooldown > 0) timer = setTimeout(() => setOtpCooldown(c => c - 1), 1000);
    return () => timer && clearTimeout(timer);
  }, [otpCooldown]);

  useEffect(() => {
    if (!open) {
      setStep(0);
      setOtpCooldown(0);
      setMessageInfo(null);
      formInit.resetFields();
      formOtp.resetFields();
    }
  }, [open, formInit, formOtp]);

  const handleInitSubmit = async (values) => {
    if (values.newPassword !== values.confirmNewPassword) {
      setMessageInfo({ type: 'error', text: 'รหัสผ่านใหม่และยืนยันไม่ตรงกัน' });
      return;
    }
    if (!PASSWORD_POLICY_REGEX.test(values.newPassword)) {
      setMessageInfo({ type: 'error', text: 'รหัสผ่านใหม่ไม่เป็นไปตามนโยบาย' });
      return;
    }
    setLoading(true);
    setMessageInfo(null);
    try {
      const res = await passwordService.initChange({ currentPassword: values.currentPassword, newPassword: values.newPassword });
      if (res.success) {
        setMessageInfo({ type: 'success', text: res.message || 'ส่ง OTP แล้ว' });
        setStep(1);
        setOtpCooldown(60);
      } else {
        setMessageInfo({ type: 'error', text: res.message || 'ไม่สำเร็จ' });
      }
    } catch (e) {
      setMessageInfo({ type: 'error', text: e.response?.data?.message || 'เกิดข้อผิดพลาด' });
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (values) => {
    setLoading(true);
    setMessageInfo(null);
    try {
      const res = await passwordService.confirmChange({ otp: values.otp });
      if (res.success) {
        setMessageInfo({ type: 'success', text: res.message || 'เปลี่ยนรหัสผ่านสำเร็จ' });
        setStep(2);
        if (res.forceLogout) {
          setTimeout(() => logout(), 2500); // รอให้ผู้ใช้เห็นข้อความก่อน logout
        }
      } else {
        setMessageInfo({ type: 'error', text: res.message || 'ไม่สำเร็จ' });
      }
    } catch (e) {
      setMessageInfo({ type: 'error', text: e.response?.data?.message || 'เกิดข้อผิดพลาด' });
    } finally {
      setLoading(false);
    }
  };
  const content = (
    <>
      <Steps current={step} size="small" style={{ marginBottom: 16 }} items={[
        { title: 'ตั้งรหัส', icon: <KeyOutlined /> },
        { title: 'ยืนยัน OTP', icon: <MailOutlined /> },
        { title: 'สำเร็จ', icon: <CheckCircleTwoTone twoToneColor="#52c41a" /> }
      ]} />
      {step === 0 && (
        <Form layout="vertical" form={formInit} onFinish={handleInitSubmit}>
          <Form.Item label="รหัสผ่านปัจจุบัน" name="currentPassword" rules={[{ required: true, message: 'กรอกรหัสผ่านปัจจุบัน' }]}>
            <Input.Password autoComplete="current-password" />
          </Form.Item>
          <Form.Item label="รหัสผ่านใหม่" name="newPassword" rules={[{ required: true, message: 'กรอกรหัสผ่านใหม่' }]}>
            <Input.Password autoComplete="new-password" />
          </Form.Item>
          <Form.Item label="ยืนยันรหัสผ่านใหม่" name="confirmNewPassword" rules={[{ required: true, message: 'ยืนยันรหัสผ่านใหม่' }]}>
            <Input.Password autoComplete="new-password" />
          </Form.Item>
          <Typography.Paragraph type="secondary" style={{ marginTop: -4 }}>
            ต้องมี a-z, A-Z, ตัวเลข และยาว ≥ 8
          </Typography.Paragraph>
          <Button type="primary" htmlType="submit" loading={loading} block icon={<MailOutlined />}>ขอรหัส OTP</Button>
        </Form>
      )}
      {step === 1 && (
        <Form layout="vertical" form={formOtp} onFinish={handleOtpSubmit}>
          <Form.Item label="รหัส OTP" name="otp" rules={[{ required: true, message: 'กรอกรหัส OTP' }, { len: 6, message: 'OTP ต้องมี 6 หลัก' }]}>
            <Input placeholder="เช่น 123456" maxLength={6} />
          </Form.Item>
          <Space style={{ width: '100%', justifyContent: 'space-between', marginBottom: 8 }}>
            <Typography.Text type="secondary">OTP จะหมดอายุใน ~{otpCooldown}s</Typography.Text>
            <Button disabled={otpCooldown > 0} onClick={() => setOtpCooldown(60)} size="small">{otpCooldown > 0 ? 'ขอใหม่' : 'ขอใหม่'}</Button>
          </Space>
          <Button type="primary" htmlType="submit" loading={loading} block>ยืนยัน OTP และเปลี่ยนรหัสผ่าน</Button>
        </Form>
      )}
      {step === 2 && (
        <Space direction="vertical" style={{ width: '100%', textAlign: 'center' }}>
          <Typography.Title level={5} style={{ textAlign: 'center' }}>สำเร็จ</Typography.Title>
          <Typography.Paragraph style={{ textAlign: 'center' }}>รหัสผ่านถูกเปลี่ยนแล้ว ระบบจะออกจากบัญชีและให้เข้าสู่ระบบใหม่</Typography.Paragraph>
          <Button type="primary" onClick={logout}>ออกจากระบบทันที</Button>
        </Space>
      )}
    </>
  );

  return (
  <Modal open={open} onCancel={onClose} title="เปลี่ยนรหัสผ่าน (Two-Step)" footer={null} destroyOnClose>
      {messageInfo && <Alert style={{ marginBottom: 12 }} type={messageInfo.type} message={messageInfo.text} showIcon />}
      {content}
    </Modal>
  );
};

export default PasswordChangeModal;
