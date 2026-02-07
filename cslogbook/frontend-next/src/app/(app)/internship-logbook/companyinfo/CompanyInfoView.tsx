"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import styles from "./companyInfo.module.css";
import { useAuth } from "@/contexts/AuthContext";
import { useHydrated } from "@/hooks/useHydrated";
import {
  useAcceptanceLetterStatus,
  useCompanyInfo,
  useCurrentCS05,
} from "@/hooks/useInternshipCompanyInfo";
import { submitCompanyInfo } from "@/lib/services/internshipService";

type Tone = "positive" | "warning" | "danger" | "info" | "muted";

type FormState = {
  companyName: string;
  supervisorName: string;
  supervisorPosition: string;
  supervisorPhone: string;
  supervisorEmail: string;
};

type GuardMessage = {
  title: string;
  body: string;
  tone?: "warning" | "danger" | "info";
};

function toneClass(tone: Tone) {
  if (tone === "positive") return styles.badgePositive;
  if (tone === "warning") return styles.badgeWarning;
  if (tone === "danger") return styles.badgeDanger;
  if (tone === "info") return styles.badgeInfo;
  return styles.badgeMuted;
}

function statusLabel(status?: string | null): { label: string; tone: Tone } {
  switch (status) {
    case "approved":
      return { label: "อนุมัติแล้ว", tone: "positive" };
    case "pending":
      return { label: "รอพิจารณา", tone: "warning" };
    case "rejected":
      return { label: "ไม่อนุมัติ", tone: "danger" };
    case "cancelled":
      return { label: "ยกเลิก", tone: "muted" };
    case "uploaded":
      return { label: "อัปโหลดแล้ว (รออนุมัติ)", tone: "warning" };
    case "not_uploaded":
      return { label: "ยังไม่อัปโหลด", tone: "muted" };
    default:
      return { label: "ไม่พบข้อมูล", tone: "muted" };
  }
}

