/**
 * Helper functions สำหรับตรวจสอบสถานะต่างๆ
 * อัปเดตด้วยระบบ Status Mapping ที่สอดคล้องกับ Backend
 */

/**
 * แปลงสถานะจาก Backend เป็นสถานะสำหรับ Frontend
 * @param {string} backendStatus - สถานะจาก Backend Database (ENUM)
 * @param {string} documentType - ประเภทเอกสาร ('referral', 'acceptance', 'cs05')
 * @returns {string} สถานะสำหรับ Frontend UI
 */
const mapBackendStatusToFrontend = (backendStatus, documentType = 'referral') => {
  console.log(`[DEBUG] 🔄 Mapping status: ${backendStatus} (${documentType})`);

  const statusMap = {
    // สำหรับหนังสือส่งตัว (Referral Letter)
    referral: {
      'draft': 'not_ready',
      'pending': 'not_ready', 
      'approved': 'not_ready',
      'acceptance_approved': 'not_ready',
      'referral_ready': 'ready',
      'referral_downloaded': 'downloaded',
      'supervisor_evaluated': 'downloaded',
      'completed': 'downloaded'
    },
    
    // สำหรับหนังสือตอบรับ (Acceptance Letter)  
    acceptance: {
      'draft': 'not_uploaded',
      'pending': 'uploaded',
      'approved': 'approved',
      'acceptance_approved': 'approved',
      'rejected': 'rejected',
      'referral_ready': 'approved',
      'referral_downloaded': 'approved',
      'supervisor_evaluated': 'approved'
    },

    // สำหรับเอกสาร CS05
    cs05: {
      'draft': 'draft',
      'pending': 'pending',
      'approved': 'approved',
      'rejected': 'rejected',
      'acceptance_approved': 'acceptance_approved',
      'referral_ready': 'referral_ready',
      'referral_downloaded': 'referral_downloaded',
      'supervisor_evaluated': 'supervisor_evaluated',
      'completed': 'completed'
    }
  };

  const mappedStatus = statusMap[documentType]?.[backendStatus] || 'not_ready';
  
  console.log(`[DEBUG] ✅ Mapped ${backendStatus} → ${mappedStatus} (${documentType})`);
  
  return mappedStatus;
};

/**
 * ตรวจสอบว่าสถานะปัจจุบันสามารถทำการต่างๆ ได้หรือไม่
 * @param {string} backendStatus - สถานะจาก Backend
 * @param {string} action - การกระทำที่ต้องการ ('upload', 'download', 'edit')
 * @param {string} documentType - ประเภทเอกสาร
 * @returns {boolean} true ถ้าสามารถทำได้
 */
const canPerformAction = (backendStatus, action, documentType = 'referral') => {
  const permissions = {
    referral: {
      'download': ['referral_ready', 'referral_downloaded', 'supervisor_evaluated'],
      'edit': ['draft', 'pending'],
      'view': ['approved', 'acceptance_approved', 'referral_ready', 'referral_downloaded', 'supervisor_evaluated']
    },
    acceptance: {
      'upload': ['approved', 'acceptance_approved'],
      'download': ['pending', 'approved', 'acceptance_approved'],
      'edit': ['draft'],
      'view': ['pending', 'approved', 'rejected', 'acceptance_approved']
    },
    cs05: {
      'edit': ['draft'],
      'view': ['pending', 'approved', 'rejected', 'acceptance_approved', 'referral_ready', 'referral_downloaded'],
      'approve': ['pending']
    }
  };

  return permissions[documentType]?.[action]?.includes(backendStatus) || false;
};

/**
 * ตรวจสอบสถานะ CS05 ล่าสุด
 * @param {Object} internshipService - Service สำหรับ API calls
 * @param {Function} setLoading - Function สำหรับจัดการ loading state
 * @param {Function} updateStepFromStatus - Function สำหรับอัปเดตขั้นตอน
 */
export const fetchLatestCS05Status = async (internshipService, setLoading, updateStepFromStatus) => {
  try {
    setLoading(true);
    console.log("[DEBUG] 🔍 กำลังตรวจสอบสถานะ CS05 ล่าสุด...");

    const response = await internshipService.getCurrentCS05();

    if (response.success && response.data) {
      const backendStatus = response.data.status;
      const frontendStatus = mapBackendStatusToFrontend(backendStatus, 'cs05');
      
      console.log("[DEBUG] 📊 CS05 Status Update:", {
        backend: backendStatus,
        frontend: frontendStatus,
        canEdit: canPerformAction(backendStatus, 'edit', 'cs05'),
        canView: canPerformAction(backendStatus, 'view', 'cs05')
      });

      updateStepFromStatus(backendStatus); // ส่งสถานะ Backend เพื่อให้ตรงกับ ENUM
    } else {
      console.log("[DEBUG] ⚪ ไม่พบข้อมูล CS05");
    }
  } catch (error) {
    console.error("[DEBUG] ❌ Error fetching CS05 status:", error);
  } finally {
    setLoading(false);
  }
};

