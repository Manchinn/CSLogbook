import React from 'react';
import { Modal, Button, Descriptions, Tag, Divider, Card, Typography, Row, Col, Space, Alert } from 'antd';
import { 
  ClockCircleOutlined, 
  CheckCircleOutlined, 
  CloseCircleOutlined, 
  CommentOutlined, 
  BookOutlined, 
  ToolOutlined, 
  SolutionOutlined, 
  CalendarOutlined,
  HistoryOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import dayjs from '../../../../utils/dayjs';
import { DATE_FORMAT_MEDIUM, DATE_TIME_FORMAT, TIME_FORMAT } from '../../../../utils/constants';

// นำเข้า locale ภาษาไทยสำหรับ dayjs
import 'dayjs/locale/th';

const { Title, Paragraph, Text } = Typography;

// สร้างฟังก์ชันสำหรับแปลงวันที่เป็นชื่อวันภาษาไทย
const getThaiDayName = (date) => {
  const thaiDays = ['วันอาทิตย์', 'วันจันทร์', 'วันอังคาร', 'วันพุธ', 'วันพฤหัสบดี', 'วันศุกร์', 'วันเสาร์'];
  return thaiDays[date.day()];
};

const ViewModal = ({ visible, entry, onClose }) => {
  if (!entry) {
    return null;
  }

  const createdDate = entry.created_at ? dayjs(entry.created_at) : null;
  const updatedDate = entry.updated_at ? dayjs(entry.updated_at) : null;
  const isUpdated = updatedDate && createdDate && !updatedDate.isSame(createdDate, 'minute');

  return (
    <Modal
      title={
        <Space>
          <BookOutlined />
          <span>รายละเอียดการฝึกงานประจำวัน</span>
          {entry?.logId && <Tag color="blue">บันทึก #{entry.logId}</Tag>}
        </Space>
      }
      open={visible}
      onCancel={onClose}
      width={800}
      style={{ top: 10 }}
      footer={[
        <Button key="close" onClick={onClose} type="primary">
          ปิด
        </Button>,
      ]}
      styles={{ padding: '16px', maxHeight: '80vh', overflowY: 'auto',}}
    >
      {(entry?.logId || entry?.timeIn) ? (
        <Alert
          message={
            <Space align="center">
              <CheckCircleOutlined />
              <Text strong>มีการบันทึกข้อมูลแล้ว</Text>
              {isUpdated && 
                <Tag color="green">อัปเดตล่าสุด: {updatedDate.format(DATE_TIME_FORMAT.replace('YYYY','BBBB'))}</Tag>
              }
            </Space>
          }
          type="success"
          showIcon={false}
          style={{ marginBottom: 16 }}
        />
      ) : (
        <Alert
          message="ยังไม่มีการบันทึกข้อมูล"
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      <Card bordered={false} style={{ marginBottom: 16 }}>
        <Descriptions title="ข้อมูลทั่วไป" layout="vertical" bordered column={{ xs: 1, sm: 2, md: 3 }}>
          <Descriptions.Item label={<><CalendarOutlined /> วันที่</>} span={1}>
            <Text strong>
              {entry && `${getThaiDayName(dayjs(entry.workDate))}, ${dayjs(entry.workDate).format(DATE_FORMAT_MEDIUM.replace('YYYY','BBBB'))}`}
            </Text>
          </Descriptions.Item>
          
          <Descriptions.Item label={<><ClockCircleOutlined /> เวลาเข้างาน</>} span={1}>
            <Space>
              {entry?.timeIn ? (
                <Tag color="green">{dayjs(entry.timeIn).format(TIME_FORMAT)}</Tag>
              ) : (
                <Tag color="red">ยังไม่บันทึก</Tag>
              )}
            </Space>
          </Descriptions.Item>
          
          <Descriptions.Item label={<><ClockCircleOutlined /> เวลาออกงาน</>} span={1}>
            <Space>
              {entry?.timeOut ? (
                <Tag color="green">{dayjs(entry.timeOut).format(TIME_FORMAT)}</Tag>
              ) : (
                <Tag color="red">ยังไม่บันทึก</Tag>
              )}
            </Space>
          </Descriptions.Item>
          
          <Descriptions.Item label={<><BookOutlined /> หัวข้องาน</>} span={3}>
            {entry?.logTitle ? (
              <Text strong style={{ fontSize: '16px' }}>{entry.logTitle}</Text>
            ) : (
              <Text type="secondary">ยังไม่ได้ระบุ</Text>
            )}
          </Descriptions.Item>
          
          <Descriptions.Item label={<><HistoryOutlined /> จำนวนชั่วโมง</>} span={3}>
            {entry?.workHours > 0 ? (
              <Tag color="blue" style={{ fontSize: '14px', padding: '2px 8px' }}>
                {entry.workHours} ชั่วโมง
              </Tag>
            ) : (
              <Text type="secondary">ยังไม่มีการคำนวณชั่วโมงทำงาน</Text>
            )}
          </Descriptions.Item>
          
          {createdDate && (
            <Descriptions.Item label={<><InfoCircleOutlined /> บันทึกเมื่อ</>} span={3}>
              {createdDate.format(DATE_TIME_FORMAT.replace('YYYY','BBBB'))} 
              {isUpdated && (
                <Text type="secondary" style={{ marginLeft: 8 }}>
                  (อัปเดตล่าสุด: {updatedDate.format(DATE_TIME_FORMAT.replace('YYYY','BBBB'))})
                </Text>
              )}
            </Descriptions.Item>
          )}
        </Descriptions>
      </Card>
      
      <Card 
        title={<Space><SolutionOutlined /> รายละเอียดการปฏิบัติงาน</Space>} 
        bordered={false} 
        style={{ marginBottom: 16 }}
      >
        {entry?.workDescription ? (
          <Paragraph style={{ whiteSpace: 'pre-line', fontSize: '15px' }}>
            {entry.workDescription}
          </Paragraph>
        ) : (
          <Alert message="ยังไม่มีการบันทึกรายละเอียดการปฏิบัติงาน" type="info" showIcon />
        )}
      </Card>
      
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col xs={24} md={12}>
          <Card 
            title={<Space><BookOutlined /> สิ่งที่ได้เรียนรู้</Space>} 
            bordered={false} 
            style={{ height: '100%' }}
          >
            {entry?.learningOutcome ? (
              <Paragraph style={{ whiteSpace: 'pre-line', fontSize: '15px' }}>
                {entry.learningOutcome}
              </Paragraph>
            ) : (
              <Alert message="ยังไม่มีการบันทึกสิ่งที่ได้เรียนรู้" type="info" showIcon />
            )}
          </Card>
        </Col>
        
        <Col xs={24} md={12}>
          <Card 
            title={<Space><ToolOutlined /> ปัญหาและการแก้ไข</Space>} 
            bordered={false}
            style={{ height: '100%' }}
          >
            <Paragraph>
              <Text strong>ปัญหาที่พบ:</Text>
              <div style={{ whiteSpace: 'pre-line', marginBottom: 8, marginTop: 4 }}>
                {entry?.problems ? (
                  <Text>{entry.problems}</Text>
                ) : (
                  <Text type="secondary">ไม่มีปัญหา</Text>
                )}
              </div>
              
              <Text strong>วิธีการแก้ไข:</Text>
              <div style={{ whiteSpace: 'pre-line', marginTop: 4 }}>
                {entry?.solutions ? (
                  <Text>{entry.solutions}</Text>
                ) : (
                  <Text type="secondary">ไม่ระบุ</Text>
                )}
              </div>
            </Paragraph>
          </Card>
        </Col>
      </Row>
      
      <Card title={<Space><CheckCircleOutlined /> สถานะการอนุมัติ</Space>} bordered={false}>
        <Space size="large" wrap>
          <Tag color={entry.supervisorApproved ? "success" : "default"} style={{ padding: '4px 8px', fontSize: '14px' }}>
            {entry.supervisorApproved 
              ? <><CheckCircleOutlined /> หัวหน้างาน: อนุมัติแล้ว</>
              : <><CloseCircleOutlined /> หัวหน้างาน: รออนุมัติ</>
            }
          </Tag>
        </Space>
        
        {entry?.supervisorComment && (
          <>
            <Divider orientation="left"><CommentOutlined /> ความคิดเห็น</Divider>
            
            <Card size="small" style={{ marginBottom: 8 }} title="ความคิดเห็นหัวหน้างาน">
              <Paragraph style={{ whiteSpace: 'pre-line' }}>
                {entry.supervisorComment}
              </Paragraph>
            </Card>
          </>
        )}
      </Card>
    </Modal>
  );
};

export default ViewModal;