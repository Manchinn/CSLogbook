/**
 * Helper functions สำหรับจัดการสถานะขั้นตอนการฝึกงาน
 */

/**
 * แปลงสถานะ CS05 เป็นขั้นตอนที่เหมาะสม
 * @param {string} status - สถานะ CS05
 * @returns {number} - หมายเลขขั้นตอน
 */
export const getStepFromStatus = (status) => {
  switch (status) {
    case "submitted":
    case "under_review":
      return 1; // การอนุมัติจากเจ้าหน้าที่ภาควิชา
    case "approved":
    case "letter_ready":
      return 3; // รอหนังสือขอความอนุเคราะห์
    case "letter_downloaded":
      return 3; // พิมพ์หนังสือขอความอนุเคราะห์ (เปิด step 4 ด้วย)
    case "acceptance_uploaded":
      return 4; // อัปโหลดหนังสือตอบรับ
    case "acceptance_approved":
      return 6; // รอหนังสือส่งตัว
    case "referral_ready":
      return 6; // นักศึกษาพิมพ์หนังสือส่งตัว
    case "referral_downloaded":
    case "completed":
      return 7; // เสร็จสิ้นขั้นตอนทั้งหมด
    default:
      return 1;
  }
};

/**
 * คำนวณสถานะของแต่ละขั้นตอน
 * @param {number} stepIndex - หมายเลขขั้นตอน (เริ่มจาก 1)
 * @param {number} currentStep - ขั้นตอนปัจจุบัน
 * @param {string} cs05Status - สถานะ CS05
 * @param {string} referralLetterStatus - สถานะหนังสือส่งตัว
 * @returns {string} - สถานะ: 'finish', 'process', 'wait'
 */
export const getStepStatus = (
  stepIndex,
  currentStep,
  cs05Status,
  referralLetterStatus = null
) => {
  console.log("[DEBUG] getStepStatus called:", {
    stepIndex,
    currentStep,
    cs05Status,
    referralLetterStatus,
  });

  // ✅ เพิ่มการตรวจสอบสถานะ completed/referral_downloaded ก่อน
  const isCompleted =
    cs05Status === "completed" ||
    cs05Status === "referral_downloaded" ||
    referralLetterStatus === "downloaded";

  // ✅ ถ้าขั้นตอนทั้งหมดเสร็จแล้ว ให้ขั้นตอนก่อนหน้าเป็น finish ทั้งหมด
  if (isCompleted && stepIndex < 7) {
    return "finish";
  }

  // ขั้นตอนที่เสร็จแล้ว (ก่อนหน้า current step)
  if (stepIndex < currentStep) {
    return "finish";
  }

  // ขั้นตอนปัจจุบัน
  if (stepIndex === currentStep) {
    // ✅ ถ้าเสร็จสมบูรณ์แล้ว ให้เป็น finish แทน process
    if (isCompleted) {
      return "finish";
    }
    return "process";
  }

  // ขั้นตอนที่ 3: พิมพ์หนังสือขอความอนุเคราะห์ (logic พิเศษ)
  if (stepIndex === 3) {
    // ✅ ตรวจสอบการเสร็จสิ้นก่อน
    if (isCompleted) {
      return "finish";
    }

    const completedStatusForStep3 = [
      "acceptance_uploaded",
      "acceptance_approved", 
      "referral_ready",
      "supervisor_evaluated",
    ];

    if (
      completedStatusForStep3.includes(cs05Status) ||
      referralLetterStatus === "downloaded"
    ) {
      return "finish";
    }

    if (
      cs05Status === "approved" &&
      currentStep >= 3 &&
      !isCompleted // ✅ เพิ่มเงื่อนไขนี้
    ) {
      return "process";
    }

    return "wait";
  }

  // ขั้นตอนที่ 4: อัปโหลดหนังสือตอบรับ (logic พิเศษ)
  if (stepIndex === 4) {
    // ✅ ตรวจสอบการเสร็จสิ้นก่อน
    if (isCompleted) {
      return "finish";
    }

    const completedStatusForStep4 = [
      "acceptance_approved",
      "referral_ready", 
      "supervisor_evaluated",
    ];

    if (
      completedStatusForStep4.includes(cs05Status) ||
      referralLetterStatus === "downloaded"
    ) {
      return "finish";
    }

    // เปิดใช้งานแบบ parallel กับ step 3
    if (
      cs05Status === "approved" &&
      currentStep >= 3 &&
      !isCompleted // ✅ เพิ่มเงื่อนไขนี้
    ) {
      return "process";
    }

    // หรือเมื่อมีการอัปโหลดแล้ว
    if (cs05Status === "acceptance_uploaded" && !isCompleted) {
      return "process";
    }

    return "wait";
  }

  // ขั้นตอนที่ 6: ดาวน์โหลดหนังสือส่งตัว
  if (stepIndex === 6) {
    if (referralLetterStatus === "downloaded" || isCompleted) {
      return "finish";
    }

    if (
      (cs05Status === "referral_ready" || cs05Status === "ready") &&
      !isCompleted
    ) {
      return "process";
    }

    return "wait";
  }

  // ขั้นตอนที่ 7: เสร็จสิ้น
  if (stepIndex === 7) {
    if (isCompleted || currentStep === 7) {
      return "finish";
    }
    return "wait";
  }

  // ขั้นตอนที่เหลือ (default logic)
  return "wait";
};