/**
 * ตรวจสอบสถานะการอัปโหลดหนังสือตอบรับ (ปรับปรุงใหม่)
 */
export const checkAcceptanceLetterStatus = async (
  existingCS05,
  cs05Status,
  internshipService,
  setAcceptanceLetterStatus,
  setAcceptanceLetterInfo,
  updateStepFromStatus,
  checkReferralLetterStatus
) => {
  if (!existingCS05?.documentId) {
    setAcceptanceLetterStatus("not_uploaded");
    setAcceptanceLetterInfo(null);
    return;
  }

  try {
    console.log("[DEBUG] 🔍 ตรวจสอบสถานะหนังสือตอบรับ...", {
      documentId: existingCS05.documentId,
      cs05Status
    });

    const response = await internshipService.checkAcceptanceLetterStatus(
      existingCS05.documentId
    );

    console.log("[DEBUG] 📊 API Response - หนังสือตอบรับ:", response);

    if (response.success && response.data) {
      const backendStatus = response.data.originalStatus || response.data.status;
      const frontendStatus = mapBackendStatusToFrontend(backendStatus, 'acceptance');
      
      // ✅ ใช้ mapping function แทนการ hardcode
      setAcceptanceLetterStatus(frontendStatus);
      setAcceptanceLetterInfo({
        ...response.data,
        status: frontendStatus,
        backendStatus: backendStatus,
        canUpload: canPerformAction(cs05Status, 'upload', 'acceptance'),
        canDownload: canPerformAction(backendStatus, 'download', 'acceptance'),
        canView: canPerformAction(backendStatus, 'view', 'acceptance'),
        mappingInfo: {
          original: backendStatus,
          mapped: frontendStatus,
          type: 'acceptance'
        }
      });

      // อัปเดตขั้นตอนตามสถานะ Backend
      if (backendStatus === "pending") {
        updateStepFromStatus("acceptance_uploaded");
      } else if (['approved', 'acceptance_approved'].includes(backendStatus)) {
        updateStepFromStatus("acceptance_approved");

        console.log("[DEBUG] 🔄 หนังสือตอบรับอนุมัติแล้ว - ตรวจสอบหนังสือส่งตัว");
        setTimeout(() => {
          checkReferralLetterStatus();
        }, 1000);
      }

      console.log("[DEBUG] ✅ อัปเดตสถานะหนังสือตอบรับ:", {
        backend: backendStatus,
        frontend: frontendStatus,
        canUpload: canPerformAction(cs05Status, 'upload', 'acceptance'),
        canDownload: canPerformAction(backendStatus, 'download', 'acceptance')
      });
    } else {
      // ไม่มีการอัปโหลด
      const canUpload = canPerformAction(cs05Status, 'upload', 'acceptance');
      setAcceptanceLetterStatus(canUpload ? "not_uploaded" : "cannot_upload");
      setAcceptanceLetterInfo({
        canUpload: canUpload,
        statusMessage: canUpload ? 
          "พร้อมอัปโหลดหนังสือตอบรับ" : 
          "รอการอนุมัติ CS05 ก่อนอัปโหลด",
        cs05Status: cs05Status
      });

      console.log("[DEBUG] ⚪ ไม่มีการอัปโหลดหนังสือตอบรับ:", {
        canUpload,
        cs05Status
      });
    }
  } catch (error) {
    console.error("[DEBUG] ❌ Error checking acceptance letter status:", error);

    if (error.response?.status === 404) {
      const canUpload = canPerformAction(cs05Status, 'upload', 'acceptance');
      setAcceptanceLetterStatus("not_uploaded");
      setAcceptanceLetterInfo({
        canUpload: canUpload,
        statusMessage: "ยังไม่มีการอัปโหลดหนังสือตอบรับ",
        cs05Status: cs05Status
      });
    } else {
      setAcceptanceLetterStatus("error");
      setAcceptanceLetterInfo({
        errorMessage: error.message || "เกิดข้อผิดพลาดในการตรวจสอบสถานะ",
        canRetry: true
      });
    }
  }
};

/**
 * ตรวจสอบสถานะหนังสือส่งตัว (ปรับปรุงใหม่ - ปรับให้ตรงกับ Controller)
 */
