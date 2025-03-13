import React, { useState, useEffect } from "react";
import { Layout, Table, message, Tag, Space, Button, Modal, Timeline, Card } from "antd";
import { FileTextOutlined, EyeOutlined, ClockCircleOutlined, SyncOutlined, CloseCircleOutlined, CheckCircleOutlined } from "@ant-design/icons";
import internshipService from '../../../services/internshipService';
import dayjs from 'dayjs';
import './InternshipStyles.css';

const { Content } = Layout;

const InternshipStatusCheck = () => {
  const [statusData, setStatusData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);

  useEffect(() => {
    fetchInternshipStatus();
  }, []);

  const fetchInternshipStatus = async () => {
    try {
      const response = await internshipService.checkInternshipStatus();
      if (response.success) {
        setStatusData(response.data);
      } else {
        message.error('ไม่สามารถดึงข้อมูลสถานะได้');
      }
    } catch (error) {
      message.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusTag = (status) => {
    const statusConfig = {
      pending: { color: 'gold', text: 'รอการพิจารณา' },
      approved: { color: 'green', text: 'อนุมัติ' },
      rejected: { color: 'red', text: 'ไม่อนุมัติ' },
      in_progress: { color: 'blue', text: 'กำลังดำเนินการ' }
    };
    
    const config = statusConfig[status] || { color: 'default', text: status };
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { color: 'gold', text: 'รอการพิจารณา', icon: <ClockCircleOutlined /> },
      approved: { color: 'green', text: 'อนุมัติ', icon: <CheckCircleOutlined /> },
      rejected: { color: 'red', text: 'ไม่อนุมัติ', icon: <CloseCircleOutlined /> },
      in_progress: { color: 'blue', text: 'กำลังดำเนินการ', icon: <SyncOutlined spin /> }
    };
    
    const config = statusConfig[status] || { color: 'default', text: status };
    return (
      <Tag icon={config.icon} color={config.color}>
        {config.text}
      </Tag>
    );
  };

  const renderStatusTimeline = (history) => (
    <Timeline>
      {history.map((item, index) => (
        <Timeline.Item 
          key={index}
          color={getStatusBadge(item.status).props.color}
        >
          <p>{getStatusBadge(item.status)} {dayjs(item.updatedAt).format('DD/MM/YYYY HH:mm')}</p>
          {item.comment && <p className="status-comment">{item.comment}</p>}
        </Timeline.Item>
      ))}
    </Timeline>
  );

  const columns = [
    {
      title: "วันที่ยื่นคำร้อง",
      dataIndex: "submittedAt",
      key: "submittedAt",
      render: (date) => dayjs(date).format('DD/MM/YYYY')
    },
    {
      title: "เอกสาร",
      dataIndex: "documentName",
      key: "documentName",
      render: () => 'แบบฟอร์ม คพ.05'
    },
    {
      title: "ชื่อบริษัท",
      dataIndex: "companyName",
      key: "companyName"
    },
    {
      title: "ระยะเวลาฝึกงาน",
      key: "internshipPeriod",
      render: (_, record) => (
        <>
          {dayjs(record.startDate).format('DD/MM/YYYY')} - 
          {dayjs(record.endDate).format('DD/MM/YYYY')}
        </>
      )
    },
    {
      title: "สถานะ",
      dataIndex: "status",
      key: "status",
      render: (status) => getStatusTag(status)
    },
    {
      title: "การดำเนินการ",
      key: "action",
      render: (_, record) => (
        <Space size="middle">
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => {
              setSelectedDocument(record);
              setViewModalVisible(true);
            }}
          >
            ดูรายละเอียด
          </Button>
        </Space>
      )
    }
  ];

  return (
    <Layout className="layout">
      <Content className="content">
        <Card 
          title={<h2>สถานะการยื่นเอกสารฝึกงาน</h2>}
          extra={statusData?.currentDocument && getStatusBadge(statusData.currentDocument.status)}
        >
          {statusData?.currentDocument ? (
            <>
              <Table
                columns={columns}
                dataSource={[statusData.currentDocument]}
                loading={loading}
                rowKey="documentId"
                pagination={false}
              />
              <Modal
                title={
                  <Space>
                    <FileTextOutlined />
                    รายละเอียดเอกสารฝึกงาน
                  </Space>
                }
                open={viewModalVisible}
                onCancel={() => setViewModalVisible(false)}
                footer={null}
                width={800}
              >
                {selectedDocument && (
                  <div className="document-detail">
                    <Card title="ข้อมูลนักศึกษา" bordered={false}>
                      <p><strong>รหัสนักศึกษา:</strong> {selectedDocument.studentCode}</p>
                      <p><strong>ชื่อ-นามสกุล:</strong> {selectedDocument.studentName}</p>
                    </Card>
                    
                    <Card title="ข้อมูลสถานที่ฝึกงาน" bordered={false}>
                      <p><strong>บริษัท:</strong> {selectedDocument.companyName}</p>
                      <p><strong>ที่อยู่:</strong> {selectedDocument.companyAddress}</p>
                      <p><strong>ระยะเวลา:</strong> {dayjs(selectedDocument.startDate).format('DD/MM/YYYY')} - {dayjs(selectedDocument.endDate).format('DD/MM/YYYY')}</p>
                    </Card>

                    {selectedDocument.supervisor?.name && (
                      <Card title="ข้อมูลผู้นิเทศงาน" bordered={false}>
                        <p><strong>ชื่อ-นามสกุล:</strong> {selectedDocument.supervisor.name}</p>
                        <p><strong>ตำแหน่ง:</strong> {selectedDocument.supervisor.position}</p>
                        <p><strong>เบอร์โทร:</strong> {selectedDocument.supervisor.phone}</p>
                        <p><strong>อีเมล:</strong> {selectedDocument.supervisor.email}</p>
                      </Card>
                    )}

                    <Card title="ประวัติการดำเนินการ" bordered={false}>
                      {renderStatusTimeline(statusData.statusHistory)}
                    </Card>
                  </div>
                )}
              </Modal>
            </>
          ) : (
            <div className="empty-state">
              <FileTextOutlined style={{ fontSize: '48px', color: '#1890ff' }} />
              <p>ยังไม่มีการยื่นเอกสารฝึกงาน</p>
              {statusData?.canSubmitNew && (
                <Button type="primary" href="/internship/cs05">
                  ยื่นแบบฟอร์ม คพ.05
                </Button>
              )}
            </div>
          )}
        </Card>
      </Content>
    </Layout>
  );
};

export default InternshipStatusCheck;