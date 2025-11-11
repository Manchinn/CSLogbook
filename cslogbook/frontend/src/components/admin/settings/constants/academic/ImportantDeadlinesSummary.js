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
  Tabs,
  message,
  
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

const { Title, Text, Paragraph } = Typography;

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

const PROJECT_CATEGORY_KEYS = new Set(['project_sem1', 'project_sem2']);

const buildReportTitle = (categoryKeys = []) => {
  const selections = new Set(categoryKeys);
  const sections = [];

  const hasProject = [...PROJECT_CATEGORY_KEYS].some((key) => selections.has(key));
  if (hasProject) {
    sections.push('โครงงานพิเศษและปริญญานิพนธ์');
  }

  if (selections.has('internship')) {
    sections.push('การฝึกงานประจำปี');
  }

  if (selections.has(DEADLINE_CATEGORY_OTHERS_KEY)) {
    sections.push('กิจกรรมอื่นๆ');
  }

  if (!sections.length) {
    return 'กำหนดการสำคัญ';
  }

  return `กำหนดการ${sections.join(' และ ')}`;
};

const formatSemesterLabel = (semester) => {
  if (!semester) return 'ทุกภาคเรียน';
  if (semester === 3) return 'ภาคฤดูร้อน';
  return `ภาคเรียนที่ ${semester}`;
};

const formatTime = (timeStr) => {
  if (!timeStr) return '';
  const [hour = '00', minute = '00'] = timeStr.split(':');
  return `${hour.padStart(2, '0')}:${minute.padStart(2, '0')}`;
};

const formatDisplayTime = (timeStr) => {
  const normalized = formatTime(timeStr);
  if (!normalized) return '';
  const [hour, minute] = normalized.split(':');
  return `${hour}.${minute}`;
};

