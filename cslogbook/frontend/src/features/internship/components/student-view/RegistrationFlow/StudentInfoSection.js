import React from 'react';
import { 
  Card, Form, Input, Select, Row, Col, Alert, Space
} from 'antd';
import { UserOutlined, PhoneOutlined } from '@ant-design/icons';

const { Option } = Select;

// ตัวเลือกห้องเรียน
const roomOptions = [
  { value: 'RA', label: 'RA - Regular A' },
  { value: 'RB', label: 'RB - Regular B' },
  { value: 'RC', label: 'RC - Regular C' },
  { value: 'DA', label: 'DA - Double A' },
  { value: 'DB', label: 'DB - Double B' },
  { value: 'CSB', label: 'CSB - Computer Science B' }
];

const StudentInfoSection = ({ 
  studentNumber, 
  isMainStudent = false, 
  title,
  studentData = null,
  form = null
}) => (
  <Card 
    title={
      <Space>
        <UserOutlined />
        {title}
      </Space>
    }
    size="small"
    style={{ marginBottom: 16 }}
  >
    {isMainStudent ? (
      // แสดงข้อมูลนักศึกษาหลักจากระบบ (ไม่สามารถแก้ไขได้)
      <Alert
        message="ข้อมูลนักศึกษาจากระบบ"
        description={
          <Row gutter={16}>
            <Col span={12}>
              <p><strong>ชื่อ-นามสกุล:</strong> {studentData?.fullName || '-'}</p>
              <p><strong>รหัสนักศึกษา:</strong> {studentData?.studentId || '-'}</p>
              <p><strong>ชั้นปี:</strong> {studentData?.year || '-'}</p>
            </Col>
            <Col span={12}>
              <p><strong>คณะ:</strong> {studentData?.faculty || '-'}</p>
              <p><strong>สาขา:</strong> {studentData?.major || '-'}</p>
              <p><strong>หน่วยกิตสะสม:</strong> {studentData?.totalCredits || 0} หน่วยกิต</p>
            </Col>
          </Row>
        }
        type="info"
        showIcon
      />
    ) : (
      // ฟอร์มสำหรับนักศึกษาคนที่ 2
      <Row gutter={16}>
        <Col xs={24} md={12}>
          <Form.Item
            name={`student${studentNumber}Name`}
            label="ชื่อ-นามสกุล"
            rules={[{ required: true, message: 'กรุณากรอกชื่อ-นามสกุล' }]}
          >
            <Input 
              placeholder="ชื่อ-นามสกุลนักศึกษา"
              prefix={<UserOutlined />}
            />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item
            name={`student${studentNumber}Id`}
            label="รหัสนักศึกษา"
            rules={[
              { required: true, message: 'กรุณากรอกรหัสนักศึกษา' },
              { 
                pattern: /^\d{8}$/, 
                message: 'รหัสนักศึกษาต้องเป็นตัวเลข 8 หลัก' 
              }
            ]}
          >
            <Input 
              placeholder="เช่น 65160124"
              maxLength={8}
            />
          </Form.Item>
        </Col>
        
        <Col xs={24} md={8}>
          <Form.Item
            name={`student${studentNumber}Year`}
            label="ชั้นปี"
            rules={[{ required: true, message: 'กรุณาเลือกชั้นปี' }]}
          >
            <Select placeholder="เลือกชั้นปี">
              <Option value="1">ปี 1</Option>
              <Option value="2">ปี 2</Option>
              <Option value="3">ปี 3</Option>
              <Option value="4">ปี 4</Option>
            </Select>
          </Form.Item>
        </Col>
        
        <Col xs={24} md={8}>
          <Form.Item
            name={`student${studentNumber}Room`}
            label="ห้อง"
            rules={[{ required: true, message: 'กรุณาเลือกห้อง' }]}
          >
            <Select placeholder="เลือกห้อง">
              {roomOptions.map(room => (
                <Option key={room.value} value={room.value}>
                  {room.label}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Col>
        
        <Col xs={24} md={8}>
          <Form.Item
            name={`student${studentNumber}Phone`}
            label="เบอร์โทรศัพท์"
            rules={[
              { required: true, message: 'กรุณากรอกเบอร์โทรศัพท์' },
              { 
                pattern: /^0\d{9}$/, 
                message: 'รูปแบบเบอร์โทรไม่ถูกต้อง (เช่น 0812345678)' 
              }
            ]}
          >
            <Input 
              placeholder="เช่น 0812345678"
              prefix={<PhoneOutlined />}
              maxLength={10}
            />
          </Form.Item>
        </Col>
        
        <Col xs={24}>
          <Form.Item
            name={`student${studentNumber}Credits`}
            label="หน่วยกิตสะสมทั้งหมด"
            rules={[
              { required: true, message: 'กรุณากรอกหน่วยกิตสะสม' },
              { 
                type: 'number', 
                min: 0, 
                max: 200, 
                message: 'หน่วยกิตต้องอยู่ระหว่าง 0-200' 
              }
            ]}
          >
            <Input 
              type="number"
              placeholder="เช่น 120"
              suffix="หน่วยกิต"
              min={0}
              max={200}
            />
          </Form.Item>
        </Col>
      </Row>
    )}
  </Card>
);

export default StudentInfoSection;