"use client";

import { useMemo, useState } from "react";
import styles from "./internshipCompanies.module.css";
import { useAuth } from "@/contexts/AuthContext";
import { useHydrated } from "@/hooks/useHydrated";
import { useInternshipCompanyDetail, useInternshipCompanyStats } from "@/hooks/useInternshipCompanyStats";
import type { InternshipCompanyRow } from "@/lib/services/internshipCompanyService";

const dateFormatter = new Intl.DateTimeFormat("th-TH", { dateStyle: "medium" });
const dateTimeFormatter = new Intl.DateTimeFormat("th-TH", { dateStyle: "medium", timeStyle: "short" });

function deriveCurrentAcademicYear() {
  const now = new Date();
  return now.getFullYear() + 543;
}

function buildYearOptions() {
  const current = deriveCurrentAcademicYear();
  return Array.from({ length: 6 }, (_, idx) => current - idx);
}

function formatDate(value?: string | null) {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "-";
  return dateFormatter.format(parsed);
}

function formatNumber(value?: number | null) {
  if (value === undefined || value === null) return "-";
  return value.toLocaleString("th-TH");
}

export default function InternshipCompaniesView() {
  const { token, user } = useAuth();
  const hydrated = useHydrated();
  const isStaff = user?.role === "teacher" || user?.role === "admin";
  const isStudent = user?.role === "student";

  const [academicYear, setAcademicYear] = useState<number | "all">(deriveCurrentAcademicYear());
  const [limit, setLimit] = useState<number>(() => (isStaff ? 50 : 10));
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null);

  const filters = useMemo(
    () => ({
      academicYear: academicYear === "all" ? null : academicYear,
      limit,
    }),
    [academicYear, limit]
  );

  const queriesEnabled = hydrated && Boolean(token);
  const statsQuery = useInternshipCompanyStats(token, filters, queriesEnabled);
  const detailQuery = useInternshipCompanyDetail(token, selectedCompany ?? "", queriesEnabled && Boolean(selectedCompany));

  const rows = statsQuery.data?.rows ?? [];
  const meta = statsQuery.data?.meta;
  const generatedLabel = meta?.generatedAt ? dateTimeFormatter.format(new Date(meta.generatedAt)) : null;

  const yearOptions = useMemo(() => buildYearOptions(), []);
  const fullCount = rows.filter((row) => row.capacityStatus === "full").length;
  const topStudents = rows.reduce((sum, row) => sum + (row.totalStudents ?? 0), 0);

  const limitMax = isStaff ? 200 : 20;
  const handleLimitChange = (value: string) => {
    const next = Number(value);
    if (Number.isNaN(next)) return;
    const clamped = Math.min(Math.max(next, 1), limitMax);
    setLimit(clamped);
  };

  const handleView = (companyName: string) => {
    setSelectedCompany(companyName);
  };

  const handleCloseDrawer = () => {
    setSelectedCompany(null);
  };

  const statsError = statsQuery.error instanceof Error ? statsQuery.error.message : null;
  const detailError = detailQuery.error instanceof Error ? detailQuery.error.message : null;

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <p className={styles.kicker}>ข้อมูลจากระบบเดิม</p>
        <h1 className={styles.title}>สถานประกอบการฝึกงาน</h1>
        <p className={styles.lead}>ตารางสรุปบริษัท ฝึกงานที่อนุมัติแล้ว พร้อมสถานะความจุของแต่ละบริษัท</p>
        <div className={styles.heroMeta}>
          <span className={styles.badge}>ปีการศึกษา: {academicYear === "all" ? "ทั้งหมด" : academicYear}</span>
          <span className={styles.badge}>ขีดจำกัดต่อบริษัท: 2 คน</span>
          {generatedLabel ? <span className={styles.badge}>อัปเดตล่าสุด {generatedLabel}</span> : null}
        </div>
      </section>

      <section className={styles.controls}>
        <div className={styles.control}>
          <label className={styles.label} htmlFor="academicYear">ปีการศึกษา</label>
          <select
            id="academicYear"
            className={styles.select}
            value={academicYear}
            onChange={(e) => setAcademicYear(e.target.value === "all" ? "all" : Number(e.target.value))}
          >
            <option value="all">ทุกปีการศึกษา</option>
            {yearOptions.map((year) => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>

        <div className={styles.control}>
          <label className={styles.label} htmlFor="limit">จำนวนบริษัทสูงสุด (1-{limitMax})</label>
          <input
            id="limit"
            className={styles.input}
            type="number"
            min={1}
            max={limitMax}
            value={limit}
            onChange={(e) => handleLimitChange(e.target.value)}
          />
          <span className={styles.helper}>นักศึกษาเห็นสูงสุด 20 บริษัท, staff เห็นได้สูงสุด 200</span>
        </div>

        <button
          className={styles.buttonPrimary}
          type="button"
          onClick={() => statsQuery.refetch()}
          disabled={statsQuery.isFetching}
        >
          {statsQuery.isFetching ? "กำลังรีเฟรช..." : "รีเฟรชข้อมูล"}
        </button>
        <button
          className={styles.buttonGhost}
          type="button"
          onClick={() => setSelectedCompany(null)}
        >
          ปิดรายละเอียด
        </button>
      </section>

      <section className={styles.statsGrid}>
        <div className={styles.statCard}>
          <p className={styles.statLabel}>บริษัทที่ดึงมา</p>
          <p className={styles.statValue}>{formatNumber(meta?.totalCompanies)}</p>
          <p className={styles.statSub}>จากทั้งหมด {formatNumber(meta?.totalAllCompanies)} บริษัท</p>
        </div>
        <div className={styles.statCard}>
          <p className={styles.statLabel}>จำนวนนักศึกษาที่แสดง</p>
          <p className={styles.statValue}>{formatNumber(topStudents)}</p>
          <p className={styles.statSub}>รวมทั้งหมด {formatNumber(meta?.totalAllStudents)} คน</p>
        </div>
        <div className={styles.statCard}>
          <p className={styles.statLabel}>สถานะความจุ</p>
          <p className={styles.statValue}>{formatNumber(fullCount)} เต็ม</p>
          <p className={styles.statSub}>{formatNumber(rows.length - fullCount)} ว่าง</p>
        </div>
        <div className={styles.statCard}>
          <p className={styles.statLabel}>Snapshot</p>
          <p className={styles.statValue}>{meta?.academicYear ?? "ทุกปี"}</p>
          <p className={styles.statSub}>อัปเดต {generatedLabel ?? "-"}</p>
        </div>
      </section>

      <section className={styles.tableCard}>
        <div className={styles.metaBar}>
          <span>
            แสดง {formatNumber(rows.length)} บริษัท จาก {formatNumber(meta?.totalAllCompanies)} | นักศึกษาในชุดนี้ {formatNumber(topStudents)} / {formatNumber(meta?.totalAllStudents)} คน
          </span>
          <div className={styles.legend}>
            <span className={`${styles.statusPill} ${styles.statusAvailable}`}>ว่าง (&lt; 2 คน)</span>
            <span className={`${styles.statusPill} ${styles.statusFull}`}>เต็ม (≥ 2 คน)</span>
          </div>
        </div>
        {meta && meta.totalAllCompanies > meta.totalCompanies ? (
          <p className={styles.helper}>แสดง {formatNumber(meta.totalCompanies)} บริษัทแรกจากทั้งหมด {formatNumber(meta.totalAllCompanies)}</p>
        ) : null}
        <div className={styles.tableWrap}>
          {statsQuery.isLoading ? (
            <div className={styles.loading}>กำลังโหลดข้อมูล...</div>
          ) : statsError ? (
            <div className={styles.error}>{statsError}</div>
          ) : rows.length === 0 ? (
            <div className={styles.empty}>ยังไม่มีข้อมูลสถิติบริษัทที่ผ่านการอนุมัติ</div>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>บริษัท</th>
                  <th>จำนวนนักศึกษา</th>
                  <th>สถานะ</th>
                  <th>รายละเอียด</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row: InternshipCompanyRow) => (
                  <tr key={row.companyName}>
                    <td>{row.companyName}</td>
                    <td>{formatNumber(row.totalStudents)}</td>
                    <td>
                      <span
                        className={`${styles.statusPill} ${row.capacityStatus === "full" ? styles.statusFull : styles.statusAvailable}`}
                      >
                        {row.capacityStatus === "full" ? "เต็ม" : "ว่าง"}
                      </span>
                    </td>
                    <td>
                      <button className={styles.rowAction} type="button" onClick={() => handleView(row.companyName)}>
                        ดูรายชื่อ
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      <aside
        className={`${styles.drawer} ${selectedCompany ? styles.drawerOpen : ""}`}
        aria-hidden={selectedCompany ? "false" : "true"}
        aria-label="รายละเอียดสถานประกอบการ"
        role="dialog"
      >
        <div className={styles.drawerHeader}>
          <div>
            <p className={styles.helper}>ผู้ฝึกงานในบริษัท</p>
            <p className={styles.drawerTitle}>{selectedCompany ?? " "}</p>
          </div>
          <button type="button" className={styles.closeButton} onClick={handleCloseDrawer}>
            ปิด
          </button>
        </div>
        <div className={styles.drawerBody}>
          {detailQuery.isLoading ? (
            <div className={styles.loading}>กำลังโหลด...</div>
          ) : detailError ? (
            <div className={styles.error}>{detailError}</div>
          ) : !detailQuery.data ? (
            <div className={styles.helper}>เลือกบริษัทเพื่อดูรายละเอียด</div>
          ) : detailQuery.data.interns.length === 0 ? (
            <div className={styles.empty}>ยังไม่มีนักศึกษาที่ได้รับการอนุมัติ</div>
          ) : (
            <>
              <div className={styles.drawerStatRow}>
                <span className={styles.pill}>จำนวนนักศึกษา {formatNumber(detailQuery.data.total)}</span>
                <span className={`${styles.pill} ${styles.pillAccent}`}>ข้อมูลจาก CS05 ที่อนุมัติ</span>
              </div>
              <ul className={styles.internList}>
                {detailQuery.data.interns.map((intern, idx) => (
                  <li
                    className={styles.internCard}
                    key={`intern-${intern.studentCode ?? intern.userId ?? idx}`}
                  >
                    {isStudent ? (
                      <p className={styles.internMeta}>ตำแหน่ง: {intern.internshipPosition || "-"}</p>
                    ) : (
                      <>
                        <div className={styles.internName}>
                          <span>
                            {intern.firstName ?? "-"} {intern.lastName ?? ""}
                          </span>
                          <span className={styles.internCode}>{intern.studentCode ?? intern.userId ?? ""}</span>
                        </div>
                        <p className={styles.internMeta}>
                          ตำแหน่ง: {intern.internshipPosition || "-"} • ระยะเวลา {formatDate(intern.startDate)} - {formatDate(intern.endDate)}
                          {intern.internshipDays ? ` (${intern.internshipDays} วัน)` : ""}
                        </p>
                      </>
                    )}
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </aside>
    </div>
  );
}
