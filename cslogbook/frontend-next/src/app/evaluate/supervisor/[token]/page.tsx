"use client";

import { FormEvent, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import styles from "../supervisor-evaluation.module.css";
import {
  EvaluationCategoryKey,
  SupervisorEvaluationSubmission,
  getSupervisorEvaluationDetails,
  submitSupervisorEvaluation,
} from "@/lib/services/supervisorEvaluationService";

const dateFormatter = new Intl.DateTimeFormat("th-TH", { dateStyle: "medium" });

function formatDate(value?: string | null) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return dateFormatter.format(d);
}

const CATEGORY_CONFIG: Array<{ key: EvaluationCategoryKey; title: string; items: string[] }> = [
  { key: "discipline", title: "1. ระเบียบวินัย (20)", items: ["1.1 การแต่งกายสุภาพ", "1.2 ความตรงต่อเวลา", "1.3 ปฏิบัติตามกฎ ระเบียบ", "1.4 ความอดทนและขยัน"] },
  { key: "behavior", title: "2. พฤติกรรมในการปฏิบัติงาน (20)", items: ["2.1 การแก้ปัญหาเฉพาะหน้า", "2.2 ทัศนคติต่องานและหน่วยงาน", "2.3 ความคิดริเริ่มและปรับปรุงงาน", "2.4 ความตั้งใจและความสนใจในงาน"] },
  { key: "performance", title: "3. ผลงาน (20)", items: ["3.1 ปฏิบัติงานถูกต้องตามหลักเกณฑ์", "3.2 งานเสร็จในเวลาที่กำหนด", "3.3 สอดคล้องกับนโยบายหน่วยงาน", "3.4 ผลงานมีคุณภาพ"] },
  { key: "method", title: "4. วิธีการปฏิบัติงาน (20)", items: ["4.1 ใช้วัสดุอย่างประหยัด", "4.2 ทำงานถูกต้องตามขั้นตอน", "4.3 คำนึงถึงความประหยัดและปลอดภัย", "4.4 ใช้เครื่องมืออุปกรณ์อย่างระมัดระวัง"] },
  { key: "relation", title: "5. มนุษยสัมพันธ์ (20)", items: ["5.1 น้ำใจและความร่วมมือ", "5.2 การปรับตัวกับสภาพแวดล้อม", "5.3 สุภาพ อ่อนน้อม", "5.4 แสดงความคิดเห็นและรับฟังผู้อื่น"] },
];

const initialScores: Record<EvaluationCategoryKey, [number, number, number, number]> = {
  discipline: [0, 0, 0, 0],
  behavior: [0, 0, 0, 0],
  performance: [0, 0, 0, 0],
  method: [0, 0, 0, 0],
  relation: [0, 0, 0, 0],
};

