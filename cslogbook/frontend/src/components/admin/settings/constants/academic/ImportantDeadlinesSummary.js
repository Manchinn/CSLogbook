import React, { useMemo, useState } from 'react';
import {
  Card,
  Typography,
  Select,
  Button,
  Table,
  Tag,
  Space,
  Checkbox,
  Divider,
  message
} from 'antd';
import {
  DownloadOutlined,
  ReloadOutlined,
  FilterOutlined,
  PlusCircleOutlined,
  RedoOutlined
} from '@ant-design/icons';
import dayjs from '../../../../../utils/dayjs';
import pdfService from '../../../../../services/PDFServices/PDFService';
import ImportantDeadlinesReport from './pdf/ImportantDeadlinesReport';
import {
  DEADLINE_CATEGORY_OPTIONS,
  ALL_DEADLINE_CATEGORY_KEYS,
  DEADLINE_CATEGORY_OTHERS_KEY,
  DEADLINE_CATEGORY_OTHERS_LABEL,
  mapDeadlineToCategory,
  getCategoryLabel
} from './deadlineCategories';

const { Title, Text } = Typography;

const SEMESTER_OPTIONS = [
  { value: null, label: 'ทุกภาคเรียน' },
  { value: 1, label: 'ภาคเรียนที่ 1' },
  { value: 2, label: 'ภาคเรียนที่ 2' },
  { value: 3, label: 'ภาคฤดูร้อน' }
];

const CATEGORY_BADGE_COLOR = {
  project_sem1: 'blue',
  project_sem2: 'magenta',
  internship: 'green',
  [DEADLINE_CATEGORY_OTHERS_KEY]: 'default'
};

const DEADLINE_TYPE_LABEL = {
  SUBMISSION: 'ส่งเอกสาร',
  ANNOUNCEMENT: 'ประกาศ',
  MANUAL: 'ทำรายการ',
  MILESTONE: 'เหตุการณ์'
};

const formatSemesterLabel = (semester) => {
  if (!semester) return 'ทุกภาคเรียน';
  if (semester === 3) return 'ภาคฤดูร้อน';
  return `ภาคเรียนที่ ${semester}`;
};

const formatTime = (timeStr) => {
  if (!timeStr) return '';
  const [hour = '00', minute = '00'] = timeStr.split(':');
  return `${hour}:${minute}`;
};

const buildScheduleText = (deadline) => {
  const startDate = deadline.windowStartDate || null;
  const endDate = deadline.windowEndDate || null;
  const singleDate = deadline.deadlineDate || null;

  if (startDate && endDate) {
    const start = dayjs(startDate).format('D MMM BBBB');
    const end = dayjs(endDate).format('D MMM BBBB');
    if (deadline.allDay) {
      return `${start} - ${end} (ทั้งวัน)`;
    }
    const startTime = formatTime(deadline.windowStartTime) || '00:00';
    const endTime = formatTime(deadline.windowEndTime) || '23:59';
    return `${start} ${startTime} น. - ${end} ${endTime} น.`;
  }

  if (singleDate) {
    const dateText = dayjs(singleDate).format('D MMMM BBBB');
    const timeText = formatTime(deadline.deadlineTime);
    return `${dateText}${timeText ? ` เวลา ${timeText} น.` : ''}`;
  }

  return '-';
};

const buildStatusText = (deadline) => {
  const statusSegments = [];
  statusSegments.push(deadline.acceptingSubmissions ? 'เปิดรับ' : 'ปิดรับ');
  statusSegments.push(deadline.isPublished ? 'เผยแพร่แล้ว' : 'ยังไม่เผยแพร่');
  if (deadline.deadlineType === 'SUBMISSION') {
    statusSegments.push(deadline.allowLate ? 'อนุญาตส่งช้า' : 'ไม่อนุญาตส่งช้า');
    statusSegments.push(deadline.lockAfterDeadline ? 'ล็อกหลังหมดเวลา' : 'ไม่ล็อก');
  }
  return statusSegments.join(' / ');
};