export const checkReferralLetterStatus = async (
  existingCS05,
  referralLetterStatus,
  currentInternshipStep,
  internshipService,
  setReferralLetterStatus,
  setReferralLetterInfo,
  updateStepFromDownloadStatus
) => {
  // ตรวจสอบข้อมูลพื้นฐาน
  if (!existingCS05?.documentId) {
    console.log("[DEBUG] 🚫 ไม่มี documentId - ตั้งค่าเป็น not_ready");
    setReferralLetterStatus("not_ready");
    setReferralLetterInfo({
      statusMessage: "ไม่พบข้อมูลเอกสาร CS05",
      reason: "missing_document",
      canRetry: false
    });
    return;
  }

  // ป้องกันการ override เมื่อผู้ใช้เพิ่งดาวน์โหลด
  if (referralLetterStatus === "downloaded" && currentInternshipStep === 7) {
    console.log("[DEBUG] 🛡️ ป้องกันการ override - ผู้ใช้เพิ่งดาวน์โหลด");
    return;
  }

  try {
    console.log("[DEBUG] 🔍 ตรวจสอบสถานะหนังสือส่งตัว...", {
      documentId: existingCS05.documentId,
      currentStatus: referralLetterStatus,
      currentStep: currentInternshipStep,
      timestamp: new Date().toISOString()
    });

    // เรียก API ตรวจสอบสถานะ
    const response = await internshipService.checkReferralLetterStatus(
      existingCS05.documentId
    );

    console.log("[DEBUG] 📊 API Response - หนังสือส่งตัว:", response);

    if (response.success && response.data) {
      const responseData = response.data;
      
      // ดึงสถานะจาก Backend (ลำดับความสำคัญ)
      const backendStatus = 
        responseData.debug?.backendStatus || 
        responseData.backendStatus || 
        responseData.originalStatus || 
        responseData.status;
      
      // ✅ ใช้ mapping จาก Backend ก่อน, fallback เป็น Frontend mapping
      let frontendStatus;
      
      if (responseData.mappingInfo?.shouldMapTo) {
        // ใช้ mapping จาก Backend
        frontendStatus = responseData.mappingInfo.shouldMapTo;
        console.log("[DEBUG] 🔄 ใช้ mapping จาก Backend:", frontendStatus);
      } else {
        // fallback เป็น Frontend mapping
        frontendStatus = mapBackendStatusToFrontend(backendStatus, 'referral');
        console.log("[DEBUG] 🔄 ใช้ mapping จาก Frontend:", frontendStatus);
      }
      
      // อัปเดต State
      setReferralLetterStatus(frontendStatus);
      
      // สร้างข้อมูลสำหรับ UI
      const referralInfo = {
        ...responseData,
        status: frontendStatus,
        backendStatus: backendStatus,
        canDownload: canPerformAction(backendStatus, 'download', 'referral'),
        canView: canPerformAction(backendStatus, 'view', 'referral'),
        
        // ข้อมูล mapping
        mappingInfo: {
          original: backendStatus,
          mapped: frontendStatus,
          type: 'referral',
          source: responseData.mappingInfo ? 'backend' : 'frontend',
          confidence: responseData.mappingInfo?.confidence || 'medium'
        },
        
        // ข้อมูล debug
        debug: {
          ...responseData.debug,
          frontendTimestamp: new Date().toISOString(),
          mappingSource: responseData.mappingInfo ? 'backend' : 'frontend'
        },
        
        // สถานะข้อความสำหรับ UI
        statusMessage: getStatusMessage(frontendStatus, responseData),
        
        // ข้อมูลการทำงาน
        lastChecked: new Date().toISOString(),
        isOnline: true
      };
      
      setReferralLetterInfo(referralInfo);

      // ✅ อัปเดตขั้นตอนเมื่อดาวน์โหลดแล้ว
      if (frontendStatus === "downloaded") {
        updateStepFromDownloadStatus("downloaded");
        
        // บันทึกลง localStorage เพื่อ backup
        localStorage.setItem(
          `referral_downloaded_${existingCS05.documentId}`,
          "true"
        );
        localStorage.setItem(
          `referral_downloaded_timestamp_${existingCS05.documentId}`,
          new Date().toISOString()
        );
      }

      console.log("[DEBUG] ✅ อัปเดตสถานะหนังสือส่งตัวสำเร็จ:", {
        backend: backendStatus,
        frontend: frontendStatus,
        canDownload: referralInfo.canDownload,
        mappingSource: referralInfo.mappingInfo.source,
        timestamp: new Date().toISOString()
      });
      
    } else {
      // กรณี API ส่งข้อมูลไม่ครบ
      console.log("[DEBUG] ⚠️ API Response ไม่สมบูรณ์");
      setReferralLetterStatus("not_ready");
      setReferralLetterInfo({
        statusMessage: "หนังสือส่งตัวยังไม่พร้อม",
        reason: "incomplete_response",
        canRetry: true,
        debug: response
      });
    }
    
  } catch (error) {
    console.error("[DEBUG] ❌ Error checking referral letter status:", error);

    // จัดการ error แบบละเอียด
    await handleReferralLetterError(
      error,
      existingCS05,
      setReferralLetterStatus,
      setReferralLetterInfo,
      updateStepFromDownloadStatus
    );
  }
};

