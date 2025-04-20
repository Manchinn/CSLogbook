import React from 'react';
import { Modal, Button, Descriptions, Tag, Divider, Card, Typography, Row, Col, Space } from 'antd';
import { ClockCircleOutlined, CheckCircleOutlined, CloseCircleOutlined, CommentOutlined, BookOutlined, ToolOutlined, SolutionOutlined } from '@ant-design/icons';
import dayjs from '../../../../utils/dayjs';
import { DATE_FORMAT_MEDIUM, TIME_FORMAT } from '../../../../utils/constants';

const { Title, Paragraph, Text } = Typography;

const ViewModal = ({ visible, entry, onClose }) => {
  if (!entry) {
    return null;
  }

  return (
    <Modal
      title={
        <Space>
          <BookOutlined />
          <span>รายละเอียดการฝึกงานประจำวัน</span>
        </Space>
      }
      open={visible}
      onCancel={onClose}
      width={800}
      footer={[
        <Button key="close" onClick={onClose} type="primary">
          ปิด
        </Button>,
      ]}
      bodyStyle={{ padding: '16px', maxHeight: '80vh', overflowY: 'auto' }}
    >
      <Card bordered={false} style={{ marginBottom: 16 }}>
        <Descriptions title="ข้อมูลทั่วไป" layout="vertical" bordered column={{ xs: 1, sm: 2, md: 3 }}>
          <Descriptions.Item label="วันที่" span={1}>
            <Text strong>{entry && dayjs(entry.workDate).format(DATE_FORMAT_MEDIUM)}</Text>
          </Descriptions.Item>
          
          <Descriptions.Item label="เวลาเข้างาน" span={1}>
            <Space>
              <ClockCircleOutlined /> 
              {entry?.timeIn ? dayjs(entry.timeIn).format(TIME_FORMAT) : '-'}
            </Space>
          </Descriptions.Item>
          
          <Descriptions.Item label="เวลาออกงาน" span={1}>
            <Space>
              <ClockCircleOutlined /> 
              {entry?.timeOut ? dayjs(entry.timeOut).format(TIME_FORMAT) : '-'}
            </Space>
          </Descriptions.Item>
          
          <Descriptions.Item label="หัวข้องาน" span={3}>
            {entry?.logTitle || '-'}
          </Descriptions.Item>
          
          <Descriptions.Item label="จำนวนชั่วโมง" span={3}>
            {entry?.workHours > 0 ? <Tag color="blue">{entry.workHours} ชั่วโมง</Tag> : '-'}
          </Descriptions.Item>
        </Descriptions>
      </Card>
      
      <Card title="รายละเอียดการปฏิบัติงาน" bordered={false} style={{ marginBottom: 16 }}>
        <Paragraph style={{ whiteSpace: 'pre-line' }}>
          {entry?.workDescription || 'ไม่มีรายละเอียด'}
        </Paragraph>
      </Card>
      
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col xs={24} md={12}>
          <Card 
            title={<Space><BookOutlined /> สิ่งที่ได้เรียนรู้</Space>} 
            bordered={false} 
            style={{ height: '100%' }}
          >
            <Paragraph style={{ whiteSpace: 'pre-line' }}>
              {entry?.learningOutcome || 'ไม่มีข้อมูล'}
            </Paragraph>
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
                {entry?.problems || "ไม่มีปัญหา"}
              </div>
              
              <Text strong>วิธีการแก้ไข:</Text>
              <div style={{ whiteSpace: 'pre-line', marginTop: 4 }}>
                {entry?.solutions || "ไม่ระบุ"}
              </div>
            </Paragraph>
          </Card>
        </Col>
      </Row>
      
      <Card title="สถานะการอนุมัติ" bordered={false}>
        <Space size="large" wrap>
          <Tag color={entry.supervisorApproved ? "success" : "default"} style={{ padding: '4px 8px', fontSize: '14px' }}>
            {entry.supervisorApproved 
              ? <><CheckCircleOutlined /> หัวหน้างาน: อนุมัติแล้ว</>
              : <><CloseCircleOutlined /> หัวหน้างาน: รออนุมัติ</>
            }
          </Tag>
          
          <Tag color={entry.advisorApproved ? "success" : "default"} style={{ padding: '4px 8px', fontSize: '14px' }}>
            {entry.advisorApproved 
              ? <><CheckCircleOutlined /> อาจารย์ที่ปรึกษา: อนุมัติแล้ว</>
              : <><CloseCircleOutlined /> อาจารย์ที่ปรึกษา: รออนุมัติ</>
            }
          </Tag>
        </Space>
        
        {(entry?.supervisorComment || entry?.advisorComment) && (
          <>
            <Divider orientation="left"><CommentOutlined /> ความคิดเห็น</Divider>
            
            {entry?.supervisorComment && (
              <Card size="small" style={{ marginBottom: 8 }} title="ความคิดเห็นหัวหน้างาน">
                <Paragraph style={{ whiteSpace: 'pre-line' }}>
                  {entry.supervisorComment}
                </Paragraph>
              </Card>
            )}
            
            {entry?.advisorComment && (
              <Card size="small" title="ความคิดเห็นอาจารย์ที่ปรึกษา">
                <Paragraph style={{ whiteSpace: 'pre-line' }}>
                  {entry.advisorComment}
                </Paragraph>
              </Card>
            )}
          </>
        )}
      </Card>
    </Modal>
  );
};

export default ViewModal;