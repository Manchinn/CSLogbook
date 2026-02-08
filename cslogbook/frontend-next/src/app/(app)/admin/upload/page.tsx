"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { useAuth } from "@/contexts/AuthContext";
import { env } from "@/lib/config/env";
import { getCurrentAcademicInfo } from "@/lib/services/academicService";
import { getCurriculums, type CurriculumRecord } from "@/lib/services/settingsService";
import { uploadStudentCSV, type UploadStudentResult, type UploadStudentSummary } from "@/lib/services/adminService";
import styles from "./page.module.css";

type PrerequisiteStatus = {
  curriculum: { ready: boolean; message: string };
  academic: { ready: boolean; message: string };
};

const statusMeta: Record<string, { label: string; className: string }> = {
  Added: { label: "เพิ่มใหม่", className: styles.tagAdded },
  Updated: { label: "อัปเดตแล้ว", className: styles.tagUpdated },
  Invalid: { label: "ข้อมูลไม่ถูกต้อง", className: styles.tagInvalid },
  Error: { label: "เกิดข้อผิดพลาด", className: styles.tagError },
};

const getCurriculumId = (curriculum: CurriculumRecord) =>
  curriculum.curriculumId ?? curriculum.id ?? curriculum.curriculumID ?? null;

const getBackendBaseUrl = () => env.apiUrl.replace(/\/api\/?$/, "");

