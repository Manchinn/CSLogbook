"use client";

import Link from "next/link";
import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useHydrated } from "@/hooks/useHydrated";
import { useStudentEligibility } from "@/hooks/useStudentEligibility";
import { useCurrentCS05 } from "@/hooks/useCurrentCS05";
import { useInternshipStudentInfo } from "@/hooks/useInternshipStudentInfo";
import RegistrationForm from "./RegistrationForm";
import styles from "./registrationLanding.module.css";

export default function RegistrationLanding() {
  const router = useRouter();
  const { token, user } = useAuth();
  const hydrated = useHydrated();
  const studentId = user?.studentId ?? user?.id;
  const queriesEnabled = hydrated && Boolean(token) && Boolean(studentId);

  const {
    data: eligibility,
    isLoading: eligibilityLoading,
    error: eligibilityError,
  } = useStudentEligibility(token, queriesEnabled);
  const {
    data: studentInfo,
    isLoading: studentLoading,
    error: studentError,
  } = useInternshipStudentInfo(token, queriesEnabled);
  const {
    data: currentCS05,
    isLoading: cs05Loading,
    error: cs05Error,
  } = useCurrentCS05(token, queriesEnabled);

  const student = studentInfo?.student ?? null;

  useEffect(() => {
    if (currentCS05) {
      router.replace("/internship-registration/flow");
    }
  }, [currentCS05, router]);

  const eligibilityStatus = eligibility?.status.internship;
  const checkingEligibility = !hydrated || !queriesEnabled || eligibilityLoading;
  const checkingStatus = !hydrated || !queriesEnabled || cs05Loading || studentLoading;
  const initError = cs05Error ?? studentError;
  const initErrorMessage = initError instanceof Error ? initError.message : "โหลดข้อมูลไม่สำเร็จ";

  const cards = useMemo(
    () => [
      {
        label: "สิทธิ์เข้าระบบ",
        value: checkingEligibility
          ? "กำลังตรวจสอบ..."
          : eligibilityError
            ? "ตรวจสอบไม่สำเร็จ"
            : eligibilityStatus?.canAccess
              ? "ผ่าน"
              : "ยังไม่ผ่าน",
        hint: eligibilityError ? "โปรดลองใหม่ภายหลัง" : eligibilityStatus?.reason ?? "ระบบจะตรวจสอบสิทธิ์จากข้อมูลล่าสุด",
      },
      {
        label: "สิทธิ์ลงทะเบียน",
        value: checkingEligibility
          ? "กำลังตรวจสอบ..."
          : eligibilityError
            ? "ตรวจสอบไม่สำเร็จ"
            : eligibilityStatus?.canRegister
              ? "พร้อมลงทะเบียน"
              : "รอตรวจสอบ",
        hint: eligibilityError
          ? "โปรดลองใหม่ภายหลัง"
          : eligibilityStatus?.registrationReason ?? "ต้องผ่านเงื่อนไขเครดิตและช่วงเวลาเปิดลงทะเบียน",
      },
    ],
    [eligibilityError, eligibilityStatus, checkingEligibility]
  );

  const statusText = checkingStatus
    ? "กำลังตรวจสอบสถานะ..."
    : initError
      ? initErrorMessage
      : currentCS05
        ? "พบคำร้องแล้ว กำลังพาไปหน้า timeline"
        : "ไม่พบคำร้องฝึกงาน";

  return (
    <div className={styles.page}>
      <header className={styles.hero}>
        <div className={styles.heroText}>
          <p className={styles.kicker}>Internship Registration</p>
          <h1 className={styles.title}>ยังไม่ได้ลงทะเบียนฝึกงาน</h1>
          <p className={styles.lead}>
            ระบบยังไม่พบคำร้อง คพ.05 ของคุณ กรุณาเริ่มลงทะเบียน หรือกดตรวจสอบอีกครั้งหลังจากส่งคำร้องแล้ว
          </p>
          <div className={styles.actions}>
            <Link className={styles.primary} href="/internship-registration/flow">
              ฉันลงทะเบียนแล้ว ลองตรวจสอบอีกครั้ง
            </Link>
            <Link className={styles.secondary} href="/app">
              กลับแดชบอร์ด
            </Link>
          </div>
        </div>
        <div className={styles.statusCard}>
          <p className={styles.statusLabel}>สถานะปัจจุบัน</p>
          <p className={styles.statusValue}>{statusText}</p>
          <p className={styles.statusHint}>เมื่อระบบพบคำร้องแล้วจะพาไปหน้า timeline อัตโนมัติ</p>
        </div>
      </header>

      <section className={styles.grid}>
        {cards.map((card) => (
          <article key={card.label} className={styles.card}>
            <p className={styles.cardLabel}>{card.label}</p>
            <p className={styles.cardValue}>{card.value}</p>
            <p className={styles.cardHint}>{card.hint}</p>
          </article>
        ))}
      </section>

      <section className={styles.panel}>
        <div className={styles.panelHeader}>
          <div>
            <p className={styles.panelKicker}>เริ่มต้นอย่างไร</p>
            <h2 className={styles.panelTitle}>ขั้นตอนก่อนมีข้อมูลในระบบ</h2>
          </div>
        </div>
        <ul className={styles.steps}>
          <li className={styles.step}>
            <p className={styles.stepTitle}>ตรวจสอบคุณสมบัติ</p>
            <p className={styles.stepHint}>ต้องผ่านเงื่อนไขเครดิตและช่วงเวลาเปิดลงทะเบียน หากไม่ผ่านให้ติดต่อเจ้าหน้าที่</p>
          </li>
          <li className={styles.step}>
            <p className={styles.stepTitle}>เตรียมข้อมูลสถานประกอบการ</p>
            <p className={styles.stepHint}>ชื่อบริษัท ที่อยู่ ช่วงฝึกงาน และผู้ควบคุมงาน เพื่อใช้ในใบคำร้อง คพ.05</p>
          </li>
          <li className={styles.step}>
            <p className={styles.stepTitle}>ยื่นคำร้อง คพ.05</p>
            <p className={styles.stepHint}>ส่งคำร้องตามช่องทางที่ภาควิชากำหนด แล้วกลับมาตรวจสอบสถานะจากหน้านี้</p>
          </li>
        </ul>
      </section>

      <RegistrationForm student={student} />
    </div>
  );
}
