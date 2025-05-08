import React, { useState, useEffect } from 'react';
import { Form, Select, Button, DatePicker, Card, Alert, message, Table, Tag, Typography, Space, Divider } from 'antd';
import { SendOutlined, HistoryOutlined, CloseCircleOutlined, CheckCircleOutlined, ClockCircleOutlined } from '@ant-design/icons';
import emailApprovalService from '../../services/emailApprovalService';
import dayjs from 'dayjs';
import 'dayjs/locale/th';
import { useAuth } from '../../contexts/AuthContext';

const { Option } = Select;
const { RangePicker } = DatePicker;
const { Title, Text } = Typography;

const EmailApprovalRequest = ({ studentId, logbooks }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [requestType, setRequestType] = useState('single');
  const [approvalHistory, setApprovalHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const { user } = useAuth();

  // โหลดประวัติการส่งคำขออนุมัติเมื่อเปิด component
  useEffect(() => {
    if (showHistory) {
      fetchApprovalHistory();
    }
  }, [showHistory]);

  const fetchApprovalHistory = async () => {
    try {
      setLoadingHistory(true);
      const response = await emailApprovalService.getApprovalHistory(studentId);
      
      if (response.success) {
        setApprovalHistory(response.data || []);
      } else {
        message.error('เกิดข้อผิดพลาดในการดึงประวัติการส่งคำขออนุมัติ');
      }
    } catch (error) {
      console.error('Error fetching approval history:', error);
      message.error('ไม่สามารถดึงประวัติการส่งคำขออนุมัติได้');
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleSubmit = async (values) => {
    try {
      setLoading(true);

      let data = { type: requestType };
      
      if (requestType === 'selected' && values.logIds) {
        data.logIds = values.logIds;
      } else if ((requestType === 'weekly' || requestType === 'monthly') && values.dateRange) {
        data.startDate = values.dateRange[0].format('YYYY-MM-DD');
        data.endDate = values.dateRange[1].format('YYYY-MM-DD');
      }

      const response = await emailApprovalService.sendApprovalRequest(studentId, data);

      if (response.success) {
        message.success('ส่งคำขออนุมัติผ่านอีเมลไปยังหัวหน้างานเรียบร้อยแล้ว');
        form.resetFields();
      } else {
        message.error(response.message || 'เกิดข้อผิดพลาดในการส่งคำขออนุมัติ');
      }
    } catch (error) {
      console.error('Error sending approval request:', error);
      message.error('ไม่สามารถส่งคำขออนุมัติได้ โปรดลองอีกครั้งในภายหลัง');
    } finally {
      setLoading(false);
    }
  };

  // กรองเฉพาะ logbook ที่ยังไม่ได้รับการอนุมัติ
  const pendingLogbooks = logbooks?.filter(log => !log.supervisorApproved) || [];

  const historyColumns = [
    {
      title: 'วันที่ส่ง',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (text) => dayjs(text).format('DD/MM/YYYY HH:mm'),
    },
    {
      title: 'ประเภท',
      dataIndex: 'type',
      key: 'type',
      render: (type) => {
        let text = '';
        switch(type) {
          case 'single': text = 'รายวัน'; break;
          case 'weekly': text = 'รายสัปดาห์'; break;
          case 'monthly': text = 'รายเดือน'; break;
          case 'full': text = 'ทั้งหมด'; break;
          default: text = type;
        }
        return text;
      },
    },
    {
      title: 'หมดอายุ',
      dataIndex: 'expiresAt',
      key: 'expiresAt',
      render: (text) => dayjs(text).format('DD/MM/YYYY HH:mm'),
    },
    {
      title: 'สถานะ',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        let color = '';
        let icon = null;
        let text = '';
        
        switch(status) {
          case 'pending': 
            color = 'gold';
            icon = <ClockCircleOutlined />;
            text = 'รอการอนุมัติ';
            break;
          case 'approved': 
            color = 'green';
            icon = <CheckCircleOutlined />;
            text = 'อนุมัติแล้ว';
            break;
          case 'rejected': 
            color = 'red';
            icon = <CloseCircleOutlined />;
            text = 'ปฏิเสธ';
            break;
          default: 
            color = 'default';
            text = status;
        }
        
        return (
          <Tag color={color} icon={icon}>
            {text}
          </Tag>
        );
      },
    },
    {
      title: 'หมายเหตุ',
      dataIndex: 'comment',
      key: 'comment',
      ellipsis: true,
      render: (comment) => comment || '-',
    },
  ];

  return (
    <div className="email-approval-request">
      <Card 
        title={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>ส่งคำขออนุมัติบันทึกการฝึกงานผ่านอีเมล</span>
            <Button 
              type="link" 
              icon={<HistoryOutlined />} 
              onClick={() => setShowHistory(!showHistory)}
            >
              {showHistory ? 'ซ่อนประวัติ' : 'แสดงประวัติ'}
            </Button>
          </div>
        }
      >
        {pendingLogbooks.length === 0 ? (
          <Alert
            message="ไม่พบบันทึกการฝึกงานที่รอการอนุมัติ"
            description="ขณะนี้คุณไม่มีบันทึกการฝึกงานที่รอการอนุมัติ หรือบันทึกการฝึกงานทั้งหมดได้รับการอนุมัติแล้ว"
            type="info"
            showIcon
          />
        ) : (
          <>
            <Alert
              message="คำแนะนำ"
              description={
                <div>
                  <p>คุณสามารถส่งอีเมลขออนุมัติบันทึกการฝึกงานไปยังหัวหน้างานได้ โดยหัวหน้างานสามารถอนุมัติหรือปฏิเสธผ่านลิงก์ในอีเมลโดยตรง</p>
                  <p>คุณสามารถเลือกส่งคำขออนุมัติได้ทั้งแบบรายวัน รายสัปดาห์ รายเดือน หรือทั้งหมด</p>
                </div>
              }
              type="info"
              showIcon
              style={{ marginBottom: 20 }}
            />

            <Form
              form={form}
              onFinish={handleSubmit}
              layout="vertical"
            >
              <Form.Item
                label="ประเภทการขออนุมัติ"
                name="requestType"
                rules={[{ required: true, message: 'กรุณาเลือกประเภทการขออนุมัติ' }]}
                initialValue="single"
              >
                <Select
                  onChange={(value) => setRequestType(value)}
                  placeholder="เลือกประเภทการขออนุมัติ"
                >
                  <Option value="single">รายวันล่าสุด</Option>
                  <Option value="selected">เลือกบันทึกเฉพาะ</Option>
                  <Option value="weekly">รายสัปดาห์</Option>
                  <Option value="monthly">รายเดือน</Option>
                  <Option value="full">ทั้งหมดที่ยังไม่ได้อนุมัติ</Option>
                </Select>
              </Form.Item>

              {requestType === 'selected' && (
                <Form.Item
                  label="เลือกบันทึกที่ต้องการขออนุมัติ"
                  name="logIds"
                  rules={[{ required: true, message: 'กรุณาเลือกบันทึกอย่างน้อย 1 รายการ' }]}
                >
                  <Select
                    mode="multiple"
                    placeholder="เลือกบันทึกที่ต้องการขออนุมัติ"
                    optionFilterProp="children"
                    style={{ width: '100%' }}
                  >
                    {pendingLogbooks.map((log) => (
                      <Option key={log.logId} value={log.logId}>
                        {dayjs(log.workDate).format('DD/MM/YYYY')} - {log.logTitle || 'ไม่มีหัวข้อ'}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              )}

              {(requestType === 'weekly' || requestType === 'monthly') && (
                <Form.Item
                  label="ช่วงวันที่"
                  name="dateRange"
                  rules={[{ required: true, message: 'กรุณาเลือกช่วงวันที่' }]}
                >
                  <RangePicker 
                    style={{ width: '100%' }}
                    format="DD/MM/YYYY"
                  />
                </Form.Item>
              )}

              <Form.Item>
                <Button 
                  type="primary" 
                  htmlType="submit" 
                  loading={loading}
                  icon={<SendOutlined />}
                  disabled={pendingLogbooks.length === 0}
                >
                  ส่งคำขออนุมัติ
                </Button>
              </Form.Item>
            </Form>
          </>
        )}

        {showHistory && (
          <>
            <Divider orientation="left">ประวัติการส่งคำขออนุมัติ</Divider>
            <Table
              columns={historyColumns}
              dataSource={approvalHistory}
              rowKey="tokenId"
              loading={loadingHistory}
              pagination={{ pageSize: 5 }}
              locale={{ emptyText: 'ไม่พบประวัติการส่งคำขออนุมัติ' }}
            />
          </>
        )}
      </Card>
    </div>
  );
};

export default EmailApprovalRequest;