export default function AdminUploadPage() {
  const { token } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [results, setResults] = useState<UploadStudentResult[]>([]);
  const [summary, setSummary] = useState<UploadStudentSummary | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [message, setMessage] = useState<string | null>(null);
  const [messageTone, setMessageTone] = useState<"info" | "warning" | "success">("info");

  const [prerequisiteStatus, setPrerequisiteStatus] = useState<PrerequisiteStatus>({
    curriculum: { ready: false, message: "" },
    academic: { ready: false, message: "" },
  });
  const [contextLoading, setContextLoading] = useState(true);
  const [activeCurriculums, setActiveCurriculums] = useState<CurriculumRecord[]>([]);
  const [selectedCurriculumId, setSelectedCurriculumId] = useState<number | null>(null);
  const selectedCurriculumRef = useRef<number | null>(null);

  useEffect(() => {
    selectedCurriculumRef.current = selectedCurriculumId;
  }, [selectedCurriculumId]);

  const resolveCurriculumStatus = useCallback(
    (curriculums: CurriculumRecord[], selectedId: number | null) => {
      if (curriculums.length === 0) {
        return {
          ready: false,
          message: "ไม่พบหลักสูตรที่เปิดใช้งาน กรุณาเพิ่มหรือเปิดใช้งานหลักสูตร",
        };
      }

      const selected = curriculums.find((curriculum) => getCurriculumId(curriculum) === selectedId);
      if (!selected) {
        return {
          ready: false,
          message: "กรุณาเลือกหลักสูตรที่จะใช้เป็นเกณฑ์",
        };
      }

      return {
        ready: true,
        message: `กำลังใช้หลักสูตร: ${selected.shortName || selected.name || "ไม่ระบุ"}`,
      };
    },
    []
  );

  const loadContext = useCallback(async () => {
    setContextLoading(true);
    const nextStatus: PrerequisiteStatus = {
      curriculum: { ready: false, message: "กรุณาตั้งค่าหลักสูตรที่ใช้งานในเมนูตั้งค่าระบบ" },
      academic: { ready: false, message: "กรุณาตั้งค่าปีการศึกษา/ภาคการศึกษาในเมนูตั้งค่าระบบ" },
    };

    try {
      const curriculums = await getCurriculums();
      const activeList = curriculums.filter((curriculum) => curriculum.active);
      setActiveCurriculums(activeList);

      if (activeList.length > 0) {
        const fallbackId = getCurriculumId(activeList[0]);
        const nextSelectedId = selectedCurriculumRef.current ?? fallbackId ?? null;
        setSelectedCurriculumId(nextSelectedId);
        nextStatus.curriculum = resolveCurriculumStatus(activeList, nextSelectedId);
      } else {
        nextStatus.curriculum = resolveCurriculumStatus(activeList, null);
      }
    } catch {
      nextStatus.curriculum = {
        ready: false,
        message: "ไม่สามารถโหลดข้อมูลหลักสูตรได้",
      };
    }

    try {
      const academicInfo = await getCurrentAcademicInfo();
      if (academicInfo) {
        nextStatus.academic = {
          ready: true,
          message: `ปีการศึกษา/ภาคเรียนปัจจุบัน: ${academicInfo.displayText}` +
            (academicInfo.isFromDatabase ? "" : " (คำนวณอัตโนมัติ)"),
        };
      }
    } catch {
      nextStatus.academic = { ready: false, message: "ไม่สามารถโหลดข้อมูลปีการศึกษาได้" };
    }

    setPrerequisiteStatus(nextStatus);
    setContextLoading(false);
  }, [resolveCurriculumStatus]);

  useEffect(() => {
    loadContext();
  }, [loadContext]);

  useEffect(() => {
    if (contextLoading) return;
    setPrerequisiteStatus((prev) => ({
      ...prev,
      curriculum: resolveCurriculumStatus(activeCurriculums, selectedCurriculumId),
    }));
  }, [activeCurriculums, contextLoading, resolveCurriculumStatus, selectedCurriculumId]);

  const selectedCurriculum = useMemo(() => {
    return activeCurriculums.find((curriculum) => getCurriculumId(curriculum) === selectedCurriculumId) ?? null;
  }, [activeCurriculums, selectedCurriculumId]);

  const isReadyToUpload = prerequisiteStatus.curriculum.ready && prerequisiteStatus.academic.ready && !!selectedCurriculum;

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextFile = event.target.files?.[0] ?? null;
    setMessage(null);

    if (!nextFile) {
      setFile(null);
      return;
    }

    const fileName = nextFile.name.toLowerCase();
    const isCsv = nextFile.type === "text/csv" || fileName.endsWith(".csv");
    const isExcel =
      nextFile.type === "application/vnd.ms-excel" ||
      nextFile.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
      fileName.endsWith(".xlsx");

    if (!isCsv && !isExcel) {
      setMessageTone("warning");
      setMessage("สามารถอัปโหลดได้เฉพาะไฟล์ .csv หรือ .xlsx เท่านั้น");
      setFile(null);
      return;
    }

    if (nextFile.size / 1024 / 1024 > 5) {
      setMessageTone("warning");
      setMessage("ไฟล์ต้องมีขนาดไม่เกิน 5MB");
      setFile(null);
      return;
    }

    setFile(nextFile);
  };

  const handleUpload = async () => {
    if (!token) {
      setMessageTone("warning");
      setMessage("กรุณาเข้าสู่ระบบก่อนใช้งานการอัปโหลด");
      return;
    }

    if (!file) {
      setMessageTone("warning");
      setMessage("กรุณาเลือกไฟล์ CSV หรือ Excel ก่อนเริ่มอัปโหลด");
      return;
    }

    if (!isReadyToUpload) {
      setMessageTone("warning");
      setMessage("ยังมีการตั้งค่าที่ต้องทำให้เสร็จก่อนอัปโหลด");
      return;
    }

    if (!selectedCurriculumId) {
      setMessageTone("warning");
      setMessage("กรุณาเลือกหลักสูตรที่จะใช้ก่อนอัปโหลด");
      return;
    }

    setUploading(true);
    setMessage(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("curriculumId", String(selectedCurriculumId));

      const response = await uploadStudentCSV(formData, token);

      if (!response.success) {
        throw new Error(response.message || response.error || "เกิดข้อผิดพลาดในการอัปโหลด");
      }

      setResults(response.results ?? []);
      setSummary(response.summary ?? null);
      setStatusFilter("all");
      setMessageTone("success");
      setMessage("อัปโหลดและประมวลผลข้อมูลเรียบร้อยแล้ว");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "เกิดข้อผิดพลาดในการอัปโหลด";
      setMessageTone("warning");
      setMessage(errorMessage);
    } finally {
      setUploading(false);
    }
  };

  const csvTemplateDownloadUrl = `${getBackendBaseUrl()}/template/download-csv-template`;
  const excelTemplateDownloadUrl = `${getBackendBaseUrl()}/template/download-excel-template`;

  const filteredResults = useMemo(() => {
    if (statusFilter === "all") return results;
    return results.filter((item) => item.status === statusFilter);
  }, [results, statusFilter]);

  return (
    <RoleGuard roles={["admin", "teacher"]} teacherTypes={["support"]}>
      <div className={styles.page}>
        <header className={styles.header}>
          <h1>อัปโหลดรายชื่อนักศึกษา</h1>
          <p className={styles.subtitle}>
            ตรวจสอบให้เรียบร้อยว่าหลักสูตรและปีการศึกษาปัจจุบันถูกต้องก่อนนำเข้าไฟล์ CSV เพื่อความแม่นยำของข้อมูล
          </p>
        </header>

        {message ? (
          <div
            className={`${styles.alert} ${
              messageTone === "success"
                ? styles.alertSuccess
                : messageTone === "warning"
                  ? styles.alertWarning
                  : styles.alertInfo
            }`}
          >
            {message}
          </div>
        ) : null}

        <section className={styles.card}>
          <div className={styles.cardHeader}>
            <div>
              <strong>ขั้นตอนที่ควรทำก่อนอัปโหลด</strong>
            </div>
            <div className={styles.badgeRow}>
              <span className={`${styles.badge} ${!isReadyToUpload ? styles.badgeWarning : ""}`}>
                {isReadyToUpload ? "พร้อมอัปโหลด" : "ต้องตั้งค่าก่อน"}
              </span>
              <button type="button" className={styles.button} onClick={loadContext}>
                รีเฟรชสถานะ
              </button>
            </div>
          </div>

          {contextLoading ? (
            <p className={styles.subtitle}>กำลังตรวจสอบการตั้งค่า...</p>
          ) : (
            <div className={styles.cardGrid}>
              <div className={styles.statusCard}>
                <div className={styles.statusTitle}>ตั้งค่าหลักสูตรที่ใช้งาน</div>
                <div className={styles.statusText}>{prerequisiteStatus.curriculum.message}</div>
                {prerequisiteStatus.curriculum.ready ? (
                  <select
                    className={styles.select}
                    value={selectedCurriculumId ?? ""}
                    onChange={(event) => {
                      const value = Number(event.target.value);
                      setSelectedCurriculumId(Number.isNaN(value) ? null : value);
                    }}
                  >
                    {activeCurriculums.map((curriculum) => {
                      const curriculumId = getCurriculumId(curriculum);
                      const label = `${curriculum.code || "ไม่ระบุ"} - ${curriculum.shortName || curriculum.name || "ไม่ระบุ"}`;
                      return (
                        <option key={curriculumId ?? label} value={curriculumId ?? ""}>
                          {label}
                        </option>
                      );
                    })}
                  </select>
                ) : (
                  <div className={styles.actionRow}>
                    <a href="/admin/settings/curriculum" className={styles.button}>
                      ไปยังหน้าตั้งค่าหลักสูตร
                    </a>
                  </div>
                )}
              </div>

              <div className={styles.statusCard}>
                <div className={styles.statusTitle}>ตั้งค่าปีการศึกษา/ภาคการศึกษา</div>
                <div className={styles.statusText}>{prerequisiteStatus.academic.message}</div>
                {!prerequisiteStatus.academic.ready ? (
                  <div className={styles.actionRow}>
                    <a href="/admin/settings/academic" className={styles.button}>
                      ไปยังหน้าตั้งค่าปีการศึกษา
                    </a>
                  </div>
                ) : null}
              </div>
            </div>
          )}

          <div className={`${styles.alert} ${isReadyToUpload ? styles.alertSuccess : styles.alertWarning}`}>
            {isReadyToUpload
              ? "พร้อมสำหรับการอัปโหลดไฟล์ CSV หรือ Excel"
              : "ยังมีการตั้งค่าที่ต้องทำให้เรียบร้อยก่อนอัปโหลด"}
          </div>
        </section>

        <section className={styles.card}>
          <div className={styles.fileInput}>
            <div>
              <strong>เลือกไฟล์ CSV หรือ Excel (.xlsx)</strong>
              <p className={styles.fileMeta}>รองรับไฟล์ .csv และ .xlsx ขนาดไม่เกิน 5MB</p>
            </div>
            <input type="file" accept=".csv,.xlsx" onChange={handleFileChange} />
            {file ? <p className={styles.fileMeta}>ไฟล์ที่เลือก: {file.name}</p> : null}
          </div>

          <div className={styles.actionRow}>
            <button
              type="button"
              className={`${styles.button} ${styles.buttonPrimary}`}
              onClick={handleUpload}
              disabled={uploading || !file || !isReadyToUpload}
            >
              {uploading ? "กำลังอัปโหลด..." : "อัปโหลดไฟล์"}
            </button>
            <button type="button" className={styles.button} onClick={() => window.open(csvTemplateDownloadUrl, "_blank")}>
              ดาวน์โหลดเทมเพลต CSV
            </button>
            <button type="button" className={styles.button} onClick={() => window.open(excelTemplateDownloadUrl, "_blank")}>
              ดาวน์โหลดเทมเพลต Excel
            </button>
          </div>
        </section>

        {summary ? (
          <section className={styles.card}>
            <strong>สรุปผลการนำเข้า</strong>
            {summary.fileError ? (
              <div className={`${styles.alert} ${styles.alertWarning}`}>{summary.fileError}</div>
            ) : null}
            <div className={styles.summaryGrid}>
              <div className={styles.summaryCard}>
                <div>จำนวนรายการทั้งหมด</div>
                <div className={styles.summaryValue}>{summary.total ?? 0}</div>
              </div>
              <div className={styles.summaryCard}>
                <div>เพิ่มใหม่</div>
                <div className={styles.summaryValue}>{summary.added ?? 0}</div>
              </div>
              <div className={styles.summaryCard}>
                <div>อัปเดตข้อมูล</div>
                <div className={styles.summaryValue}>{summary.updated ?? 0}</div>
              </div>
              <div className={styles.summaryCard}>
                <div>ข้อมูลไม่ถูกต้อง</div>
                <div className={styles.summaryValue}>{summary.invalid ?? 0}</div>
              </div>
            </div>
          </section>
        ) : null}

        <section className={styles.card}>
          <div className={styles.cardHeader}>
            <strong>ผลลัพธ์การประมวลผล</strong>
            <div className={styles.filters}>
              <span className={styles.fileMeta}>แสดงสถานะ:</span>
              <select
                className={styles.select}
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
              >
                <option value="all">ทั้งหมด</option>
                <option value="Added">เพิ่มใหม่</option>
                <option value="Updated">อัปเดตแล้ว</option>
                <option value="Invalid">ข้อมูลไม่ถูกต้อง</option>
                <option value="Error">เกิดข้อผิดพลาด</option>
              </select>
            </div>
          </div>

          <div className={styles.tableWrap}>
            {filteredResults.length ? (
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>รหัสนักศึกษา</th>
                    <th>ชื่อ</th>
                    <th>นามสกุล</th>
                    <th>อีเมล</th>
                    <th>สถานะ</th>
                    <th>หมายเหตุ</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredResults.map((item, index) => {
                    const meta = statusMeta[item.status ?? ""];
                    return (
                      <tr key={item.studentID ?? `${item.status}-${index}`}>
                        <td>{item.studentID || "-"}</td>
                        <td>{item.firstName || "-"}</td>
                        <td>{item.lastName || "-"}</td>
                        <td>{item.email || "-"}</td>
                        <td>
                          <span className={`${styles.statusTag} ${meta?.className ?? ""}`}>
                            {meta?.label ?? item.status ?? "-"}
                          </span>
                        </td>
                        <td>
                          {item.status === "Invalid" && item.errors?.length
                            ? item.errors.map((errorText, errorIndex) => (
                                <div key={`${item.studentID}-err-${errorIndex}`}>• {errorText}</div>
                              ))
                            : item.status === "Error" && item.error
                              ? item.error
                              : "-"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <p className={styles.fileMeta}>ยังไม่มีผลลัพธ์จากการอัปโหลด</p>
            )}
          </div>
        </section>
      </div>
    </RoleGuard>
  );
}
