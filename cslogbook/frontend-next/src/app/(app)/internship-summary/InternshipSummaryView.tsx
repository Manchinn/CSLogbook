"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useHydrated } from "@/hooks/useHydrated";
import { useStudentInternshipStatus } from "@/hooks/useStudentInternshipStatus";
import { useAcceptanceLetterStatus, useCurrentCS05 } from "@/hooks/useInternshipCompanyInfo";
import { useTimesheetEntries, useTimesheetStats } from "@/hooks/useInternshipLogbook";
import {
  getReflection,
  saveReflection,
  type ReflectionPayload,
  type ReflectionResponse,
  type TimesheetEntry,
} from "@/lib/services/internshipLogbookService";
import {
  getEvaluationStatus,
  sendEvaluationRequest,
  type EvaluationStatus,
} from "@/lib/services/internshipService";
import styles from "./summary.module.css";

const dateFormatter = new Intl.DateTimeFormat("th-TH", { dateStyle: "medium" });

function formatDate(value?: string | null) {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "-";
  return dateFormatter.format(parsed);
}

function formatNumber(value?: number | null) {
  if (value === null || value === undefined) return "-";
  return value.toLocaleString("th-TH", { maximumFractionDigits: 1 });
}

function statusBadge(status?: string | null) {
  if (!status) return "ข้อมูลไม่ครบ";
  if (status === "approved") return "อนุมัติแล้ว";
  if (status === "pending") return "รอดำเนินการ";
  if (status === "rejected") return "ถูกปฏิเสธ";
  if (status === "cancelled") return "ถูกยกเลิก";
  return status;
}

function entryStatusLabel(entry?: TimesheetEntry | null) {
  if (!entry) return "ยังไม่บันทึก";
  if (entry.supervisorApproved === 1 || entry.supervisorApproved === true || entry.advisorApproved) {
    return "อนุมัติแล้ว";
  }
  if (entry.supervisorApproved === -1) return "ถูกปฏิเสธ";
  if (entry.timeIn || entry.workHours) return "บันทึกแล้ว";
  return "ร่าง";
}

