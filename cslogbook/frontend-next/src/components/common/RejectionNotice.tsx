import styles from "@/styles/requestPage.module.css";

interface RejectionNoticeProps {
  status: string;
  message?: string;
}

export function RejectionNotice({ status, message }: RejectionNoticeProps) {
  if (!["advisor_rejected", "staff_returned"].includes(status)) return null;

  return (
    <section className={styles.noticeRejection}>
      <p className={styles.sectionTitle}>
        {status === "advisor_rejected" ? "อาจารย์ส่งคำขอกลับแล้ว" : "เจ้าหน้าที่ส่งคำขอกลับแล้ว"}
      </p>
      <p>{message || "กรุณาตรวจสอบข้อมูลและแก้ไขแล้วส่งใหม่ได้เลย"}</p>
    </section>
  );
}