const buildDetailedScheduleText = (deadline) => {
  const startDate = deadline.windowStartDate || null;
  const endDate = deadline.windowEndDate || null;
  const singleDate = deadline.deadlineDate || null;

  if (startDate && endDate) {
    const start = dayjs(startDate);
    const end = dayjs(endDate);
    const sameDay = start.isSame(end, 'day');
    const startLabel = start.format('D MMMM');
    const endLabel = end.format('D MMMM BBBB');
    const sameMonthAndYear = start.month() === end.month() && start.year() === end.year();

    if (sameDay) {
      const dateText = start.format('ddddที่ D MMMM BBBB');
      if (deadline.allDay) {
        return `${dateText} (ทั้งวัน)`;
      }
      const startTime = formatDisplayTime(deadline.windowStartTime || '00:00');
      const endTime = formatDisplayTime(deadline.windowEndTime || '23:59');
      return `${dateText} เวลา ${startTime} - ${endTime} น.`;
    }

    let rangeText;
    if (sameMonthAndYear) {
      rangeText = `วันที่ ${start.format('D')} ถึง ${endLabel}`;
    } else if (start.year() === end.year()) {
      rangeText = `วันที่ ${startLabel} ถึง ${endLabel}`;
    } else {
      rangeText = `วันที่ ${start.format('D MMMM BBBB')} ถึง ${endLabel}`;
    }

    if (deadline.allDay || (!deadline.windowStartTime && !deadline.windowEndTime)) {
      return rangeText;
    }

    const startTime = formatDisplayTime(deadline.windowStartTime || '00:00');
    const endTime = formatDisplayTime(deadline.windowEndTime || '23:59');
    return `${rangeText} เวลา ${startTime} - ${endTime} น.`;
  }

  if (singleDate) {
    const dateText = dayjs(singleDate).format('ddddที่ D MMMM BBBB');
    const timeText = formatDisplayTime(deadline.deadlineTime || (deadline.allDay ? '' : null));
    if (timeText) {
      return `${dateText} ภายในเวลา ${timeText} น.`;
    }
    if (deadline.allDay) {
      return `${dateText} (ทั้งวัน)`;
    }
    return dateText;
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
  onCreateDeadline,
  manualScheduleDeadlines = []
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

  const manualDeadlineRows = useMemo(() => {
    const allowedSet = new Set(selectedCategories);

    return (manualScheduleDeadlines || [])
      .filter((item) => {
        if (!item) return false;

        const semesterMatch =
          !semesterFilter ||
          !item.semester ||
          Number(item.semester) === Number(semesterFilter);

        const yearMatch =
          !academicYearFilter ||
          !item.academicYear ||
          Number(item.academicYear) === Number(academicYearFilter);

        let categoryKey = item.category;
        if (!categoryKey || !DEADLINE_CATEGORY_OPTIONS.some((opt) => opt.value === categoryKey)) {
          categoryKey = DEADLINE_CATEGORY_OTHERS_KEY;
        }

        return (
          semesterMatch &&
          yearMatch &&
          allowedSet.has(categoryKey)
        );
      })
      .map((item) => {
        const categoryKey = item.category || DEADLINE_CATEGORY_OTHERS_KEY;
        const categoryLabel = getCategoryLabel(categoryKey);
        const typeLabel = 'ช่วงเวลา';

        const startDate = item.start ? dayjs(item.start) : null;
        const endDate = item.end ? dayjs(item.end) : null;

        let scheduleText = '-';
        if (startDate && endDate) {
          const sameDay = startDate.isSame(endDate, 'day');
          const startLabel = startDate.format('D MMMM BBBB');
          const endLabel = endDate.format('D MMMM BBBB');
          scheduleText = sameDay
            ? `วันที่ ${startLabel}`
            : `วันที่ ${startLabel} ถึง ${endLabel}`;
        }

        return {
          key: item.id,
          name: item.name || '-',
          categoryKey,
          categoryLabel,
          academicYear: item.academicYear,
          semester: item.semester,
          deadlineTypeLabel: typeLabel,
          scheduleText,
          detailedScheduleText: scheduleText,
          statusText: 'ตั้งค่าจากหน้า ขั้นตอนที่ 3',
          notesText: 'ยังไม่บันทึกในระบบกำหนดการ (Draft)',
          description: item.description || '',
          academicYearDisplay: item.academicYear
            ? `${item.academicYear} / ${formatSemesterLabel(item.semester)}`
            : formatSemesterLabel(item.semester),
          effectiveSortValue: endDate ? endDate.valueOf() : 0,
          effectiveTimeSortValue: '',
        };
      });
  }, [
    manualScheduleDeadlines,
    selectedCategories,
    semesterFilter,
    academicYearFilter,
  ]);

  const enhancedRows = useMemo(() => {
    return [...filteredDeadlines]
      .map((deadline) => {
        const categoryKey = mapDeadlineToCategory(deadline);
        const categoryLabel = getCategoryLabel(categoryKey);
        const typeLabel = DEADLINE_TYPE_LABEL[deadline.deadlineType] || deadline.deadlineType || '-';
        const scheduleText = buildDetailedScheduleText(deadline);
        const statusText = buildStatusText(deadline);
    const effectiveDate = deadline.windowEndDate || deadline.deadlineDate || null;
    const effectiveTime = deadline.windowEndTime || deadline.deadlineTime || null;
    const effectiveDateObj = effectiveDate ? dayjs(effectiveDate) : null;
    const notesText = deadline.description?.trim() || '';
        return {
          ...deadline,
          key: deadline.id || `${deadline.name}-${deadline.semester}`,
          categoryKey,
          categoryLabel,
          deadlineTypeLabel: typeLabel,
          scheduleText,
          statusText,
          detailedScheduleText: scheduleText,
          notesText,
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

  const summaryColumns = useMemo(() => [
    {
      title: 'กิจกรรม',
      dataIndex: 'name',
      key: 'name',
      width: 320,
      render: (_, record) => (
        <Space direction="vertical" size={6}>
          <Text strong>{record.name}</Text>
          <Space size={4} wrap>
            <Tag color={CATEGORY_BADGE_COLOR[record.categoryKey] || 'default'}>
              {record.categoryLabel}
            </Tag>
            <Tag color="geekblue">{record.deadlineTypeLabel}</Tag>
            <Tag color="cyan">{record.academicYearDisplay}</Tag>
          </Space>
          <Button type="link" onClick={() => onEditDeadline?.(record)} size="small">
            แก้ไขรายละเอียด
          </Button>
        </Space>
      )
    },
    {
      title: 'วันที่',
      dataIndex: 'detailedScheduleText',
      key: 'schedule',
      width: 320,
      render: (text) => (
        <Paragraph style={{ marginBottom: 0 }}>{text}</Paragraph>
      )
    },
    {
      title: 'หมายเหตุ',
      dataIndex: 'notesText',
      key: 'notes',
      render: (text, record) => (
        <Space direction="vertical" size={4} style={{ width: '100%' }}>
          <Paragraph style={{ marginBottom: 0 }}>
            {text || '-'}
          </Paragraph>
          {!record.description && record.statusText && (
            <Text type="secondary">{record.statusText}</Text>
          )}
        </Space>
      )
    }
  ], [onEditDeadline]);

  const fullColumns = useMemo(() => [
    {
      title: 'ลำดับ',
      key: 'index',
      width: 80,
      align: 'center',
      render: (_, __, index) => index + 1
    },
    {
      title: 'กิจกรรม',
      dataIndex: 'name',
      key: 'name',
      width: 300,
      render: (_, record) => (
        <Space direction="vertical" size={6}>
          <Text strong>{record.name}</Text>
          {record.description && (
            <Text type="secondary">{record.description}</Text>
          )}
          <Button type="link" onClick={() => onEditDeadline?.(record)} size="small">
            แก้ไขรายละเอียด
          </Button>
        </Space>
      )
    },
    {
      title: 'หมวด',
      dataIndex: 'categoryLabel',
      key: 'category',
      width: 180,
      render: (_, record) => (
        <Tag color={CATEGORY_BADGE_COLOR[record.categoryKey] || 'default'}>
          {record.categoryLabel}
        </Tag>
      )
    },
    {
      title: 'ปี / ภาค',
      dataIndex: 'academicYearDisplay',
      key: 'academicYear',
      width: 160
    },
    {
      title: 'กำหนดการ',
      dataIndex: 'scheduleText',
      key: 'scheduleText',
      width: 260,
      render: (text) => <Paragraph style={{ marginBottom: 0 }}>{text}</Paragraph>
    },
    {
      title: 'สถานะ',
      dataIndex: 'statusText',
      key: 'statusText',
      width: 220,
      render: (text) => (
        <Paragraph style={{ marginBottom: 0 }}>{text}</Paragraph>
      )
    },
    {
      title: 'ประเภท',
      dataIndex: 'deadlineTypeLabel',
      key: 'deadlineTypeLabel',
      width: 160,
      render: (text) => (
        <Tag color="geekblue">{text}</Tag>
      )
    },
    {
      title: 'หมายเหตุ',
      dataIndex: 'notesText',
      key: 'fullNotes',
      render: (text, record) => (
        <Space direction="vertical" size={4} style={{ width: '100%' }}>
          <Paragraph style={{ marginBottom: 0 }}>{text || '-'}</Paragraph>
          {!record.description && record.statusText && (
            <Text type="secondary">{record.statusText}</Text>
          )}
        </Space>
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
      activity: row.name,
      dateDetail: row.detailedScheduleText,
      note: row.description?.trim() || row.statusText || '-'
    }));

    const meta = {
      academicYearLabel: academicYearFilter || 'ทั้งหมด',
      semesterLabel: formatSemesterLabel(semesterFilter),
      categorySummary: selectedCategories
        .map((key) => getCategoryLabel(key))
        .join(', '),
      generatedAt: dayjs().format('D MMMM BBBB HH:mm น.'),
      periodLabel:
        academicYearFilter && semesterFilter
          ? `ภาคการศึกษาที่ ${semesterFilter}/${academicYearFilter}`
          : academicYearFilter
            ? `ปีการศึกษา ${academicYearFilter}`
            : 'ปีการศึกษาทั้งหมด',
      title: buildReportTitle(selectedCategories)
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
            แสดง {enhancedRows.length + manualDeadlineRows.length} รายการ
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

        <Tabs
          defaultActiveKey="summary"
          items={[
            {
              key: 'summary',
              label: 'มุมมองสรุป',
              children: (
                <Table
                  columns={summaryColumns}
                  dataSource={[...manualDeadlineRows, ...enhancedRows]}
                  loading={loading}
                  pagination={{ pageSize: 6, showSizeChanger: false }}
                  scroll={{ x: 960 }}
                  rowKey={(record) => record.id || record.key}
                  size="middle"
                />
              )
            },
            {
              key: 'full',
              label: 'มุมมองตารางเต็ม',
              children: (
                <Table
                  columns={fullColumns}
                  dataSource={[...manualDeadlineRows, ...enhancedRows]}
                  loading={loading}
                  pagination={false}
                  scroll={{ x: 'max-content' }}
                  rowKey={(record) => record.id || record.key}
                  size="middle"
                />
              )
            }
          ]}
        />
      </Space>
    </Card>
  );
};

export default ImportantDeadlinesSummary;
