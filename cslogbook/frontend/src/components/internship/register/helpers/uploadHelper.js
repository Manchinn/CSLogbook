import { message } from "antd";

/**
 * Helper functions สำหรับจัดการการอัปโหลด
 */

/**
 * การตั้งค่า Upload Component
 * @param {File|null} acceptanceFile - ไฟล์ที่เลือก
 * @param {Function} setAcceptanceFile - Function สำหรับตั้งค่าไฟล์
 * @returns {Object} - การตั้งค่า Upload props
 */
export const getUploadProps = (acceptanceFile, setAcceptanceFile) => {
  return {
    accept: ".pdf",
    maxCount: 1,
    showUploadList: true,
    beforeUpload: (file) => {
      // ตรวจสอบประเภทไฟล์
      if (file.type !== "application/pdf") {
        message.error("กรุณาอัปโหลดเฉพาะไฟล์ PDF เท่านั้น");
        return false;
      }

      // ตรวจสอบขนาดไฟล์ (สูงสุด 5MB)
      if (file.size > 5 * 1024 * 1024) {
        message.error("ขนาดไฟล์ต้องไม่เกิน 5MB");
        return false;
      }

      setAcceptanceFile(file);
      return false; // ป้องกันการอัปโหลดอัตโนมัติ
    },
    onRemove: () => {
      setAcceptanceFile(null);
    },
    fileList: acceptanceFile
      ? [
          {
            uid: "-1",
            name: acceptanceFile.name,
            status: "done",
            originFileObj: acceptanceFile,
          },
        ]
      : [],
  };
};

/**
 * อัปโหลดหนังสือตอบรับ
 * @param {File} acceptanceFile - ไฟล์ที่จะอัปโหลด
 * @param {Object} existingCS05 - ข้อมูล CS05 ที่มีอยู่
 * @param {Object} internshipService - Service สำหรับ API calls
 * @param {Function} setLoading - Function สำหรับจัดการ loading state
 * @param {Function} setAcceptanceFile - Function สำหรับตั้งค่าไฟล์
 * @param {Function} setAcceptanceLetterStatus - Function สำหรับอัปเดตสถานะ
 * @param {Function} setAcceptanceLetterInfo - Function สำหรับอัปเดตข้อมูล
 * @param {Function} updateStepFromStatus - Function สำหรับอัปเดตขั้นตอน
 */
export const handleUploadAcceptanceLetter = async (
  acceptanceFile,
  existingCS05,
  internshipService,
  setLoading,
  setAcceptanceFile,
  setAcceptanceLetterStatus,
  setAcceptanceLetterInfo,
  updateStepFromStatus
) => {
  // ✅ เพิ่มการ debug ข้อมูลที่รับเข้ามา
  console.log("[DEBUG] handleUploadAcceptanceLetter - Parameters:", {
    acceptanceFile: acceptanceFile ? acceptanceFile.name : "No file",
    existingCS05: existingCS05,
    hasDocumentId: existingCS05?.documentId,
    documentId: existingCS05?.documentId,
  });
  
  if (!acceptanceFile) {
    message.error("กรุณาเลือกไฟล์หนังสือตอบรับก่อนอัปโหลด");
    return;
  }

  if (!existingCS05?.documentId) {
    message.error("ไม่พบข้อมูลเอกสาร CS05");
    return;
  }

  setLoading(true);
  try {
    const formData = new FormData();
    formData.append("acceptanceLetter", acceptanceFile);
    formData.append("documentId", existingCS05.documentId);

    const response = await internshipService.uploadAcceptanceLetter(formData);

    if (response.success) {
      message.success("อัปโหลดหนังสือตอบรับเรียบร้อยแล้ว!");
      setAcceptanceFile(null);

      // อัปเดตข้อมูลสถานะการอัปโหลด
      setAcceptanceLetterStatus("uploaded");
      setAcceptanceLetterInfo({
        ...response.data,
        originalStatus: "pending",
      });

      // อัปเดตสถานะไปขั้นตอนถัดไป
      updateStepFromStatus("acceptance_uploaded");
    } else {
      message.error(response.message || "ไม่สามารถอัปโหลดหนังสือตอบรับได้");
    }
  } catch (error) {
    console.error("Error uploading acceptance letter:", error);
    message.error(
      error.response?.data?.message || "เกิดข้อผิดพลาดในการอัปโหลดหนังสือตอบรับ"
    );
  } finally {
    setLoading(false);
  }
};
