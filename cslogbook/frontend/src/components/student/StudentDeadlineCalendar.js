import React, { useMemo, useState } from "react";
import {
  Calendar,
  Badge,
  Select,
  Spin,
  Tooltip,
  Divider,
  Tag,
  Card,
  Typography,
  Space,
  Button,
} from "antd";
import useAllDeadlines from "../../hooks/useAllDeadlines";
import dayjs from "../../utils/dayjs";
// NOTE: deadlines ที่มาจาก hook ผ่าน normalize แล้ว มี deadline_at_local, effective_deadline_local, isWindow, windowStartDate/EndDate legacy และ submittedAtLocal
import DeadlineBadge from "../deadlines/DeadlineBadge";
import { computeDeadlineStatus } from "../../utils/deadlineUtils";

const SUBMISSION_STATUS_META = Object.freeze({
  pending: { label: "รอพิจารณา", color: "gold" },
  reviewing: { label: "กำลังตรวจสอบ", color: "gold" },
  in_review: { label: "กำลังตรวจสอบ", color: "gold" },
  approved: { label: "อนุมัติแล้ว", color: "green" },
  completed: { label: "เสร็จสิ้น", color: "green" },
  accepted: { label: "ยอมรับแล้ว", color: "green" },
  supervisor_evaluated: { label: "อาจารย์ประเมินแล้ว", color: "blue" },
  acceptance_approved: { label: "เจ้าหน้าที่อนุมัติ", color: "cyan" },
  referral_ready: { label: "พร้อมออกหนังสือ", color: "purple" },
  referral_downloaded: { label: "ดาวน์โหลดแล้ว", color: "geekblue" },
  rejected: { label: "ไม่อนุมัติ", color: "red" },
  rescinded: { label: "ยกเลิก", color: "default" }
});

function resolveSubmissionMeta(status) {
  if (!status) return null;
  const normalized = String(status).toLowerCase();
  return SUBMISSION_STATUS_META[normalized] || null;
}