const ImportantDeadlinesSummary = ({
  academicYearFilter,
  onAcademicYearChange,
  onResetAcademicYear,
  semesterFilter,
  onSemesterChange,
  deadlines = [],
  loading = false,
  onRefresh,
  onEditDeadline,
  onCreateDeadline
}) => {
  const [selectedCategories, setSelectedCategories] = useState(ALL_DEADLINE_CATEGORY_KEYS);

  const academicYearOptions = useMemo(() => {
    const years = new Set();
    (deadlines || []).forEach((deadline) => {
      if (deadline?.academicYear) {
        years.add(deadline.academicYear);
      }
    });
    if (academicYearFilter) {
      years.add(academicYearFilter);
    }
    const sorted = Array.from(years).sort((a, b) => Number(b) - Number(a));
    return sorted.map((year) => ({ value: year, label: `${year}` }));
  }, [deadlines, academicYearFilter]);

  const filteredDeadlines = useMemo(() => {
    const allowedSet = new Set(selectedCategories);
    return (deadlines || []).filter((deadline) => {
      const categoryKey = mapDeadlineToCategory(deadline);
      if (categoryKey === DEADLINE_CATEGORY_OTHERS_KEY) {
        return allowedSet.has(DEADLINE_CATEGORY_OTHERS_KEY);
      }
      return allowedSet.has(categoryKey);
    });
  }, [deadlines, selectedCategories]);

  const enhancedRows = useMemo(() => {
    return filteredDeadlines
      .map((deadline) => {
        const categoryKey = mapDeadlineToCategory(deadline);
        const categoryLabel = getCategoryLabel(categoryKey);
        const typeLabel = DEADLINE_TYPE_LABEL[deadline.deadlineType] || deadline.deadlineType || '-';
        const scheduleText = buildScheduleText(deadline);
        const statusText = buildStatusText(deadline);
        const effectiveDate = deadline.windowEndDate || deadline.deadlineDate || null;
        const effectiveTime = deadline.windowEndTime || deadline.deadlineTime || null;
        const effectiveDateObj = effectiveDate ? dayjs(effectiveDate) : null;
        return {
          ...deadline,
          key: deadline.id || `${deadline.name}-${deadline.semester}`,
          categoryKey,
          categoryLabel,
          deadlineTypeLabel: typeLabel,
          scheduleText,
          statusText,
          academicYearDisplay: deadline.academicYear
            ? `${deadline.academicYear} / ${formatSemesterLabel(deadline.semester)}`
            : formatSemesterLabel(deadline.semester),
          effectiveSortValue: effectiveDateObj ? effectiveDateObj.valueOf() : 0,
          effectiveTimeSortValue: effectiveTime ? formatTime(effectiveTime) : ''
        };
      })
      .sort((a, b) => {
        if (a.effectiveSortValue === b.effectiveSortValue) {
          return a.effectiveTimeSortValue.localeCompare(b.effectiveTimeSortValue);
        }
        return a.effectiveSortValue - b.effectiveSortValue;
      });
  }, [filteredDeadlines]);

  const columns = useMemo(() => [
    {
      title: 'กิจกรรม',
      dataIndex: 'name',
      key: 'name',
      ellipsis: true
    },
    {
      title: 'หมวด',
      dataIndex: 'categoryLabel',
      key: 'category',
      width: 200,
      render: (_, record) => (
        <Tag color={CATEGORY_BADGE_COLOR[record.categoryKey] || 'default'}>{record.categoryLabel}</Tag>
      )
    },
    {
      title: 'ปีการศึกษา / ภาค',
      dataIndex: 'academicYearDisplay',
      key: 'year',
      width: 200
    },
    {
      title: 'กำหนดการ',
      dataIndex: 'scheduleText',
      key: 'schedule',
      ellipsis: true
    },
    {
      title: 'สถานะ',
      key: 'status',
      width: 220,
      render: (_, record) => (
        <Space size={4} wrap>
          <Tag color={record.acceptingSubmissions ? 'green' : 'red'}>
            {record.acceptingSubmissions ? 'เปิดรับ' : 'ปิดรับ'}
          </Tag>
          <Tag color={record.isPublished ? 'blue' : 'default'}>
            {record.isPublished ? 'เผยแพร่แล้ว' : 'ร่าง'}
          </Tag>
          {record.deadlineType === 'SUBMISSION' && (
            <>
              <Tag color={record.allowLate ? 'orange' : 'default'}>
                {record.allowLate ? 'อนุญาตส่งช้า' : 'ไม่อนุญาตส่งช้า'}
              </Tag>
              <Tag color={record.lockAfterDeadline ? 'purple' : 'default'}>
                {record.lockAfterDeadline ? 'ล็อกหลังหมดเวลา' : 'ไม่ล็อก'}
              </Tag>
            </>
          )}
        </Space>
      )
    },
    {
      title: 'ประเภท',
      dataIndex: 'deadlineTypeLabel',
      key: 'type',
      width: 140
    },
    {
      title: 'การจัดการ',
      key: 'actions',
      width: 110,
      render: (_, record) => (
        <Button type="link" onClick={() => onEditDeadline?.(record)}>
          แก้ไข
        </Button>
      )
    }
  ], [onEditDeadline]);

  const handleExportPDF = async () => {
    if (!enhancedRows.length) {
      message.info('ไม่มีข้อมูลสำหรับส่งออก PDF');
      return;
    }

    const exportRows = enhancedRows.map((row) => ({
      id: row.id,
      name: row.name,
      categoryLabel: row.categoryLabel,
      academicYearDisplay: row.academicYearDisplay,
      scheduleText: row.scheduleText,
      statusText: row.statusText,
      deadlineTypeLabel: row.deadlineTypeLabel
    }));

    const meta = {
      academicYearLabel: academicYearFilter || 'ทั้งหมด',
      semesterLabel: formatSemesterLabel(semesterFilter),
      categorySummary: selectedCategories
        .map((key) => getCategoryLabel(key))
        .join(', '),
      generatedAt: dayjs().format('D MMMM BBBB HH:mm น.')
    };

    try {
      await pdfService.generateAndDownload(
        <ImportantDeadlinesReport records={exportRows} meta={meta} />,
        `กำหนดการสำคัญ_${meta.academicYearLabel || 'ทั้งหมด'}`
      );
      message.success('ส่งออก PDF สำเร็จ');
    } catch (error) {
      message.error(error.message || 'ไม่สามารถส่งออก PDF ได้');
    }
  };

  const handleCategoryChange = (values) => {
    if (!values.length) {
      message.warning('กรุณาเลือกอย่างน้อยหนึ่งหมวดหมู่');
      return;
    }
    setSelectedCategories(values);
  };

  return (
    <Card className="settings-card" title={<Title level={5}>ตารางสรุปกำหนดการสำคัญ</Title>}>
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        <div>
          <Space size="small" direction="vertical" style={{ width: '100%' }}>
            <Text type="secondary">
              เลือกปีการศึกษาและภาคเรียนเพื่อกรองรายการ พร้อมส่งออกเป็นไฟล์ PDF ได้ทันที
            </Text>
            <Space wrap>
              <Select
                style={{ minWidth: 160 }}
                placeholder="เลือกปีการศึกษา"
                value={academicYearFilter ?? null}
                onChange={(value) => onAcademicYearChange?.(value ?? null)}
                options={[{ value: null, label: 'ทุกปีการศึกษา' }, ...academicYearOptions]}
                allowClear
              />
              <Select
                style={{ minWidth: 160 }}
                placeholder="เลือกภาคเรียน"
                value={semesterFilter ?? null}
                onChange={(value) => onSemesterChange?.(value ?? null)}
                options={SEMESTER_OPTIONS}
              />
              <Button icon={<RedoOutlined />} onClick={onResetAcademicYear}>
                ใช้ปีปัจจุบัน
              </Button>
              <Button icon={<ReloadOutlined />} onClick={onRefresh}>
                รีเฟรชข้อมูล
              </Button>
            </Space>
          </Space>
        </div>

        <div>
          <Divider orientation="left" plain>
            <FilterOutlined /> หมวดหมู่กิจกรรม
          </Divider>
          <Checkbox.Group
            options={DEADLINE_CATEGORY_OPTIONS}
            value={selectedCategories}
            onChange={handleCategoryChange}
          />
        </div>

        <Space style={{ width: '100%', justifyContent: 'space-between' }}>
          <Text>
            แสดง {enhancedRows.length} รายการ
            {selectedCategories.includes(DEADLINE_CATEGORY_OTHERS_KEY) &&
              ` (รวม ${DEADLINE_CATEGORY_OTHERS_LABEL})`}
          </Text>
          <Space>
            <Button type="primary" icon={<PlusCircleOutlined />} onClick={onCreateDeadline}>
              เพิ่มกำหนดการใหม่
            </Button>
            <Button icon={<DownloadOutlined />} onClick={handleExportPDF}>
              ส่งออก PDF
            </Button>
          </Space>
        </Space>

        <Table
          columns={columns}
          dataSource={enhancedRows}
          loading={loading}
          pagination={{ pageSize: 6, showSizeChanger: false }}
          scroll={{ x: 960 }}
          rowKey={(record) => record.id || record.key}
          size="middle"
        />
      </Space>
    </Card>
  );
};

export default ImportantDeadlinesSummary;
