import React, { useState, useEffect, useCallback } from 'react';
import { 
  Table, Button, Space, Tag, Modal, Form, Input, message, 
  Row, Col, Card, Typography, Tooltip, Popconfirm 
} from 'antd';
import {
  CheckCircleOutlined, CloseCircleOutlined, DownloadOutlined,
  EyeOutlined, BellOutlined, FileTextOutlined
} from '@ant-design/icons';
import certificateService from '../../../services/certificateService'; // ✅ ใช้ service ใหม่

const { Title, Text } = Typography;

const CertificateManagement = () => {
  const [certificateRequests, setCertificateRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [processLoading, setProcessLoading] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [actionType, setActionType] = useState(''); // 'approve' หรือ 'reject'
  const [form] = Form.useForm();

  // ดึงรายการคำขอหนังสือรับรอง
  const fetchCertificateRequests = useCallback(async () => {
    try {
      setLoading(true);
      const response = await certificateService.getCertificateRequests(); // ✅ ใช้ admin route
      
      if (response.success) {
        setCertificateRequests(response.data || []);
      }
    } catch (error) {
      console.error('Error fetching certificate requests:', error);
      message.error('ไม่สามารถดึงข้อมูลคำขอหนังสือรับรองได้');
    } finally {
      setLoading(false);
    }
  }, []);

  // โหลดข้อมูลเมื่อ component mount
  useEffect(() => {
    fetchCertificateRequests();
  }, [fetchCertificateRequests]);

  // อนุมัติคำขอหนังสือรับรอง
  const handleApproveRequest = async (requestId) => {
    try {
      setProcessLoading(true);
      
      const certificateNumber = generateCertificateNumber();
      
      await certificateService.approveCertificateRequest(requestId, certificateNumber); // ✅ ใช้ admin route
      
      message.success('อนุมัติคำขอหนังสือรับรองเรียบร้อยแล้ว');
      await fetchCertificateRequests();
      setModalVisible(false);
      
      // ส่งอีเมลแจ้งเตือนนักศึกษา
      await notifyStudent(selectedRequest.studentId, 'approved', certificateNumber);
      
    } catch (error) {
      console.error('Error approving request:', error);
      message.error('ไม่สามารถอนุมัติคำขอได้');
    } finally {
      setProcessLoading(false);
    }
  };

  // ปฏิเสธคำขอหนังสือรับรอง  
  const handleRejectRequest = async (requestId, remarks) => {
    try {
      setProcessLoading(true);
      
      await certificateService.rejectCertificateRequest(requestId, remarks); // ✅ ใช้ admin route
      
      message.success('ปฏิเสธคำขอเรียบร้อยแล้ว');
      await fetchCertificateRequests();
      setModalVisible(false);
      
      // ส่งอีเมลแจ้งเตือนนักศึกษา
      await notifyStudent(selectedRequest.studentId, 'rejected', null, remarks);
      
    } catch (error) {
      console.error('Error rejecting request:', error);
      message.error('ไม่สามารถปฏิเสธคำขอได้');
    } finally {
      setProcessLoading(false);
    }
  };

  // ดาวน์โหลดหนังสือรับรอง
  const downloadCertificate = async (requestId) => {
    try {
      await certificateService.downloadCertificateForAdmin(requestId); // ✅ ใช้ admin route
      message.success('ดาวน์โหลดหนังสือรับรองเรียบร้อยแล้ว');
    } catch (error) {
      console.error('Error downloading certificate:', error);
      message.error('ไม่สามารถดาวน์โหลดหนังสือรับรองได้');
    }
  };

  // ส่งการแจ้งเตือนให้นักศึกษา
  const notifyStudent = async (studentId, status, certificateNumber = null, remarks = null) => {
    try {
      await certificateService.notifyStudent( // ✅ ใช้ admin route
        studentId, 
        'certificate_status', 
        status, 
        certificateNumber, 
        remarks
      );
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  };

  // สร้างหมายเลขหนังสือรับรอง
  const generateCertificateNumber = () => {
    const year = new Date().getFullYear() + 543; // พ.ศ.
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    const random = Math.floor(Math.random() * 9999).toString().padStart(4, '0');
    return `ว ${year}/${month}/${random}`;
  };

  // คอลัมน์ตาราง
  const columns = [
    {
      title: 'รหัสนักศึกษา',
      dataIndex: ['student', 'studentCode'],
      key: 'studentCode',
      width: 120,
    },
    {
      title: 'ชื่อ-นามสกุล',
      dataIndex: ['student', 'fullName'],
      key: 'fullName',
      width: 200,
    },
    {
      title: 'วันที่ขอ',
      dataIndex: 'requestDate',
      key: 'requestDate',
      width: 120,
      render: (date) => new Date(date).toLocaleDateString('th-TH'),
    },
    {
      title: 'ชั่วโมงฝึกงาน',
      dataIndex: 'totalHours',
      key: 'totalHours',
      width: 100,
      render: (hours) => `${hours} ชม.`,
    },
    {
      title: 'สถานะ',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status) => {
        const statusConfig = {
          pending: { color: 'orange', text: 'รอดำเนินการ' },
          approved: { color: 'green', text: 'อนุมัติแล้ว' },
          rejected: { color: 'red', text: 'ปฏิเสธ' },
        };
        const config = statusConfig[status] || statusConfig.pending;
        return <Tag color={config.color}>{config.text}</Tag>;
      },
    },
    {
      title: 'หมายเลขหนังสือ',
      dataIndex: 'certificateNumber',
      key: 'certificateNumber',
      width: 150,
      render: (number) => number || '-',
    },
    {
      title: 'การดำเนินการ',
      key: 'actions',
      width: 200,
      render: (_, record) => (
        <Space size="small">
          {record.status === 'pending' && (
            <>
              <Tooltip title="อนุมัติ">
                <Button
                  type="primary"
                  size="small"
                  icon={<CheckCircleOutlined />}
                  onClick={() => {
                    setSelectedRequest(record);
                    setActionType('approve');
                    setModalVisible(true);
                  }}
                />
              </Tooltip>
              <Tooltip title="ปฏิเสธ">
                <Button
                  danger
                  size="small"
                  icon={<CloseCircleOutlined />}
                  onClick={() => {
                    setSelectedRequest(record);
                    setActionType('reject');
                    setModalVisible(true);
                  }}
                />
              </Tooltip>
            </>
          )}
          
          {record.status === 'approved' && (
            <Tooltip title="ดาวน์โหลดหนังสือรับรอง">
              <Button
                type="default"
                size="small"
                icon={<DownloadOutlined />}
                onClick={() => downloadCertificate(record.id)}
              />
            </Tooltip>
          )}
          
          <Tooltip title="ส่งการแจ้งเตือน">
            <Button
              type="default"
              size="small"
              icon={<BellOutlined />}
              onClick={() => {
                notifyStudent(
                  record.studentId, 
                  record.status, 
                  record.certificateNumber
                );
                message.success('ส่งการแจ้งเตือนแล้ว');
              }}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Card>
        <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
          <Col>
            <Title level={4}>
              <FileTextOutlined style={{ marginRight: 8 }} />
              จัดการหนังสือรับรองการฝึกงาน
            </Title>
          </Col>
          <Col>
            <Button 
              type="primary" 
              onClick={fetchCertificateRequests}
              loading={loading}
            >
              รีเฟรช
            </Button>
          </Col>
        </Row>

        <Table
          columns={columns}
          dataSource={certificateRequests}
          loading={loading}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `ทั้งหมด ${total} รายการ`,
          }}
          scroll={{ x: 1000 }}
        />
      </Card>

      {/* Modal สำหรับอนุมัติ/ปฏิเสธ */}
      <Modal
        title={actionType === 'approve' ? 'อนุมัติคำขอหนังสือรับรอง' : 'ปฏิเสธคำขอหนังสือรับรอง'}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
        }}
        footer={[
          <Button key="cancel" onClick={() => setModalVisible(false)}>
            ยกเลิก
          </Button>,
          <Button
            key="submit"
            type={actionType === 'approve' ? 'primary' : 'danger'}
            loading={processLoading}
            onClick={() => {
              if (actionType === 'approve') {
                handleApproveRequest(selectedRequest?.id);
              } else {
                form.validateFields().then((values) => {
                  handleRejectRequest(selectedRequest?.id, values.remarks);
                });
              }
            }}
          >
            {actionType === 'approve' ? 'อนุมัติ' : 'ปฏิเสธ'}
          </Button>,
        ]}
      >
        {selectedRequest && (
          <div>
            <p><strong>นักศึกษา:</strong> {selectedRequest.student?.fullName}</p>
            <p><strong>รหัส:</strong> {selectedRequest.student?.studentCode}</p>
            <p><strong>ชั่วโมงฝึกงาน:</strong> {selectedRequest.totalHours} ชั่วโมง</p>
            
            {actionType === 'reject' && (
              <Form form={form} layout="vertical">
                <Form.Item
                  name="remarks"
                  label="เหตุผลการปฏิเสธ"
                  rules={[{ required: true, message: 'กรุณาระบุเหตุผล' }]}
                >
                  <Input.TextArea 
                    rows={4} 
                    placeholder="ระบุเหตุผลการปฏิเสธ..."
                  />
                </Form.Item>
              </Form>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default CertificateManagement;