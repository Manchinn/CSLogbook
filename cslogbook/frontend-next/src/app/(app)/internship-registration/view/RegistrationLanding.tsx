"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useHydrated } from "@/hooks/useHydrated";
import { useStudentEligibility } from "@/hooks/useStudentEligibility";
import {
  getCurrentCS05,
  getInternshipStudentInfo,
  type CS05Document,
  type InternshipStudent,
} from "@/lib/services/internshipService";
import RegistrationForm from "./RegistrationForm";
import styles from "./registrationLanding.module.css";

export default function RegistrationLanding() {
  const router = useRouter();
  const { token, user } = useAuth();
  const hydrated = useHydrated();
  const studentId = user?.studentId ?? user?.id;
  const queriesEnabled = hydrated && Boolean(token) && Boolean(studentId);

  const { data: eligibility, isLoading: eligibilityLoading } = useStudentEligibility(token, queriesEnabled);

  const [student, setStudent] = useState<InternshipStudent | null>(null);
  const [currentCS05, setCurrentCS05] = useState<CS05Document | null>(null);
  const [initError, setInitError] = useState<string | null>(null);
  const [initLoading, setInitLoading] = useState(false);

  useEffect(() => {
    if (!queriesEnabled) return;
    let cancelled = false;
    const load = async () => {
      try {
        setInitLoading(true);
        setInitError(null);
        const [studentRes, cs05] = await Promise.all([
          getInternshipStudentInfo(token ?? ""),
          getCurrentCS05(token ?? ""),
        ]);

        if (cancelled) return;

        if (studentRes.student) {
          setStudent(studentRes.student);
        }

        if (cs05) {
          setCurrentCS05(cs05);
          router.replace("/internship-registration/flow");
          return;
        }
      } catch (err) {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : "โหลดข้อมูลไม่สำเร็จ";
        setInitError(message);
      } finally {
        if (!cancelled) {
          setInitLoading(false);
        }
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [queriesEnabled, token, router]);

  const eligibilityStatus = eligibility?.status.internship;
  const checkingEligibility = !hydrated || !queriesEnabled || eligibilityLoading;
  const checkingStatus = !hydrated || !queriesEnabled || initLoading;

  const cards = useMemo(
    () => [
      {
        label: "สิทธิ์เข้าระบบ",
        value: checkingEligibility ? "กำลังตรวจสอบ..." : eligibilityStatus?.canAccess ? "ผ่าน" : "ยังไม่ผ่าน",
        hint: eligibilityStatus?.reason ?? "ระบบจะตรวจสอบสิทธิ์จากข้อมูลล่าสุด",
      },
      {
        label: "สิทธิ์ลงทะเบียน",
        value: checkingEligibility ? "กำลังตรวจสอบ..." : eligibilityStatus?.canRegister ? "พร้อมลงทะเบียน" : "รอตรวจสอบ",
        hint: eligibilityStatus?.registrationReason ?? "ต้องผ่านเงื่อนไขเครดิตและช่วงเวลาเปิดลงทะเบียน",
      },
    ],
    [eligibilityStatus, checkingEligibility]
  );

  const statusText = checkingStatus
    ? "กำลังตรวจสอบสถานะ..."
    : initError
      ? initError
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

      <RegistrationForm student={student} onSubmitted={setCurrentCS05} />
    </div>
  );
}