export default function CompanyInfoView() {
  const { token } = useAuth();
  const hydrated = useHydrated();
  const queriesEnabled = hydrated && Boolean(token);

  const cs05Query = useCurrentCS05(token, queriesEnabled);
  const cs05 = cs05Query.data;
  const documentId = cs05?.documentId ?? null;

  const acceptanceQuery = useAcceptanceLetterStatus(token, documentId, queriesEnabled && Boolean(documentId));
  const acceptance = acceptanceQuery.data;

  const companyInfoQuery = useCompanyInfo(token, documentId, queriesEnabled && Boolean(documentId));
  const companyInfo = companyInfoQuery.data;

  const [mode, setMode] = useState<"view" | "edit">("edit");
  const [formState, setFormState] = useState<FormState>({
    companyName: "",
    supervisorName: "",
    supervisorPosition: "",
    supervisorPhone: "",
    supervisorEmail: "",
  });
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (cs05?.companyName) {
      setFormState((prev) => ({ ...prev, companyName: cs05.companyName ?? prev.companyName }));
    }
  }, [cs05?.companyName]);

  useEffect(() => {
    if (companyInfo) {
      setFormState({
        companyName: cs05?.companyName ?? companyInfo.companyName ?? "",
        supervisorName: companyInfo.supervisorName ?? "",
        supervisorPosition: companyInfo.supervisorPosition ?? "",
        supervisorPhone: companyInfo.supervisorPhone ?? "",
        supervisorEmail: companyInfo.supervisorEmail ?? "",
      });
      setMode("view");
      setSubmitError(null);
    } else if (!companyInfo && cs05 && !companyInfoQuery.isFetching) {
      setFormState((prev) => ({
        ...prev,
        companyName: cs05.companyName ?? prev.companyName,
      }));
      setMode("edit");
    }
  }, [companyInfo, companyInfoQuery.isFetching, cs05]);

  useEffect(() => {
    if (!documentId || !acceptance) {
      setMode("view");
      return;
    }
    const canEdit = acceptance.acceptanceStatus === "approved" && cs05?.status === "approved";
    if (!canEdit) {
      setMode("view");
    }
  }, [acceptance, cs05?.status, documentId]);

  const cs05Status = cs05?.status ?? null;
  const acceptanceStatus = acceptance?.acceptanceStatus ?? null;
  const canEdit = cs05Status === "approved" && acceptanceStatus === "approved";

  const guard: GuardMessage | null = useMemo(() => {
    if (!hydrated) return { title: "กำลังเตรียมข้อมูล", body: "กรุณารอสักครู่", tone: "info" };
    if (cs05Query.isError) {
      return { title: "โหลดข้อมูล CS05 ไม่สำเร็จ", body: "กรุณาลองรีเฟรชหรือกลับไปยังหน้าลงทะเบียน", tone: "danger" };
    }
    if (!cs05 && !cs05Query.isLoading) {
      return {
        title: "ยังไม่มีคำร้อง คพ.05",
        body: "กรุณายื่นคำร้องฝึกงาน (คพ.05) และรอการอนุมัติ ก่อนบันทึกข้อมูลสถานประกอบการ",
        tone: "warning",
      };
    }
    if (cs05Status && cs05Status !== "approved") {
      const body = cs05Status === "pending"
        ? "คำร้อง คพ.05 อยู่ระหว่างการพิจารณา"
        : cs05Status === "rejected"
        ? "คำร้อง คพ.05 ไม่ได้รับการอนุมัติ กรุณาแก้ไขและส่งใหม่"
        : "คำร้อง คพ.05 ยังไม่พร้อมสำหรับขั้นตอนนี้";
      return {
        title: "ยังไม่สามารถบันทึกข้อมูลผู้ควบคุมงาน",
        body,
        tone: cs05Status === "rejected" ? "danger" : "warning",
      };
    }
    if (acceptanceQuery.isError) {
      return { title: "ตรวจสอบหนังสือตอบรับไม่สำเร็จ", body: "กรุณาลองใหม่หรืออัปโหลดหนังสือตอบรับอีกครั้ง", tone: "danger" };
    }
    if (acceptanceQuery.isLoading) {
      return { title: "กำลังตรวจสอบหนังสือตอบรับ", body: "กรุณารอสักครู่", tone: "info" };
    }
    if (acceptanceStatus !== "approved") {
      const body = acceptanceStatus === "pending"
        ? "หนังสือตอบรับอยู่ระหว่างการพิจารณา"
        : acceptanceStatus === "rejected"
        ? "หนังสือตอบรับไม่ได้รับการอนุมัติ กรุณาอัปโหลดใหม่"
        : "กรุณาอัปโหลดหนังสือตอบรับจากบริษัทและรอการอนุมัติ";
      return {
        title: "ต้องได้รับการอนุมัติหนังสือตอบรับก่อน",
        body,
        tone: acceptanceStatus === "rejected" ? "danger" : "warning",
      };
    }
    return null;
  }, [acceptanceQuery.isError, acceptanceQuery.isLoading, acceptanceStatus, cs05, cs05Query.isError, cs05Query.isLoading, cs05Status, hydrated]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitError(null);
    setSubmitSuccess(null);

    if (!token || !documentId) {
      setSubmitError("ไม่พบข้อมูลคำร้อง คพ.05");
      return;
    }

    const supervisorName = formState.supervisorName.trim();
    const supervisorPosition = formState.supervisorPosition.trim();
    const supervisorPhone = formState.supervisorPhone.trim();
    const supervisorEmail = formState.supervisorEmail.trim();

    if (!supervisorName) {
      setSubmitError("กรุณากรอกชื่อผู้ควบคุมงาน");
      return;
    }
    if (!/^[0-9]{9,10}$/.test(supervisorPhone)) {
      setSubmitError("กรุณากรอกเบอร์โทรศัพท์ 9-10 หลัก");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(supervisorEmail)) {
      setSubmitError("กรุณากรอกอีเมลให้ถูกต้อง");
      return;
    }

    setSaving(true);
    try {
      await submitCompanyInfo(token, {
        documentId,
        supervisorName,
        supervisorPosition: supervisorPosition || null,
        supervisorPhone,
        supervisorEmail,
      });
      await companyInfoQuery.refetch();
      setMode("view");
      setSubmitSuccess("บันทึกข้อมูลสำเร็จ");
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "ไม่สามารถบันทึกข้อมูลได้");
    } finally {
      setSaving(false);
    }
  };

  const companyInfoStatus = companyInfo ? "บันทึกแล้ว" : "ยังไม่บันทึก";

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div>
          <p className={styles.kicker}>Internship Logbook</p>
          <h1 className={styles.title}>ข้อมูลสถานประกอบการ</h1>
          <p className={styles.lead}>กรอกข้อมูลผู้ควบคุมงานหลังคำร้อง คพ.05 และหนังสือตอบรับได้รับอนุมัติ</p>
        </div>
        <div className={styles.heroMeta}>
          <span className={`${styles.badge} ${toneClass(statusLabel(cs05Status).tone)}`}>
            CS05: {statusLabel(cs05Status).label}
          </span>
          <span className={`${styles.badge} ${toneClass(statusLabel(acceptanceStatus).tone)}`}>
            หนังสือตอบรับ: {statusLabel(acceptanceStatus).label}
          </span>
          <span className={`${styles.badge} ${styles.badgeNeutral}`}>
            Document ID: {documentId ?? "-"}
          </span>
        </div>
      </section>

      <section className={styles.statusGrid}>
        <div className={styles.statusCard}>
          <p className={styles.statusLabel}>สถานะ คพ.05</p>
          <p className={styles.statusValue}>{statusLabel(cs05Status).label}</p>
          <p className={styles.statusHint}>{cs05?.companyName || "ยังไม่มีข้อมูลบริษัท"}</p>
        </div>
        <div className={styles.statusCard}>
          <p className={styles.statusLabel}>หนังสือตอบรับ</p>
          <p className={styles.statusValue}>{statusLabel(acceptanceStatus).label}</p>
          <p className={styles.statusHint}>{acceptance?.statusMessage || "ต้องได้รับอนุมัติจึงจะกรอกข้อมูลได้"}</p>
        </div>
        <div className={styles.statusCard}>
          <p className={styles.statusLabel}>ข้อมูลผู้ควบคุมงาน</p>
          <p className={styles.statusValue}>{companyInfoStatus}</p>
          <p className={styles.statusHint}>{companyInfo?.supervisorName || "ยังไม่บันทึกชื่อผู้ควบคุมงาน"}</p>
        </div>
      </section>

      {guard ? (
        <section className={`${styles.callout} ${guard.tone ? styles[`callout${guard.tone.charAt(0).toUpperCase() + guard.tone.slice(1)}`] : ""}`}>
          <div>
            <p className={styles.calloutTitle}>{guard.title}</p>
            <p className={styles.calloutText}>{guard.body}</p>
          </div>
          <div className={styles.calloutActions}>
            <Link className={styles.secondaryButton} href="/dashboard">กลับแดชบอร์ด</Link>
            <Link className={styles.primaryButton} href="/internship-registration/flow">ไปหน้าลงทะเบียนฝึกงาน</Link>
          </div>
        </section>
      ) : (
        <section className={styles.formCard}>
          <div className={styles.formHeader}>
            <div>
              <p className={styles.panelKicker}>Supervisor contact</p>
              <h2 className={styles.formTitle}>บันทึกข้อมูลผู้ควบคุมงาน</h2>
              <p className={styles.formHint}>ข้อมูลนี้ใช้ในบันทึกการฝึกงานและหนังสือรับรอง</p>
            </div>
            {canEdit && mode === "view" ? (
              <button className={styles.secondaryButton} type="button" onClick={() => setMode("edit")}>แก้ไขข้อมูล</button>
            ) : null}
          </div>

          <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="company-name">ชื่อสถานประกอบการ</label>
              <input
                className={styles.input}
                id="company-name"
                type="text"
                value={formState.companyName}
                disabled
                aria-readonly
              />
              <p className={styles.helper}>ดึงจากคำร้อง คพ.05</p>
            </div>

            <div className={styles.gridTwo}>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="supervisor-name">ชื่อผู้ควบคุมงาน *</label>
                <input
                  className={styles.input}
                  id="supervisor-name"
                  type="text"
                  value={formState.supervisorName}
                  onChange={(e) => setFormState((prev) => ({ ...prev, supervisorName: e.target.value }))}
                  disabled={!canEdit || mode === "view"}
                  required
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="supervisor-position">ตำแหน่ง</label>
                <input
                  className={styles.input}
                  id="supervisor-position"
                  type="text"
                  value={formState.supervisorPosition}
                  onChange={(e) => setFormState((prev) => ({ ...prev, supervisorPosition: e.target.value }))}
                  disabled={!canEdit || mode === "view"}
                />
              </div>
            </div>

            <div className={styles.gridTwo}>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="supervisor-phone">เบอร์โทรศัพท์ *</label>
                <input
                  className={styles.input}
                  id="supervisor-phone"
                  type="tel"
                  value={formState.supervisorPhone}
                  onChange={(e) => setFormState((prev) => ({ ...prev, supervisorPhone: e.target.value }))}
                  disabled={!canEdit || mode === "view"}
                  inputMode="tel"
                  maxLength={10}
                  required
                />
                <p className={styles.helper}>ตัวเลข 9-10 หลัก เช่น 0812345678</p>
              </div>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="supervisor-email">อีเมลผู้ควบคุมงาน *</label>
                <input
                  className={styles.input}
                  id="supervisor-email"
                  type="email"
                  value={formState.supervisorEmail}
                  onChange={(e) => setFormState((prev) => ({ ...prev, supervisorEmail: e.target.value }))}
                  disabled={!canEdit || mode === "view"}
                  required
                />
              </div>
            </div>

            {submitError ? <p className={styles.error}>{submitError}</p> : null}
            {submitSuccess ? <p className={styles.success}>{submitSuccess}</p> : null}

            <div className={styles.actions}>
              <Link className={styles.secondaryButton} href="/dashboard">กลับหน้าแดชบอร์ด</Link>
              {canEdit && mode === "edit" ? (
                <button className={styles.primaryButton} type="submit" disabled={saving}>
                  {saving ? "กำลังบันทึก..." : "บันทึกข้อมูล"}
                </button>
              ) : null}
            </div>
          </form>
        </section>
      )}
    </div>
  );
}
