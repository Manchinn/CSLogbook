import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { Card, Table, Tag, Button, Space, message } from 'antd';
import { internshipApprovalService } from '../../../services/internshipApprovalService';
import dayjs from 'dayjs';

const statusColor = {
  draft: 'default',
  pending: 'gold',
  approved: 'green',
  rejected: 'red'
};

export default function ApproveDocuments() {
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);

  const fetchQueue = async () => {
    setLoading(true);
    try {
      const res = await internshipApprovalService.getHeadQueue();
      if (res.success) {
        setItems(res.data || []);
      } else {
        message.error(res.message || 'ไม่สามารถดึงรายการได้');
      }
    } catch (e) {
      message.error(e.message || 'เกิดข้อผิดพลาดในการดึงรายการ');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, []);

  const handleApprove = useCallback(async (record) => {
    try {
      await internshipApprovalService.approveCS05(record.documentId);
      message.success('อนุมัติสำเร็จ');
      fetchQueue();
    } catch (e) {
      message.error(e.message || 'อนุมัติไม่สำเร็จ');
    }
  }, []);

  const handleReject = useCallback(async (record) => {
    const reason = window.prompt('กรุณาระบุเหตุผลการปฏิเสธ');
    if (!reason) return;
    try {
      await internshipApprovalService.rejectCS05(record.documentId, reason);
      message.success('ปฏิเสธสำเร็จ');
      fetchQueue();
    } catch (e) {
      message.error(e.message || 'ปฏิเสธไม่สำเร็จ');
    }
  }, []);

  const columns = useMemo(() => [
    {
      title: 'รหัสนักศึกษา',
      dataIndex: ['student', 'studentCode'],
      key: 'studentCode'
    },
    {
      title: 'ชื่อนักศึกษา',
      key: 'studentName',
      render: (_, r) => `${r.student?.firstName || ''} ${r.student?.lastName || ''}`.trim()
    },
    {
      title: 'สถานประกอบการ',
      dataIndex: 'companyName',
      key: 'companyName'
    },
    {
      title: 'ช่วงฝึกงาน',
      key: 'period',
      render: (_, r) => {
        const s = r.startDate ? dayjs(r.startDate).format('DD/MM/YYYY') : '-';
        const e = r.endDate ? dayjs(r.endDate).format('DD/MM/YYYY') : '-';
        return `${s} - ${e}`;
      }
    },
    {
      title: 'สถานะ',
      dataIndex: 'status',
      key: 'status',
      render: (v) => <Tag color={statusColor[v] || 'default'}>{v}</Tag>
    },
    {
      title: 'ส่งเมื่อ',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (v) => (v ? dayjs(v).format('DD/MM/YYYY HH:mm') : '-')
    },
    {
      title: 'การทำงาน',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button type="primary" onClick={() => handleApprove(record)}>อนุมัติ</Button>
          <Button danger onClick={() => handleReject(record)}>ปฏิเสธ</Button>
        </Space>
      )
    }
  ], [handleApprove, handleReject]);

  return (
    <Card title="อนุมัติเอกสาร คพ.05" extra={<Button onClick={fetchQueue}>รีเฟรช</Button>}>
      <Table rowKey="documentId" loading={loading} columns={columns} dataSource={items} pagination={{ pageSize: 10 }} />
    </Card>
  );
}
