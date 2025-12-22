// StudentEditForm.js
import React from 'react';
import { Card, Form, InputNumber, Button, Row, Col, Modal, Space, Alert, Statistic } from 'antd';
import { BookOutlined, ProjectOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { Typography } from 'antd';
const { Text } = Typography;

const StudentEditForm = ({ form, onFinish, onCancel, initialValues, eligibilityCriteria }) => {
  // ใช้ค่าจาก props แทนการ fetch
  // เกณฑ์ต่างๆ ถูกจัดการจากภายนอกฟอร์มนี้แล้ว จึงไม่ต้องเก็บ state ซ้ำ

  // calculateEligibility ไม่ได้ใช้ในฟอร์มนี้แล้ว จึงถูกลบเพื่อลด warning

  const handleSubmit = (values) => {
    const totalCredits = parseInt(values.totalCredits);
    const majorCredits = parseInt(values.majorCredits);

    Modal.confirm({
      title: (
      <div style={{ textAlign: 'center', borderBottom: '2px solid #1890ff', paddingBottom: '10px' }}>
        <Text strong style={{ fontSize: '20px' }}>
        การยืนยันความถูกต้องของข้อมูลหน่วยกิต
        </Text>
      </div>
      ),
      okText: 'ยืนยันการบันทึก',
      cancelText: 'ยกเลิก',
      width: 700,
      className: 'confirmation-modal',
      icon: null,
      // The style prop has been removed.
      // The styles prop is now correctly structured to target the modal's body.
      styles: { 
      body: { 
        maxHeight: 'calc(100vh - 110px)', 
        overflowY: 'auto' 
      }
      },
      content: (
      <Space direction="vertical" style={{ width: '100%', padding: '10px 0' }}>
        <Card
        style={{
          marginBottom: 10,
          backgroundColor: '#fafafa',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}
        >
        <div style={{
          textAlign: 'center',
          marginBottom: 20,
          backgroundColor: '#e6f7ff',
          padding: '12px',
          borderRadius: '4px'
        }}>
          <Text strong style={{ fontSize: 18, color: '#1890ff' }}>
          ข้อมูลที่ต้องการบันทึก
          </Text>
        </div>
        <Row gutter={[24, 24]} justify="space-around">
          <Col span={11}>
          <Statistic
            title={<Text strong>หน่วยกิตรวมสะสม</Text>}
            value={totalCredits}
            suffix="หน่วยกิต"
            valueStyle={{ color: '#1890ff', fontSize: '24px' }}
            prefix={<BookOutlined style={{ fontSize: '24px' }} />}
          />
          </Col>
          <Col span={11}>
          <Statistic
            title={<Text strong>หน่วยกิตภาควิชา</Text>}
            value={majorCredits}
            suffix="หน่วยกิต"
            valueStyle={{ color: '#1890ff', fontSize: '24px' }}
            prefix={<ProjectOutlined style={{ fontSize: '24px' }} />}
          />
          </Col>
        </Row>
        </Card>

        <div style={{
        padding: '15px',
        backgroundColor: '#f0f5ff',
        border: '1px solid #1890ff',
        borderRadius: '8px',
        marginBottom: 10
        }}>
        <Text strong>
          การยืนยันความถูกต้องของข้อมูล:
        </Text>
        <Text style={{ display: 'block', marginTop: '10px' }}>
          ข้าพเจ้าได้ตรวจสอบข้อมูลจากระบบ Reg KMUTNB แล้ว และขอรับรองว่าข้อมูลถูกต้องตรงตามความเป็นจริง
          หากข้อมูลไม่ถูกต้องจะส่งผลต่อการประเมินสิทธิ์การฝึกงานและโครงงานพิเศษ
        </Text>
        </div>

        <Alert
        message={<Text strong style={{ color: '#d4380d' }}>ข้อควรระวัง</Text>}
        description={
          <ul style={{ paddingLeft: '20px', margin: '10px 0' }}>
          <li>การให้ข้อมูลอันเป็นเท็จอาจมีผลต่อสิทธิ์การลงทะเบียนของท่าน</li>
          <li>กรุณาตรวจสอบความถูกต้องของข้อมูลก่อนการยืนยัน</li>
          </ul>
        }
        type="error"
        showIcon
        style={{
          marginBottom: 10,
          border: '1px solid #ff4d4f',
          borderRadius: '8px'
        }}
        />

        <div style={{
        padding: '10px',
        backgroundColor: '#f5f5f5',
        borderRadius: '8px',
        textAlign: 'center',
        border: '1px solid #d9d9d9'
        }}>
        <Space>
          <ClockCircleOutlined style={{ color: '#1890ff' }} />
          <Text type="secondary">
          บันทึกการยืนยัน: {new Date().toLocaleString('th-TH', {
            timeZone: 'Asia/Bangkok',
            dateStyle: 'full',
            timeStyle: 'medium'
          })}
          </Text>
        </Space>
        </div>
      </Space>
      ),
      onOk: () => {
      onFinish(values);
      },
      centered: true, // This prop handles centering the modal
      maskClosable: false
    });
  };

  return (
    <Card style={{ marginTop: 24 }}>
      <Form
        form={form}
        onFinish={handleSubmit}
        layout="vertical"
        initialValues={initialValues || {
          totalCredits: 0,
          majorCredits: 0
        }}
      >
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="totalCredits"
              label="หน่วยกิตรวมสะสม"
              validateTrigger={['onBlur']}
              rules={[
                { required: true, message: "กรุณากรอกหน่วยกิตรวม" },
                {
                  validator: async (_, value) => {
                    const numValue = parseInt(value);
                    if (isNaN(numValue) || numValue < 0 || numValue > 142) {
                      throw new Error("หน่วยกิตไม่ถูกต้อง");
                    }
                  },
                },
              ]}
            >
              <InputNumber min={0} max={142} style={{ width: "100%" }} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="majorCredits"
              label="หน่วยกิตภาควิชา"
              dependencies={["totalCredits"]}
              validateTrigger={['onBlur']}
              rules={[
                { required: true, message: "กรุณากรอกหน่วยกิตภาควิชา" },
                {
                  validator: async (_, value) => {
                    const numValue = parseInt(value);
                    const totalCredits = parseInt(form.getFieldValue("totalCredits"));
                    if (isNaN(numValue) || numValue < 0) {
                      throw new Error("หน่วยกิตภาควิชาไม่ถูกต้อง");
                    }
                    if (!isNaN(totalCredits) && numValue > totalCredits) {
                      throw new Error("หน่วยกิตภาควิชาต้องไม่มากกว่าหน่วยกิตรวม");
                    }
                  },
                },
              ]}
            >
              <InputNumber
                min={0}
                style={{ width: "100%" }}
              />
            </Form.Item>
          </Col>
        </Row>
        <Form.Item>
          <Button type="primary" htmlType="submit">
            บันทึก
          </Button>
          <Button onClick={onCancel} style={{ marginLeft: 8 }}>
            ยกเลิก
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default StudentEditForm;