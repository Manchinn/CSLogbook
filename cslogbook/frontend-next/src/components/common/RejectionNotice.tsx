import styles from "@/styles/requestPage.module.css";

const REJECTION_STATUSES = ["advisor_rejected", "staff_rejected", "rejected"];

const STATUS_LABELS: Record<string, string> = {
  advisor_rejected: "อาจารย์ส่งคำขอกลับแล้ว",
  staff_rejected: "เจ้าหน้าที่ส่งคำขอกลับแล้ว",
  rejected: "คำขอถูกปฏิเสธ",
};

interface RejectionNoticeProps {
  status: string;
  message?: string;
  /** rejection note จากผู้ reject */
  details?: string | null;
  /** คำแนะนำขั้นตอนถัดไป */
  actionText?: string;
  /** force show โดยไม่ต้องเช็ค status (กรณี KP02 ที่ overall status ไม่ตรง) */
  visible?: boolean;
  /** callback เปิด modal ดูรายละเอียด */
  onViewDetails?: () => void;
}

export function RejectionNotice({ status, message, details, actionText, visible, onViewDetails }: RejectionNoticeProps) {
  if (!visible && !REJECTION_STATUSES.includes(status)) return null;

  const label = STATUS_LABELS[status] || "คำขอถูกส่งกลับ";

  return (
    <section className={styles.noticeRejection}>
      <p className={styles.sectionTitle}>{label}</p>
      {details ? <p style={{ margin: "4px 0" }}>เหตุผล: {details}</p> : null}
      <p>{message || "กรุณาตรวจสอบข้อมูลและแก้ไขแล้วส่งใหม่ได้เลย"}</p>
      {actionText ? <p style={{ fontWeight: 600, marginTop: 4 }}>{actionText}</p> : null}
      {onViewDetails ? (
        <button
          type="button"
          onClick={onViewDetails}
          style={{
            marginTop: 8,
            padding: "6px 14px",
            borderRadius: 8,
            border: "1px solid var(--tag-danger-text)",
            background: "transparent",
            color: "var(--tag-danger-text)",
            cursor: "pointer",
            fontSize: "0.85rem",
            fontWeight: 500,
          }}
        >
          ดูรายละเอียด
        </button>
      ) : null}
    </section>
  );
}
