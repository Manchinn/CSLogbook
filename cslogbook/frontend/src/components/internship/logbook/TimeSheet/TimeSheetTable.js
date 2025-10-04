import React, { useCallback, useState } from 'react';
import { Table, Space, Button, Badge, Tooltip, Tag, Typography, Modal, Select, DatePicker, Form, message, Popover, Alert } from 'antd';
import { EditOutlined, EyeOutlined, ClockCircleOutlined, CheckCircleOutlined, CloseCircleOutlined, SendOutlined } from '@ant-design/icons';
import dayjs from '../../../../utils/dayjs';
import { DATE_FORMAT_MEDIUM, TIME_FORMAT } from '../../../../utils/constants';
import emailApprovalService from '../../../../services/emailApprovalService';
import { useAuth } from '../../../../contexts/AuthContext';
// เปลี่ยนจาก styles.css เป็น CSS Modules
import styles from './TimeSheet.module.css';

const { Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

// เพิ่มฟังก์ชันเพื่อตรวจสอบว่าวันที่ยังไม่ถึงหรือไม่
const isFutureDate = (date) => {
  const today = dayjs().startOf('day');
  return dayjs(date).isAfter(today);
};

const getEntryStatus = (entry) => {
  if (isFutureDate(entry.workDate)) return "upcoming"; // วันที่ยังไม่ถึง
  if (!entry.timeIn) return "pending";
  if (entry.timeIn && !entry.timeOut) return "incomplete"; // เข้างานแล้วแต่ยังไม่ออก
  if (!entry.workDescription || !entry.logTitle) return "incomplete"; // ข้อมูลไม่ครบ
  if (entry.logId) {
    if (entry.supervisorApproved === -1) return "rejected"; //  Handle rejected state
    if (entry.supervisorApproved === 1) return "approved";   // Handle approved state (e.g., value is 1)
    if (entry.supervisorApproved === 0 || entry.supervisorApproved === null || typeof entry.supervisorApproved === 'undefined') return "submitted"; // Handle pending/submitted state (e.g., value is 0)
  }
  return "incomplete"; // ถ้ามีข้อมูลแต่ไม่เข้าเงื่อนไขข้างบน
};

const renderStatusBadge = (status) => {
  const statusConfig = {
    upcoming: { color: 'default', text: 'วันที่ยังไม่ถึง' },
    pending: { color: 'default', text: 'รอดำเนินการ' },
    incomplete: { color: 'warning', text: 'ไม่สมบูรณ์' },
    submitted: { color: 'processing', text: 'รอตรวจสอบ' },
    approved: { color: 'success', text: 'อนุมัติแล้ว' },
    rejected: { color: 'error', text: 'ปฏิเสธแล้ว' } // Added rejected status
  };

  const config = statusConfig[status] || statusConfig.pending;
  return <Badge status={config.color} text={config.text} />;
};

const TimeSheetTable = ({ data, loading, onEdit, onView, studentId }) => {
  // เพิ่ม studentId เป็น prop
  const [approvalModalVisible, setApprovalModalVisible] = useState(false);
  const [requestType, setRequestType] = useState('full');
  const [loadingApproval, setLoadingApproval] = useState(false);
  const [form] = Form.useForm();
  const { user } = useAuth();
  
  // ตรวจสอบ studentId - ใช้จาก props ก่อน ถ้าไม่มีจึงใช้จาก user context
  const currentStudentId = studentId || (user && user.studentId) || (data && data[0] && data[0].studentId);

  // เตรียมข้อมูลสำหรับแสดงในตาราง
  const prepareTableData = useCallback(() => {
    if (!data) return [];
    
    return data.map(entry => ({
      ...entry,
      key: entry.key || entry.logId || `timesheet-${entry.workDate.format('YYYY-MM-DD')}`
    }));
  }, [data]);
  
  const tableData = prepareTableData();

  // กรองเฉพาะบันทึกที่ยังไม่ได้อนุมัติและมีข้อมูลครบถ้วน
  const pendingLogbooks = tableData.filter(log => 
    !log.supervisorApproved && 
    log.logId && 
    log.timeIn && 
    log.timeOut && 
    log.workDescription && 
    log.logTitle
  );
  
  // เช็คว่ามีรายการที่รอการอนุมัติหรือไม่
  const hasUnapprovedLogs = pendingLogbooks.length > 0;

  // ฟังก์ชันสำหรับเปิด modal ส่งคำขออนุมัติ
  const showApprovalModal = () => {
    setApprovalModalVisible(true);
    form.resetFields();
  };

  // ฟังก์ชันสำหรับปิด modal
  const handleCancel = () => {
    setApprovalModalVisible(false);
    form.resetFields();
  };

  // ฟังก์ชันสำหรับส่งคำขออนุมัติไปยังหัวหน้างาน
  const handleSubmitApproval = async () => {
    try {
      if (!currentStudentId) {
        message.error('ไม่พบรหัสนักศึกษา กรุณาลองเข้าสู่ระบบใหม่');
        return;
      }
      
      const values = await form.validateFields();
      setLoadingApproval(true);
      
      let data = { type: requestType };
      
      if (requestType === 'weekly' && values.dateRange) {
        data.startDate = values.dateRange[0].format('YYYY-MM-DD');
        data.endDate = values.dateRange[1].format('YYYY-MM-DD');
      }
      
      // ส่ง API request
      const response = await emailApprovalService.sendApprovalRequest(currentStudentId, data);
      
      if (response.success) {
        // ✅ มีการตรวจสอบแล้ว แต่อาจจะต้องปรับปรุงการแสดงผล
        if (response.emailSent === false) {
          if (response.reason === 'notification_disabled') {
            message.warning('คำขออนุมัติได้รับการบันทึกแล้ว แต่ไม่ส่งอีเมลเนื่องจากการแจ้งเตือนถูกปิดใช้งาน');
          } else {
            message.warning(`คำขออนุมัติได้รับการบันทึกแล้ว แต่ไม่สามารถส่งอีเมลได้: ${response.reason || 'ไม่ทราบสาเหตุ'}`);
          }
        } else {
          message.success('ส่งคำขออนุมัติผ่านอีเมลไปยังหัวหน้างานเรียบร้อยแล้ว');
        }
        
        setApprovalModalVisible(false);
        form.resetFields();
      } else {
        message.error(response.message || 'เกิดข้อผิดพลาดในการส่งคำขออนุมัติ');
      }
    } catch (error) {
      console.error('Error sending approval request:', error);
      message.error('ไม่สามารถส่งคำขออนุมัติได้ โปรดลองอีกครั้งในภายหลัง');
    } finally {
      setLoadingApproval(false);
    }
  };

  const columns = [
    {
      title: "วันที่",
      dataIndex: "workDate",
      key: "workDate",
      render: (date) => {
        try {
          return dayjs(date).format(DATE_FORMAT_MEDIUM.replace('YYYY','BBBB'));
        } catch (e) {
          return String(date);
        }
      },
    },
    {
      title: "เวลาทำงาน",
      key: "workTime",
      width: 160,
      render: (_, record) => {
        if (!record.timeIn) return '-';
        
        return (
          <Space direction="vertical" size="small" style={{ width: '100%' }}>
            <Text><ClockCircleOutlined /> เข้า: {record.timeIn ? dayjs(record.timeIn).format(TIME_FORMAT) : '-'}</Text>
            <Text>{record.timeOut ? `ออก: ${dayjs(record.timeOut).format(TIME_FORMAT)}` : 'ยังไม่บันทึกเวลาออก'}</Text>
          </Space>
        );
      },
    },
    {
      title: "หัวข้อและรายละเอียด",
      key: "details",
      render: (_, record) => (
        <Space direction="vertical" size="small" style={{ width: '100%' }}>
          <Text strong>{record.logTitle || '-'}</Text>
          {record.workHours > 0 && <Text type="secondary">{record.workHours} ชั่วโมง</Text>}
          {record.workDescription && (
            <Text type="secondary" ellipsis={{ tooltip: record.workDescription }}>
              {record.workDescription.length > 50 
                ? `${record.workDescription.substring(0, 50)}...` 
                : record.workDescription}
            </Text>
          )}
        </Space>
      ),
    },
    {
      title: "การอนุมัติ",
      key: "approvals",
      width: 180, // Adjusted width for potentially longer text or popover
      render: (_, record) => {
        let tagContent;
        // Assuming the rejection comment is stored in 'record.supervisorComment'
        const comment = record.supervisorComment;

        if (record.supervisorApproved === 1) {
          tagContent = (
            <Tag color="success" style={{ margin: '2px 0' }}>
              <CheckCircleOutlined /> หัวหน้างานอนุมัติ
            </Tag>
          );
        } else if (record.supervisorApproved === -1) {
          const rejectedTag = (
            <Tag color="error" style={{ margin: '2px 0' }}>
              <CloseCircleOutlined /> ปฏิเสธโดยหัวหน้างาน
            </Tag>
          );
          if (comment) {
            tagContent = (
              <Popover 
                content={<Text>{comment}</Text>} 
                title="เหตุผลการปฏิเสธ" 
                trigger="hover"
              >
                {rejectedTag}
              </Popover>
            );
          } else {
            tagContent = rejectedTag;
          }
        } else { // Handles 0, null, undefined (Pending approval)
          tagContent = (
            <Tag color="processing" style={{ margin: '2px 0' }}>
              <ClockCircleOutlined /> รออนุมัติ
            </Tag>
          );
        }
        return <Space direction="vertical" size="small" style={{ width: '100%' }}>{tagContent}</Space>;
      },
    },
    {
      title: "สถานะ",
      key: "status",
      width: 120,
      render: (_, record) => {
        const status = getEntryStatus(record);
        return renderStatusBadge(status);
      },
    },
    {
      title: "Actions",
      key: "actions",
      width: 100,
      render: (_, record) => {
        const isDateInFuture = isFutureDate(record.workDate);
        
        return (
          <Space>
            <Button 
              type="link" 
              icon={<EyeOutlined />} 
              onClick={() => onView(record)} 
            />
            <Tooltip 
              title={isDateInFuture ? "ไม่สามารถบันทึกข้อมูลล่วงหน้าได้" : ""} 
            >
              <Button 
                type="link" 
                icon={<EditOutlined />} 
                onClick={() => onEdit(record)}
                disabled={isDateInFuture}
                style={isDateInFuture ? { color: '#ccc', cursor: 'not-allowed' } : {}}
              />
            </Tooltip>
          </Space>
        );
      },
    },
  ];

  return (
    <div className={styles.timesheetTableWrapper}>
      <div className={styles.timesheetActions}>
        <Tooltip title={!hasUnapprovedLogs ? "ไม่มีรายการที่รอการอนุมัติ หรือข้อมูลไม่ครบถ้วน" : ""}>
          <Button
            type="primary"
            icon={<SendOutlined />}
            onClick={showApprovalModal}
            disabled={!hasUnapprovedLogs}
          >
            ส่งคำขออนุมัติผ่านอีเมล
          </Button>
        </Tooltip>
      </div>
      
      <Table 
        columns={columns} 
        dataSource={tableData}
        loading={loading}
        rowKey={record => record.key}
        style={{ minWidth: '800px' }} 
        pagination={{
          pageSize: 10,
          showSizeChanger: false,
          position: ['bottomCenter'],
          showTotal: (total, range) => `${range[0]}-${range[1]} จาก ${total} วัน`,
          locale: {
            prev_page: 'หน้าก่อนหน้า',
            next_page: 'หน้าถัดไป',
            jump_to: 'ไปที่หน้า',
            jump_to_confirm: 'ยืนยัน'
          }
        }} 
      />
      
      <Modal
        title="ส่งคำขออนุมัติผ่านอีเมล"
        open={approvalModalVisible}
        onCancel={handleCancel}
        footer={[
          <Button key="back" onClick={handleCancel}>
            ยกเลิก
          </Button>,
          <Button 
            key="submit" 
            type="primary" 
            loading={loadingApproval} 
            onClick={handleSubmitApproval}
            icon={<SendOutlined />}
          >
            ส่งคำขออนุมัติ
          </Button>,
        ]}
      >
        <Form form={form} layout="vertical">
          <Form.Item label="ประเภทการขออนุมัติ" name="requestType">
            <Select 
              defaultValue={requestType} 
              onChange={setRequestType}
            >
              <Option value="full">ทั้งหมด (ที่ยังไม่ได้รับการอนุมัติ)</Option>
              <Option value="weekly">รายสัปดาห์</Option>
              {/* <Option value="monthly">รายเดือน</Option> */}
              {/* <Option value="selected">เลือกเฉพาะรายการ</Option> */}
            </Select>
          </Form.Item>
          
          {requestType === 'weekly' && (
            <Form.Item 
              label="เลือกช่วงวันที่ (สัปดาห์)"
              name="dateRange"
              rules={[{ required: true, message: 'กรุณาเลือกช่วงวันที่' }]}
            >
              <RangePicker style={{ width: '100%' }} />
            </Form.Item>
          )}
        </Form>

        <div style={{ marginTop: 16 }}>
          <Alert
            message="หมายเหตุ"
            description={
              <ul style={{ paddingLeft: 20, margin: 0 }}>
                <li>ระบบจะส่งอีเมลไปยังหัวหน้างานที่ระบุไว้ในแบบฟอร์ม คพ.05</li>
                <li>หัวหน้างานสามารถอนุมัติหรือปฏิเสธคำขอผ่านลิงก์ในอีเมลโดยตรง</li>
                <li>คำขออนุมัติจะหมดอายุหลังจาก 7 วัน</li>
              </ul>
            }
            type="info"
            showIcon
          />
        </div>
      </Modal>
    </div>
  );
};

export default TimeSheetTable;