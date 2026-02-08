"use client";

import { RoleGuard } from "@/components/auth/RoleGuard";
import { featureFlags } from "@/lib/config/featureFlags";
import { guardFeatureRoute } from "@/lib/navigation/routeGuards";
import styles from "./examDay.module.css";

export default function ExamDayPage() {
  guardFeatureRoute(featureFlags.enableProjectPhase1Page, "/app");

  return (
    <RoleGuard roles={["student"]}>
      <div className={styles.page}>
        <section className={styles.header}>
          <h1 className={styles.title}>ติดตามกำหนดการสอบ</h1>
          <p className={styles.subtitle}>
            ติดตามวันสอบและผลสอบโครงงานพิเศษ 1 ตามที่ภาควิชากำหนด
          </p>
        </section>
        <section className={styles.notice}>กำลังเตรียมฟีเจอร์ตารางสอบและผลสอบ</section>
      </div>
    </RoleGuard>
  );
}
