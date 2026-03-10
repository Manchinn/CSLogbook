import styles from "@/styles/requestPage.module.css";

interface StudentTableProps {
  students: Array<Record<string, string>>;
  onStudentChange: (index: number, field: string, value: string) => void;
  disabled?: boolean;
}

export function StudentTable({ students, onStudentChange, disabled }: StudentTableProps) {
  return (
    <section className={styles.card}>
      <h3 className={styles.sectionTitle}>ข้อมูลนักศึกษา</h3>
      <div className={styles.table}>
        <div className={styles.tableHeader}>
          <span className={styles.tableHeaderCell}>รหัสนักศึกษา</span>
          <span className={styles.tableHeaderCell}>ชื่อ-นามสกุล</span>
          <span className={styles.tableHeaderCell}>เบอร์โทรศัพท์</span>
          <span className={styles.tableHeaderCell}>อีเมล</span>
        </div>
        {students.map((student, index) => (
          <div key={`${student.studentId}-${index}`} className={styles.row}>
            <input value={student.studentCode || ""} disabled aria-label="รหัสนักศึกษา" />
            <input value={student.name || ""} disabled aria-label="ชื่อ-นามสกุล" />
            <input
              value={student.phone || ""}
              onChange={(event) => onStudentChange(index, "phone", event.target.value)}
              disabled={disabled}
              aria-label="เบอร์โทรศัพท์"
            />
            <input
              value={student.email || ""}
              onChange={(event) => onStudentChange(index, "email", event.target.value)}
              disabled={disabled}
              aria-label="อีเมล"
            />
          </div>
        ))}
      </div>
    </section>
  );
}
