"use client";

import { useEffect, useState } from "react";
import styles from "./SurveyBanner.module.css";

// เปลี่ยน URL นี้เป็น Google Form URL จริงเมื่อสร้างฟอร์มเสร็จ
const SURVEY_URL = "https://docs.google.com/forms/d/e/1FAIpQLSeqH_APGVtiwvdJnKwGWdbKY_VAMGLLOgjyzceKisN4P_joKw/viewform?usp=dialog";

type Mode = "popup" | "banner" | "hidden";

export function SurveyBanner() {
  // แสดง popup ทุกครั้งที่ login (state อยู่ใน memory เท่านั้น รีเซ็ตทุกครั้งที่โหลดหน้าใหม่)
  // เริ่มต้นเป็น "popup" ทันที — "use client" component, server/client ตกลงกัน ไม่มี hydration mismatch
  const [mode, setMode] = useState<Mode>("popup");

  // ล็อก scroll เมื่อ popup เปิด
  useEffect(() => {
    if (mode === "popup") {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mode]);

  function handleOpen() {
    window.open(SURVEY_URL, "_blank", "noopener,noreferrer");
  }

  // กด "ทำภายหลัง" บน popup → ปิด popup แสดง banner แทน
  function handlePopupLater() {
    setMode("banner");
  }

  // กด "ทำแบบประเมิน" บน popup → เปิดฟอร์ม + ปิด popup
  function handlePopupOpen() {
    handleOpen();
    setMode("hidden");
  }

  // กด "ไม่ขอบคุณ" บน banner → ซ่อน (จนกว่าจะ login ใหม่)
  function handleBannerDismiss() {
    setMode("hidden");
  }

  if (mode === "hidden") return null;

  if (mode === "popup") {
    return (
      <div
        className={styles.overlay}
        role="dialog"
        aria-modal="true"
        aria-label="แบบประเมินการใช้งานระบบ"
        onClick={(e) => {
          // กด backdrop → ทำเหมือนกด "ทำภายหลัง"
          if (e.target === e.currentTarget) handlePopupLater();
        }}
      >
        <div className={styles.modal}>
          <div className={styles.modalIcon} aria-hidden="true">📋</div>
          <h2 className={styles.modalTitle}>แบบประเมินการใช้งานระบบ CSLogbook</h2>
          <p className={styles.modalDesc}>
            ขอเชิญร่วมประเมินการใช้งานระบบ CSLogbook เพื่อนำข้อมูลไปปรับปรุงระบบให้ดียิ่งขึ้น
            <br />
            ใช้เวลาเพียง <strong>1–2 นาที</strong>
          </p>
          <div className={styles.modalActions}>
            <button type="button" className={styles.btnPrimary} onClick={handlePopupOpen}>
              ทำแบบประเมิน
            </button>
            <button type="button" className={styles.btnSecondary} onClick={handlePopupLater}>
              ทำภายหลัง
            </button>
          </div>
        </div>
      </div>
    );
  }

  // mode === "banner"
  return (
    <section
      className={styles.banner}
      role="complementary"
      aria-label="แบบประเมินการใช้งานระบบ"
    >
      <div className={styles.icon} aria-hidden="true">📋</div>
      <div className={styles.body}>
        <p className={styles.title}>แบบประเมินการใช้งานระบบ CSLogbook</p>
        <p className={styles.desc}>
          ช่วยประเมินการใช้งานระบบเพื่อปรับปรุงให้ดียิ่งขึ้น — ใช้เวลาเพียง 1–2 นาที
        </p>
      </div>
      <div className={styles.actions}>
        <button type="button" className={styles.btnPrimary} onClick={handleOpen}>
          ทำแบบประเมิน
        </button>
        <button type="button" className={styles.btnSecondary} onClick={handleBannerDismiss}>
          ไม่ขอบคุณ
        </button>
      </div>
    </section>
  );
}