export default function SupervisorEvaluationPage() {
  const params = useParams<{ token: string }>();
  const token = params?.token;

  const [supervisorName, setSupervisorName] = useState<string | null>(null);
  const [supervisorPosition, setSupervisorPosition] = useState<string | null>(null);
  const [supervisorEmail, setSupervisorEmail] = useState<string | null>(null);
  const [supervisorPhone, setSupervisorPhone] = useState<string | null>(null);
  const [strengths, setStrengths] = useState("");
  const [improvements, setImprovements] = useState("");
  const [additionalComments, setAdditionalComments] = useState("");
  const [decision, setDecision] = useState<"pass" | "fail" | null>(null);
  const [scores, setScores] = useState<Record<EvaluationCategoryKey, [number, number, number, number]>>(initialScores);
  const [localError, setLocalError] = useState<string | null>(null);
  const [submittedLocal, setSubmittedLocal] = useState(false);

  const detailsQuery = useQuery({
    queryKey: ["supervisor-evaluation", token],
    queryFn: () => getSupervisorEvaluationDetails(token as string),
    enabled: Boolean(token),
    retry: false,
  });

  const details = detailsQuery.data?.data;

  const submitted = submittedLocal || (details?.evaluationDetails?.status && details.evaluationDetails.status !== "pending");

  const mutation = useMutation({
    mutationFn: (payload: SupervisorEvaluationSubmission) => submitSupervisorEvaluation(token as string, payload),
    onSuccess: () => {
      setSubmittedLocal(true);
      setLocalError(null);
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : "ไม่สามารถส่งแบบประเมินได้";
      setLocalError(message);
    },
  });

  const resolvedSupervisorName = supervisorName ?? details?.internshipInfo?.supervisorName ?? "";
  const resolvedSupervisorPosition = supervisorPosition ?? details?.internshipInfo?.supervisorPosition ?? "";
  const resolvedSupervisorEmail = supervisorEmail ?? details?.internshipInfo?.supervisorEmail ?? "";
  const resolvedSupervisorPhone = supervisorPhone ?? details?.internshipInfo?.supervisorPhone ?? "";

  const subtotals = useMemo(() => {
    return (Object.keys(scores) as EvaluationCategoryKey[]).reduce<Record<EvaluationCategoryKey, number>>((acc, key) => {
      acc[key] = scores[key].reduce((a, b) => a + (Number.isFinite(b) ? b : 0), 0);
      return acc;
    }, {
      discipline: 0,
      behavior: 0,
      performance: 0,
      method: 0,
      relation: 0,
    });
  }, [scores]);

  const totalScore = useMemo(() => {
    return Object.values(subtotals).reduce((a, b) => a + b, 0);
  }, [subtotals]);

  const passByScore = totalScore >= 70;
  const finalPass = passByScore && decision === "pass";

  const missingScores = useMemo(() => {
    return (Object.values(scores).some((arr) => arr.some((v) => !v)));
  }, [scores]);

  const handleScoreChange = (category: EvaluationCategoryKey, index: number, value: number) => {
    setScores((prev) => ({
      ...prev,
      [category]: prev[category].map((v, idx) => (idx === index ? value : v)) as [number, number, number, number],
    }));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLocalError(null);
    if (!token || !details) {
      setLocalError("ไม่พบลิงก์สำหรับการประเมิน");
      return;
    }
    const trimmedName = resolvedSupervisorName.trim();
    const trimmedPosition = resolvedSupervisorPosition.trim();
    const trimmedStrengths = strengths.trim();
    const trimmedImprovements = improvements.trim();

    if (!trimmedName || !trimmedPosition || !trimmedStrengths || !trimmedImprovements) {
      setLocalError("กรุณากรอกข้อมูลผู้ประเมินและสรุปข้อคิดเห็นให้ครบถ้วน");
      return;
    }
    if (!decision) {
      setLocalError("กรุณาเลือกผลการตัดสินผ่าน/ไม่ผ่าน");
      return;
    }
    if (missingScores) {
      setLocalError("กรุณาให้คะแนนทุกข้อ (1-5)");
      return;
    }

    const payload: SupervisorEvaluationSubmission = {
      supervisorName: trimmedName,
      supervisorPosition: trimmedPosition,
      supervisorEmail: resolvedSupervisorEmail.trim() || undefined,
      supervisorPhone: resolvedSupervisorPhone.trim() || undefined,
      supervisorDecision: decision === "pass",
      categories: scores,
      strengths: trimmedStrengths,
      improvements: trimmedImprovements,
      additionalComments: additionalComments.trim() ? additionalComments.trim() : null,
    };

    mutation.mutate(payload);
  };

  const loadingState = detailsQuery.isLoading;
  const errorState = detailsQuery.isError || (!details && !detailsQuery.isLoading);
  const tokenInvalid = !token;

  if (tokenInvalid) {
    return (
      <div className={styles.page}>
        <div className={styles.shell}>
          <div className={styles.statusCard}>
            <div className={styles.statusTitle}>ไม่พบลิงก์การประเมิน</div>
            <div className={styles.statusMeta}>กรุณาตรวจสอบ URL อีกครั้ง</div>
          </div>
        </div>
      </div>
    );
  }

  if (loadingState) {
    return (
      <div className={styles.page}>
        <div className={styles.shell}>
          <div className={styles.contentCard}>
            <div className={styles.sectionTitle}>กำลังโหลดแบบประเมิน...</div>
            <div className={styles.helperText}>กรุณารอสักครู่</div>
          </div>
        </div>
      </div>
    );
  }

  if (errorState) {
    const message = (detailsQuery.error as Error | undefined)?.message || "ไม่สามารถดึงข้อมูลแบบประเมินได้";
    const isExpiredError = message.includes("หมดอายุ");
    return (
      <div className={styles.page}>
        <div className={styles.shell}>
          <div className={styles.statusCard}>
            <div className={styles.statusTitle}>
              {isExpiredError ? "ลิงก์หมดอายุแล้ว" : "ไม่พบข้อมูลการประเมิน"}
            </div>
            <div className={styles.statusMeta}>{message}</div>
          </div>
        </div>
      </div>
    );
  }

  if (!details) {
    return null;
  }

  if (submitted || details.evaluationDetails?.status === "used") {
    return (
      <div className={styles.page}>
        <div className={styles.shell}>
          <div className={styles.statusCard}>
            <div className={styles.kicker}>ขอบคุณ</div>
            <div className={styles.statusTitle}>บันทึกผลการประเมินแล้ว</div>
            <div className={styles.statusMeta}>
              ขอบคุณที่สละเวลาในการประเมินนักศึกษา {details.studentInfo?.fullName || ""}
            </div>
            <div className={styles.statusMeta}>
              หากต้องการแก้ไข กรุณาติดต่อเจ้าหน้าที่เพื่อลิงก์ใหม่
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.shell}>
        <div className={styles.hero}>
          <div className={styles.kicker}>Internship evaluation</div>
          <div className={styles.title}>แบบประเมินผลการฝึกงานโดยผู้ควบคุมงาน</div>
          <p className={styles.lead}>
            กรุณาให้คะแนนและข้อเสนอแนะสำหรับนักศึกษาที่เข้าฝึกงาน คะแนนจะใช้ประกอบการตัดสินผลการฝึกงาน
          </p>
          <div className={styles.metaRow}>
            <span className={styles.pill}>ส่งเมื่อ {formatDate(details.evaluationDetails?.sentDate)}</span>
            <span className={`${styles.pill} ${styles.pillMuted}`}>หมดอายุ {formatDate(details.evaluationDetails?.expiresAt)}</span>
          </div>
        </div>

        <form className={styles.contentCard} onSubmit={handleSubmit}>
          <div className={styles.sectionTitle}>ข้อมูลนักศึกษาและสถานประกอบการ</div>
          <p className={styles.sectionLead}>ใช้เพื่อยืนยันตัวตนนักศึกษาและข้อมูลการฝึกงาน</p>
          <div className={styles.infoGrid}>
            <div className={styles.infoItem}>
              <div className={styles.infoLabel}>นักศึกษา</div>
              <div className={styles.infoValue}>{details.studentInfo?.fullName || "ไม่ระบุ"}</div>
            </div>
            <div className={styles.infoItem}>
              <div className={styles.infoLabel}>รหัสนักศึกษา</div>
              <div className={styles.infoValue}>{details.studentInfo?.studentCode || details.studentInfo?.studentId || "ไม่ระบุ"}</div>
            </div>
            <div className={styles.infoItem}>
              <div className={styles.infoLabel}>อีเมลนักศึกษา</div>
              <div className={styles.infoValue}>{details.studentInfo?.email || "ไม่ระบุ"}</div>
            </div>
            <div className={styles.infoItem}>
              <div className={styles.infoLabel}>ตำแหน่งฝึกงาน</div>
              <div className={styles.infoValue}>{details.internshipInfo?.internshipPosition || "ไม่ระบุ"}</div>
            </div>
            <div className={styles.infoItem}>
              <div className={styles.infoLabel}>สถานประกอบการ</div>
              <div className={styles.infoValue}>{details.internshipInfo?.companyName || "ไม่ระบุ"}</div>
            </div>
            <div className={styles.infoItem}>
              <div className={styles.infoLabel}>ช่วงการฝึกงาน</div>
              <div className={styles.infoValue}>
                {details.internshipInfo?.startDate && details.internshipInfo?.endDate
                  ? `${formatDate(details.internshipInfo.startDate)} ถึง ${formatDate(details.internshipInfo.endDate)}`
                  : "ไม่ระบุ"}
              </div>
            </div>
          </div>

          <div className={styles.sectionTitle}>ข้อมูลผู้ประเมิน</div>
          <div className={styles.formGrid}>
            <div>
              <div className={styles.fieldLabel}>ชื่อ-สกุล ผู้ประเมิน *</div>
              <input
                className={styles.textInput}
                value={resolvedSupervisorName}
                onChange={(e) => setSupervisorName(e.target.value)}
                placeholder="เช่น นายสมศักดิ์ ใจดี"
              />
            </div>
            <div>
              <div className={styles.fieldLabel}>ตำแหน่ง *</div>
              <input
                className={styles.textInput}
                value={resolvedSupervisorPosition}
                onChange={(e) => setSupervisorPosition(e.target.value)}
                placeholder="เช่น Senior Software Engineer"
              />
            </div>
          </div>
          <div className={styles.formGrid}>
            <div>
              <div className={styles.fieldLabel}>อีเมล</div>
              <input
                className={styles.textInput}
                value={resolvedSupervisorEmail}
                onChange={(e) => setSupervisorEmail(e.target.value)}
                placeholder="supervisor@example.com"
              />
            </div>
            <div>
              <div className={styles.fieldLabel}>เบอร์ติดต่อ</div>
              <input
                className={styles.textInput}
                value={resolvedSupervisorPhone}
                onChange={(e) => setSupervisorPhone(e.target.value)}
                placeholder="02-123-4567"
              />
            </div>
          </div>

          <div className={styles.divider} />

          <div className={styles.sectionTitle}>ส่วนที่ 1: การประเมินผลการปฏิบัติงาน</div>
          <p className={styles.sectionLead}>ให้คะแนนแต่ละข้อ 1-5 คะแนน ระบบจะรวมอัตโนมัติ (ผ่านเมื่อ ≥ 70 และเลือกผ่าน)</p>

          {CATEGORY_CONFIG.map((cat) => {
            const subtotal = subtotals[cat.key];
            const badgeClass = subtotal === 20 ? `${styles.scoreBadge} ${styles.scoreBadgePositive}` : styles.scoreBadge;
            return (
              <div key={cat.key} className={styles.ratingCard}>
                <div className={styles.ratingHeader}>
                  <div className={styles.sectionTitle}>{cat.title}</div>
                  <span className={badgeClass}>{subtotal} / 20</span>
                </div>
                {cat.items.map((label, idx) => {
                  const currentScore = scores[cat.key][idx];
                  return (
                    <div key={`${cat.key}-${idx}`} className={styles.ratingRow}>
                      <div className={styles.ratingLabel}>{label}</div>
                      <div className={styles.ratingControls}>
                        {[1, 2, 3, 4, 5].map((score) => {
                          const active = currentScore === score;
                          return (
                            <button
                              type="button"
                              key={score}
                              className={`${styles.ratingButton} ${active ? styles.ratingButtonActive : ""}`}
                              onClick={() => handleScoreChange(cat.key, idx, score)}
                            >
                              {score}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}

          <div className={styles.summaryCard}>
            <div className={styles.summaryItem}>
              <div className={styles.infoLabel}>คะแนนรวม</div>
              <div className={styles.summaryValue} style={{ color: passByScore ? "#15803d" : "#b91c1c" }}>{totalScore} / 100</div>
              <div className={styles.helperText}>ต้องได้อย่างน้อย 70 คะแนน</div>
            </div>
            <div className={styles.summaryItem}>
              <div className={styles.infoLabel}>การตัดสินของผู้ประเมิน *</div>
              <div className={styles.decisions}>
                <button
                  type="button"
                  className={`${styles.decisionButton} ${decision === "pass" ? styles.decisionActivePass : ""}`}
                  onClick={() => setDecision("pass")}
                >
                  ผ่าน
                </button>
                <button
                  type="button"
                  className={`${styles.decisionButton} ${decision === "fail" ? styles.decisionActiveFail : ""}`}
                  onClick={() => setDecision("fail")}
                >
                  ไม่ผ่าน
                </button>
              </div>
              <div className={styles.helperText}>ระบบจะสรุปผลเบื้องต้นจากคะแนนรวมและการตัดสินนี้</div>
            </div>
            <div className={styles.summaryItem}>
              <div className={styles.infoLabel}>ผลสรุปเบื้องต้น</div>
              <div className={styles.summaryValue} style={{ color: finalPass ? "#15803d" : "#b45309" }}>
                {finalPass ? "ผ่าน" : "ยังไม่ผ่าน"}
              </div>
            </div>
          </div>

          <div className={styles.divider} />

          <div className={styles.sectionTitle}>ส่วนที่ 2: สรุปและข้อเสนอแนะ</div>
          <div className={styles.formGrid}>
            <div style={{ gridColumn: "span 2" }}>
              <div className={styles.fieldLabel}>จุดเด่นของนักศึกษา *</div>
              <textarea
                className={styles.textArea}
                value={strengths}
                onChange={(e) => setStrengths(e.target.value)}
                placeholder="อธิบายจุดเด่นหรือสิ่งที่นักศึกษาทำได้ดี"
              />
            </div>
            <div style={{ gridColumn: "span 2" }}>
              <div className={styles.fieldLabel}>สิ่งที่ควรปรับปรุง *</div>
              <textarea
                className={styles.textArea}
                value={improvements}
                onChange={(e) => setImprovements(e.target.value)}
                placeholder="อธิบายสิ่งที่นักศึกษาควรปรับปรุงหรือพัฒนาเพิ่มเติม"
              />
            </div>
            <div style={{ gridColumn: "span 2" }}>
              <div className={styles.fieldLabel}>ข้อเสนอแนะเพิ่มเติม (ไม่บังคับ)</div>
              <textarea
                className={styles.textArea}
                value={additionalComments}
                onChange={(e) => setAdditionalComments(e.target.value)}
                placeholder="ข้อคิดเห็นเพิ่มเติม (ถ้ามี)"
              />
            </div>
          </div>

          {localError ? (
            <div className={styles.alert}>{localError}</div>
          ) : (
            <div className={`${styles.alert} ${styles.alertInfo}`}>
              เกณฑ์ผ่าน: คะแนนรวมไม่น้อยกว่า 70 และเลือก &quot;ผ่าน&quot;
            </div>
          )}

          <div className={styles.submitBar}>
            <button className={styles.primaryButton} type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "กำลังส่ง..." : "ส่งแบบประเมิน"}
            </button>
          </div>

          {mutation.isSuccess && !submitted && (
            <div className={`${styles.alert} ${styles.alertSuccess}`}>
              ส่งแบบประเมินเรียบร้อยแล้ว
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