/**
 * สร้างข้อความสถานะสำหรับ UI
 */
const getStatusMessage = (frontendStatus, responseData) => {
  const statusMessages = {
    'not_ready': 'หนังสือส่งตัวยังไม่พร้อม - รอการอนุมัติหนังสือตอบรับ',
    'ready': 'หนังสือส่งตัวพร้อมให้ดาวน์โหลด',
    'downloaded': `ดาวน์โหลดแล้วเมื่อ ${responseData.downloadedAt ? new Date(responseData.downloadedAt).toLocaleString('th-TH') : 'ไม่ทราบเวลา'}`,
    'error': 'เกิดข้อผิดพลาดในการตรวจสอบสถานะ'
  };
  
  return statusMessages[frontendStatus] || 'สถานะไม่ทราบ';
};

/**
 * จัดการ Error สำหรับการตรวจสอบสถานะหนังสือส่งตัว
 */
const handleReferralLetterError = async (
  error,
  existingCS05,
  setReferralLetterStatus,
  setReferralLetterInfo,
  updateStepFromDownloadStatus
) => {
  const errorType = error.response?.data?.errorType;
  const statusCode = error.response?.status;
  
  console.log("[DEBUG] 🔍 วิเคราะห์ error:", {
    errorType,
    statusCode,
    message: error.message,
    responseData: error.response?.data
  });

  // ตรวจสอบ localStorage fallback ก่อน
  const fallbackStatus = localStorage.getItem(
    `referral_downloaded_${existingCS05.documentId}`
  );
  const fallbackTimestamp = localStorage.getItem(
    `referral_downloaded_timestamp_${existingCS05.documentId}`
  );

  if (fallbackStatus === "true") {
    console.log("[DEBUG] 🔄 ใช้สถานะจาก localStorage fallback");
    setReferralLetterStatus("downloaded");
    setReferralLetterInfo({
      status: "downloaded",
      statusMessage: `ดาวน์โหลดแล้ว (จาก cache) เมื่อ ${fallbackTimestamp ? new Date(fallbackTimestamp).toLocaleString('th-TH') : 'ไม่ทราบเวลา'}`,
      source: "localStorage",
      isOffline: true,
      canRetry: true,
      fallbackData: {
        downloadedAt: fallbackTimestamp,
        documentId: existingCS05.documentId
      }
    });
    updateStepFromDownloadStatus("downloaded");
    return;
  }

  // จัดการ error ตาม type และ status code
  let errorStatus = "error";
  let errorInfo = {
    canRetry: true,
    retryAction: "checkReferralLetterStatus"
  };

  if (statusCode === 404 || errorType === "NOT_FOUND") {
    errorStatus = "not_ready";
    errorInfo = {
      statusMessage: "หนังสือส่งตัวยังไม่พร้อม",
      reason: "not_found",
      canRetry: true,
      helpText: "รอการอนุมัติหนังสือตอบรับ หรือติดต่อเจ้าหน้าที่"
    };
  } else if (statusCode === 403 || errorType === "FORBIDDEN") {
    errorStatus = "no_permission";
    errorInfo = {
      statusMessage: "ไม่มีสิทธิ์เข้าถึงหนังสือส่งตัว",
      reason: "forbidden",
      canRetry: false,
      helpText: "ติดต่อเจ้าหน้าที่เพื่อตรวจสอบสิทธิ์"
    };
  } else if (statusCode === 409 || errorType === "NOT_APPROVED") {
    errorStatus = "not_ready";
    errorInfo = {
      statusMessage: "หนังสือส่งตัวยังไม่ได้รับการอนุมัติ",
      reason: "not_approved",
      canRetry: true,
      helpText: "รอการอนุมัติจากเจ้าหน้าที่"
    };
  } else {
    // Server error หรือ network error
    errorInfo = {
      errorMessage: error.message || "เกิดข้อผิดพลาดในการตรวจสอบสถานะ",
      reason: "server_error",
      canRetry: true,
      retryAction: "checkReferralLetterStatus",
      helpText: "ลองใหม่อีกครั้ง หรือติดต่อเจ้าหน้าที่หากปัญหายังคงอยู่"
    };
  }

  setReferralLetterStatus(errorStatus);
  setReferralLetterInfo({
    ...errorInfo,
    error: true,
    timestamp: new Date().toISOString(),
    debug: {
      errorType,
      statusCode,
      originalMessage: error.message,
      responseData: error.response?.data
    }
  });
};

// Export utility functions
export { 
  mapBackendStatusToFrontend, 
  canPerformAction,
  getStatusMessage,
  handleReferralLetterError
};
