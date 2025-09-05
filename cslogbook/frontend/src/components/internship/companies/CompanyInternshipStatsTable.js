import React, { useMemo, useState, useCallback } from 'react';
import { Table, Tag, Space, Typography, Button, Modal, List, Skeleton } from 'antd';
import dayjs from '../../../utils/dayjs'; // ใช้ instance ที่ตั้ง locale=th + buddhistEra แล้ว
import { EyeOutlined } from '@ant-design/icons';

// helper แปลงวันที่เป็นรูปแบบไทยย่อ พ.ศ. (ใช้ plugin buddhistEra => BBBB)
const formatThaiDate = (dateStr) => {
  if (!dateStr) return '-';
  const d = dayjs(dateStr);
  if (!d.isValid()) return dateStr;
  return d.format('D MMM BBBB'); // เช่น 5 ก.ย. 2568
};

// ตารางแสดงบริษัท + จำนวนผู้ฝึก + สถานะ capacity
const CompanyInternshipStatsTable = ({ rows = [], meta, loading, onView, role }) => {
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState(null); // {companyName, interns[], loading}

  const handleView = useCallback(async (record) => {
    if (!onView) return;
    setCurrent({ companyName: record.companyName, loading: true, interns: [] });
    setOpen(true);
    try {
      const detail = await onView(record.companyName);
      setCurrent({ companyName: record.companyName, loading: false, interns: detail?.interns || [] });
    } catch (e) {
      setCurrent(prev => ({ ...prev, loading: false, error: e.message || 'โหลดข้อมูลล้มเหลว' }));
    }
  }, [onView]);

  const columns = useMemo(() => [
    {
      title: 'บริษัท',
      dataIndex: 'companyName',
      key: 'companyName',
      sorter: (a,b) => a.companyName.localeCompare(b.companyName)
    },
    {
      title: 'จำนวนนักศึกษา',
      dataIndex: 'totalStudents',
      key: 'totalStudents',
      sorter: (a,b) => a.totalStudents - b.totalStudents,
      render: (val) => <strong>{val}</strong>
    },
    {
      title: 'สถานะ',
      key: 'capacityStatus',
      render: (_, record) => {
        const full = record.capacityStatus === 'full';
        return <Tag color={full ? 'red' : 'green'}>{full ? 'เต็ม' : 'ว่าง'}</Tag>;
      }
    },
    {
      title: 'ดู',
      key: 'actions',
      render: (_, record) => (
        <Button size="small" icon={<EyeOutlined />} onClick={() => handleView(record)}>
          View
        </Button>
      )
    }
  ], [handleView]);
  // handleView ไม่เปลี่ยน reference บ่อยพอเป็น dependency (eslint อนุโลมในกรณี stable props)

  return (
    <Space direction="vertical" style={{ width: '100%' }} size="large">
      <Table
        size="small"
        rowKey={(r) => r.companyName}
        dataSource={rows}
        columns={columns}
        loading={loading}
        pagination={false}
      />
      <Modal
        open={open}
        onCancel={() => setOpen(false)}
        footer={null}
        title={`รายละเอียดผู้ฝึกงาน - ${current?.companyName || ''}`}
        width={600}
      >
        {current?.loading ? (
          <Skeleton active paragraph={{ rows: 4 }} />
        ) : current?.error ? (
          <Typography.Text type="danger">{current.error}</Typography.Text>
        ) : (
          <List
            dataSource={current?.interns || []}
            locale={{ emptyText: 'ยังไม่มีนักศึกษาที่ได้รับการอนุมัติ' }}
            renderItem={(item, idx) => (
              <List.Item>
                <List.Item.Meta
                  title={(() => {
                    const isStudent = role === 'student';
                    if (isStudent) {
                      return `${idx + 1}. ตำแหน่ง: ${item.internshipPosition || '-'}`;
                    }
                    return `${idx + 1}. ${item.firstName} ${item.lastName} (${item.studentCode || item.userId})`;
                  })()}
                  description={(() => {
                    const isStudent = role === 'student';
                    if (isStudent) {
                      return null; // ไม่แสดงรายละเอียดอื่น
                    }
                    return (
                      <div>
                        ตำแหน่ง: {item.internshipPosition || '-'} | ระยะเวลา: {formatThaiDate(item.startDate)} ถึง {formatThaiDate(item.endDate)}
                        {(() => {
                          const days = item.internshipDays || (item.startDate && item.endDate ? dayjs(item.endDate).diff(dayjs(item.startDate), 'day') + 1 : null);
                          return days ? ` (${days} วัน)` : '';
                        })()}
                      </div>
                    );
                  })()}
                />
              </List.Item>
            )}
          />
        )}
      </Modal>
      {meta && meta.totalAllCompanies > meta.totalCompanies && (
        <Typography.Text type="secondary">
          แสดง {meta.totalCompanies} บริษัทแรกจากทั้งหมด {meta.totalAllCompanies}
        </Typography.Text>
      )}
    </Space>
  );
};

export default CompanyInternshipStatsTable;
