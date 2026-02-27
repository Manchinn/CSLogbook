"use client";

import { useMemo, useState } from "react";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { env } from "@/lib/config/env";
import {
  getSsoAuthorize,
  getSsoCallback,
  getSsoStatus,
  getSsoUrl,
  refreshAuthToken,
} from "@/lib/api/authService";
import { getAgentSystemStatus, getAgentEmailStats, restartAgent } from "@/lib/services/agentStatusService";
import {
  approveByEmail,
  previewApproveByEmail,
  previewRejectByEmail,
  rejectByEmail,
  getTimesheetApprovalDetails,
  approveTimesheet,
  rejectTimesheet,
} from "@/lib/services/timesheetApprovalService";
import {
  getAdvisorWorkload,
  getDeadlineAcademicYears,
  getDeadlineCompliance,
  getInternshipLogbookCompliance,
  getReportsOverview,
  getStudentDeadlineHistory,
  getWorkflowProgress,
} from "@/lib/services/reportService";
import {
  getAllTimelines,
  getStudentTimeline,
  getWorkflowTimeline,
  initStudentTimeline,
  updateTimelineStep,
  updateWorkflow,
} from "@/lib/services/workflowService";
import { getWorkflowRuntimeStep } from "@/lib/services/workflowStepService";
import { getUploadCsvHistory } from "@/lib/services/adminService";
import { getTemplateDownloadPath } from "@/lib/services/compatibilityService";
import styles from "../settings.module.css";

function toPretty(value: unknown) {
  return JSON.stringify(value ?? null, null, 2);
}

function getBackendBaseUrl() {
  return env.apiUrl.replace(/\/api\/?$/, "");
}

