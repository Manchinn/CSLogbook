import React, { useState, useEffect } from "react";
import {
  Typography,
  Card,
  Timeline,
  Alert,
  message,
  Button,
  Space,
} from "antd";
import { CheckCircleOutlined, ReloadOutlined } from "@ant-design/icons";
// dayjs ถูกนำออกเนื่องจากไม่ได้ใช้งานในไฟล์นี้
import internshipService from "../../../services/internshipService";
import io from "socket.io-client";
import officialDocumentService from "../../../services/PDFServices/OfficialDocumentService";

// นำเข้า helper functions จาก helpers directory
import {
  // Step Status Helpers
  updateStepFromStatus,
  updateStepFromDownloadStatus,
  updateStepFromReferralStatus,
  getNextActionText,

  // PDF Helpers
  prepareFormDataForPDF,
  handlePreviewPDF,
  handleGenerateOfficialLetter,
  handlePreviewAcceptanceForm,
  handleGenerateAcceptanceForm,
  handleGenerateReferralLetter,
  handlePreviewReferralLetter,

  // Upload Helpers
  getUploadProps,
  handleUploadAcceptanceLetter,

  // Status Check Helpers
  fetchLatestCS05Status,
  checkAcceptanceLetterStatus,
  checkReferralLetterStatus,

  // Timeline Helpers
  createInternshipProcessSteps,
} from "./helpers";

const { Title, Paragraph, Text } = Typography;

