"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useHydrated } from "@/hooks/useHydrated";
import { useStudentEligibility } from "@/hooks/useStudentEligibility";
import { WidgetState } from "@/components/dashboard/WidgetState";
import styles from "./StudentEligibilityWidget.module.css";

type StudentEligibilityWidgetProps = {
  enabled: boolean;
};

function formatRegistration(open: boolean | undefined) {
  return open ? "เปิดลงทะเบียน" : "ปิดลงทะเบียน";
}

// สร้างข้อความอธิบายเหตุผลที่ไม่มีสิทธิ์แบบละเอียด (เหมือน Legacy)
function renderDetailedReason(reason: string | null | undefined) {
  if (!reason) return null;

  // ตรวจสอบประเภทของเหตุผล
  if (reason.includes("หน่วยกิต")) {
    return (
      <div className={styles.popoverContent}>
        <p className={styles.popoverTitle}>⚠️ หน่วยกิตไม่เพียงพอ</p>
        <p className={styles.popoverReason}>{reason}</p>
        <p className={styles.popoverHint}>
          คุณจำเป็นต้องลงทะเบียนเรียนเพิ่มเติมเพื่อให้มีหน่วยกิตครบตามเกณฑ์ที่กำหนด
          กรุณาติดต่ออาจารย์ที่ปรึกษาเพื่อวางแผนการลงทะเบียน
        </p>
      </div>
    );
  } else if (reason.includes("ภาคเรียน")) {
    return (
      <div className={styles.popoverContent}>
        <p className={styles.popoverTitle}>⚠️ ไม่อยู่ในภาคเรียนที่กำหนด</p>
        <p className={styles.popoverReason}>{reason}</p>
        <p className={styles.popoverHint}>
          ตามระเบียบของภาควิชา คุณสามารถลงทะเบียนฝึกงานได้ในภาคเรียนที่กำหนดเท่านั้น
          กรุณารอจนกว่าจะถึงภาคเรียนที่สามารถลงทะเบียนได้
        </p>
      </div>
    );
  } else if (reason.includes("ช่วงเวลา")) {
    return (
      <div className={styles.popoverContent}>
        <p className={styles.popoverTitle}>⚠️ อยู่นอกช่วงเวลาลงทะเบียน</p>
        <p className={styles.popoverReason}>{reason}</p>
        <p className={styles.popoverHint}>
          ระบบจะเปิดให้ลงทะเบียนในช่วงเวลาที่กำหนดเท่านั้น
          กรุณาตรวจสอบกำหนดการและเตรียมเอกสารให้พร้อม
        </p>
      </div>
    );
  } else if (reason.includes("สถานะ")) {
    return (
      <div className={styles.popoverContent}>
        <p className={styles.popoverTitle}>⚠️ สถานภาพนักศึกษาไม่เข้าเกณฑ์</p>
        <p className={styles.popoverReason}>{reason}</p>
        <p className={styles.popoverHint}>
          กรุณาติดต่อภาควิชาเพื่อตรวจสอบสถานภาพนักศึกษาของคุณ
        </p>
      </div>
    );
  } else {
    return (
      <div className={styles.popoverContent}>
        <p className={styles.popoverTitle}>⚠️ ไม่ผ่านเกณฑ์การลงทะเบียน</p>
        <p className={styles.popoverReason}>{reason}</p>
      </div>
    );
  }
}

