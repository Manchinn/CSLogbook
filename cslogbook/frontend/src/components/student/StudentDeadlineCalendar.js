import React, { useEffect, useMemo, useState } from "react";
import {
  Select,
  Spin,
  Divider,
  Card,
  Typography,
  Space,
  Button,
  Table,
} from "antd";
import useAllDeadlines from "../../hooks/useAllDeadlines";
import dayjs from "../../utils/dayjs";
// NOTE: deadlines ที่มาจาก hook ผ่าน normalize แล้ว มี deadline_at_local, effective_deadline_local, isWindow, windowStartDate/EndDate legacy และ submittedAtLocal
import { studentService } from "features/user-management/services/studentService";

export default function StudentDeadlineCalendar({ audience = "student" }) {
  const currentYear = dayjs().year();
  const [academicYear, setAcademicYear] = useState(null);
  const [semester, setSemester] = useState(null);
  const [filterOptions, setFilterOptions] = useState({
    academicYears: [],
    semesters: [],
  });
  const [filtersLoading, setFiltersLoading] = useState(false);
  const { deadlines, loading, reload } = useAllDeadlines({
    academicYear,
    audience,
  });

  // โหลดตัวเลือกปีการศึกษาจริงจาก backend
  useEffect(() => {
    let isMounted = true;

    async function loadFilters() {
      try {
        setFiltersLoading(true);
        const data = await studentService.getFilterOptions();
        if (!isMounted) return;
        setFilterOptions(data || {});

        // ตั้งค่า default ปีการศึกษาเป็นค่าที่ backend ส่งมา
        if (!academicYear && data?.academicYears?.length) {
          const first = data.academicYears[0];
          const yearValue = first.value ?? first;
          setAcademicYear(yearValue);
        } else if (!academicYear) {
          // fallback: ใช้ปีปัจจุบัน (ค.ศ.) ถ้า backend ไม่ส่งมา
          setAcademicYear(currentYear);
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error("Failed to load student filter options", error);
        if (!academicYear) {
          setAcademicYear(currentYear);
        }
      } finally {
        if (isMounted) {
          setFiltersLoading(false);
        }
      }
    }

    loadFilters();

    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ตัวเลือกปีการศึกษาสำหรับ dropdown (ใช้ของจริงจาก backend เป็นหลัก)
  const academicYearOptions = useMemo(() => {
    if (filterOptions.academicYears && filterOptions.academicYears.length) {
      return filterOptions.academicYears.map((y) => ({
        value: y.value ?? y,
        label: y.label ?? String(y.value ?? y),
      }));
    }
    const baseYear = academicYear || currentYear;
    return generateYearOptions(baseYear);
  }, [filterOptions.academicYears, academicYear, currentYear]);

  // filter deadline ตามภาคเรียน (ถ้ามี)
  const filteredDeadlines = useMemo(() => {
    if (!semester) return deadlines;
    const target = Number(semester);
    return deadlines.filter(
      (d) => !d.semester || Number(d.semester) === target
    );
  }, [deadlines, semester]);

  // เตรียมข้อมูลและจัดกลุ่มเป็นหมวด (ใช้ header row แยกหมวด)
  const flatTableData = useMemo(() => {
    const baseRows = filteredDeadlines
      .map((d, index) => {
        const baseLocal =
          d.deadline_at_local || d.effective_deadline_local || null;

        let startLabel = "-";
        let endLabel = "-";

        if (d.isWindow && d.windowStartDate && d.windowEndDate) {
          const start = dayjs(
            `${d.windowStartDate} ${d.windowStartTime || "00:00:00"}`
          );
          const end = dayjs(
            `${d.windowEndDate} ${d.windowEndTime || "23:59:59"}`
          );
          startLabel = start.format("D MMM BBBB HH:mm");
          endLabel = end.format("D MMM BBBB HH:mm");
        } else if (baseLocal) {
          const formatted = baseLocal.format("D MMM BBBB เวลา HH:mm น.");
          startLabel = formatted;
          endLabel = formatted;
        }

        // จัดหมวดตาม relatedTo เพื่อใช้ทำ header กลุ่ม
        const rel = d.relatedTo || "general";
        let systemKey = "general";
        let systemLabel = "กิจกรรมปฏิทินการศึกษา / ทั่วไป";
        if (rel.startsWith("intern")) {
          systemKey = "internship";
          systemLabel = "ระบบฝึกงาน";
        } else if (rel.startsWith("project")) {
          systemKey = "project";
          systemLabel = "ระบบโครงงานพิเศษ";
        }

        return {
          key: d.id || `${d.name}-${index}`,
          order: index + 1,
          systemKey,
          name: d.name || d.title,
          systemLabel,
          startLabel,
          endLabel,
          original: d,
          rawStartSort:
            d.isWindow && d.windowStartDate
              ? dayjs(
                  `${d.windowStartDate} ${d.windowStartTime || "00:00:00"}`
                )
              : baseLocal,
        };
      });

    const sorted = baseRows.sort((a, b) => {
      if (!a.rawStartSort && !b.rawStartSort) return 0;
      if (!a.rawStartSort) return 1;
      if (!b.rawStartSort) return -1;
      return a.rawStartSort.valueOf() - b.rawStartSort.valueOf();
    });

    const SYSTEM_ORDER = ["internship", "project", "general"];

    const groupedRows = [];
    SYSTEM_ORDER.forEach((key) => {
      const rowsInGroup = sorted.filter((r) => r.systemKey === key);
      if (!rowsInGroup.length) return;
      const label = rowsInGroup[0].systemLabel;
      groupedRows.push({
        key: `group-${key}`,
        isGroupHeader: true,
        systemLabel: label,
      });
      groupedRows.push(...rowsInGroup);
    });

    return groupedRows;
  }, [filteredDeadlines]);

  const COLUMN_COUNT = 3;

  const columns = [
    {
      title: "รายการ",
      dataIndex: "name",
      render: (text, record) =>
        record.isGroupHeader ? (
          {
            children: <strong>{record.systemLabel}</strong>,
            props: { colSpan: COLUMN_COUNT },
          }
        ) : (
          text
        ),
    },
    {
      title: "วันเริ่มต้น",
      dataIndex: "startLabel",
      width: 220,
      render: (text, record) =>
        record.isGroupHeader
          ? { children: null, props: { colSpan: 0 } }
          : text,
    },
    {
      title: "วันสิ้นสุด",
      dataIndex: "endLabel",
      width: 220,
      render: (text, record) =>
        record.isGroupHeader
          ? { children: null, props: { colSpan: 0 } }
          : text,
    },
  ];

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "24px" }}>
      <Card style={{ paddingTop: 16 }}>
        <Typography.Title level={4} style={{ marginTop: 0 }}>
          📅 ปฏิทินกำหนดการ
        </Typography.Title>
        <Space wrap style={{ marginBottom: 16 }}>
          <Select
            placeholder="เลือกปีการศึกษา"
            value={academicYear}
            onChange={setAcademicYear}
            style={{ width: 160 }}
            options={academicYearOptions}
            loading={filtersLoading}
          />
          <Select
            allowClear
            placeholder="เลือกภาคเรียน"
            value={semester}
            onChange={setSemester}
            style={{ width: 160 }}
            options={[
              { value: 1, label: "ภาคเรียนที่ 1" },
              { value: 2, label: "ภาคเรียนที่ 2" },
              { value: 3, label: "ภาคฤดูร้อน" },
            ]}
          />
          <Button
            onClick={() => reload()}
            disabled={loading}
            loading={loading}
          >
            รีเฟรช
          </Button>
        </Space>
        <Divider />
        {loading ? (
          <div style={{ textAlign: "center", padding: "24px 0" }}>
            <Spin />
          </div>
        ) : (
          <Table
            columns={columns}
            dataSource={flatTableData}
            pagination={false}
            size="small"
            scroll={{ x: true }}
          />
        )}
      </Card>
    </div>
  );
}

function generateYearOptions(currentYear) {
  const years = [];
  for (let y = currentYear + 1; y >= currentYear - 5; y--) {
    years.push({ value: y, label: String(y + 543) });
  }
  return years;
}
