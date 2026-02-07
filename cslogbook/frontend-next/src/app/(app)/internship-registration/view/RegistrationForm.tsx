"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import type { CS05Document, InternshipStudent } from "@/lib/services/internshipService";
import { submitCS05WithTranscript } from "@/lib/services/internshipService";
import styles from "./registrationLanding.module.css";

type RegistrationFormProps = {
  student: InternshipStudent | null;
  onSubmitted?: (cs05: CS05Document | null) => void;
};

type FormState = {
  companyName: string;
  companyAddress: string;
  internshipPosition: string;
  contactPersonName: string;
  contactPersonPosition: string;
  startDate: string;
  endDate: string;
  phoneNumber: string;
  classroom: string;
};

const initialState: FormState = {
  companyName: "",
  companyAddress: "",
  internshipPosition: "",
  contactPersonName: "",
  contactPersonPosition: "",
  startDate: "",
  endDate: "",
  phoneNumber: "",
  classroom: "",
};

export default function RegistrationForm({ student, onSubmitted }: RegistrationFormProps) {
  const router = useRouter();
  const { token } = useAuth();
  const [form, setForm] = useState<FormState>(() => ({
    ...initialState,
    phoneNumber: student?.phoneNumber || "",
    classroom: student?.classroom || "",
  }));
  const [transcriptFile, setTranscriptFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const studentSummary = useMemo(() => {
    if (!student) return null;
    return `${student.studentId} • ${student.fullName || "นักศึกษา"}`;
  }, [student]);

  useEffect(() => {
    if (!student) return;
    setForm((prev) => ({
      ...prev,
      phoneNumber: prev.phoneNumber || student.phoneNumber || "",
      classroom: prev.classroom || student.classroom || "",
    }));
  }, [student]);

  const handleChange = (field: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setTranscriptFile(file);
  };

  const validate = () => {
    if (!form.companyName.trim()) return "กรุณากรอกชื่อบริษัท";
    if (!form.companyAddress.trim()) return "กรุณากรอกที่อยู่บริษัท";
    if (!form.internshipPosition.trim()) return "กรุณากรอกตำแหน่งที่ขอฝึกงาน";
    if (!form.contactPersonName.trim()) return "กรุณากรอกชื่อผู้ติดต่อ";
    if (!form.contactPersonPosition.trim()) return "กรุณากรอกตำแหน่งผู้ติดต่อ";
    if (!form.startDate || !form.endDate) return "กรุณาระบุช่วงวันที่ฝึกงาน";
    if (new Date(form.endDate).getTime() < new Date(form.startDate).getTime()) return "วันที่สิ้นสุดต้องอยู่หลังวันที่เริ่ม";
    if (!transcriptFile) return "กรุณาอัปโหลดไฟล์ Transcript (PDF)";
    if (transcriptFile.type && transcriptFile.type !== "application/pdf") return "กรุณาอัปโหลดเฉพาะไฟล์ PDF";
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    const message = validate();
    if (message) {
      setError(message);
      return;
    }
    if (!token) {
      setError("ไม่พบโทเค็น กรุณาเข้าสู่ระบบใหม่");
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        companyName: form.companyName.trim(),
        companyAddress: form.companyAddress.trim(),
        startDate: form.startDate,
        endDate: form.endDate,
        internshipPosition: form.internshipPosition.trim(),
        contactPersonName: form.contactPersonName.trim(),
        contactPersonPosition: form.contactPersonPosition.trim(),
        phoneNumber: form.phoneNumber.trim(),
        classroom: form.classroom.trim(),
        studentData: [
          {
            fullName: student?.fullName,
            studentId: student?.studentId,
            yearLevel: student?.year,
            totalCredits: student?.totalCredits,
            phoneNumber: form.phoneNumber.trim(),
            classroom: form.classroom.trim(),
          },
        ],
      };

      const formData = new FormData();
      formData.append("formData", JSON.stringify(payload));
      formData.append("transcript", transcriptFile as File);

      const response = await submitCS05WithTranscript(token, formData);
      setSuccess(response.message || "ส่งคำร้องเรียบร้อยแล้ว");
      onSubmitted?.(response.data ?? null);
      router.replace("/internship-registration/flow");
    } catch (err) {
      const message = err instanceof Error ? err.message : "ส่งคำร้องไม่สำเร็จ";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className={styles.formSection}>
      <header className={styles.panelHeader}>
        <div>
          <p className={styles.panelKicker}>ยื่นคำร้อง คพ.05</p>
          <h2 className={styles.panelTitle}>กรอกข้อมูลคำร้องฝึกงาน</h2>
          {studentSummary ? <p className={styles.cardHint}>ผู้ยื่น: {studentSummary}</p> : null}
        </div>
      </header>

      <form className={styles.formCard} onSubmit={handleSubmit}>
        {error ? <div className={styles.errorBox}>{error}</div> : null}
        {success ? <div className={styles.successBox}>{success}</div> : null}

        <div className={styles.formGrid}>
          <label className={styles.field}>
            <span className={styles.label}>ชื่อบริษัท/หน่วยงาน *</span>
            <input
              className={styles.input}
              name="companyName"
              value={form.companyName}
              onChange={handleChange("companyName")}
              placeholder="เช่น บริษัท เอ บี ซี จำกัด"
              required
            />
          </label>

          <label className={styles.field}>
            <span className={styles.label}>ตำแหน่งที่ขอฝึกงาน *</span>
            <input
              className={styles.input}
              name="internshipPosition"
              value={form.internshipPosition}
              onChange={handleChange("internshipPosition")}
              placeholder="เช่น Web Developer, Data Analyst"
              required
            />
          </label>
        </div>

        <label className={styles.field}>
          <span className={styles.label}>ที่อยู่บริษัท *</span>
          <textarea
            className={styles.textarea}
            name="companyAddress"
            value={form.companyAddress}
            onChange={handleChange("companyAddress")}
            placeholder="เลขที่ ถนน แขวง/ตำบล เขต/อำเภอ จังหวัด รหัสไปรษณีย์"
            rows={3}
            required
          />
        </label>

        <div className={styles.formGrid}>
          <label className={styles.field}>
            <span className={styles.label}>ชื่อผู้ติดต่อ *</span>
            <input
              className={styles.input}
              name="contactPersonName"
              value={form.contactPersonName}
              onChange={handleChange("contactPersonName")}
              placeholder="เช่น คุณสมชาย ใจดี / HR"
              required
            />
          </label>

          <label className={styles.field}>
            <span className={styles.label}>ตำแหน่งผู้ติดต่อ *</span>
            <input
              className={styles.input}
              name="contactPersonPosition"
              value={form.contactPersonPosition}
              onChange={handleChange("contactPersonPosition")}
              placeholder="เช่น HR Manager"
              required
            />
          </label>
        </div>

        <div className={styles.formGrid}>
          <label className={styles.field}>
            <span className={styles.label}>วันที่เริ่มฝึกงาน *</span>
            <input
              className={styles.input}
              type="date"
              name="startDate"
              value={form.startDate}
              onChange={handleChange("startDate")}
              required
            />
          </label>
          <label className={styles.field}>
            <span className={styles.label}>วันที่สิ้นสุด *</span>
            <input
              className={styles.input}
              type="date"
              name="endDate"
              value={form.endDate}
              onChange={handleChange("endDate")}
              required
            />
          </label>
        </div>

        <div className={styles.formGrid}>
          <label className={styles.field}>
            <span className={styles.label}>เบอร์โทรศัพท์ติดต่อ</span>
            <input
              className={styles.input}
              name="phoneNumber"
              value={form.phoneNumber}
              onChange={handleChange("phoneNumber")}
              placeholder="กรอกเบอร์โทรศัพท์"
            />
          </label>
          <label className={styles.field}>
            <span className={styles.label}>ห้องเรียน</span>
            <input
              className={styles.input}
              name="classroom"
              value={form.classroom}
              onChange={handleChange("classroom")}
              placeholder="เช่น RA, RB"
            />
          </label>
        </div>

        <label className={styles.field}>
          <span className={styles.label}>อัปโหลดใบแสดงผลการเรียน (PDF) *</span>
          <input
            className={styles.fileInput}
            type="file"
            accept="application/pdf"
            onChange={handleFileChange}
            required
          />
          <p className={styles.helper}>รองรับเฉพาะไฟล์ PDF ขนาดไม่เกินที่ระบบกำหนด</p>
          {transcriptFile ? <p className={styles.cardHint}>ไฟล์ที่เลือก: {transcriptFile.name}</p> : null}
        </label>

        <div className={styles.actionsRow}>
          <button type="submit" className={styles.primary} disabled={submitting}>
            {submitting ? "กำลังส่งคำร้อง..." : "ส่งคำร้อง คพ.05"}
          </button>
        </div>
      </form>
    </section>
  );
}