export default function InternshipSummaryView() {
  const { token } = useAuth();
  const hydrated = useHydrated();
  const enabled = hydrated && Boolean(token);

  const statusQuery = useStudentInternshipStatus(token, enabled);
  const summary = statusQuery.data?.summary ?? null;
  const statsFromStatus = statusQuery.data?.stats ?? null;

  const cs05Query = useCurrentCS05(token, enabled);
  const cs05 = cs05Query.data;
  const documentId = cs05?.documentId ?? summary?.documentId ?? null;
  const cs05Status = cs05?.status ?? null;

  const acceptanceQuery = useAcceptanceLetterStatus(token, documentId, enabled && Boolean(documentId));
  const acceptanceStatus = acceptanceQuery.data?.acceptanceStatus ?? null;

  const timesheetEntriesQuery = useTimesheetEntries(token, enabled && Boolean(documentId));
  const timesheetStatsQuery = useTimesheetStats(token, enabled && Boolean(documentId));

  const reflectionQuery = useQuery<ReflectionResponse | null, Error>({
    queryKey: ["internship-reflection", token],
    queryFn: () => getReflection(token ?? ""),
    enabled: Boolean(token) && enabled,
    staleTime: 1000 * 60 * 5,
  });

  const evaluationStatusQuery = useQuery<EvaluationStatus | null, Error>({
    queryKey: ["internship-evaluation-status", token],
    queryFn: () => getEvaluationStatus(token ?? ""),
    enabled: Boolean(token) && enabled,
    staleTime: 1000 * 60 * 2,
  });

  const [reflectionDraft, setReflectionDraft] = useState<ReflectionPayload>({
    learningOutcome: "",
    keyLearnings: "",
    futureApplication: "",
    improvements: "",
  });
  const [editingReflection, setEditingReflection] = useState(false);

  const saveReflectionMutation = useMutation({
    mutationFn: async () => {
      if (!token) throw new Error("missing token");
      return saveReflection(token, reflectionDraft);
    },
    onSuccess: () => {
      reflectionQuery.refetch();
      setEditingReflection(false);
    },
  });

  const sendEvaluationMutation = useMutation({
    mutationFn: async () => {
      if (!token) throw new Error("missing token");
      if (!documentId) throw new Error("missing documentId");
      return sendEvaluationRequest(token, documentId);
    },
    onSuccess: () => evaluationStatusQuery.refetch(),
  });

  const reflectionData = reflectionQuery.data ?? null;
  const stats = timesheetStatsQuery.data ?? statsFromStatus ?? null;

  useEffect(() => {
    if (reflectionData && !editingReflection) {
      setReflectionDraft({
        learningOutcome: reflectionData.learningOutcome ?? "",
        keyLearnings: reflectionData.keyLearnings ?? "",
        futureApplication: reflectionData.futureApplication ?? "",
        improvements: reflectionData.improvements ?? "",
      });
    }
  }, [reflectionData, editingReflection]);

  if (!enabled) {
    return <div className={styles.card}>กำลังเตรียมข้อมูล...</div>;
  }

  if (statusQuery.isLoading) {
    return <div className={styles.card}>กำลังโหลดข้อมูลสรุปการฝึกงาน...</div>;
  }

  if (statusQuery.isError) {
    return (
      <div className={`${styles.card} ${styles.calloutDanger}`}>
        โหลดข้อมูลไม่สำเร็จ กรุณาลองใหม่
      </div>
    );
  }

  const guard = (() => {
    if (cs05Query.isLoading) {
      return { title: "กำลังตรวจสอบคำร้อง คพ.05", body: "กรุณารอสักครู่", tone: "info" as const };
    }
    if (!cs05 && !cs05Query.isLoading) {
      return {
        title: "ไม่พบคำร้อง คพ.05",
        body: "ต้องยื่นคำร้องและรออนุมัติจึงจะดูสรุปผลฝึกงานได้",
        tone: "warning" as const,
        actions: [
          { href: "/internship-registration/flow", label: "ยื่นคำร้อง คพ.05" },
          { href: "/dashboard/student", label: "กลับหน้าหลัก" },
        ],
      };
    }
    if (cs05Status && cs05Status !== "approved" && cs05Status !== "cancelled") {
      return {
        title: cs05Status === "pending" ? "คำร้อง คพ.05 รอการอนุมัติ" : "คำร้อง คพ.05 ไม่ผ่าน",
        body:
          cs05Status === "pending"
            ? "กรุณารอผลอนุมัติจากเจ้าหน้าที่"
            : "คำร้องไม่ผ่าน กรุณาตรวจสอบและยื่นใหม่",
        tone: cs05Status === "pending" ? "warning" : "danger" as const,
        actions: [
          { href: "/internship-registration/flow", label: "ดูสถานะคำร้อง" },
        ],
      };
    }
    if (cs05Status === "approved") {
      if (acceptanceQuery.isLoading) {
        return { title: "กำลังตรวจสอบหนังสือตอบรับ", body: "กรุณารอสักครู่", tone: "info" as const };
      }
      if (!acceptanceStatus) {
        return {
          title: "ยังไม่มีหนังสือตอบรับ",
          body: "อัปโหลดหนังสือตอบรับจากบริษัทก่อน",
          tone: "info" as const,
          actions: [
            { href: "/internship-registration/flow", label: "อัปโหลดหนังสือตอบรับ" },
          ],
        };
      }
      if (acceptanceStatus !== "approved") {
        return {
          title: acceptanceStatus === "pending" ? "หนังสือตอบรับรออนุมัติ" : "หนังสือตอบรับถูกปฏิเสธ",
          body:
            acceptanceStatus === "pending"
              ? "รอผลการตรวจสอบจากเจ้าหน้าที่"
              : "กรุณาอัปโหลดไฟล์ใหม่",
          tone: acceptanceStatus === "pending" ? "warning" : "danger" as const,
          actions: [
            { href: "/internship-registration/flow", label: "ดูสถานะ / อัปโหลดใหม่" },
          ],
        };
      }
    }
    return null;
  })();

  if (!summary || guard) {
    return (
      <div className={`${styles.card} ${guard?.tone === "danger" ? styles.calloutDanger : styles.callout}`}>
        <div className={styles.calloutTitle}>{guard?.title ?? "ยังไม่มีข้อมูลสรุปการฝึกงาน"}</div>
        <div className={styles.calloutBody}>
          {guard?.body ?? "กรุณาบันทึกสมุดบันทึกและส่งข้อมูลให้ครบถ้วนเพื่อสร้างสรุป"}
        </div>
        <div className={styles.actions}>
          {(guard?.actions ?? [{ href: "/internship/logbook", label: "ไปที่สมุดบันทึก" }]).map((action) => (
            <Link key={action.href} className={styles.linkButton} href={action.href}>
              {action.label}
            </Link>
          ))}
        </div>
      </div>
    );
  }

  const companyName = summary.companyName || "สถานประกอบการ";
  const supervisorContact = [summary.supervisorPhone, summary.supervisorEmail]
    .filter(Boolean)
    .join(" | ") || "-";

  const entries = timesheetEntriesQuery.data ?? [];
  const averageHours = stats?.averageHoursPerDay ?? null;
  const remainingDays = stats?.remainingDays ?? null;
  const approvedHours = summary.approvedHours ?? 0;
  const completionPct = Math.min(100, Math.round(((approvedHours ?? 0) / 240) * 100));
  const evaluationSent = evaluationStatusQuery.data?.isSent ?? false;

  const canRequestEvaluation = approvedHours >= 240 && !evaluationSent && !sendEvaluationMutation.isPending;

  return (
    <div className={styles.page}>
      <div className={styles.titleBar}>
        <div>
          <div className={styles.overline}>สรุปผลการฝึกงาน</div>
          <h1 className={styles.heading}>{companyName}</h1>
          <p className={styles.subhead}>
            ช่วงฝึกงาน {formatDate(summary.startDate)} - {formatDate(summary.endDate)}
          </p>
        </div>
        <div className={styles.actions}>
          <Link href="/internship/logbook" className={styles.linkButton}>
            เปิดสมุดบันทึก
          </Link>
        </div>
      </div>

      <div className={styles.grid}>
        <div className={styles.card}>
          <div className={styles.label}>ชั่วโมงที่อนุมัติแล้ว</div>
          <div className={styles.statValue}>{formatNumber(summary.approvedHours)}</div>
          <div className={styles.statLabel}>
            จากทั้งหมด {formatNumber(summary.totalHours)} ชั่วโมง
          </div>
        </div>
        <div className={styles.card}>
          <div className={styles.label}>จำนวนวันทำงาน</div>
          <div className={styles.statValue}>{formatNumber(summary.approvedDays)}</div>
          <div className={styles.statLabel}>
            บันทึกทั้งหมด {formatNumber(summary.totalDays)} วัน
          </div>
        </div>
        <div className={styles.card}>
          <div className={styles.label}>ค่าเฉลี่ยชั่วโมง/วัน</div>
          <div className={styles.statValue}>{formatNumber(averageHours)}</div>
          <div className={styles.statLabel}>
            เหลืออีก {formatNumber(remainingDays)} วัน
          </div>
        </div>
      </div>

      <div className={styles.card}>
        <div className={styles.label}>สถานะคำร้อง</div>
        <div className={styles.meta}>คพ.05: {statusBadge(cs05Status)} | หนังสือตอบรับ: {statusBadge(acceptanceStatus)}</div>
        <div className={styles.progressRow}>
          <div className={styles.progressLabel}>ชั่วโมงที่ได้รับอนุมัติ</div>
          <div className={styles.progressBar}>
            <div className={styles.progressFill} style={{ width: `${completionPct}%` }} />
          </div>
          <div className={styles.meta}>{approvedHours} / 240 ชม.</div>
        </div>
      </div>

      <div className={styles.gridWide}>
        <div className={styles.card}>
          <div className={styles.label}>ที่อยู่บริษัท</div>
          <div className={styles.value}>{summary.companyAddress || "-"}</div>
        </div>
        <div className={styles.card}>
          <div className={styles.label}>ผู้ควบคุมงาน</div>
          <div className={styles.value}>{summary.supervisorName || "-"}</div>
          <div className={styles.meta}>{summary.supervisorPosition || ""}</div>
          <div className={styles.meta}>{supervisorContact}</div>
        </div>
      </div>

      <div className={styles.card}>
        <div className={styles.sectionHeader}>
          <div>
            <div className={styles.label}>บทสรุปประสบการณ์</div>
            <div className={styles.meta}>Reflection จากการฝึกงาน</div>
          </div>
          <button
            className={styles.secondaryButton}
            onClick={() => setEditingReflection((v) => !v)}
            type="button"
          >
            {editingReflection ? "ยกเลิก" : "แก้ไข"}
          </button>
        </div>
        {editingReflection ? (
          <form
            className={styles.formGrid}
            onSubmit={(e) => {
              e.preventDefault();
              saveReflectionMutation.mutate();
            }}
          >
            <label className={styles.formField}>
              <span>สิ่งที่ได้เรียนรู้</span>
              <textarea
                value={reflectionDraft.learningOutcome}
                onChange={(e) => setReflectionDraft((p) => ({ ...p, learningOutcome: e.target.value }))}
              />
            </label>
            <label className={styles.formField}>
              <span>ทักษะ/บทเรียนสำคัญ</span>
              <textarea
                value={reflectionDraft.keyLearnings}
                onChange={(e) => setReflectionDraft((p) => ({ ...p, keyLearnings: e.target.value }))}
              />
            </label>
            <label className={styles.formField}>
              <span>การนำไปใช้ในอนาคต</span>
              <textarea
                value={reflectionDraft.futureApplication}
                onChange={(e) => setReflectionDraft((p) => ({ ...p, futureApplication: e.target.value }))}
              />
            </label>
            <label className={styles.formField}>
              <span>สิ่งที่อยากปรับปรุง (ถ้ามี)</span>
              <textarea
                value={reflectionDraft.improvements ?? ""}
                onChange={(e) => setReflectionDraft((p) => ({ ...p, improvements: e.target.value }))}
              />
            </label>
            <div className={styles.actions}>
              <button type="submit" className={styles.linkButton} disabled={saveReflectionMutation.isPending}>
                {saveReflectionMutation.isPending ? "กำลังบันทึก..." : "บันทึกบทสรุป"}
              </button>
            </div>
          </form>
        ) : (
          <div className={styles.value}>
            {reflectionData?.learningOutcome || summary.learningOutcome || "ยังไม่มีข้อมูล"}
          </div>
        )}
      </div>

      <div className={styles.card}>
        <div className={styles.sectionHeader}>
          <div>
            <div className={styles.label}>บันทึกประจำวัน</div>
            <div className={styles.meta}>รายการบันทึกที่ส่งในช่วงฝึกงาน</div>
          </div>
          <Link href="/internship/logbook" className={styles.secondaryButton}>
            จัดการบันทึก
          </Link>
        </div>
        {timesheetEntriesQuery.isLoading ? (
          <div className={styles.meta}>กำลังโหลดบันทึก...</div>
        ) : entries.length === 0 ? (
          <div className={styles.meta}>ยังไม่มีบันทึก</div>
        ) : (
          <div className={styles.table}>
            <div className={styles.tableHead}>
              <span>วันที่</span>
              <span>หัวข้อ</span>
              <span>ชั่วโมง</span>
              <span>สถานะ</span>
            </div>
            {entries.map((entry) => (
              <div key={entry.logId ?? entry.workDate} className={styles.tableRow}>
                <span>{formatDate(entry.workDate)}</span>
                <span>{entry.logTitle || entry.workDescription || "-"}</span>
                <span>{formatNumber(entry.workHours ?? null)}</span>
                <span className={styles.tag}>{entryStatusLabel(entry)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className={styles.card}>
        <div className={styles.sectionHeader}>
          <div>
            <div className={styles.label}>ส่งประเมินไปยังผู้ควบคุมงาน</div>
            <div className={styles.meta}>จำเป็นหลังสะสมชั่วโมงครบ 240</div>
          </div>
          <button
            className={styles.linkButton}
            disabled={!canRequestEvaluation}
            onClick={() => sendEvaluationMutation.mutate()}
            type="button"
          >
            {evaluationSent ? "ส่งคำขอแล้ว" : sendEvaluationMutation.isPending ? "กำลังส่ง..." : "ส่งแบบประเมิน"}
          </button>
        </div>
        <div className={styles.meta}>
          สถานะการส่ง: {evaluationSent ? "ส่งแล้ว" : "ยังไม่ส่ง"}
          {evaluationStatusQuery.data?.sentDate ? ` (ส่งเมื่อ ${formatDate(evaluationStatusQuery.data.sentDate)})` : ""}
        </div>
        <div className={styles.meta} style={{ marginTop: 8 }}>
          ผู้ควบคุมงาน: {summary.supervisorName || "-"} ({summary.supervisorEmail || "ไม่มีอีเมล"})
        </div>
      </div>
    </div>
  );
}