const SubmissionResultStep = ({
  navigate,
  formData,
  existingCS05,
  studentData,
  transcriptFile,
}) => {
  // State management
  const [currentInternshipStep, setCurrentInternshipStep] = useState(1);
  const [cs05Status, setCs05Status] = useState(
    existingCS05?.status || "submitted"
  );
  const [loading, setLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [acceptanceFile, setAcceptanceFile] = useState(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [acceptanceLetterStatus, setAcceptanceLetterStatus] = useState(null);
  const [acceptanceLetterInfo, setAcceptanceLetterInfo] = useState(null);
  const [referralLetterStatus, setReferralLetterStatus] = useState(null);
  const [referralLetterInfo, setReferralLetterInfo] = useState(null);
  const [socketInstance, setSocketInstance] = useState(null);
  const [cs05Info, setCs05Info] = useState(null); // ✅ เก็บข้อมูล CS05 ล่าสุด (รวมเหตุผลปฏิเสธ)

  // ตรวจสอบสถานะ PDF Service
  useEffect(() => {
    const checkPDFService = () => {
      const status = officialDocumentService.getStatus();
      console.log("PDF Service Status:", status);

      if (!status.isInitialized) {
        console.warn(
          "PDF Service ยังไม่ได้รับการตั้งค่า กรุณาตรวจสอบการเชื่อมต่อ"
        );
      }
    };

    checkPDFService();
  }, []);

  // ฟังก์ชันที่เกี่ยวข้องกับ helpers แต่ต้องส่ง state เข้าไป
  const handleUpdateStepFromStatus = (status) => {
    updateStepFromStatus(status, setCurrentInternshipStep, setCs05Status);
  };

  const handleUpdateStepFromDownloadStatus = (downloadStatus) => {
    updateStepFromDownloadStatus(
      downloadStatus,
      setCurrentInternshipStep,
      setCs05Status
    );
  };

  const handleUpdateStepFromReferralStatus = (
    referralStatus,
    acceptanceStatus
  ) => {
    updateStepFromReferralStatus(
      referralStatus,
      acceptanceStatus,
      setCurrentInternshipStep,
      setCs05Status
    );
  };

  // ฟังก์ชันเตรียม data สำหรับ PDF functions
  const prepareData = () => {
    return prepareFormDataForPDF(existingCS05, formData, studentData);
  };

  // ฟังก์ชันสำหรับ PDF
  const handlePreviewPDFWrapper = async () => {
    await handlePreviewPDF(prepareData, setPreviewLoading);
  };

  const handleGenerateOfficialLetterWrapper = async () => {
    await handleGenerateOfficialLetter(prepareData, setPdfLoading);
  };

  const handleGenerateAcceptanceFormWrapper = async (isBlank = true) => {
    await handleGenerateAcceptanceForm(prepareData, setPdfLoading, isBlank);
  };

  const handlePreviewAcceptanceFormWrapper = async (isBlank = true) => {
    await handlePreviewAcceptanceForm(prepareData, setPreviewLoading, isBlank);
  };

  const handleGenerateReferralLetterWrapper = async () => {
    await handleGenerateReferralLetter(
      prepareData,
      existingCS05,
      setPdfLoading,
      setReferralLetterStatus,
      setCurrentInternshipStep,
      internshipService
    );
  };

  const handlePreviewReferralLetterWrapper = async () => {
    await handlePreviewReferralLetter(
      prepareData,
      existingCS05,
      setPreviewLoading
    );
  };

  useEffect(() => {
    console.log("🔍 SubmissionResultStep - existingCS05:", existingCS05);
    console.log("🔍 Props received:", {
      existingCS05,
      hasData: !!existingCS05,
      documentId: existingCS05?.documentId,
    });
  }, [existingCS05]);

  // ฟังก์ชันสำหรับอัปโหลด
  const uploadProps = getUploadProps(acceptanceFile, setAcceptanceFile);

  const handleUploadAcceptanceLetterWrapper = async () => {
    // เพิ่มการ debug เพื่อตรวจสอบข้อมูล
    console.log("[DEBUG] Upload Wrapper - existingCS05:", existingCS05);
    console.log("[DEBUG] Upload Wrapper - acceptanceFile:", acceptanceFile);

    if (!existingCS05) {
      message.error("ไม่พบข้อมูลเอกสาร CS05 กรุณารีเฟรชหน้าเว็บ");
      return;
    }

    if (!existingCS05.documentId) {
      message.error("ไม่พบ ID เอกสาร CS05");
      return;
    }

    await handleUploadAcceptanceLetter(
      acceptanceFile,
      existingCS05,
      internshipService,
      setUploadLoading,
      setAcceptanceFile,
      setAcceptanceLetterStatus,
      setAcceptanceLetterInfo,
      handleUpdateStepFromStatus
    );
  };

  // ฟังก์ชันสำหรับตรวจสอบสถานะ
  const fetchLatestCS05StatusWrapper = async () => {
    await fetchLatestCS05Status(
      internshipService,
      setLoading,
  handleUpdateStepFromStatus,
  setCs05Info // ✅ ส่ง callback เพื่อรับเหตุผลการปฏิเสธ
    );
  };

  const checkAcceptanceLetterStatusWrapper = async () => {
    try {
      console.log("[DEBUG] 🔍 เริ่มตรวจสอบสถานะ acceptance letter...");

      await checkAcceptanceLetterStatus(
        existingCS05,
        cs05Status,
        internshipService,
        setAcceptanceLetterStatus,
        setAcceptanceLetterInfo,
        handleUpdateStepFromStatus,
        checkReferralLetterStatusWrapper
      );

      console.log("[DEBUG] ✅ ตรวจสอบ acceptance letter เสร็จสิ้น");
    } catch (error) {
      console.error(
        "[DEBUG] ❌ Error in checkAcceptanceLetterStatusWrapper:",
        error
      );
    }
  };

  const checkReferralLetterStatusWrapper = async () => {
    await checkReferralLetterStatus(
      existingCS05,
      referralLetterStatus,
      currentInternshipStep,
      internshipService,
      setReferralLetterStatus,
      setReferralLetterInfo,
      handleUpdateStepFromDownloadStatus
    );
  };

  // ✅ ปรับปรุงฟังก์ชันตรวจสอบสถานะทั้งหมด
  const checkAllStatus = async () => {
    console.log("[DEBUG] 🔄 เริ่มตรวจสอบสถานะทั้งหมด...");

    try {
      // ✅ ตรวจสอบว่าเสร็จสิ้นแล้วหรือไม่ก่อน
      if (
        cs05Status === "referral_downloaded" ||
        cs05Status === "completed" ||
        referralLetterStatus === "downloaded"
      ) {
        console.log("[DEBUG] 🛡️ ข้ามการตรวจสอบ - ขั้นตอนเสร็จสมบูรณ์แล้ว");
        return;
      }

      // ✅ 1. ตรวจสอบ CS05 status ล่าสุด
      console.log("[DEBUG] 📋 ตรวจสอบสถานะ CS05...");
      await fetchLatestCS05StatusWrapper();

      // ✅ 2. ตรวจสอบ acceptance letter status
      console.log("[DEBUG] 📄 ตรวจสอบสถานะหนังสือตอบรับ...");
      await checkAcceptanceLetterStatusWrapper();

      // ✅ 3. ตรวจสอบ referral letter status (ถ้า acceptance letter อนุมัติแล้ว)
      if (
        acceptanceLetterStatus === "approved" ||
        cs05Status === "acceptance_approved"
      ) {
        console.log("[DEBUG] 📋 ตรวจสอบสถานะหนังสือส่งตัว...");
        await checkReferralLetterStatusWrapper();
      }

      console.log("[DEBUG] ✅ ตรวจสอบสถานะทั้งหมดเสร็จสิ้น");
    } catch (error) {
      console.error("[DEBUG] ❌ Error in checkAllStatus:", error);
    }
  };

  // ✅ แก้ไข useEffect สำหรับตรวจสอบ localStorage ตอนเริ่ม
  useEffect(() => {
    const initializeFromCache = () => {
      if (!existingCS05?.documentId) return;

      // ตรวจสอบสถานะดาวน์โหลดจาก localStorage
      const cachedDownloadStatus = localStorage.getItem(
        `referral_downloaded_${existingCS05.documentId}`
      );
      const cachedTimestamp = localStorage.getItem(
        `referral_downloaded_timestamp_${existingCS05.documentId}`
      );
      const backendSynced = localStorage.getItem(
        `backend_synced_${existingCS05.documentId}`
      );

      if (cachedDownloadStatus === "true") {
        console.log("[DEBUG] 🎯 พบสถานะดาวน์โหลดใน localStorage:", {
          documentId: existingCS05.documentId,
          downloadedAt: cachedTimestamp,
          backendSynced: backendSynced === "true",
        });

        // อัปเดต state ให้ตรงกับ cache
        setReferralLetterStatus("downloaded");
        setCurrentInternshipStep(7);
        setCs05Status("referral_downloaded");

        setReferralLetterInfo({
          status: "downloaded",
          downloadedAt: cachedTimestamp,
          statusMessage: `ดาวน์โหลดแล้วเมื่อ ${
            cachedTimestamp
              ? new Date(cachedTimestamp).toLocaleString("th-TH")
              : "ไม่ทราบเวลา"
          }`,
          source: "localStorage_cache",
          backendSynced: backendSynced === "true",
        });

        console.log("[DEBUG] ✅ คืนสถานะจาก localStorage สำเร็จ");
        return true; // แสดงว่าพบ cache
      }

      return false; // ไม่พบ cache
    };

    // เรียกตรวจสอบ cache ก่อนเรียก API
    const hasCachedStatus = initializeFromCache();

    // ✅ ถ้าไม่มี cache ให้เรียก checkAllStatus แทน handleUpdateStepFromStatus
    if (!hasCachedStatus) {
      console.log("[DEBUG] 🔄 ไม่พบ cache - ตรวจสอบสถานะจาก API");

      // ✅ แก้ไขตรงนี้: เรียก checkAllStatus แทน handleUpdateStepFromStatus
      const initializeStatusFromAPI = async () => {
        try {
          if (existingCS05?.status) {
            console.log(
              "[DEBUG] 🔄 เริ่มต้นการตรวจสอบสถานะทั้งหมด:",
              existingCS05.status
            );

            // ✅ ตั้งสถานะเริ่มต้นจาก CS05 ก่อน
            handleUpdateStepFromStatus(existingCS05.status);

            // ✅ จากนั้นตรวจสอบสถานะทั้งหมดจาก API (หลังจาก 500ms)
            setTimeout(async () => {
              console.log("[DEBUG] 🔍 เริ่มตรวจสอบสถานะทั้งหมดจาก API...");
              await checkAllStatus();
              console.log("[DEBUG] ✅ ตรวจสอบสถานะทั้งหมดเสร็จสิ้น");
            }, 500);
          }
        } catch (error) {
          console.error("[DEBUG] ❌ Error in initializeStatusFromAPI:", error);
        }
      };

      initializeStatusFromAPI();
    }
  }, [existingCS05?.status, existingCS05?.documentId]); // eslint-disable-line react-hooks/exhaustive-deps

  // ✅ เพิ่มฟังก์ชันสำหรับล้าง cache (สำหรับ debug)
  const clearLocalStorageCache = () => {
    if (!existingCS05?.documentId) return;

    const keys = [
      `referral_downloaded_${existingCS05.documentId}`,
      `referral_downloaded_timestamp_${existingCS05.documentId}`,
      `cs05_status_${existingCS05.documentId}`,
      `backend_synced_${existingCS05.documentId}`,
    ];

    keys.forEach((key) => localStorage.removeItem(key));
    console.log("[DEBUG] 🗑️ ล้าง localStorage cache แล้ว");

    // Refresh สถานะ
    window.location.reload();
  };

  // ✅ เวอร์ชันง่ายของ handleRefreshStatus
  const handleRefreshStatus = async () => {
    setLoading(true);
    try {
      console.log("[DEBUG] 🔄 รีเฟรชสถานะ...");

      // เรียกตรวจสอบสถานะทั้งหมดใหม่
      await checkAllStatus();

      message.success("อัปเดตสถานะเรียบร้อยแล้ว");
    } catch (error) {
      console.error("[DEBUG] ❌ เกิดข้อผิดพลาดในการรีเฟรช:", error);
      message.error("ไม่สามารถอัปเดตสถานะได้");
    } finally {
      setLoading(false);
    }
  };

  // ดักจับการเปลี่ยนแปลง referralLetterStatus
  useEffect(() => {
    if (referralLetterStatus && acceptanceLetterStatus === "approved") {
      console.log(
        "[DEBUG] 👀 referralLetterStatus เปลี่ยนแปลง:",
        referralLetterStatus
      );
      handleUpdateStepFromReferralStatus(referralLetterStatus, "approved");
    }
  }, [referralLetterStatus, acceptanceLetterStatus]);

  // ✅ ตั้งค่า Socket สำหรับรับการแจ้งเตือน real-time การปฏิเสธหนังสือตอบรับ
  useEffect(() => {
    if (!existingCS05?.documentId) return;

    // ป้องกันการสร้างหลาย instance
    if (socketInstance) return;

    const socketUrl =
      process.env.REACT_APP_API_URL?.replace(/\/api$/, "") ||
      window.location.origin;
    const socket = io(socketUrl, { withCredentials: true });
    setSocketInstance(socket);

    socket.on("connect", () => {
      console.log("[Socket] ✅ Connected (SubmissionResultStep)");
    });

    socket.on("disconnect", () => {
      console.log("[Socket] ⚠️ Disconnected");
    });

    socket.on("document:rejected", async (payload) => {
      console.log("[Socket] 📥 document:rejected event", payload);

      if (payload?.documentName === "ACCEPTANCE_LETTER") {
        message.error(
          `หนังสือตอบรับถูกปฏิเสธ: ${payload.reason || "ไม่มีเหตุผล"}`
        );
        await checkAcceptanceLetterStatusWrapper();
      }

      if (payload?.documentName === "CS05") {
        message.error(
          `คำร้อง คพ.05 ถูกปฏิเสธ: ${payload.reason || "ไม่มีเหตุผล"}`
        );
        // รีเฟรชสถานะ CS05 และเก็บเหตุผล
        await fetchLatestCS05StatusWrapper();
      }
    });

    return () => {
      socket.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existingCS05?.documentId]);

  // การสร้าง action handlers สำหรับ timeline
  const actionHandlers = {
    handlePreviewPDF: handlePreviewPDFWrapper,
    handleGenerateOfficialLetter: handleGenerateOfficialLetterWrapper,
    handlePreviewAcceptanceForm: handlePreviewAcceptanceFormWrapper,
    handleGenerateAcceptanceForm: handleGenerateAcceptanceFormWrapper,
    handleUploadAcceptanceLetter: handleUploadAcceptanceLetterWrapper,
    handlePreviewReferralLetter: handlePreviewReferralLetterWrapper,
    handleGenerateReferralLetter: handleGenerateReferralLetterWrapper,
    uploadProps,
    acceptanceFile,
    pdfLoading,
    previewLoading,
    uploadLoading,
  };

  // ใช้ฟังก์ชัน createInternshipProcessSteps จาก timelineHelper
  const internshipProcessSteps = createInternshipProcessSteps(
    currentInternshipStep,
    cs05Status,
    referralLetterStatus,
    acceptanceLetterStatus,
    acceptanceLetterInfo,
    actionHandlers
  );

  // รายละเอียดขั้นตอนปัจจุบัน
  const getCurrentStepDetails = () => {
    const currentStep = internshipProcessSteps[currentInternshipStep - 1];

    if (currentInternshipStep === 3 && cs05Status === "approved") {
      return {
        title: currentStep?.title || "",
        description: "ขณะนี้คุณสามารถดาวน์โหลดเอกสารและอัปโหลดหนังสือตอบรับได้",
        nextAction: getNextActionText(currentInternshipStep - 1),
      };
    }
    return {
      title: currentStep?.title || "",
      description: currentStep?.description || "",
      nextAction: getNextActionText(currentInternshipStep),
    };
  };

  const stepDetails = getCurrentStepDetails();

  return (
    <div>
      {/* หัวข้อหลักพร้อมแสดงสถานะปัจจุบัน */}
      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <CheckCircleOutlined
          style={{ fontSize: "64px", color: "#52c41a", marginBottom: 16 }}
        />
        <Title level={3}>ส่งคำร้องเรียบร้อยแล้ว!</Title>
        <Paragraph>
          คำร้อง คพ.05 ของคุณได้รับการบันทึกในระบบเรียบร้อยแล้ว
          <br />
          <Text strong style={{ color: "#1890ff" }}>
            {stepDetails.nextAction}
          </Text>
        </Paragraph>
      </div>

      {/* Timeline แสดงขั้นตอนทั้งหมด */}
      <Card
        title="ขั้นตอนการดำเนินการฝึกงาน"
        extra={
          <Space>
            <Button
              icon={<ReloadOutlined />}
              onClick={handleRefreshStatus}
              loading={loading}
              size="small"
            >
              อัปเดตสถานะ
            </Button>

            {/* 🔧 Debug button - ลบออกได้เมื่อแก้ไขเสร็จ */}
            {process.env.NODE_ENV === "development" && (
              <Button
                danger
                size="small"
                onClick={clearLocalStorageCache}
                title="ล้าง Cache และ Refresh"
              >
                🗑️ Reset Cache
              </Button>
            )}
          </Space>
        }
        style={{ marginBottom: 24 }}
      >
        <Timeline>
            {/* แจ้งเตือนเมื่อ CS05 ถูกปฏิเสธ */}
            {cs05Status === "rejected" && (
              <Timeline.Item color="red">
                <Alert
                  type="error"
                  showIcon
                  message="คำร้อง คพ.05 ถูกปฏิเสธ"
                  description={
                    <div>
                      <p style={{ marginBottom: 4 }}>
                        {cs05Info?.rejectionReason || cs05Info?.reviewComment || "เหตุผลไม่ได้ระบุ"}
                      </p>
                      <p style={{ marginBottom: 0 }}>
                        กรุณาแก้ไขข้อมูลในฟอร์มและส่งใหม่อีกครั้ง (ตรวจสอบข้อมูลบริษัท / ระยะเวลาฝึกงาน / หน่วยกิต)
                      </p>
                    </div>
                  }
                />
              </Timeline.Item>
            )}
            {/* แจ้งเตือนเมื่อหนังสือตอบรับถูกปฏิเสธ */}
            {acceptanceLetterStatus === "rejected" && (
              <Timeline.Item color="red">
                <Alert
                  type="error"
                  showIcon
                  message="หนังสือตอบรับถูกปฏิเสธ"
                  description={
                    <div>
                      <p style={{ marginBottom: 4 }}>
                        {acceptanceLetterInfo?.rejectionReason ||
                          acceptanceLetterInfo?.reviewComment ||
                          "เหตุผลไม่ได้ระบุ"}
                      </p>
                      <p style={{ marginBottom: 0 }}>
                        กรุณาแก้ไขไฟล์และอัปโหลดใหม่อีกครั้ง
                      </p>
                    </div>
                  }
                />
              </Timeline.Item>
            )}
            {/* แสดงสถานะหนังสือส่งตัวหากมี error หรือยังไม่พร้อม */}
            {referralLetterStatus && ["error", "not_ready"].includes(referralLetterStatus) && referralLetterInfo?.statusMessage && (
              <Timeline.Item color={referralLetterStatus === "error" ? "red" : "gray"}>
                <Alert
                  type={referralLetterStatus === "error" ? "error" : "info"}
                  showIcon
                  message={referralLetterStatus === "error" ? "ไม่สามารถตรวจสอบหนังสือส่งตัวได้" : "หนังสือส่งตัวยังไม่พร้อม"}
                  description={referralLetterInfo.statusMessage}
                />
              </Timeline.Item>
            )}
          {Array.isArray(internshipProcessSteps) &&
          internshipProcessSteps.length > 0 ? (
            internshipProcessSteps.map((step, index) => (
              <Timeline.Item
                key={index}
                dot={
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: "50%",
                      backgroundColor: step.color,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "white",
                      fontWeight: "bold",
                      fontSize: "14px",
                    }}
                  >
                    {index + 1}
                  </div>
                }
                color={step.color}
              >
                <div style={{ paddingLeft: 16 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      marginBottom: 8,
                    }}
                  >
                    <Text strong style={{ fontSize: "16px" }}>
                      {step.title}
                    </Text>
                    <span
                      style={{
                        padding: "2px 8px",
                        borderRadius: "4px",
                        fontSize: "12px",
                        backgroundColor:
                          step.status === "finish"
                            ? "#f6ffed"
                            : step.status === "process"
                            ? "#e6f7ff"
                            : "#fafafa",
                        color:
                          step.status === "finish"
                            ? "#52c41a"
                            : step.status === "process"
                            ? "#1890ff"
                            : "#8c8c8c",
                        border: `1px solid ${
                          step.status === "finish"
                            ? "#b7eb8f"
                            : step.status === "process"
                            ? "#91d5ff"
                            : "#d9d9d9"
                        }`,
                      }}
                    >
                      {step.status === "finish"
                        ? "เสร็จสิ้น"
                        : step.status === "process"
                        ? "กำลังดำเนินการ"
                        : "รอดำเนินการ"}
                    </span>
                  </div>
                  <Text type="secondary">{step.description}</Text>

                  {/* แสดงรายละเอียดเพิ่มเติม */}
                  {step.status === "process" && (
                    <Alert
                      message="รายละเอียดขั้นตอนนี้"
                      description={
                        <ul style={{ marginBottom: 0, paddingLeft: 20 }}>
                          {step.details?.map((detail, detailIndex) => (
                            <li key={detailIndex}>{detail}</li>
                          )) || []}
                        </ul>
                      }
                      type="info"
                      showIcon
                      style={{ marginTop: 12 }}
                    />
                  )}

                  {/* แสดงปุ่ม actions ถ้ามี */}
                  {step.actions && step.actions}
                </div>
              </Timeline.Item>
            ))
          ) : (
            <Timeline.Item>
              <Alert message="กำลังโหลดข้อมูลขั้นตอน..." type="info" showIcon />
            </Timeline.Item>
          )}
        </Timeline>
      </Card>
    </div>
  );
};

export default SubmissionResultStep;
