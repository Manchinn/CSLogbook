import React, { useState, useEffect } from "react";
import { Typography, Card, Timeline, Alert, message } from "antd";
import { CheckCircleOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import "dayjs/locale/th";
import internshipService from "../../../services/internshipService";
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

  // ฟังก์ชันสำหรับอัปโหลด
  const uploadProps = getUploadProps(acceptanceFile, setAcceptanceFile);

  const handleUploadAcceptanceLetterWrapper = async () => {
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
      handleUpdateStepFromStatus
    );
  };

  const checkAcceptanceLetterStatusWrapper = async () => {
    await checkAcceptanceLetterStatus(
      existingCS05,
      cs05Status,
      internshipService,
      setAcceptanceLetterStatus,
      setAcceptanceLetterInfo,
      handleUpdateStepFromStatus,
      checkReferralLetterStatusWrapper
    );
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

  // ฟังก์ชันตรวจสอบสถานะทั้งหมด
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
      
      await fetchLatestCS05StatusWrapper();
      await checkAcceptanceLetterStatusWrapper();

      if (
        acceptanceLetterStatus === "approved" ||
        cs05Status === "acceptance_approved"
      ) {
        console.log(
          "[DEBUG] 🔍 หนังสือตอบรับอนุมัติแล้ว - ตรวจสอบหนังสือส่งตัว"
        );
        await checkReferralLetterStatusWrapper();
      }

      console.log("[DEBUG] ✅ ตรวจสอบสถานะทั้งหมดเสร็จสิ้น");
    } catch (error) {
      console.error("[DEBUG] ❌ Error in checkAllStatus:", error);
    }
  };

  // ✅ แก้ไข useEffect เพื่อรอการโหลดข้อมูลเสร็จก่อน
useEffect(() => {
  const initializeStatus = async () => {
    if (existingCS05?.status) {
      console.log("[DEBUG] 🔄 เริ่มต้นการตั้งค่าสถานะ:", existingCS05.status);
      
      // อัปเดตขั้นตอนจากสถานะ CS05
      handleUpdateStepFromStatus(existingCS05.status);
      
      // รอการอัปเดตเสร็จแล้วค่อยตรวจสอบสถานะ
      setTimeout(async () => {
        await checkAllStatus();
      }, 100); // รอ state update
    }
  };

  initializeStatus();
}, [existingCS05?.status, existingCS05?.documentId]);

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
        title="ขั้นตอนการดำเนินการฝึกงาน (ทั้งหมด 7 ขั้นตอน)"
        style={{ marginBottom: 24 }}
      >
        <Timeline>
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
