"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { useAuth } from "@/contexts/AuthContext";
import { env } from "@/lib/config/env";
import { getCurrentAcademicInfo } from "@/lib/services/academicService";
import { getTemplateDownloadPath } from "@/lib/services/compatibilityService";
import { getCurriculumById, getCurriculumMappings, type CurriculumRecord } from "@/lib/services/settingsService";
import { uploadStudentCSV, type UploadStudentResult, type UploadStudentSummary } from "@/lib/services/adminService";
import btn from "@/styles/shared/buttons.module.css";
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

type FilterKey = "all" | "Added" | "Updated" | "Invalid" | "Error";

const filterOptions: { key: FilterKey; label: string }[] = [
  { key: "all", label: "ทั้งหมด" },
  { key: "Added", label: "เพิ่มใหม่" },
  { key: "Updated", label: "อัปเดต" },
  { key: "Invalid", label: "ไม่ถูกต้อง" },
  { key: "Error", label: "ข้อผิดพลาด" },
];

const getCurriculumId = (curriculum: CurriculumRecord) =>
  curriculum.curriculumId ?? curriculum.id ?? curriculum.curriculumID ?? null;

const getBackendBaseUrl = () => env.apiUrl.replace(/\/api\/?$/, "");

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export default function AdminUploadPage() {
  const { token } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [results, setResults] = useState<UploadStudentResult[]>([]);
  const [summary, setSummary] = useState<UploadStudentSummary | null>(null);
  const [statusFilter, setStatusFilter] = useState<FilterKey>("all");
  const [message, setMessage] = useState<string | null>(null);
  const [messageTone, setMessageTone] = useState<"info" | "warning" | "success">("info");
  const [dragActive, setDragActive] = useState(false);

  const [prerequisiteStatus, setPrerequisiteStatus] = useState<PrerequisiteStatus>({
    curriculum: { ready: false, message: "" },
    academic: { ready: false, message: "" },
  });
  const [contextLoading, setContextLoading] = useState(true);
  const [activeCurriculums, setActiveCurriculums] = useState<CurriculumRecord[]>([]);
  const [selectedCurriculumId, setSelectedCurriculumId] = useState<number | null>(null);
  const selectedCurriculumRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
        message: `กำลังใช้หลักสูตร: ${selected.shortName || selected.name || "ไม่ระบุ"}` +
          (selected.active === false ? " (ยังไม่ได้เปิดใช้งาน)" : ""),
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

    let nextAcademicCurriculumId: number | null = null;

    try {
      const academicInfo = await getCurrentAcademicInfo();
      if (academicInfo) {
        nextAcademicCurriculumId = academicInfo.activeCurriculumId ?? null;
        nextStatus.academic = {
          ready: true,
          message:
            `ปีการศึกษา/ภาคเรียนปัจจุบัน: ${academicInfo.displayText}` +
            (academicInfo.isFromDatabase ? "" : " (คำนวณอัตโนมัติ)"),
        };
      }
    } catch {
      nextStatus.academic = { ready: false, message: "ไม่สามารถโหลดข้อมูลปีการศึกษาได้" };
    }

    try {
      const curriculums = await getCurriculumMappings();
      let nextCurriculums = curriculums;

      if (nextAcademicCurriculumId && !curriculums.some((item) => getCurriculumId(item) === nextAcademicCurriculumId)) {
        const academicCurriculum = await getCurriculumById(nextAcademicCurriculumId);
        if (academicCurriculum) {
          nextCurriculums = [academicCurriculum, ...curriculums];
        }
      }

      setActiveCurriculums(nextCurriculums);

      if (nextCurriculums.length > 0) {
        const preferredCurriculum = nextCurriculums.find((item) => item.active) ?? nextCurriculums[0];
        const fallbackId = getCurriculumId(preferredCurriculum);
        const academicMatch = nextCurriculums.find(
          (curriculum) => getCurriculumId(curriculum) === nextAcademicCurriculumId
        );
        const nextSelectedId =
          (academicMatch ? getCurriculumId(academicMatch) : null) ??
          selectedCurriculumRef.current ??
          fallbackId ??
          null;
        setSelectedCurriculumId(nextSelectedId);
        nextStatus.curriculum = resolveCurriculumStatus(nextCurriculums, nextSelectedId);
      } else {
        nextStatus.curriculum = resolveCurriculumStatus(nextCurriculums, null);
      }
    } catch {
      nextStatus.curriculum = {
        ready: false,
        message: "ไม่สามารถโหลดข้อมูลหลักสูตรได้",
      };
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

  const validateAndSetFile = (nextFile: File | null) => {
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

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    validateAndSetFile(event.target.files?.[0] ?? null);
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setDragActive(false);
    const droppedFile = event.dataTransfer.files?.[0] ?? null;
    validateAndSetFile(droppedFile);
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (event: React.DragEvent) => {
    event.preventDefault();
    setDragActive(false);
  };

  const handleRemoveFile = () => {
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
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

  const csvTemplateDownloadUrl = `${getBackendBaseUrl()}${getTemplateDownloadPath("csv")}`;
  const excelTemplateDownloadUrl = `${getBackendBaseUrl()}${getTemplateDownloadPath("excel")}`;

  const filteredResults = useMemo(() => {
    if (statusFilter === "all") return results;
    return results.filter((item) => item.status === statusFilter);
  }, [results, statusFilter]);

  const filterCounts = useMemo(() => {
    const counts: Record<FilterKey, number> = {
      all: results.length,
      Added: 0,
      Updated: 0,
      Invalid: 0,
      Error: 0,
    };
    for (const item of results) {
      const status = item.status as FilterKey;
      if (status in counts) counts[status]++;
    }
    return counts;
  }, [results]);

  return (
    <RoleGuard roles={["admin", "teacher"]} teacherTypes={["support"]}>
      <div className={styles.page}>
        <header className={styles.header}>
          <h1>อัปโหลดรายชื่อนักศึกษา</h1>
          <p className={styles.subtitle}>
            นำเข้าข้อมูลนักศึกษาจากไฟล์ CSV หรือ Excel เข้าสู่ระบบ
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

        {/* ─── Step 1: Prerequisites ─── */}
        <div className={styles.stepSection}>
          <div className={styles.stepHeader}>
            <span className={styles.stepNumber} data-done={isReadyToUpload ? "true" : undefined}>1</span>
            <h2 className={styles.stepTitle}>ตรวจสอบการตั้งค่าระบบ</h2>
          </div>

          <section className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.badgeRow}>
                <span className={`${styles.badge} ${!isReadyToUpload ? styles.badgeWarning : ""}`}>
                  {isReadyToUpload ? "พร้อมอัปโหลด" : "ต้องตั้งค่าก่อน"}
                </span>
              </div>
              <button type="button" className={btn.button} onClick={loadContext} disabled={contextLoading}>
                {contextLoading ? "กำลังตรวจสอบ..." : "รีเฟรชสถานะ"}
              </button>
            </div>

            {contextLoading ? (
              <p className={styles.subtitle}>กำลังตรวจสอบการตั้งค่า...</p>
            ) : (
              <div className={styles.cardGrid}>
                <div className={styles.statusCard} data-ready={prerequisiteStatus.curriculum.ready ? "true" : "false"}>
                  <div className={styles.statusTitle}>
                    <span
                      className={styles.statusIndicator}
                      data-ready={prerequisiteStatus.curriculum.ready ? "true" : undefined}
                    />
                    หลักสูตรที่ใช้งาน
                  </div>
                  <div className={styles.statusText}>{prerequisiteStatus.curriculum.message}</div>
                  {prerequisiteStatus.curriculum.ready ? (
                    <select
                      className={styles.select}
                      title="เลือกหลักสูตร"
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
                      <a href="/admin/settings/curriculum" className={btn.button}>
                        ไปยังหน้าตั้งค่าหลักสูตร
                      </a>
                    </div>
                  )}
                </div>

                <div className={styles.statusCard} data-ready={prerequisiteStatus.academic.ready ? "true" : "false"}>
                  <div className={styles.statusTitle}>
                    <span
                      className={styles.statusIndicator}
                      data-ready={prerequisiteStatus.academic.ready ? "true" : undefined}
                    />
                    ปีการศึกษา / ภาคการศึกษา
                  </div>
                  <div className={styles.statusText}>{prerequisiteStatus.academic.message}</div>
                  {!prerequisiteStatus.academic.ready ? (
                    <div className={styles.actionRow}>
                      <a href="/admin/settings/academic" className={btn.button}>
                        ไปยังหน้าตั้งค่าปีการศึกษา
                      </a>
                    </div>
                  ) : null}
                </div>
              </div>
            )}
          </section>
        </div>

        {/* ─── Step 2: File Upload ─── */}
        <div className={styles.stepSection}>
          <div className={styles.stepHeader}>
            <span className={styles.stepNumber} data-done={file ? "true" : undefined}>2</span>
            <h2 className={styles.stepTitle}>เลือกไฟล์และอัปโหลด</h2>
          </div>

          <section className={styles.card}>
            {!file ? (
              <div
                className={styles.dropZone}
                data-active={dragActive ? "true" : undefined}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.xlsx"
                  title="เลือกไฟล์ CSV หรือ Excel"
                  onChange={handleFileChange}
                  className={styles.dropZoneInput}
                />
                <div className={styles.dropIcon}>{dragActive ? "\u{1F4E5}" : "\u{1F4C4}"}</div>
                <div className={styles.dropLabel}>
                  {dragActive ? "ปล่อยไฟล์ที่นี่" : "ลากไฟล์มาวางที่นี่ หรือคลิกเพื่อเลือกไฟล์"}
                </div>
                <div className={styles.dropHint}>รองรับ .csv และ .xlsx ขนาดไม่เกิน 5MB</div>
              </div>
            ) : (
              <div className={styles.fileInfo}>
                <span className={styles.fileName}>{file.name}</span>
                <span className={styles.fileSize}>{formatFileSize(file.size)}</span>
                <button type="button" className={styles.fileRemove} onClick={handleRemoveFile}>
                  ลบไฟล์
                </button>
              </div>
            )}

            <div className={styles.actionRow}>
              <button
                type="button"
                className={`${btn.button} ${btn.buttonPrimary}`}
                onClick={handleUpload}
                disabled={uploading || !file || !isReadyToUpload}
              >
                {uploading ? "กำลังอัปโหลด..." : "อัปโหลดไฟล์"}
              </button>
            </div>

            <div className={styles.templateRow}>
              <span className={styles.templateLabel}>ดาวน์โหลดเทมเพลต:</span>
              <button type="button" className={btn.button} onClick={() => window.open(csvTemplateDownloadUrl, "_blank")}>
                CSV
              </button>
              <button type="button" className={btn.button} onClick={() => window.open(excelTemplateDownloadUrl, "_blank")}>
                Excel
              </button>
            </div>
          </section>
        </div>

        {/* ─── Step 3: Results ─── */}
        {summary ? (
          <div className={styles.stepSection}>
            <div className={styles.stepHeader}>
              <span className={styles.stepNumber} data-done="true">3</span>
              <h2 className={styles.stepTitle}>ผลลัพธ์การนำเข้า</h2>
            </div>

            <section className={styles.card}>
              {summary.fileError ? (
                <div className={`${styles.alert} ${styles.alertWarning}`}>{summary.fileError}</div>
              ) : null}

              <div className={styles.summaryGrid}>
                <div className={styles.summaryCard} data-type="total">
                  <div className={styles.summaryLabel}>ทั้งหมด</div>
                  <div className={styles.summaryValue}>{summary.total ?? 0}</div>
                </div>
                <div className={styles.summaryCard} data-type="added">
                  <div className={styles.summaryLabel}>เพิ่มใหม่</div>
                  <div className={styles.summaryValue}>{summary.added ?? 0}</div>
                </div>
                <div className={styles.summaryCard} data-type="updated">
                  <div className={styles.summaryLabel}>อัปเดต</div>
                  <div className={styles.summaryValue}>{summary.updated ?? 0}</div>
                </div>
                <div className={styles.summaryCard} data-type="invalid">
                  <div className={styles.summaryLabel}>ไม่ถูกต้อง</div>
                  <div className={styles.summaryValue}>{summary.invalid ?? 0}</div>
                </div>
              </div>
            </section>

            <section className={styles.card}>
              <div className={styles.filterTabs}>
                {filterOptions.map((opt) => (
                  <button
                    key={opt.key}
                    type="button"
                    className={styles.filterTab}
                    data-active={statusFilter === opt.key ? "true" : undefined}
                    onClick={() => setStatusFilter(opt.key)}
                  >
                    {opt.label}
                    {results.length > 0 ? (
                      <span className={styles.filterCount}>{filterCounts[opt.key]}</span>
                    ) : null}
                  </button>
                ))}
              </div>

              <div className={styles.tableWrap}>
                {filteredResults.length > 0 ? (
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>#</th>
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
                            <td className={styles.rowNumber}>{index + 1}</td>
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
                              {item.status === "Invalid" && item.errors?.length ? (
                                <div className={styles.errorList}>
                                  {item.errors.map((errorText, errorIndex) => (
                                    <div key={`${item.studentID}-err-${errorIndex}`}>{errorText}</div>
                                  ))}
                                </div>
                              ) : item.status === "Error" && item.error ? (
                                <div className={styles.errorList}>{item.error}</div>
                              ) : (
                                "-"
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                ) : (
                  <div className={styles.emptyState}>
                    <div className={styles.emptyIcon}>{"\u{1F50D}"}</div>
                    <div>ไม่พบรายการที่ตรงกับตัวกรอง</div>
                  </div>
                )}
              </div>
            </section>
          </div>
        ) : null}
      </div>
    </RoleGuard>
  );
}