/**
 * อัปเดตขั้นตอนจากสถานะ
 * @param {string} status - สถานะใหม่
 * @param {Function} setCurrentStep - Function สำหรับอัปเดตขั้นตอน
 * @param {Function} setCs05Status - Function สำหรับอัปเดตสถานะ CS05
 */
export const updateStepFromStatus = (status, setCurrentStep, setCs05Status) => {
  const newStep = getStepFromStatus(status);
  setCurrentStep(newStep);

  // ✅ เพิ่มการ handle acceptance_approved
  if (status === "acceptance_approved") {
    setCs05Status("acceptance_approved");
    console.log(`📍 อัปเดตขั้นตอนเป็น ${newStep} จาก CS05 status: ${status}`);
  } else {
    setCs05Status(status);
    console.log(`📍 อัปเดตขั้นตอนเป็น ${newStep} จาก CS05 status: ${status}`);
  }
};

/**
 * อัปเดตขั้นตอนจากสถานะการดาวน์โหลด
 * @param {string} downloadStatus - สถานะการดาวน์โหลด
 * @param {Function} setCurrentStep - Function สำหรับอัปเดตขั้นตอน
 * @param {Function} setCs05Status - Function สำหรับอัปเดตสถานะ CS05
 */
export const updateStepFromDownloadStatus = (
  downloadStatus,
  setCurrentStep,
  setCs05Status
) => {
  if (downloadStatus === "downloaded") {
    setCurrentStep(7); // ขั้นตอนสุดท้าย
    setCs05Status("referral_downloaded");
    console.log("✅ อัปเดตขั้นตอนเป็น 7 (เสร็จสิ้น) จากสถานะการดาวน์โหลด");
    console.log("✅ อัปเดต CS05 Status เป็น 'referral_downloaded'");
  }
};

/**
 * อัปเดตขั้นตอนจากสถานะหนังสือส่งตัว
 * @param {string} referralStatus - สถานะหนังสือส่งตัว
 * @param {string} acceptanceStatus - สถานะหนังสือตอบรับ
 * @param {Function} setCurrentStep - Function สำหรับอัปเดตขั้นตอน
 * @param {Function} setCs05Status - Function สำหรับอัปเดตสถานะ CS05
 */
export const updateStepFromReferralStatus = (
  referralStatus,
  acceptanceStatus,
  setCurrentStep,
  setCs05Status
) => {
  console.log("[DEBUG] updateStepFromReferralStatus:", {
    referralStatus,
    acceptanceStatus,
  });

  if (acceptanceStatus === "approved" && referralStatus === "ready") {
    console.log("✅ หนังสือส่งตัวพร้อม - ไปขั้นตอนที่ 6");
    setCurrentStep(6);
    setCs05Status("referral_ready");
  } else if (referralStatus === "downloaded") {
    console.log("✅ ดาวน์โหลดหนังสือส่งตัวแล้ว - ไปขั้นตอนที่ 7");
    setCurrentStep(7);
  }
};

/**
 * ข้อความแสดงการกระทำถัดไป
 * @param {number} stepIndex - หมายเลขขั้นตอน
 * @returns {string} - ข้อความแสดงการกระทำถัดไป
 */
export const getNextActionText = (stepIndex) => {
  switch (stepIndex) {
    case 0:
      return "คำร้อง คพ.05 ได้รับการบันทึกในระบบเรียบร้อยแล้ว รอเจ้าหน้าที่ภาควิชาตรวจสอบ";
    case 1:
      return "เจ้าหน้าที่ภาควิชากำลังตรวจสอบข้อมูลและจะส่งให้หัวหน้าภาควิชาพิจารณาอนุมัติ";
    case 2:
      return "กรุณารอการอนุมัติจากหัวหน้าภาควิชาเพื่อออกหนังสือขอความอนุเคราะห์";
    case 3:
      return "หนังสือขอความอนุเคราะห์พร้อมแล้ว กรุณาดาวน์โหลดและพิมพ์เพื่อนำไปติดต่อสถานประกอบการ";
    case 4:
      return "กรุณาอัปโหลดหนังสือตอบรับจากสถานประกอบการเพื่อดำเนินการขั้นตอนถัดไป";
    case 5:
      return "กรุณารอเจ้าหน้าที่ภาควิชาจัดทำหนังสือส่งตัวนักศึกษาฝึกงาน";
    case 6:
      return "หนังสือส่งตัวพร้อมแล้ว กรุณาดาวน์โหลดและพิมพ์เพื่อนำไปรายงานตัว";
    default:
      return "ขั้นตอนการยื่นเรื่องขอฝึกงานเสร็จสมบูรณ์แล้ว";
  }
};
