"use client";

import { useState } from "react";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { TeacherPageScaffold, TeacherEmptyState } from "@/components/teacher/TeacherPageScaffold";
import { useAcademicYears } from "@/hooks/useAcademicYears";
import { useTopicExamOverview } from "@/hooks/useTeacherModule";
import styles from "./TopicExamOverview.module.css";

export default function TopicExamOverviewPage() {
  const { data: academicYears = [] } = useAcademicYears();
  const [academicYear, setAcademicYear] = useState<string>("");
  const [semester, setSemester] = useState<string>("");

  const { data: projects = [], isLoading, error } = useTopicExamOverview(
    academicYear || undefined,
    semester || undefined
  );

  return (
    <RoleGuard roles={["teacher"]} teacherTypes={["academic"]} requireTopicExamAccess>
      <TeacherPageScaffold
        title="รายชื่อหัวข้อโครงงานพิเศษ"
        description="ดูรายชื่อหัวข้อโครงงานพิเศษทั้งหมด (สำหรับอาจารย์ที่มีสิทธิ์)"
      >
        {/* Filters */}
        <div className={styles.filters}>
          <div className={styles.filterGroup}>
            <label htmlFor="academicYear">ปีการศึกษา</label>
            <select
              id="academicYear"
              value={academicYear}
              onChange={(e) => setAcademicYear(e.target.value)}
              className={styles.select}
            >
              <option value="">ทั้งหมด</option>
              {academicYears.map((y) => (
                <option key={y.academicYear} value={String(y.academicYear)}>
                  {y.academicYear}
                </option>
              ))}
            </select>
          </div>
          <div className={styles.filterGroup}>
            <label htmlFor="semester">ภาคเรียน</label>
            <select
              id="semester"
              value={semester}
              onChange={(e) => setSemester(e.target.value)}
              className={styles.select}
            >
              <option value="">ทั้งหมด</option>
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="3">3</option>
            </select>
          </div>
        </div>

        {isLoading && (
          <div className={styles.loadingState}>
            <p>กำลังโหลดข้อมูล...</p>
          </div>
        )}

        {error && (
          <div className={styles.errorState}>
            <p>เกิดข้อผิดพลาด: {error instanceof Error ? error.message : "ไม่สามารถโหลดข้อมูลได้"}</p>
          </div>
        )}

        {!isLoading && !error && projects.length === 0 && (
          <TeacherEmptyState message="ไม่พบหัวข้อโครงงานพิเศษในขณะนี้" icon="📚" />
        )}

        {!isLoading && !error && projects.length > 0 && (
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>#</th>
                  <th>หัวข้อโครงงาน</th>
                  <th>นักศึกษา</th>
                  <th>อาจารย์ที่ปรึกษา</th>
                  <th>ปีการศึกษา/ภาค</th>
                  <th>วันสอบ</th>
                  <th>ผลสอบ</th>
                </tr>
              </thead>
              <tbody>
                {projects.map((project, index) => (
                  <tr key={project.id}>
                    <td>{index + 1}</td>
                    <td>
                      <div className={styles.projectTitle}>{project.projectTitle}</div>
                    </td>
                    <td>
                      <div className={styles.students}>
                        {project.studentNames.map((name, idx) => (
                          <div key={idx} className={styles.studentName}>
                            {name}
                          </div>
                        ))}
                      </div>
                    </td>
                    <td>{project.advisorName}</td>
                    <td>
                      {project.academicYear}/{project.semester}
                    </td>
                    <td>
                      {project.examDate
                        ? new Date(project.examDate).toLocaleDateString("th-TH")
                        : "-"}
                    </td>
                    <td>
                      {project.examResult && (
                        <span
                          className={`${styles.badge} ${styles[`badge-${project.examResult}`]}`}
                        >
                          {project.examResult === "pass" && "ผ่าน"}
                          {project.examResult === "fail" && "ไม่ผ่าน"}
                          {project.examResult === "pending" && "รอผล"}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </TeacherPageScaffold>
    </RoleGuard>
  );
}
