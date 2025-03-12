import React from 'react';
import { Card, Typography, Table, Tag, Space, Button } from 'antd';
import InternshipSteps from '../shared/InternshipSteps';
import './InternshipStyles.css';

const { Title, Text } = Typography;

const InternshipSummary = () => {
  // ตัวอย่างข้อมูล (ควรดึงจาก API จริง)
  const summaryData = {
    totalDays: 45,
    totalHours: 270,
    company: {
      name: "บริษัท ตัวอย่าง จำกัด",
      supervisor: "คุณ สมชาย ใจดี"
    }
  };

  const logbookColumns = [
    {
      title: 'วันที่',
      dataIndex: 'date',
      key: 'date',
    },
    {
      title: 'เวลาเข้างาน',
      dataIndex: 'timeIn',
      key: 'timeIn',
    },
    {
      title: 'เวลาออกงาน',
      dataIndex: 'timeOut',
      key: 'timeOut',
    },
    {
      title: 'จำนวนชั่วโมง',
      dataIndex: 'hours',
      key: 'hours',
    },
    {
      title: 'สถานะ',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={status === 'approved' ? 'green' : 'gold'}>
          {status === 'approved' ? 'อนุมัติแล้ว' : 'รอการอนุมัติ'}
        </Tag>
      ),
    }
  ];

  return (
    <div className="internship-container">
      <InternshipSteps />
      <div className="internship-card">
        <Title level={3}>สรุปผลการฝึกงาน</Title>

        {/* ข้อมูลสรุป */}
        <Card className="summary-section">
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <div>
              <Text strong>บริษัท:</Text> {summaryData.company.name}
            </div>
            <div>
              <Text strong>พี่เลี้ยง:</Text> {summaryData.company.supervisor}
            </div>
            <div>
              <Text strong>จำนวนวันทั้งหมด:</Text> {summaryData.totalDays} วัน
            </div>
            <div>
              <Text strong>จำนวนชั่วโมงทั้งหมด:</Text> {summaryData.totalHours} ชั่วโมง
            </div>
          </Space>
        </Card>

        {/* ตารางบันทึกประจำวัน */}
        <Card title="ประวัติการบันทึกเวลา" className="logbook-table">
          <Table 
            columns={logbookColumns}
            dataSource={[]} // ควรดึงข้อมูลจาก API
            pagination={{ pageSize: 10 }}
          />
        </Card>

        {/* ปุ่มดาวน์โหลดเอกสาร */}
        <Space className="button-group">
          <Button type="primary">
            ดาวน์โหลดสรุปการฝึกงาน
          </Button>
          <Button>
            พิมพ์เอกสาร
          </Button>
        </Space>
      </div>
    </div>
  );
};

export default InternshipSummary;