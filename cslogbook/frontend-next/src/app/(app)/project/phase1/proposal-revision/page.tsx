"use client";

import { RoleGuard } from "@/components/auth/RoleGuard";
import { featureFlags } from "@/lib/config/featureFlags";
import { guardFeatureRoute } from "@/lib/navigation/routeGuards";
import styles from "./proposalRevision.module.css";

export default function ProposalRevisionPage() {
  guardFeatureRoute(featureFlags.enableProjectPhase1Page, "/app");

  return (
    <RoleGuard roles={["student"]}>
      <div className={styles.page}>
        <section className={styles.header}>
          <h1 className={styles.title}>อัปโหลด Proposal ฉบับแก้ไข</h1>
          <p className={styles.subtitle}>
            เตรียมพื้นที่สำหรับอัปโหลด Proposal ฉบับแก้ไขตามข้อเสนอแนะจากอาจารย์
          </p>
        </section>
        <section className={styles.notice}>กำลังเตรียมฟีเจอร์อัปโหลด Proposal</section>
      </div>
    </RoleGuard>
  );
}