export function StudentEligibilityWidget({ enabled }: StudentEligibilityWidgetProps) {
  const hydrated = useHydrated();
  const { token } = useAuth();
  const { data, isLoading, error } = useStudentEligibility(token, enabled && hydrated);
  const [showInternshipPopover, setShowInternshipPopover] = useState(false);
  const [showProjectPopover, setShowProjectPopover] = useState(false);

  return (
    <WidgetState
      enabled={enabled}
      hydrated={hydrated}
      isLoading={isLoading}
      error={error || !data}
      loadingFallback={<p>กำลังโหลดสิทธิ์นักศึกษา...</p>}
      errorFallback={<p className={styles.error}>ไม่สามารถโหลดสิทธิ์นักศึกษาได้</p>}
    >
      {data ? (
        <section className={styles.wrapper}>
          <div className={styles.header}>
            <div>
              <p className={styles.eyebrow}>สิทธิ์นักศึกษา</p>
              <h2>สิทธิ์การลงทะเบียน</h2>
            </div>
          </div>

          <div className={styles.grid}>
            <article className={styles.card}>
              <p className={styles.cardTitle}>สิทธิ์การฝึกงาน</p>
              <div className={styles.statusLine}>
                <span
                  className={`${styles.statusBadge} ${data.eligibility.internship.isEligible ? styles.positive : styles.negative}`}
                >
                  {data.eligibility.internship.isEligible ? "ผ่านเกณฑ์" : "ยังไม่ผ่าน"}
                </span>
                <span>{formatRegistration(data.status.internship.registrationOpen)}</span>
              </div>
              <p className={styles.note}>
                {data.eligibility.internship.reason || data.status.internship.reason || "ไม่พบข้อมูลสิทธิ์ฝึกงาน"}
              </p>
              {(data.eligibility.internship.reason || data.status.internship.reason) && !data.eligibility.internship.isEligible && (
                <div className={styles.popoverWrapper}>
                  <button
                    className={styles.detailButton}
                    onClick={() => setShowInternshipPopover(!showInternshipPopover)}
                  >
                    คลิกเพื่อดูรายละเอียดเพิ่มเติม
                  </button>
                  {showInternshipPopover && (
                    <div className={styles.popover}>
                      <div className={styles.popoverHeader}>
                        <span>รายละเอียดสิทธิ์การฝึกงาน</span>
                        <button
                          className={styles.popoverClose}
                          onClick={() => setShowInternshipPopover(false)}
                        >
                          ×
                        </button>
                      </div>
                      {renderDetailedReason(data.eligibility.internship.reason || data.status.internship.reason)}
                    </div>
                  )}
                </div>
              )}
            </article>

            <article className={styles.card}>
              <p className={styles.cardTitle}>สิทธิ์โครงงานพิเศษ</p>
              <div className={styles.statusLine}>
                <span
                  className={`${styles.statusBadge} ${data.eligibility.project.canAccessFeature ? styles.positive : styles.negative}`}
                >
                  {data.eligibility.project.canAccessFeature ? "เข้าถึงได้" : "ยังเข้าไม่ได้"}
                </span>
                <span>{formatRegistration(data.status.project.registrationOpen)}</span>
              </div>
              <p className={styles.note}>{data.eligibility.project.reason || data.status.project.reason || "ไม่พบข้อมูลสิทธิ์โครงงาน"}</p>
              {(data.eligibility.project.reason || data.status.project.reason) && !data.eligibility.project.canAccessFeature && (
                <div className={styles.popoverWrapper}>
                  <button
                    className={styles.detailButton}
                    onClick={() => setShowProjectPopover(!showProjectPopover)}
                  >
                    คลิกเพื่อดูรายละเอียดเพิ่มเติม
                  </button>
                  {showProjectPopover && (
                    <div className={styles.popover}>
                      <div className={styles.popoverHeader}>
                        <span>รายละเอียดสิทธิ์โครงงานพิเศษ</span>
                        <button
                          className={styles.popoverClose}
                          onClick={() => setShowProjectPopover(false)}
                        >
                          ×
                        </button>
                      </div>
                      {renderDetailedReason(data.eligibility.project.reason || data.status.project.reason)}
                    </div>
                  )}
                </div>
              )}
              {data.status.project.requiresInternshipCompletion && (
                <p className={styles.note}>* ต้องผ่านฝึกงานก่อนจึงจะลงทะเบียนโครงงานได้</p>
              )}
            </article>

            <article className={styles.card}>
              <p className={styles.cardTitle}>หน่วยกิต</p>
              <div className={styles.statList}>
                <div className={styles.statRow}>
                  <span>หน่วยกิตสะสม</span>
                  <strong>{(data.student.totalCredits ?? 0).toLocaleString()}</strong>
                </div>
                <div className={styles.statRow}>
                  <span>หน่วยกิตภาควิชา</span>
                  <strong>{(data.student.majorCredits ?? 0).toLocaleString()}</strong>
                </div>
              </div>
              <div className={styles.requirements}>
                <span>
                  เกณฑ์ฝึกงาน: {data.requirements.internship.totalCredits ?? "—"} หน่วยกิต (หน่วยกิตภาควิชา {data.requirements.internship.majorCredits ?? "—"})
                </span>
                <span>
                  เกณฑ์โครงงาน: {data.requirements.project.totalCredits ?? "—"} หน่วยกิต (หน่วยกิตภาควิชา {data.requirements.project.majorCredits ?? "—"})
                </span>
                {data.requirements.project.requireInternship !== undefined && (
                  <span>ต้องผ่านฝึกงานก่อนขอโครงงาน: {data.requirements.project.requireInternship ? "ใช่" : "ไม่จำเป็น"}</span>
                )}
              </div>
            </article>
          </div>
        </section>
      ) : null}
    </WidgetState>
  );
}