export default function StudentDeadlineCalendar({ audience = 'student' }) {
  const currentYear = dayjs().year();
  const [academicYear, setAcademicYear] = useState(currentYear);
  const { deadlines, loading } = useAllDeadlines({ academicYear, audience });

  // แบ่งกลุ่มตามระบบ
  const grouped = useMemo(() => {
    const g = { internship: [], project: [], general: [] };
    deadlines.forEach(d => {
      const rel = d.relatedTo || 'general';
      if (rel.startsWith('intern')) g.internship.push(d);
      else if (rel.startsWith('project')) g.project.push(d);
      else g.general.push(d);
    });
    return g;
  }, [deadlines]);

  // สร้างแผนที่วันที่ -> deadlines (ขยายช่วง window)
  const dateMap = useMemo(() => {
    const map = {};
    deadlines.forEach(d => {
      // canonical window: มี windowStartAt/windowEndAt (เรายังคงมี legacy windowStartDate เพื่อแสดง)
      if (d.isWindow && d.windowStartDate && d.windowEndDate) {
        const start = dayjs(`${d.windowStartDate} 00:00:00`);
        const end = dayjs(`${d.windowEndDate} 23:59:59`);
        for (let cur = start; cur.isBefore(end) || cur.isSame(end,'day'); cur = cur.add(1,'day')) {
          const key = cur.format('YYYY-MM-DD');
          if (!map[key]) map[key] = [];
          map[key].push({ ...d, _rangePart: true });
        }
      } else {
        // single point: ใช้ legacy deadlineDate ถ้ามี ไม่งั้น derive จาก deadline_at_local
        let dateKey = d.deadlineDate;
        if (!dateKey && d.deadline_at_local) dateKey = d.deadline_at_local.format('YYYY-MM-DD');
        if (dateKey) {
          if (!map[dateKey]) map[dateKey] = [];
          map[dateKey].push(d);
        }
      }
    });
    return map;
  }, [deadlines]);

  // Renamed from dateCellRender to cellRender for Ant Design 5.x compatibility
  function cellRender(current, info) {
    // For calendar cells, we only render content for date cells
    if (info.type !== 'date') return info.originNode;
    
    const dateKey = current.format("YYYY-MM-DD");
    const items = dateMap[dateKey] || [];
    if (!items.length) return null;
    // จัดเรียง: window ก่อน ตามเวลา/ชื่อ
    const sorted = [...items].sort((a, b) => {
      if (a.isWindow && !b.isWindow) return -1;
      if (!a.isWindow && b.isWindow) return 1;
      const ta = a.deadlineTime || a.windowStartTime || "23:59:59";
      const tb = b.deadlineTime || b.windowStartTime || "23:59:59";
      return ta.localeCompare(tb);
    });
    return sorted.slice(0, 4).map(item => {
      const label = item.isWindow ? (item.allDay ? `${item.name || item.title} (ช่วง)` : `${item.name || item.title} (ช่วงเวลา)`) : (item.name || item.title);
      const submissionMeta = resolveSubmissionMeta(item.submission?.status);
      const submittedAtText = item.submittedAtLocal ? item.submittedAtLocal.format("D MMM BBBB เวลา HH:mm น.") : null;
      // กรณี ANNOUNCEMENT ไม่ต้องคำนวณสถานะส่ง เรียก badge สีคงที่
      if (item.deadlineType === 'ANNOUNCEMENT') {
        const tooltipDetail = item.isWindow 
          ? `${item.name || item.title} · ${item.windowStartDate} → ${item.windowEndDate}${item.allDay?' (ทั้งวัน)':''} · ประกาศ`
          : `${item.name || item.title} · ประกาศ`;
        return (
          <div key={item.id} style={{ marginBottom:2 }}>
            <Tooltip title={tooltipDetail}>
              <Badge color="gold" status="warning" text={label} />
            </Tooltip>
          </div>
        );
      }
      // ปกติ: คำนวณสถานะ submission
  const baseLocal = item.deadline_at_local || item.effective_deadline_local || null; // canonical
      const st = computeDeadlineStatus(baseLocal, item.submittedAtLocal, { isSubmitted:item.isSubmitted, isLate:item.isLate, locked:item.locked });
      const colorMap = { pending:'blue', dueSoon:'gold', overdue:'red', submitted:'green', late:'orange', locked:'purple' };
      const dotStatus = st.code === 'overdue' ? 'error' : (st.code === 'dueSoon' ? 'warning' : (st.code === 'locked' ? 'default' : 'processing'));
      const statusSuffixParts = [];
      if (item.isSubmitted) {
        statusSuffixParts.push(submissionMeta?.label || 'ส่งแล้ว');
        if (submittedAtText) statusSuffixParts.push(`ส่งเมื่อ ${submittedAtText}`);
      } else if (item.locked) {
        statusSuffixParts.push(st.label);
      } else if (st.label) {
        statusSuffixParts.push(st.label);
      }
      const statusSuffix = statusSuffixParts.length ? ` · ${statusSuffixParts.join(' · ')}` : '';
      const tooltipDetail = item.isWindow 
        ? `${item.name || item.title} · ${item.windowStartDate} → ${item.windowEndDate}${item.allDay?' (ทั้งวัน)':''}${statusSuffix}`
        : `${item.name || item.title} · ${baseLocal?baseLocal.format('D MMM BBBB เวลา HH:mm น.'):''}${statusSuffix}`;
      return (
        <div key={item.id} style={{ marginBottom:2 }}>
          <Tooltip title={tooltipDetail}>
            <Badge color={colorMap[st.code] || 'blue'} status={dotStatus} text={label} />
          </Tooltip>
        </div>
      );
    });
    // ถ้าเกิน 4 รายการ สามารถเพิ่ม indicator เพิ่มเติมในอนาคต
  }

  const headerRender = ({ value, onChange }) => {
    const current = value.clone();
    const year = current.year();
    const month = current.month();
    const months = Array.from({ length: 12 }, (_, i) =>
      dayjs().month(i).format("MMM")
    );
    return (
      <div
        style={{ padding: 8, display: "flex", gap: 12, alignItems: "center" }}
      >
        <Select
          size="small"
          value={month}
          onChange={(m) => {
            const newVal = value.clone().month(m);
            onChange(newVal);
          }}
          style={{ width: 100 }}
        >
          {months.map((mLabel, idx) => (
            <Select.Option key={idx} value={idx}>
              {mLabel}
            </Select.Option>
          ))}
        </Select>
        <Select
          size="small"
          value={year}
          onChange={(y) => {
            const newVal = value.clone().year(y);
            onChange(newVal);
          }}
          style={{ width: 110 }}
        >
          {[year - 1, year, year + 1].map((y) => (
            <Select.Option key={y} value={y}>
              {y + 543}
            </Select.Option>
          ))}
        </Select>
        <div style={{ marginLeft: "auto", fontWeight: 600 }}>
          {current.format("MMMM")} {year + 543}
        </div>
      </div>
    );
  };

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "24px" }}>
      <Card style={{ paddingTop: 16 }}>
        <Typography.Title level={4} style={{ marginTop: 0 }}>
          📅 ปฏิทินกำหนดการ
        </Typography.Title>
        <Space wrap style={{ marginBottom: 16 }}>
          <Select
            value={academicYear}
            onChange={setAcademicYear}
            style={{ width: 140 }}
            options={generateYearOptions(academicYear)}
          />
          <Button
            onClick={() => setAcademicYear(academicYear)}
            disabled={loading}
            loading={loading}
          >
            รีเฟรช
          </Button>
        </Space>
        {loading ? (
          <Spin />
        ) : (
          <Calendar
            cellRender={cellRender}
            headerRender={headerRender}
          />
        )}
        <Divider />
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 8,
            marginBottom: 16,
          }}
        >
          <Tag color="blue">รอ (ปกติ)</Tag>
          <Tag color="gold">ใกล้ถึงกำหนด (&lt;24ชม.)</Tag>
          {audience !== 'teacher' && (
            <>
              <Tag color="red">เกินกำหนด</Tag>
              <Tag color="green">ส่งแล้ว</Tag>
              <Tag color="orange">ส่งช้า</Tag>
              <Tag color="purple">ปิดรับแล้ว</Tag>
            </>
          )}
        </div>
        <Typography.Title level={5} style={{ marginTop: 0 }}>
          รายละเอียด (จำแนกตามระบบ)
        </Typography.Title>
        {["internship", "project", "general"].map((section) => {
          const list = grouped[section];
          if (!list || !list.length) return null;
          const labelMap = {
            internship: "ระบบฝึกงาน",
            project: "ระบบโครงงานพิเศษ",
            general: "ทั่วไป / ภาพรวม",
          };
          return (
            <div key={section} style={{ marginBottom: 16 }}>
              <div style={{ fontWeight: 600, margin: "4px 0 8px" }}>
                {labelMap[section]} ({list.length})
              </div>
              {list.map((d) => {
                const typeMap = {
                  SUBMISSION: { txt: "ส่งเอกสาร", color: "blue" },
                  ANNOUNCEMENT: { txt: "ประกาศ", color: "gold" },
                  MANUAL: { txt: "ทำรายการ", color: "purple" },
                  MILESTONE: { txt: "เหตุการณ์", color: "cyan" },
                };
                const t = typeMap[d.deadlineType] || {
                  txt: d.deadlineType,
                  color: "default",
                };
                const submissionMeta = resolveSubmissionMeta(d.submission?.status);
                const submittedAtDisplay = d.submittedAtLocal
                  ? d.submittedAtLocal.format("D MMM BBBB เวลา HH:mm น.")
                  : null;
                return (
                  <div
                    key={d.id}
                    style={{
                      borderBottom: "1px solid #eee",
                      padding: "8px 6px",
                      display: "flex",
                      flexDirection: "column",
                      gap: 4,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        flexWrap: "wrap",
                      }}
                    >
                      <strong>
                        {d.name || d.title}
                        {d.isWindow
                          ? d.allDay
                            ? " (ช่วงทั้งวัน)"
                            : " (ช่วงเวลา)"
                          : ""}
                      </strong>
                      <Tag color={t.color}>{t.txt}</Tag>
                      {audience !== 'teacher' && d.deadlineType !== 'ANNOUNCEMENT' && (
                        <>
                          <DeadlineBadge
                            deadline={d.deadline_at_local || d.effective_deadline_local}
                            isSubmitted={d.isSubmitted}
                            isLate={d.isLate}
                            submittedAt={d.submittedAtLocal}
                            locked={d.locked}
                          />
                          {submissionMeta && (
                            <Tag color={submissionMeta.color} variant="borderless">
                              {submissionMeta.label}
                            </Tag>
                          )}
                        </>
                      )}
                    </div>
                    <div style={{ fontSize: 12, opacity: 0.8 }}>
                      {d.isWindow ? (
                        <>
                          ช่วง: {dayjs(d.windowStartDate).format("D MMM BBBB")}{" "}
                          - {dayjs(d.windowEndDate).format("D MMM BBBB")}{" "}
                          {d.allDay ? "(ทั้งวัน)" : ""}
                        </>
                      ) : (
                        d.deadline_th ||
                        (d.deadline_at_local
                          ? d.deadline_at_local.format("D MMM BBBB เวลา HH:mm น.")
                          : (d.effective_deadline_local ? d.effective_deadline_local.format("D MMM BBBB เวลา HH:mm น.") : "—"))
                      )}
                    </div>
                    {submittedAtDisplay && (
                      <div style={{ fontSize: 12, color: "#389e0d" }}>
                        ส่งเมื่อ {submittedAtDisplay}
                      </div>
                    )}
                    {d.description && (
                      <div style={{ fontSize: 12 }}>{d.description}</div>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
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
