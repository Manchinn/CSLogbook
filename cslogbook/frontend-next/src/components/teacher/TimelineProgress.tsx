"use client";

import type { SystemTestRequest } from "@/lib/services/teacherService";
import styles from "./TimelineProgress.module.css";

type ApprovalStatus = "approved" | "rejected" | "pending" | "not_started";

type TimelineProgressProps = {
  request: SystemTestRequest;
};

function getStatusColor(status: ApprovalStatus): string {
  switch (status) {
    case "approved":
      return "#10b981"; // green
    case "rejected":
      return "#ef4444"; // red
    case "pending":
      return "#f59e0b"; // orange
    case "not_started":
      return "#d1d5db"; // gray
    default:
      return "#d1d5db";
  }
}

function getStatusLabel(status: ApprovalStatus): string {
  switch (status) {
    case "approved":
      return "อนุมัติแล้ว";
    case "rejected":
      return "ปฏิเสธแล้ว";
    case "pending":
      return "รออนุมัติ";
    case "not_started":
      return "ยังไม่เริ่ม";
    default:
      return "-";
  }
}

export function TimelineProgress({ request }: TimelineProgressProps) {
  const { submittedAt, advisors = [], status } = request;

  // Calculate progress
  const advisorSteps = advisors.length;
  const hasStaffStep = status === "staff_approved" || status === "pending_staff";
  const totalSteps = 1 + advisorSteps + (hasStaffStep ? 1 : 0); // Submitted + Advisors + Staff
  let completedSteps = 1; // Always submitted

  // Count completed advisor approvals
  advisors.forEach((approval) => {
    if (approval.status === "approved") {
      completedSteps++;
    }
  });

  // Check staff verification
  if (status === "staff_approved") {
    completedSteps++;
  }

  const progressPercentage = Math.round((completedSteps / totalSteps) * 100);

  return (
    <div className={styles.timelineContainer}>
      {/* Progress Bar */}
      <div className={styles.progressBar}>
        <div className={styles.progressBarBg}>
          <div
            className={styles.progressBarFill}
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
        <div className={styles.progressLabel}>{progressPercentage}% เสร็จสิ้น</div>
      </div>

      {/* Timeline Steps */}
      <div className={styles.timeline}>
        {/* Step 1: Submitted */}
        <div className={styles.timelineStep}>
          <div className={styles.stepConnector}>
            <div
              className={styles.stepDot}
              style={{ backgroundColor: getStatusColor("approved") }}
            />
            <div className={styles.stepLine} style={{ backgroundColor: "#10b981" }} />
          </div>
          <div className={styles.stepContent}>
            <div className={styles.stepLabel}>ยื่นคำขอ</div>
            <div className={styles.stepDate}>
              {submittedAt
                ? new Date(submittedAt).toLocaleString("th-TH")
                : new Date(request.requestDate).toLocaleString("th-TH")}
            </div>
            <div className={styles.stepStatus} style={{ color: "#10b981" }}>
              ✓ เสร็จสิ้น
            </div>
          </div>
        </div>

        {/* Step 2+: Advisor Approvals */}
        {advisors.map((approval, index) => {
          const isLast = index === advisors.length - 1 && !hasStaffStep;
          const color = getStatusColor(approval.status as ApprovalStatus);

          return (
            <div key={index} className={styles.timelineStep}>
              <div className={styles.stepConnector}>
                <div className={styles.stepDot} style={{ backgroundColor: color }} />
                {!isLast && (
                  <div
                    className={styles.stepLine}
                    style={{
                      backgroundColor:
                        approval.status === "approved" ? "#10b981" : "#e5e7eb",
                    }}
                  />
                )}
              </div>
              <div className={styles.stepContent}>
                <div className={styles.stepLabel}>
                  {approval.teacherName}{" "}
                  <span style={{ fontSize: "0.75rem", color: "#6b7280" }}>
                    ({approval.role === "advisor" ? "อาจารย์ที่ปรึกษา" : "อาจารย์ที่ปรึกษาร่วม"})
                  </span>
                </div>
                <div className={styles.stepStatus} style={{ color }}>
                  {getStatusLabel(approval.status as ApprovalStatus)}
                </div>
                {approval.approvedAt && (
                  <div className={styles.stepDate}>
                    {new Date(approval.approvedAt).toLocaleString("th-TH")}
                  </div>
                )}
                {approval.note && (
                  <div className={styles.stepNote}>หมายเหตุ: {approval.note}</div>
                )}
              </div>
            </div>
          );
        })}

        {/* Step Final: Staff Verification */}
        {hasStaffStep && (
          <div className={styles.timelineStep}>
            <div className={styles.stepConnector}>
              <div
                className={styles.stepDot}
                style={{
                  backgroundColor: getStatusColor(
                    status === "staff_approved" ? "approved" : "pending"
                  ),
                }}
              />
            </div>
            <div className={styles.stepContent}>
              <div className={styles.stepLabel}>ตรวจสอบโดยเจ้าหน้าที่</div>
              <div
                className={styles.stepStatus}
                style={{
                  color: getStatusColor(status === "staff_approved" ? "approved" : "pending"),
                }}
              >
                {getStatusLabel(status === "staff_approved" ? "approved" : "pending")}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Overall Status Badge */}
      <div className={styles.overallStatus}>
        <span className={`${styles.statusBadge} ${styles[`status-${status}`]}`}>
          {status === "approved" && "อนุมัติสมบูรณ์"}
          {status === "rejected" && "ปฏิเสธ"}
          {status === "pending" && "รอดำเนินการ"}
          {status === "pending_advisor" && "รออาจารย์พิจารณา"}
          {status === "pending_staff" && "รอเจ้าหน้าที่ตรวจสอบ"}
          {status === "staff_approved" && "เจ้าหน้าที่อนุมัติแล้ว"}
        </span>
      </div>
    </div>
  );
}