export default function CompatibilityEndpointsPage() {
  const [studentId, setStudentId] = useState("1");
  const [stepId, setStepId] = useState("1");
  const [tokenId, setTokenId] = useState("");
  const [agentId, setAgentId] = useState("1");
  const [workflowType, setWorkflowType] = useState<"internship" | "project">("internship");
  const [year, setYear] = useState("");
  const [semester, setSemester] = useState("");
  const [comment, setComment] = useState("approved via compatibility ui");
  const [result, setResult] = useState<string>("ยังไม่มีผลลัพธ์");
  const [loadingKey, setLoadingKey] = useState<string | null>(null);

  const query = useMemo(
    () => ({
      year: year ? Number(year) : undefined,
      semester: semester ? Number(semester) : undefined,
    }),
    [semester, year]
  );

  const run = async (key: string, fn: () => Promise<unknown>) => {
    setLoadingKey(key);
    try {
      const data = await fn();
      setResult(toPretty(data));
    } catch (error) {
      const message = error instanceof Error ? error.message : "unknown error";
      setResult(toPretty({ error: message }));
    } finally {
      setLoadingKey(null);
    }
  };

  const openTemplate = (kind: "csv" | "excel" | "generic") => {
    window.open(`${getBackendBaseUrl()}${getTemplateDownloadPath(kind)}`, "_blank", "noopener,noreferrer");
  };

  return (
    <RoleGuard roles={["admin", "teacher"]} teacherTypes={["support"]}>
      <div className={styles.page}>
        <header className={styles.header}>
          <h1>Compatibility Endpoints</h1>
          <p className={styles.subtitle}>หน้า UI สำหรับเรียกใช้งาน Do Not Remove endpoints โดยตรงผ่าน service layer</p>
        </header>

        <section className={styles.section}>
          <div className={styles.fieldRow}>
            <label className={styles.field}>
              Student ID
              <input className={styles.input} value={studentId} onChange={(e) => setStudentId(e.target.value)} />
            </label>
            <label className={styles.field}>
              Step ID
              <input className={styles.input} value={stepId} onChange={(e) => setStepId(e.target.value)} />
            </label>
            <label className={styles.field}>
              Token ID
              <input className={styles.input} value={tokenId} onChange={(e) => setTokenId(e.target.value)} />
            </label>
            <label className={styles.field}>
              Agent ID
              <input className={styles.input} value={agentId} onChange={(e) => setAgentId(e.target.value)} />
            </label>
          </div>
          <div className={styles.fieldRow}>
            <label className={styles.field}>
              Workflow
              <select className={styles.select} value={workflowType} onChange={(e) => setWorkflowType(e.target.value as "internship" | "project")}>
                <option value="internship">internship</option>
                <option value="project">project</option>
              </select>
            </label>
            <label className={styles.field}>
              Year
              <input className={styles.input} value={year} onChange={(e) => setYear(e.target.value)} placeholder="เช่น 2026" />
            </label>
            <label className={styles.field}>
              Semester
              <input className={styles.input} value={semester} onChange={(e) => setSemester(e.target.value)} placeholder="1/2/3" />
            </label>
            <label className={styles.field}>
              Comment
              <input className={styles.input} value={comment} onChange={(e) => setComment(e.target.value)} />
            </label>
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHeader}><strong>Auth + SSO</strong></div>
          <div className={styles.actions}>
            <button className={styles.button} onClick={() => run("sso-status", () => getSsoStatus())} disabled={!!loadingKey}>GET /api/auth/sso/status</button>
            <button className={styles.button} onClick={() => run("sso-url", () => getSsoUrl())} disabled={!!loadingKey}>GET /api/auth/sso/url</button>
            <button className={styles.button} onClick={() => run("sso-authorize", () => getSsoAuthorize({ redirectPath: "/app" }))} disabled={!!loadingKey}>GET /api/auth/sso/authorize</button>
            <button className={styles.button} onClick={() => run("sso-callback", () => getSsoCallback({ state: "debug", code: "debug" }))} disabled={!!loadingKey}>GET /api/auth/sso/callback</button>
            <button className={styles.button} onClick={() => run("refresh-token", () => refreshAuthToken())} disabled={!!loadingKey}>POST /api/auth/refresh-token</button>
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHeader}><strong>Agent + Email Approval</strong></div>
          <div className={styles.actions}>
            <button className={styles.button} onClick={() => run("agent-system", () => getAgentSystemStatus())} disabled={!!loadingKey}>GET /api/admin/agent-status</button>
            <button className={styles.button} onClick={() => run("agent-email-stats", () => getAgentEmailStats())} disabled={!!loadingKey}>GET /api/admin/agent-status/email-stats</button>
            <button className={styles.button} onClick={() => run("agent-restart", () => restartAgent(agentId))} disabled={!!loadingKey}>POST /api/admin/agent-status/:id/restart</button>
            <button className={styles.button} onClick={() => run("approval-details", () => getTimesheetApprovalDetails(tokenId))} disabled={!!loadingKey || !tokenId}>GET /api/email-approval/details/:id</button>
            <button className={styles.button} onClick={() => run("email-approve-get", () => previewApproveByEmail(tokenId))} disabled={!!loadingKey || !tokenId}>GET /api/email-approval/email/approve/:id</button>
            <button className={styles.button} onClick={() => run("email-approve-post", () => approveByEmail(tokenId, comment))} disabled={!!loadingKey || !tokenId}>POST /api/email-approval/email/approve/:id</button>
            <button className={styles.button} onClick={() => run("email-reject-get", () => previewRejectByEmail(tokenId))} disabled={!!loadingKey || !tokenId}>GET /api/email-approval/email/reject/:id</button>
            <button className={styles.button} onClick={() => run("email-reject-post", () => rejectByEmail(tokenId, comment))} disabled={!!loadingKey || !tokenId}>POST /api/email-approval/email/reject/:id</button>
            <button className={styles.button} onClick={() => run("web-approve-post", () => approveTimesheet(tokenId, comment))} disabled={!!loadingKey || !tokenId}>POST /api/email-approval/web/approve/:id</button>
            <button className={styles.button} onClick={() => run("web-reject-post", () => rejectTimesheet(tokenId, comment))} disabled={!!loadingKey || !tokenId}>POST /api/email-approval/web/reject/:id</button>
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHeader}><strong>Reports</strong></div>
          <div className={styles.actions}>
            <button className={styles.button} onClick={() => run("deadline-years", () => getDeadlineAcademicYears())} disabled={!!loadingKey}>GET /api/reports/deadlines/academic-years</button>
            <button className={styles.button} onClick={() => run("deadline-compliance", () => getDeadlineCompliance(query))} disabled={!!loadingKey}>GET /api/reports/deadlines/overdue + upcoming</button>
            <button className={styles.button} onClick={() => run("internship-logbook-compliance", () => getInternshipLogbookCompliance(query))} disabled={!!loadingKey}>GET /api/reports/internships/logbook-compliance</button>
            <button className={styles.button} onClick={() => run("reports-overview", () => getReportsOverview(query))} disabled={!!loadingKey}>GET /api/reports/overview</button>
            <button className={styles.button} onClick={() => run("advisor-load", () => getAdvisorWorkload())} disabled={!!loadingKey}>GET /api/reports/projects/advisor-load</button>
            <button className={styles.button} onClick={() => run("student-deadline-history", () => getStudentDeadlineHistory(studentId))} disabled={!!loadingKey}>GET /api/reports/students/:id/deadline-history</button>
            <button className={styles.button} onClick={() => run("workflow-progress", () => getWorkflowProgress({ workflowType }))} disabled={!!loadingKey}>GET /api/reports/workflow/*</button>
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHeader}><strong>Timeline + Workflow</strong></div>
          <div className={styles.actions}>
            <button className={styles.button} onClick={() => run("timeline-all", () => getAllTimelines())} disabled={!!loadingKey}>GET /api/timeline/all</button>
            <button className={styles.button} onClick={() => run("timeline-student", () => getStudentTimeline(studentId))} disabled={!!loadingKey}>GET /api/timeline/student/:id</button>
            <button className={styles.button} onClick={() => run("timeline-student-init", () => initStudentTimeline(studentId, { source: "compat-ui" }))} disabled={!!loadingKey}>POST /api/timeline/student/:id/init</button>
            <button className={styles.button} onClick={() => run("timeline-step-update", () => updateTimelineStep(stepId, { status: "in_progress" }))} disabled={!!loadingKey}>PUT /api/timeline/step/:id</button>
            <button className={styles.button} onClick={() => run("workflow-step", () => getWorkflowRuntimeStep(stepId))} disabled={!!loadingKey}>GET /api/workflow/steps/:id</button>
            <button className={styles.button} onClick={() => run("workflow-update", () => updateWorkflow({ workflowType, studentId, action: "sync" }))} disabled={!!loadingKey}>PUT /api/workflow/update</button>
            <button className={styles.button} onClick={() => run("workflow-timeline", () => getWorkflowTimeline("", workflowType, studentId))} disabled={!!loadingKey}>GET /api/reports/workflow/student-timeline/:id</button>
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHeader}><strong>Upload + Template</strong></div>
          <div className={styles.actions}>
            <button className={styles.button} onClick={() => run("upload-history", () => getUploadCsvHistory())} disabled={!!loadingKey}>GET /api/upload-csv/history</button>
            <button className={styles.button} onClick={() => openTemplate("csv")} disabled={!!loadingKey}>GET /template/download-csv-template</button>
            <button className={styles.button} onClick={() => openTemplate("excel")} disabled={!!loadingKey}>GET /template/download-excel-template</button>
            <button className={styles.button} onClick={() => openTemplate("generic")} disabled={!!loadingKey}>GET /template/download-template</button>
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHeader}><strong>Result</strong></div>
          <div className={styles.tableWrap}>
            <pre className={styles.cardMeta} style={{ whiteSpace: "pre-wrap", margin: 0 }}>{result}</pre>
          </div>
        </section>
      </div>
    </RoleGuard>
  );
}
