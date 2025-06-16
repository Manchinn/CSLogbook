import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Typography,
  Card,
  Timeline,
  Button,
  Space,
  Tag,
  Alert,
  Tooltip,
  message,
  Upload,
} from "antd";
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  FileTextOutlined,
  AuditOutlined,
  PrinterOutlined,
  PaperClipOutlined,
  UploadOutlined,
  FileDoneOutlined,
  DownloadOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import "dayjs/locale/th";
import internshipService from "../../../services/internshipService";
// เพิ่ม import สำหรับ PDF Service
import officialDocumentService from "../../../services/PDFServices/OfficialDocumentService";
import pdfService from "../../../services/PDFServices/PDFService";
import templateDataService from "../../../services/PDFServices/TemplateDataService";
import { ReferralLetterTemplate } from "../templates";

const { Title, Paragraph, Text } = Typography;

const SubmissionResultStep = ({
  navigate,
  formData,
  existingCS05,
  studentData,
  transcriptFile,
}) => {
  const [currentInternshipStep, setCurrentInternshipStep] = useState(1);
  const [cs05Status, setCs05Status] = useState(
    existingCS05?.status || "submitted"
  );
  const [loading, setLoading] = useState(false);

  // 🆕 เพิ่ม state สำหรับ PDF Generation
  const [pdfLoading, setPdfLoading] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);

  // 🆕 เพิ่ม state สำหรับ Upload หนังสือตอบรับ
  const [acceptanceFile, setAcceptanceFile] = useState(null);
  const [uploadLoading, setUploadLoading] = useState(false);

  // 🆕 เพิ่ม state สำหรับตรวจสอบสถานะการอัปโหลด
  const [acceptanceLetterStatus, setAcceptanceLetterStatus] = useState(null);
  const [acceptanceLetterInfo, setAcceptanceLetterInfo] = useState(null);

  // 🆕 เพิ่ม state สำหรับหนังสือส่งตัวนักศึกษา
  const [referralLetterStatus, setReferralLetterStatus] = useState(null);
  const [referralLetterInfo, setReferralLetterInfo] = useState(null);

  // 🆕 เพิ่มการตรวจสอบสถานะ PDF Service
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

  // คำนวณระยะเวลาฝึกงาน
  const calculateInternshipDuration = (startDate, endDate) => {
    if (!startDate || !endDate) return "";

    const start = dayjs(startDate);
    const end = dayjs(endDate);
    const diffInDays = end.diff(start, "day") + 1;
    const diffInMonths = Math.round(diffInDays / 30);

    return `${diffInMonths} เดือน (${diffInDays} วัน)`;
  };

  // 🆕 ฟังก์ชันเตรียมข้อมูลสำหรับ PDF
  const prepareFormDataForPDF = () => {
    try {
      const displayData = existingCS05 || formData || {};

      return {
        // ข้อมูลเอกสาร
        documentNumber: "", // จะถูกสร้างอัตโนมัติ
        documentDate: new Date(),

        // ข้อมูลบริษัท
        companyName: displayData.companyName || "",
        companyAddress: displayData.companyAddress || "",
        contactPersonName: displayData.contactPersonName || "",
        contactPersonPosition: displayData.contactPersonPosition || "",
        internshipPosition: displayData.internshipPosition || "",

        // ข้อมูลนักศึกษา
        studentData:
          displayData.studentData ||
          (studentData
            ? [
                {
                  fullName: studentData.fullName,
                  studentId: studentData.studentId,
                  yearLevel: studentData.year || 3,
                  classroom: studentData.classroom || "",
                  phoneNumber: studentData.phoneNumber || "",
                  totalCredits: studentData.totalCredits || 0,
                },
              ]
            : []),

        // ข้อมูลระยะเวลาฝึกงาน
        startDate: displayData.startDate || "",
        endDate: displayData.endDate || "",
        internshipDays: displayData.internshipDuration || 0,

        // ข้อมูลอาจารย์ (ค่าเริ่มต้น)
        advisorName: "ผู้ช่วยศาสตราจารย์ ดร.อภิชาต บุญมา",
        advisorTitle: "หัวหน้าภาควิชาวิทยาการคอมพิวเตอร์และสารสนเทศ",
      };
    } catch (error) {
      console.error("Error preparing PDF data:", error);
      message.error("เกิดข้อผิดพลาดในการเตรียมข้อมูล PDF");
      return null;
    }
  };

  // 🆕 ฟังก์ชัน Preview PDF
  const handlePreviewPDF = async () => {
    setPreviewLoading(true);
    try {
      const pdfData = prepareFormDataForPDF();
      if (!pdfData) return;

      await officialDocumentService.previewPDF("official_letter", pdfData);
      message.info("เปิดตัวอย่างหนังสือขอความอนุเคราะห์ในแท็บใหม่");
    } catch (error) {
      console.error("Error previewing PDF:", error);
      message.error(
        "ไม่สามารถแสดงตัวอย่าง PDF ได้: " +
          (error.message || "เกิดข้อผิดพลาดไม่ทราบสาเหตุ")
      );
    } finally {
      setPreviewLoading(false);
    }
  };

  // 🆕 ฟังก์ชันสร้างหนังสือขอความอนุเคราะห์อย่างเป็นทางการ
  const handleGenerateOfficialLetter = async () => {
    setPdfLoading(true);
    try {
      const pdfData = prepareFormDataForPDF();
      if (!pdfData) return;

      await officialDocumentService.generateOfficialLetterPDF(pdfData);
      message.success("สร้างหนังสือขอความอนุเคราะห์สำเร็จ!");
    } catch (error) {
      console.error("Error generating official letter:", error);
      message.error(
        "ไม่สามารถสร้างหนังสือขอความอนุเคราะห์ได้: " +
          (error.message || "เกิดข้อผิดพลาดไม่ทราบสาเหตุ")
      );
    } finally {
      setPdfLoading(false);
    }
  };

  // เพิ่มฟังก์ชันสำหรับแบบฟอร์มหนังสือตอบรับ
  const handleGenerateAcceptanceForm = async (isBlank = true) => {
    setPdfLoading(true);
    try {
      const pdfData = isBlank ? null : prepareFormDataForPDF();

      await officialDocumentService.generateAcceptanceFormPDF(pdfData, isBlank);

      const formType = isBlank ? "แบบฟอร์มว่าง" : "แบบฟอร์มที่มีข้อมูล";
      message.success(`สร้าง${formType}หนังสือตอบรับสำเร็จ!`);
    } catch (error) {
      console.error("Error generating acceptance form:", error);
      message.error(
        "ไม่สามารถสร้างแบบฟอร์มหนังสือตอบรับได้: " +
          (error.message || "เกิดข้อผิดพลาดไม่ทราบสาเหตุ")
      );
    } finally {
      setPdfLoading(false);
    }
  };

  // 🆕 การตั้งค่า Upload Component
  const uploadProps = {
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

  // 🆕 ฟังก์ชันสำหรับอัปโหลดหนังสือตอบรับ
  const handleUploadAcceptanceLetter = async () => {
    if (!acceptanceFile) {
      message.error("กรุณาเลือกไฟล์หนังสือตอบรับก่อนอัปโหลด");
      return;
    }

    if (!existingCS05?.documentId) {
      message.error("ไม่พบข้อมูลเอกสาร CS05");
      return;
    }

    setUploadLoading(true);
    try {
      const formData = new FormData();
      formData.append("acceptanceLetter", acceptanceFile);
      formData.append("documentId", existingCS05.documentId);

      // เรียก API อัปโหลดหนังสือตอบรับ
      const response = await internshipService.uploadAcceptanceLetter(formData);

      if (response.success) {
        message.success("อัปโหลดหนังสือตอบรับเรียบร้อยแล้ว!");
        setAcceptanceFile(null);

        // 🆕 อัปเดตข้อมูลสถานะการอัปโหลด
        setAcceptanceLetterStatus("uploaded"); // แปลงจาก pending เป็น uploaded
        setAcceptanceLetterInfo({
          ...response.data,
          originalStatus: "pending", // เก็บสถานะเดิมไว้
        });

        // อัปเดตสถานะไปขั้นตอนถัดไป
        updateStepFromStatus("acceptance_uploaded");

        // 🆕 ตรวจสอบสถานะใหม่หลังจากอัปโหลด 3 วินาที
        /* setTimeout(() => {
          checkAcceptanceLetterStatus();
        }, 3000); */
      } else {
        message.error(response.message || "ไม่สามารถอัปโหลดหนังสือตอบรับได้");
      }
    } catch (error) {
      console.error("Error uploading acceptance letter:", error);
      message.error(
        error.response?.data?.message ||
          "เกิดข้อผิดพลาดในการอัปโหลดหนังสือตอบรับ"
      );
    } finally {
      setUploadLoading(false);
    }
  };

  // เพิ่มฟังก์ชัน Preview แบบฟอร์มหนังสือตอบรับ
  const handlePreviewAcceptanceForm = async (isBlank = true) => {
    setPreviewLoading(true);
    try {
      const pdfData = isBlank ? null : prepareFormDataForPDF();

      await officialDocumentService.previewAcceptanceForm(pdfData, isBlank);

      const formType = isBlank ? "แบบฟอร์มว่าง" : "แบบฟอร์มที่มีข้อมูล";
      message.info(`เปิดตัวอย่าง${formType}หนังสือตอบรับในแท็บใหม่`);
    } catch (error) {
      console.error("Error previewing acceptance form:", error);
      message.error(
        "ไม่สามารถแสดงตัวอย่างแบบฟอร์มได้: " +
          (error.message || "เกิดข้อผิดพลาดไม่ทราบสาเหตุ")
      );
    } finally {
      setPreviewLoading(false);
    }
  };

  // ✅ ปรับปรุงฟังก์ชันสร้างหนังสือส่งตัว
  const handleGenerateReferralLetter = async () => {
    setPdfLoading(true);
    try {
      const pdfData = prepareFormDataForPDF();
      if (!pdfData) return;

      // เพิ่มข้อมูลเฉพาะสำหรับหนังสือส่งตัว
      const referralData = {
        ...pdfData,
        supervisorName: existingCS05?.supervisorName || "",
        supervisorPosition: existingCS05?.supervisorPosition || "",
        supervisorPhone: existingCS05?.supervisorPhone || "",
        supervisorEmail: existingCS05?.supervisorEmail || "",
      };

      // สร้าง PDF
      await pdfService.initialize();
      const preparedData =
        templateDataService.prepareReferralLetterData(referralData);
      const template = <ReferralLetterTemplate data={preparedData} />;
      const filename = pdfService.generateFileName(
        "referral_letter",
        preparedData.studentData?.[0]?.fullName || "นักศึกษา",
        "หนังสือส่งตัวฝึกงาน"
      );

      await pdfService.generateAndDownload(template, filename);
      message.success("สร้างหนังสือส่งตัวสำเร็จ!");

      // ✅ อัปเดต Frontend State แบบสมบูรณ์
      setReferralLetterStatus("downloaded");
      setCurrentInternshipStep(7);
      setCs05Status("referral_downloaded"); // ✅ อัปเดต CS05 status

      console.log("✅ อัปเดต Frontend state เรียบร้อย:");
      console.log("  - referralLetterStatus: downloaded");
      console.log("  - currentInternshipStep: 7");
      console.log("  - cs05Status: referral_downloaded");

      // ✅ เรียก Backend API เพื่อซิงค์ข้อมูล
      if (existingCS05?.documentId) {
        try {
          const response = await internshipService.markReferralLetterDownloaded(
            existingCS05.documentId
          );

          console.log("✅ อัปเดตสถานะใน Backend สำเร็จ:", response);

          // ✅ ตรวจสอบว่า Backend ต้องการอัปเดต CS05 status หรือไม่
          if (response.data?.shouldUpdateCS05Status) {
            await internshipService.updateCS05Status(
              existingCS05.documentId,
              "referral_downloaded"
            );
            console.log(
              "✅ อัปเดต CS05 status ใน Backend เป็น referral_downloaded"
            );
          }
        } catch (apiError) {
          console.warn(
            "⚠️ Backend API Error (ไม่กระทบการทำงาน):",
            apiError.message
          );

          // Fallback: เก็บใน localStorage
          localStorage.setItem(
            `referral_downloaded_${existingCS05.documentId}`,
            "true"
          );
          localStorage.setItem(
            `cs05_status_${existingCS05.documentId}`,
            "referral_downloaded"
          );
        }
      }
    } catch (error) {
      console.error("Error generating referral letter:", error);
      message.error(
        "ไม่สามารถสร้างหนังสือส่งตัวได้: " +
          (error.message || "เกิดข้อผิดพลาดไม่ทราบสาเหตุ")
      );
    } finally {
      setPdfLoading(false);
    }
  };

  // ฟังก์ชัน Preview หนังสือส่งตัว (อัปเดตใหม่)
  const handlePreviewReferralLetter = async () => {
    setPreviewLoading(true);
    try {
      const pdfData = prepareFormDataForPDF();
      if (!pdfData) return;

      const referralData = {
        ...pdfData,
        supervisorName: existingCS05?.supervisorName || "",
        supervisorPosition: existingCS05?.supervisorPosition || "",
        supervisorPhone: existingCS05?.supervisorPhone || "",
        supervisorEmail: existingCS05?.supervisorEmail || "",
      };

      // ใช้ services ที่มีอยู่แล้ว
      await pdfService.initialize();

      const preparedData =
        templateDataService.prepareReferralLetterData(referralData);

      const template = <ReferralLetterTemplate data={preparedData} />;

      await pdfService.previewPDF(template);
      message.info("เปิดตัวอย่างหนังสือส่งตัวในแท็บใหม่");
    } catch (error) {
      console.error("Error previewing referral letter:", error);
      message.error(
        "ไม่สามารถแสดงตัวอย่างหนังสือส่งตัวได้: " +
          (error.message || "เกิดข้อผิดพลาดไม่ทราบสาเหตุ")
      );
    } finally {
      setPreviewLoading(false);
    }
  };

  // 🔧 ปรับปรุงฟังก์ชันการแปลงสถานะ
  const getStepFromStatus = (status) => {
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
      case "referral_downloaded": // ✅ เพิ่ม case ใหม่
      case "completed":
        return 7; // เสร็จสิ้นขั้นตอนทั้งหมด
      default:
        return 1;
    }
  };

  // ✅ เพิ่ม useEffect สำหรับ sync CS05 status เมื่อถึงขั้นตอนที่ 7
  useEffect(() => {
    // เมื่อถึงขั้นตอนที่ 7 ให้อัปเดต CS05 status
    if (
      currentInternshipStep === 7 &&
      cs05Status !== "referral_downloaded" &&
      cs05Status !== "completed"
    ) {
      console.log(
        "[DEBUG] 🔄 ถึงขั้นตอนที่ 7 - อัปเดต CS05 status เป็น referral_downloaded"
      );
      setCs05Status("referral_downloaded");
    }
  }, [currentInternshipStep]);

  // ✅ เพิ่มฟังก์ชันแยกสำหรับจัดการ Referral Letter Status
  const updateStepFromReferralStatus = (referralStatus, acceptanceStatus) => {
    console.log("[DEBUG] updateStepFromReferralStatus:", {
      referralStatus,
      acceptanceStatus,
    });

    if (acceptanceStatus === "approved" && referralStatus === "ready") {
      console.log("✅ หนังสือส่งตัวพร้อม - ไปขั้นตอนที่ 6");
      setCurrentInternshipStep(6);
      setCs05Status("referral_ready"); // อัปเดต cs05Status ด้วย
    } else if (referralStatus === "downloaded") {
      console.log("✅ ดาวน์โหลดหนังสือส่งตัวแล้ว - ไปขั้นตอนที่ 7");
      setCurrentInternshipStep(7);
    }
  };

  // ✅ ปรับปรุง updateStepFromStatus ให้จัดการ acceptance_approved ถูกต้อง
  const updateStepFromStatus = (status) => {
    const newStep = getStepFromStatus(status);
    setCurrentInternshipStep(newStep);

    // ✅ แปลง acceptance_approved เป็น referral_ready
    if (status === "acceptance_approved") {
      setCs05Status("referral_ready"); // อัปเดต cs05Status ให้ถูกต้อง
      console.log(
        `📍 อัปเดตขั้นตอนเป็น ${newStep} จาก CS05 status: ${status} → referral_ready`
      );
    } else {
      setCs05Status(status);
      console.log(`📍 อัปเดตขั้นตอนเป็น ${newStep} จาก CS05 status: ${status}`);
    }
  };

  // 🆕 เพิ่มฟังก์ชันแยกสำหรับจัดการสถานะการดาวน์โหลด
  const updateStepFromDownloadStatus = (downloadStatus) => {
    if (downloadStatus === "downloaded") {
      setCurrentInternshipStep(7); // ขั้นตอนสุดท้าย
      setCs05Status("referral_downloaded"); // ✅ อัปเดต CS05 status ด้วย
      console.log("✅ อัปเดตขั้นตอนเป็น 7 (เสร็จสิ้น) จากสถานะการดาวน์โหลด");
      console.log("✅ อัปเดต CS05 Status เป็น 'referral_downloaded'");
    }
  };

  // 🆕 เพิ่มฟังก์ชันตรวจสอบว่าขั้นตอนไหนควรเปิดใช้งาน
  const isStepEnabled = (stepIndex, currentStep, cs05Status) => {
    // ขั้นตอนที่ 1-2 ทำงานตามปกติ
    if (stepIndex <= 2) {
      return stepIndex <= currentStep;
    }

    // ขั้นตอนที่ 3: พิมพ์หนังสือขอความอนุเคราะห์
    if (stepIndex === 3) {
      return currentStep >= 3 && cs05Status === "approved";
    }

    // ขั้นตอนที่ 4: อัปโหลดหนังสือตอบรับ
    // 🎯 เปิดใช้งานเมื่อถึงขั้นตอนที่ 3 และ cs05 approved
    if (stepIndex === 4) {
      return currentStep >= 3 && cs05Status === "approved";
    }

    // ขั้นตอนที่เหลือทำงานตามปกติ
    return stepIndex <= currentStep;
  };

  // 🆕 ฟังก์ชันกำหนดสถานะของขั้นตอน
  const getStepStatus = (stepIndex, currentStep, cs05Status) => {
    if (stepIndex < currentStep) {
      return "finish";
    }

    if (stepIndex === currentStep) {
      return "process";
    }

    // สำหรับขั้นตอนที่ 4: อัปโหลดหนังสือตอบรับ
    if (stepIndex === 4 && currentStep >= 3 && cs05Status === "approved") {
      return "process"; // เปิดให้ใช้งานเมื่อถึงขั้นตอนที่ 3
    }

    return "wait";
  };

  // โหลดสถานะ CS05 ล่าสุดจาก API
  const fetchLatestCS05Status = async () => {
    try {
      setLoading(true);
      const response = await internshipService.getCurrentCS05();

      if (response.success && response.data) {
        const latestStatus = response.data.status;

        // อัปเดตขั้นตอนตามสถานะใหม่
        updateStepFromStatus(latestStatus);
      }
    } catch (error) {
      console.error("Error fetching CS05 status:", error);
    } finally {
      setLoading(false);
    }
  };

  // 🆕 ฟังก์ชันตรวจสอบสถานะการอัปโหลดหนังสือตอบรับ
  const checkAcceptanceLetterStatus = async () => {
    if (!existingCS05?.documentId) {
      setAcceptanceLetterStatus("not_uploaded");
      setAcceptanceLetterInfo(null);
      return;
    }

    try {
      const response = await internshipService.checkAcceptanceLetterStatus(
        existingCS05.documentId
      );

      if (response.success) {
        if (response.data.hasAcceptanceLetter) {
          // 🔧 ใช้ mappedStatus จาก service
          setAcceptanceLetterStatus(response.data.status); // 'uploaded' หรือ 'approved'
          setAcceptanceLetterInfo(response.data);

          // ถ้ามีการอัปโหลดแล้ว ให้อัปเดตขั้นตอน
          if (response.data.status === "uploaded") {
            updateStepFromStatus("acceptance_uploaded");
          } else if (response.data.status === "approved") {
            updateStepFromStatus("acceptance_approved");
          }
        } else {
          // ไม่มีการอัปโหลด
          setAcceptanceLetterStatus("not_uploaded");
          setAcceptanceLetterInfo(null);
        }
      } else {
        setAcceptanceLetterStatus("not_uploaded");
        setAcceptanceLetterInfo(null);
      }
    } catch (error) {
      console.error("Error checking acceptance letter status:", error);

      // กรณี API ยังไม่มีหรือมีปัญหา ให้ถือว่ายังไม่มีการอัปโหลด
      if (error.response?.status === 404) {
        setAcceptanceLetterStatus("not_uploaded");
        setAcceptanceLetterInfo(null);
      } else {
        setAcceptanceLetterStatus("error");
        setAcceptanceLetterInfo(null);
      }
    }
  };

  // ฟังก์ชันตรวจสอบสถานะหนังสือส่งตัว (แยกการจัดการสถานะ)
  const checkReferralLetterStatus = async () => {
    if (!existingCS05?.documentId) {
      setReferralLetterStatus("not_ready");
      setReferralLetterInfo(null);
      return;
    }

    // ป้องกันการ override เมื่อผู้ใช้เพิ่งดาวน์โหลด
    if (referralLetterStatus === "downloaded" && currentInternshipStep === 7) {
      console.log("[DEBUG] 🛡️ ป้องกันการ override - ผู้ใช้เพิ่งดาวน์โหลด");
      return;
    }

    try {
      console.log("[DEBUG] 🔍 ตรวจสอบสถานะหนังสือส่งตัวจาก Backend...");

      const response = await internshipService.checkReferralLetterStatus(
        existingCS05.documentId
      );

      console.log("[DEBUG] ✅ ผลตรวจสอบสถานะ:", response);

      if (response.success && response.data.hasReferralLetter) {
        const apiStatus = response.data.status; // 'ready' หรือ 'downloaded'

        console.log("[DEBUG] 📊 สถานะจาก API:", apiStatus);

        setReferralLetterStatus(apiStatus);
        setReferralLetterInfo(response.data);

        // ✅ ไม่อัปเดต currentInternshipStep ที่นี่
        // ให้ useEffect อื่นจัดการ
      } else {
        setReferralLetterStatus("not_ready");
      }
    } catch (error) {
      console.error("[DEBUG] ❌ Error checking referral letter status:", error);

      // ตรวจสอบ localStorage fallback เมื่อมี error
      const fallbackStatus = localStorage.getItem(
        `referral_downloaded_${existingCS05.documentId}`
      );

      if (fallbackStatus === "true") {
        console.log("[DEBUG] 🔄 API Error - ใช้สถานะจาก localStorage fallback");
        setReferralLetterStatus("downloaded");
        updateStepFromDownloadStatus("downloaded");
      } else {
        if (error.response?.status === 404) {
          setReferralLetterStatus("not_ready");
          setReferralLetterInfo(null);
        } else {
          setReferralLetterStatus("error");
          setReferralLetterInfo(null);
        }
      }
    }
  };

  // เรียกใช้เมื่อ component โหลด (ปรับปรุงให้เรียบง่าย)
  useEffect(() => {
    // ตั้งค่าขั้นตอนเริ่มต้นจากข้อมูลที่มีอยู่
    if (existingCS05?.status) {
      updateStepFromStatus(existingCS05.status);
    }

    // ฟังก์ชันตรวจสอบสถานะทั้งหมด
    const checkAllStatus = async () => {
      console.log("[DEBUG] 🔄 เริ่มตรวจสอบสถานะทั้งหมด...");

      try {
        // 1. ตรวจสอบสถานะ CS05
        await fetchLatestCS05Status();

        // 2. ตรวจสอบสถานะการอัปโหลดหนังสือตอบรับ
        await checkAcceptanceLetterStatus();

        // 3. ✅ ตรวจสอบสถานะหนังสือส่งตัว (ใหม่)
        const currentAcceptanceStatus = acceptanceLetterStatus;

        // ถ้าหนังสือตอบรับได้รับการอนุมัติแล้ว ให้ตรวจสอบหนังสือส่งตัว
        if (
          currentAcceptanceStatus === "approved" ||
          cs05Status === "acceptance_approved"
        ) {
          console.log(
            "[DEBUG] 🔍 หนังสือตอบรับอนุมัติแล้ว - ตรวจสอบหนังสือส่งตัว"
          );

          await checkReferralLetterStatus();
        }

        console.log("[DEBUG] ✅ ตรวจสอบสถานะทั้งหมดเสร็จสิ้น");
      } catch (error) {
        console.error("[DEBUG] ❌ Error in checkAllStatus:", error);
      }
    };

    checkAllStatus();
  }, [existingCS05?.status, existingCS05?.documentId]);

  // ✅ เพิ่ม useEffect แยกสำหรับ watch การเปลี่ยนแปลง referralLetterStatus
  useEffect(() => {
    if (referralLetterStatus && acceptanceLetterStatus === "approved") {
      console.log(
        "[DEBUG] 👀 referralLetterStatus เปลี่ยนแปลง:",
        referralLetterStatus
      );
      updateStepFromReferralStatus(referralLetterStatus, "approved");
    }
  }, [referralLetterStatus, acceptanceLetterStatus]);

  // ขั้นตอนทั้งหมดของการฝึกงาน (7 ขั้นตอน) - อัปเดตให้สะท้อนสถานะปัจจุบัน
  const internshipProcessSteps = [
    {
      title: "กรอกข้อมูล คพ.05",
      description: "ส่งคำร้องขอฝึกงาน พร้อมข้อมูลบริษัทและนักศึกษา",
      icon: <FileTextOutlined />,
      status: "finish", // เสร็จแล้วเสมอ
      color: "#52c41a",
      details: [
        "ข้อมูลบริษัท / หน่วยงาน และสถานที่ตั้ง",
        "ข้อมูลผู้ติดต่อ (HR หรือผู้รับผิดชอบ)",
        "ตำแหน่งที่ขอฝึกงาน",
        "รายชื่อนักศึกษา (ไม่เกิน 2 คน)",
        "ข้อมูลส่วนตัว: ชื่อ-สกุล, ชั้นปี, ห้อง, รหัสนักศึกษา",
        "เบอร์โทรศัพท์และหน่วยกิตสะสม",
        "วันที่เริ่มต้นและสิ้นสุดการฝึกงาน",
      ],
    },
    {
      title: "การอนุมัติจากเจ้าหน้าที่ภาควิชา",
      description: "เจ้าหน้าที่ภาควิชาตรวจสอบและอนุมัติคำร้อง",
      icon: <AuditOutlined />,
      status: currentInternshipStep > 1 ? "finish" : "process",
      color: currentInternshipStep > 1 ? "#52c41a" : "#1890ff",
      details: [
        "เจ้าหน้าที่ภาควิชาตรวจสอบความถูกต้องของข้อมูล",
        "ตรวจสอบคุณสมบัติของนักศึกษา (หน่วยกิต, ชั้นปี)",
        "อนุมัติคำร้องและเตรียมเอกสารขอความอนุเคราะห์",
        "ระยะเวลาดำเนินการ: 2-3 วันทำการ",
      ],
    },
    {
      title: "รอหนังสือขอความอนุเคราะห์",
      description: "รอการอนุมัติและเตรียมเอกสาร",
      icon: <ClockCircleOutlined />,
      status:
        currentInternshipStep > 2
          ? "finish"
          : currentInternshipStep === 2
          ? "process"
          : "wait",
      color:
        currentInternshipStep > 2
          ? "#52c41a"
          : currentInternshipStep === 2
          ? "#1890ff"
          : "#d9d9d9",
      details: [
        "ระบบเตรียมหนังสือขอความอนุเคราะห์ฝึกงาน",
        "สร้างเลขที่เอกสารอัตโนมัติ",
        "เตรียมเอกสารสำหรับนักศึกษาดาวน์โหลด",
        "ระยะเวลาดำเนินการ: 1-2 วันทำการ",
      ],
    },
    {
      title: "พิมพ์หนังสือขอความอนุเคราะห์",
      description: "นักศึกษาดาวน์โหลดและพิมพ์เอกสาร",
      icon: <PrinterOutlined />,
      status: getStepStatus(3, currentInternshipStep, cs05Status),
      color:
        getStepStatus(3, currentInternshipStep, cs05Status) === "finish"
          ? "#52c41a"
          : getStepStatus(3, currentInternshipStep, cs05Status) === "process"
          ? "#1890ff"
          : "#d9d9d9",
      details: [
        "ดาวน์โหลดหนังสือขอความอนุเคราะห์ฝึกงาน",
        "ดาวน์โหลดแบบฟอร์มหนังสือตอบรับนักศึกษาเข้าฝึกงาน",
        "พิมพ์เอกสารทั้งสองฉบับ",
        "นำเอกสารไปติดต่อบริษัท/หน่วยงาน",
      ],
      // 🆕 อัปเดตส่วน actions ให้มีปุ่มแบบฟอร์มหนังสือตอบรับ
      actions: isStepEnabled(3, currentInternshipStep, cs05Status) ? (
        <Card size="small" style={{ marginTop: 12 }}>
          <Alert
            message="คำร้อง CS05 ได้รับการอนุมัติแล้ว"
            description="ขณะนี้คุณสามารถดาวน์โหลดหนังสือขอความอนุเคราะห์และแบบฟอร์มหนังสือตอบรับได้แล้ว"
            type="success"
            showIcon
            style={{ marginBottom: 16 }}
          />

          {/* หนังสือขอความอนุเคราะห์ */}
          <div style={{ marginBottom: 16 }}>
            <Text strong style={{ display: "block", marginBottom: 8 }}>
              📄 หนังสือขอความอนุเคราะห์:
            </Text>
            <Space wrap>
              <Tooltip title="ดูตัวอย่างหนังสือขอความอนุเคราะห์">
                <Button
                  icon={<EyeOutlined />}
                  onClick={handlePreviewPDF}
                  loading={previewLoading}
                  size="small"
                >
                  Preview
                </Button>
              </Tooltip>

              <Tooltip title="ดาวน์โหลดหนังสือขอความอนุเคราะห์">
                <Button
                  type="primary"
                  icon={<FileTextOutlined />}
                  onClick={handleGenerateOfficialLetter}
                  loading={pdfLoading}
                  size="small"
                >
                  หนังสือขอความอนุเคราะห์
                </Button>
              </Tooltip>
            </Space>
          </div>

          {/* แบบฟอร์มหนังสือตอบรับ */}
          <div>
            <Text strong style={{ display: "block", marginBottom: 8 }}>
              📋 แบบฟอร์มหนังสือตอบรับ:
            </Text>
            <Space wrap>
              <Tooltip title="ดูตัวอย่างแบบฟอร์มหนังสือตอบรับ">
                <Button
                  icon={<EyeOutlined />}
                  onClick={() => handlePreviewAcceptanceForm(true)}
                  loading={previewLoading}
                  size="small"
                >
                  Preview แบบฟอร์ม
                </Button>
              </Tooltip>

              <Tooltip title="ดาวน์โหลดแบบฟอร์มหนังสือตอบรับ">
                <Button
                  type="primary"
                  icon={<DownloadOutlined />}
                  onClick={() => handleGenerateAcceptanceForm(true)}
                  loading={pdfLoading}
                  size="small"
                >
                  แบบฟอร์มหนังสือตอบรับ
                </Button>
              </Tooltip>

              {/* <Tooltip title="ดาวน์โหลดแบบฟอร์มหนังสือตอบรับ (ใส่ข้อมูลแล้ว)">
                <Button
                  type="default"
                  icon={<FileTextOutlined />}
                  onClick={() => handleGenerateAcceptanceForm(false)}
                  loading={pdfLoading}
                  size="small"
                >
                  แบบฟอร์มมีข้อมูล
                </Button>
              </Tooltip> */}
            </Space>
          </div>
        </Card>
      ) : null,
    },
    {
      title: "อัปโหลดหนังสือตอบรับนักศึกษาเข้าฝึกงาน",
      description: "อัปโหลดหนังสือตอบรับจากบริษัท",
      icon: <UploadOutlined />,
      status: getStepStatus(4, currentInternshipStep, cs05Status),
      color:
        getStepStatus(4, currentInternshipStep, cs05Status) === "finish"
          ? "#52c41a"
          : getStepStatus(4, currentInternshipStep, cs05Status) === "process"
          ? "#1890ff"
          : "#d9d9d9",
      details: [
        "รับหนังสือตอบรับจากบริษัท/หน่วยงาน",
        "อัปโหลดหนังสือตอบรับเข้าสู่ระบบ",
        "เจ้าหน้าที่ภาควิชาตรวจสอบเอกสาร",
        "รอการอนุมัติเพื่อดำเนินการขั้นตอนถัดไป",
      ],

      // ✅ ย้ายส่วนอัปโหลดมาที่นี่
      actions: isStepEnabled(4, currentInternshipStep, cs05Status) ? (
        <Card size="small" style={{ marginTop: 12 }}>
          {/* ส่วนอัปโหลด - แสดงเฉพาะเมื่อยังไม่มีการอัปโหลด */}
          {(!acceptanceLetterStatus ||
            acceptanceLetterStatus === "not_uploaded") && (
            <>
              <Alert
                message="ยังไม่มีการอัปโหลดหนังสือตอบรับ"
                type="warning"
                showIcon
                style={{ marginBottom: 16 }}
              />
              <div style={{ marginBottom: 16 }}>
                <Text strong style={{ display: "block", marginBottom: 8 }}>
                  📤 อัปโหลดหนังสือตอบรับ:
                </Text>

                <Upload {...uploadProps}>
                  <Button
                    icon={<PaperClipOutlined />}
                    size="small"
                    style={{ marginBottom: 8 }}
                  >
                    เลือกไฟล์ PDF
                  </Button>
                </Upload>

                <div style={{ fontSize: "12px", color: "#666", marginTop: 4 }}>
                  รองรับไฟล์ PDF เท่านั้น (ขนาดไม่เกิน 5MB)
                </div>
              </div>

              <Button
                type="primary"
                icon={<UploadOutlined />}
                onClick={handleUploadAcceptanceLetter}
                loading={uploadLoading}
                disabled={!acceptanceFile}
                size="small"
              >
                อัปโหลดหนังสือตอบรับ
              </Button>
            </>
          )}
        </Card>
      ) : null,
    },
    {
      title: "รอหนังสือส่งตัว",
      description: "เจ้าหน้าที่ภาควิชาออกหนังสือส่งตัว",
      icon: <FileDoneOutlined />,
      // ✅ ปรับ logic ให้ข้าม step 5 เมื่อ acceptance_approved
      status: (() => {
        if (
          cs05Status === "acceptance_approved" ||
          cs05Status === "referral_ready"
        ) {
          return "finish"; // ข้ามขั้นตอนนี้
        }
        if (currentInternshipStep > 5) return "finish";
        if (currentInternshipStep === 5) return "process";
        return "wait";
      })(),
      color: (() => {
        if (
          cs05Status === "acceptance_approved" ||
          cs05Status === "referral_ready"
        ) {
          return "#52c41a"; // เสร็จแล้ว (ข้าม)
        }
        if (currentInternshipStep > 5) return "#52c41a";
        if (currentInternshipStep === 5) return "#1890ff";
        return "#d9d9d9";
      })(),
      details: [
        "เจ้าหน้าที่ภาควิชาจัดทำหนังสือส่งตัวนักศึกษา",
        "ตรวจสอบรายละเอียดก่อนออกเอกสาร",
        "เตรียมเอกสารสำหรับนักศึกษาดาวน์โหลด",
        "ระยะเวลาดำเนินการ: 2-3 วันทำการ",
      ],
    },
    {
      title: "นักศึกษาพิมพ์หนังสือส่งตัว",
      description: "ดาวน์โหลดและพิมพ์หนังสือส่งตัวเพื่อไปแจ้งให้กับบริษัท",
      icon: <DownloadOutlined />,

      // ✅ Logic ใหม่ที่เรียบง่าย
      status: (() => {
        if (referralLetterStatus === "downloaded") {
          return "finish";
        }
        if (
          cs05Status === "acceptance_approved" ||
          cs05Status === "referral_ready" ||
          (currentInternshipStep === 6 && referralLetterStatus === "ready")
        ) {
          return "process";
        }
        return "wait";
      })(),

      color: (() => {
        if (
          referralLetterStatus === "downloaded" ||
          currentInternshipStep > 6
        ) {
          return "#52c41a";
        }
        if (currentInternshipStep === 6) {
          return "#1890ff";
        }
        return "#d9d9d9";
      })(),

      // actions จะแสดงเมื่อ status = "process"
      actions:
        cs05Status === "acceptance_approved" ||
        cs05Status === "referral_ready" ||
        (currentInternshipStep === 6 && referralLetterStatus === "ready") ? (
          <Card size="small" style={{ marginTop: 12 }}>
            <Alert
              message="หนังสือส่งตัวพร้อมแล้ว"
              description="ขณะนี้คุณสามารถดาวน์โหลดหนังสือส่งตัวเพื่อนำไปรายงานตัวกับบริษัทได้แล้ว"
              type="success"
              showIcon
              style={{ marginBottom: 16 }}
            />

            <div>
              <Text strong style={{ display: "block", marginBottom: 8 }}>
                📋 หนังสือส่งตัวนักศึกษา:
              </Text>
              <Space wrap>
                <Tooltip title="ดูตัวอย่างหนังสือส่งตัว">
                  <Button
                    icon={<EyeOutlined />}
                    onClick={handlePreviewReferralLetter}
                    loading={previewLoading}
                    size="small"
                  >
                    Preview
                  </Button>
                </Tooltip>

                <Tooltip title="ดาวน์โหลดหนังสือส่งตัว">
                  <Button
                    type="primary"
                    icon={<DownloadOutlined />}
                    onClick={handleGenerateReferralLetter}
                    loading={pdfLoading}
                    size="small"
                  >
                    ดาวน์โหลดหนังสือส่งตัว
                  </Button>
                </Tooltip>
              </Space>
            </div>

            <div style={{ marginTop: 12, fontSize: "12px", color: "#666" }}>
              💡 หลังจากดาวน์โหลดแล้ว
              กรุณาพิมพ์และนำไปรายงานตัวกับบริษัทตามวันที่กำหนด
            </div>
          </Card>
        ) : null,
    },
    {
      title: "เสร็จสิ้นขั้นตอนการเตรียมตัวฝึกงาน",
      description: "ขั้นตอนการเตรียมความพร้อมสำหรับการฝึกงานเสร็จสมบูรณ์",
      icon: <CheckCircleOutlined />,
      status: (() => {
        if (
          currentInternshipStep >= 7 ||
          cs05Status === "referral_downloaded" ||
          cs05Status === "completed" ||
          referralLetterStatus === "downloaded"
        ) {
          return "finish";
        }
        return "wait";
      })(),
      color: (() => {
        if (
          currentInternshipStep >= 7 ||
          cs05Status === "referral_downloaded" ||
          cs05Status === "completed" ||
          referralLetterStatus === "downloaded"
        ) {
          return "#52c41a";
        }
        return "#d9d9d9";
      })(),
      details: [
        "✅ คำร้อง CS05 ได้รับการอนุมัติแล้ว",
        "✅ หนังสือขอความอนุเคราะห์ได้รับการจัดทำและดาวน์โหลดแล้ว",
        "✅ หนังสือตอบรับจากบริษัทได้รับการอัปโหลดและอนุมัติแล้ว",
        "✅ หนังสือส่งตัวได้รับการดาวน์โหลดแล้ว",
        "🎉 พร้อมเริ่มต้นการฝึกงานตามกำหนดการ",
      ],

      // 🆕 แสดง actions เมื่อเสร็จสิ้น
      actions:
        currentInternshipStep >= 7 ||
        cs05Status === "referral_downloaded" ||
        cs05Status === "completed" ? (
          <Card size="small" style={{ marginTop: 12 }}>
            <Alert
              message="🎉 ขั้นตอนการเตรียมตัวเสร็จสมบูรณ์!"
              description="คุณได้ดำเนินการขั้นตอนการเตรียมตัวสำหรับการฝึกงานครบถ้วนแล้ว ขณะนี้พร้อมเริ่มต้นการฝึกงานตามกำหนดการ"
              type="success"
              showIcon
              style={{ marginBottom: 16 }}
            />

            <div>
              <Text strong style={{ display: "block", marginBottom: 8 }}>
                📋 ขั้นตอนต่อไป:
              </Text>
              <ul style={{ marginBottom: 12, paddingLeft: 20 }}>
                <li>นำหนังสือส่งตัวไปรายงานตัวกับบริษัท/หน่วยงาน</li>
                <li>เริ่มต้นการฝึกงานตามวันที่กำหนด</li>
                <li>บันทึกการฝึกงานในระบบ CSLogbook</li>
                <li>ติดต่อผู้ควบคุมงานและอาจารย์ที่ปรึกษาเป็นระยะ</li>
              </ul>
            </div>
          </Card>
        ) : null,
    },
  ];

  // รายละเอียดขั้นตอนปัจจุบัน
  const getCurrentStepDetails = () => {
    const currentStep = internshipProcessSteps[currentInternshipStep - 1];

    // ถ้าอยู่ในขั้นตอนที่ 3 และ cs05 approved แล้ว
    // แสดงว่าทั้งขั้นตอนที่ 3 และ 4 สามารถทำงานได้
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

  // ข้อความแสดงการกระทำถัดไป
  const getNextActionText = (stepIndex) => {
    switch (stepIndex) {
      case 0:
        return "คำร้อง คพ.05 ได้รับการบันทึกในระบบเรียบร้อยแล้ว รอเจ้าหน้าที่ภาควิชาตรวจสอบ";
      case 1:
        return "เจ้าหน้าที่ภาควิชากำลังตรวจสอบข้อมูลและจะส่งให้หัวหน้าภาควิชาพิจารณาอนุมัติ";
      case 2:
        return "กรุณารอการอนุมัติจากหัวหน้าภาควิชาเพื่อออกหนังสือขอความอนุเคราะห์";
      case 3:
        return "หนังสือขอความอนุเคราะห์พร้อมแล้ว กรุณาดาวน์โหลดและพิมพ์เพื่อนำไปติดต่อบริษัท";
      case 4:
        return "กรุณาอัปโหลดหนังสือตอบรับจากบริษัทเพื่อดำเนินการขั้นตอนถัดไป";
      case 5:
        return "กรุณารอเจ้าหน้าที่ภาควิชาจัดทำหนังสือส่งตัว";
      case 6:
        return "หนังสือส่งตัวพร้อมแล้ว กรุณาดาวน์โหลดและพิมพ์เพื่อนำไปรายงานตัว";
      default:
        return "ขั้นตอนการฝึกงานเสร็จสมบูรณ์แล้ว";
    }
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
          {/* 🔧 เพิ่มการตรวจสอบ array ก่อน map */}
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
                {/* step content */}
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
                    <Tag
                      color={
                        step.status === "finish"
                          ? "success"
                          : step.status === "process"
                          ? "processing"
                          : "default"
                      }
                    >
                      {step.status === "finish"
                        ? "เสร็จสิ้น"
                        : step.status === "process"
                        ? "กำลังดำเนินการ"
                        : "รอดำเนินการ"}
                    </Tag>
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
