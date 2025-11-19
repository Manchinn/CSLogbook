import React from "react";
import {
  FileTextOutlined,
  AuditOutlined,
  ClockCircleOutlined,
  PrinterOutlined,
  UploadOutlined,
  FileDoneOutlined,
  DownloadOutlined,
  CheckCircleOutlined,
  EyeOutlined,
  PaperClipOutlined,
} from "@ant-design/icons";
import { Button, Space, Alert, Card, Typography, Tooltip, Upload } from "antd";
import { getStepStatus } from "./stepStatusHelper";

const { Text } = Typography;

/**
 * สร้างข้อมูลขั้นตอนทั้งหมดของการฝึกงาน
 * @param {number} currentInternshipStep - ขั้นตอนปัจจุบัน
 * @param {string} cs05Status - สถานะ CS05
 * @param {string} referralLetterStatus - สถานะหนังสือส่งตัว
 * @param {string} acceptanceLetterStatus - สถานะหนังสือตอบรับ
 * @param {Object} acceptanceLetterInfo - ข้อมูลหนังสือตอบรับ
 * @param {Object} actionHandlers - Object ที่มี handler functions ทั้งหมด
 * @returns {Array} - อาร์เรย์ของขั้นตอนทั้งหมด
 */
export const createInternshipProcessSteps = (
  currentInternshipStep,
  cs05Status,
  referralLetterStatus,
  acceptanceLetterStatus,
  acceptanceLetterInfo,
  actionHandlers
) => {
  return [
    // ขั้นตอนที่ 1: กรอกข้อมูล คพ.05
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

    // ขั้นตอนที่ 2: การอนุมัติจากเจ้าหน้าที่ภาควิชา
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

    // ขั้นตอนที่ 3: รอหนังสือขอความอนุเคราะห์
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

    // ขั้นตอนที่ 4: พิมพ์หนังสือขอความอนุเคราะห์
    createStep3Actions(
      currentInternshipStep,
      cs05Status,
      referralLetterStatus,
      actionHandlers
    ),

    // ขั้นตอนที่ 5: อัปโหลดหนังสือตอบรับ
    createStep4Actions(
      currentInternshipStep,
      cs05Status,
      referralLetterStatus,
      acceptanceLetterStatus,
      acceptanceLetterInfo,
      actionHandlers
    ),

    // ขั้นตอนที่ 6: รอหนังสือส่งตัว
    {
      title: "รอหนังสือส่งตัว",
      description: "เจ้าหน้าที่ภาควิชาออกหนังสือส่งตัว",
      icon: <FileDoneOutlined />,
      status: (() => {
        const stepStatus = getStepStatus(
          5,
          currentInternshipStep,
          cs05Status,
          referralLetterStatus
        );
        console.log("[DEBUG] Step 5 Status Calculation:", {
          stepIndex: 5,
          currentInternshipStep,
          cs05Status,
          referralLetterStatus,
          calculatedStatus: stepStatus,
        });
        return stepStatus;
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

    // ขั้นตอนที่ 7: นักศึกษาพิมพ์หนังสือส่งตัว
    createStep6Actions(
      currentInternshipStep,
      cs05Status,
      referralLetterStatus,
      actionHandlers
    ),

    // ขั้นตอนที่ 8: เสร็จสิ้นขั้นตอนการเตรียมตัวฝึกงาน
    createStep7Actions(currentInternshipStep, cs05Status, referralLetterStatus),
  ];
};

// Helper functions สำหรับสร้าง actions ของแต่ละขั้นตอน
const createStep3Actions = (
  currentInternshipStep,
  cs05Status,
  referralLetterStatus,
  handlers
) => {
  const {
    handlePreviewPDF,
    handleGenerateOfficialLetter,
    handlePreviewAcceptanceForm,
    handleGenerateAcceptanceForm,
    pdfLoading,
    previewLoading,
  } = handlers;

  return {
    title: "พิมพ์หนังสือขอความอนุเคราะห์",
    description: "นักศึกษาดาวน์โหลดและพิมพ์เอกสาร",
    icon: <PrinterOutlined />,
    status: (() => {
      const stepStatus = getStepStatus(
        3,
        currentInternshipStep,
        cs05Status,
        referralLetterStatus
      );
      console.log("[DEBUG] Step 3 Status:", {
        stepIndex: 3,
        currentInternshipStep,
        cs05Status,
        calculatedStatus: stepStatus,
      });
      return stepStatus;
    })(),
    color: (() => {
      const stepStatus = getStepStatus(
        3,
        currentInternshipStep,
        cs05Status,
        referralLetterStatus
      );
      switch (stepStatus) {
        case "finish":
          return "#52c41a"; // เขียว - เสร็จแล้ว
        case "process":
          return "#1890ff"; // น้ำเงิน - กำลังดำเนินการ
        case "wait":
        default:
          return "#d9d9d9"; // เทา - รอดำเนินการ
      }
    })(),
    details: [
      "ดาวน์โหลดหนังสือขอความอนุเคราะห์ฝึกงาน",
      "ดาวน์โหลดแบบฟอร์มหนังสือตอบรับนักศึกษาเข้าฝึกงาน",
      "พิมพ์เอกสารทั้งสองฉบับ",
      "นำเอกสารไปติดต่อบริษัท/หน่วยงาน",
    ],
    actions: (() => {
      const stepStatus = getStepStatus(
        3,
        currentInternshipStep,
        cs05Status,
        referralLetterStatus
      );
      const isEnabled = stepStatus === "process";

      console.log("[DEBUG] Step 3 Actions Check:", {
        stepStatus,
        isEnabled,
        currentInternshipStep,
        cs05Status,
      });

      if (!isEnabled) {
        return null;
      }

      return (
        <Card size="small" style={{ marginTop: 12 }}>
          {/* <Alert
            message="คำร้อง CS05 ได้รับการอนุมัติแล้ว"
            description="ขณะนี้คุณสามารถดาวน์โหลดหนังสือขอความอนุเคราะห์และแบบฟอร์มหนังสือตอบรับได้แล้ว"
            type="success"
            showIcon
            style={{ marginBottom: 16 }}
          /> */}

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
            </Space>
          </div>
        </Card>
      );
    })(),
  };
};

const createStep4Actions = (
  currentInternshipStep,
  cs05Status,
  referralLetterStatus,
  acceptanceLetterStatus,
  acceptanceLetterInfo,
  handlers
) => {
  const {
    handleUploadAcceptanceLetter,
    uploadProps,
    acceptanceFile,
    uploadLoading,
  } = handlers;

  return {
    title: "อัปโหลดหนังสือตอบรับนักศึกษาเข้าฝึกงาน",
    description: "อัปโหลดหนังสือตอบรับจากบริษัท",
    icon: <UploadOutlined />,
    status: getStepStatus(
      4,
      currentInternshipStep,
      cs05Status,
      referralLetterStatus
    ),
    color: (() => {
      // ✅ ปรับปรุงการคำนวณสี
      if (
        acceptanceLetterStatus === "approved" ||
        cs05Status === "acceptance_approved"
      ) {
        return "#52c41a"; // เขียว - อนุมัติแล้ว
      }
      if (acceptanceLetterStatus === "rejected") {
        return "#ff4d4f"; // แดง - ถูกปฏิเสธ ต้องแก้ไข
      }

      const stepStatus = getStepStatus(
        4,
        currentInternshipStep,
        cs05Status,
        referralLetterStatus
      );
      switch (stepStatus) {
        case "finish":
          return "#52c41a";
        case "process":
          return "#1890ff";
        case "wait":
        default:
          return "#d9d9d9";
      }
    })(),
    details: [
      "รับหนังสือตอบรับจากบริษัท/หน่วยงาน",
      "อัปโหลดหนังสือตอบรับเข้าสู่ระบบ",
      "เจ้าหน้าที่ภาควิชาตรวจสอบเอกสาร",
      "รอการอนุมัติเพื่อดำเนินการขั้นตอนถัดไป",
    ],
    actions: (() => {
      console.log("[DEBUG] Step 4 Actions - Current Status:", {
        acceptanceLetterStatus,
        acceptanceLetterInfo,
        cs05Status,
      });

      // ✅ กรณีอนุมัติแล้ว - แสดงสถานะสำเร็จ
      /* if (
        acceptanceLetterStatus === "approved" ||
        cs05Status === "acceptance_approved"
      ) {
        return (
          <Card size="small" style={{ marginTop: 12 }}>
            {acceptanceLetterInfo?.fileName && (
              <div style={{ marginTop: 12, fontSize: "12px", color: "#666" }}>
                📎 ไฟล์ที่อัปโหลด: {acceptanceLetterInfo.fileName}
                <br />
                📅 อนุมัติเมื่อ:{" "}
                {acceptanceLetterInfo.approvedAt
                  ? new Date(
                      acceptanceLetterInfo.approvedAt
                    ).toLocaleDateString("th-TH")
                  : "เพิ่งอนุมัติ"}
              </div>
            )}
          </Card>
        );
      } */

      // ✅ กรณีอัปโหลดแล้ว รอการอนุมัติ (เพิ่ม 'pending' และ 'uploaded')
      if (
        acceptanceLetterStatus === "uploaded" ||
        acceptanceLetterStatus === "pending" ||
        acceptanceLetterStatus === "submitted"
      ) {
        const statusConfig = {
          pending: {
            message: "📝 หนังสือตอบรับอยู่ระหว่างการพิจารณา",
            description:
              "หนังสือตอบรับได้รับการอัปโหลดแล้ว กรุณารอเจ้าหน้าที่ภาควิชาตรวจสอบและอนุมัติ",
            type: "info",
          },
          uploaded: {
            message: "📝 หนังสือตอบรับอยู่ระหว่างการตรวจสอบ",
            description:
              "หนังสือตอบรับได้รับการอัปโหลดแล้ว กรุณารอเจ้าหน้าที่ภาควิชาตรวจสอบและอนุมัติ",
            type: "info",
          },
          submitted: {
            message: "📝 หนังสือตอบรับได้รับการส่งแล้ว",
            description:
              "หนังสือตอบรับอยู่ระหว่างการประมวลผล กรุณารอการตรวจสอบ",
            type: "info",
          },
        };

        const config =
          statusConfig[acceptanceLetterStatus] || statusConfig.pending;

        return (
          <Card size="small" style={{ marginTop: 12 }}>
            <Alert
              message={config.message}
              description={config.description}
              type={config.type}
              showIcon
            />

            {/* ✅ แสดงข้อมูลไฟล์จาก acceptanceLetterInfo */}
            {acceptanceLetterInfo && (
              <div style={{ marginTop: 12, fontSize: "12px", color: "#666" }}>
                {acceptanceLetterInfo.fileName && (
                  <>
                    📎 ไฟล์ที่อัปโหลด: {acceptanceLetterInfo.fileName}
                    <br />
                  </>
                )}
                {acceptanceLetterInfo.uploadedAt && (
                  <>
                    📅 อัปโหลดเมื่อ:{" "}
                    {new Date(
                      acceptanceLetterInfo.uploadedAt
                    ).toLocaleDateString("th-TH")}
                    <br />
                  </>
                )}
                {acceptanceLetterInfo.statusMessage && (
                  <>📋 สถานะ: {acceptanceLetterInfo.statusMessage}</>
                )}
              </div>
            )}
          </Card>
        );
      }

      // ✅ กรณีถูกปฏิเสธ ให้แสดงเหตุผลและอนุญาตให้อัปโหลดใหม่
      if (acceptanceLetterStatus === "rejected") {
        return (
          <Card size="small" style={{ marginTop: 12, borderColor: '#ffccc7' }}>
            <Alert
              message="หนังสือตอบรับถูกปฏิเสธ"
              description={
                <div>
                  <p style={{ marginBottom: 8 }}>
                    เหตุผล: {acceptanceLetterInfo?.rejectionReason || acceptanceLetterInfo?.reviewComment || 'ไม่ระบุ'}
                  </p>
                  <p style={{ marginBottom: 0 }}>
                    กรุณาแก้ไขเอกสารตามเหตุผลด้านบน แล้วอัปโหลดใหม่อีกครั้ง
                  </p>
                </div>
              }
              type="error"
              showIcon
              style={{ marginBottom: 16 }}
            />

            <div style={{ marginBottom: 16 }}>
              <Text strong style={{ display: 'block', marginBottom: 8 }}>
                📤 อัปโหลดไฟล์ฉบับแก้ไข:
              </Text>
              <Upload {...uploadProps}>
                <Button icon={<PaperClipOutlined />} size="small" style={{ marginBottom: 8 }}>
                  เลือกไฟล์ PDF ใหม่
                </Button>
              </Upload>
              {acceptanceFile && (
                <div style={{ fontSize: 12, color: '#555' }}>
                  ไฟล์ที่เลือก: {acceptanceFile.name}
                </div>
              )}
            </div>

            <Space>
              <Button
                type="primary"
                icon={<UploadOutlined />}
                onClick={handleUploadAcceptanceLetter}
                loading={uploadLoading}
                disabled={!acceptanceFile}
                size="small"
              >
                ส่งไฟล์ใหม่
              </Button>
            </Space>
          </Card>
        );
      }

      // ✅ กรณียังไม่ได้อัปโหลด - ตรวจสอบว่าสามารถอัปโหลดได้หรือไม่
      const stepStatus = getStepStatus(
        4,
        currentInternshipStep,
        cs05Status,
        referralLetterStatus
      );
      if (stepStatus !== "process") {
        return null;
      }

      // ✅ กรณีที่ยังไม่มีการอัปโหลดเลย
      if (
        !acceptanceLetterStatus ||
        acceptanceLetterStatus === "not_uploaded" ||
        acceptanceLetterStatus === "none"
      ) {
        return (
          <Card size="small" style={{ marginTop: 12 }}>
            <Alert
              message="ยังไม่มีการอัปโหลดหนังสือตอบรับ"
              description="กรุณาอัปโหลดหนังสือตอบรับจากบริษัทเพื่อดำเนินการขั้นตอนถัดไป"
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
          </Card>
        );
      }

      // ✅ สำหรับสถานะอื่นๆ ที่ไม่ได้คาดการณ์ไว้
      return (
        <Card size="small" style={{ marginTop: 12 }}>
          <Alert
            message="สถานะไม่ทราบ"
            description={`สถานะปัจจุบัน: ${
              acceptanceLetterStatus || "ไม่ระบุ"
            }`}
            type="warning"
            showIcon
          />

          <div style={{ marginTop: 12, fontSize: "12px", color: "#666" }}>
            🔧 Debug Info:
            <br />
            acceptanceLetterStatus: {acceptanceLetterStatus || "undefined"}
            <br />
            cs05Status: {cs05Status}
            <br />
            hasInfo: {!!acceptanceLetterInfo}
          </div>
        </Card>
      );
    })(),
  };
};

const createStep6Actions = (
  currentInternshipStep,
  cs05Status,
  referralLetterStatus,
  handlers
) => {
  const {
    handlePreviewReferralLetter,
    handleGenerateReferralLetter,
    pdfLoading,
    previewLoading,
  } = handlers;

  return {
    title: "นักศึกษาพิมพ์หนังสือส่งตัว",
    description: "ดาวน์โหลดและพิมพ์หนังสือส่งตัวเพื่อไปแจ้งให้กับบริษัท",
    icon: <DownloadOutlined />,
    status: getStepStatus(
      6,
      currentInternshipStep,
      cs05Status,
      referralLetterStatus
    ),
    color: (() => {
      const stepStatus = getStepStatus(
        6,
        currentInternshipStep,
        cs05Status,
        referralLetterStatus
      );
      switch (stepStatus) {
        case "finish":
          return "#52c41a"; // เขียว - เสร็จแล้ว
        case "process":
          return "#1890ff"; // น้ำเงิน - กำลังดำเนินการ
        case "wait":
        default:
          return "#d9d9d9"; // เทา - รอดำเนินการ
      }
    })(),
    details: [
      "ดาวน์โหลดหนังสือส่งตัวฝึกงาน",
      "พิมพ์เอกสารเพื่อนำไปยื่นในวันแรกของการฝึกงาน",
      "เตรียมตัวเริ่มการฝึกงานตามวันที่กำหนด",
      "รายงานตัวกับผู้ควบคุมงานในบริษัท",
    ],
    actions: (() => {
      const stepStatus = getStepStatus(
        6,
        currentInternshipStep,
        cs05Status,
        referralLetterStatus
      );
      const isEnabled = stepStatus === "process";

      // ซ่อน actions เมื่อดาวน์โหลดหนังสือส่งตัวแล้ว
      if (referralLetterStatus === "downloaded") {
        return null;
      }

      console.log("[DEBUG] Step 6 Actions Check:", {
        stepStatus,
        isEnabled,
        currentInternshipStep,
        cs05Status,
        referralLetterStatus,
      });

      if (!isEnabled) {
        return null;
      }

      return (
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
      );
    })(),
  };
};

const createStep7Actions = (
  currentInternshipStep,
  cs05Status,
  referralLetterStatus
) => {
  return {
    title: "เสร็จสิ้นขั้นตอนการเตรียมตัวฝึกงาน",
    description: "ขั้นตอนการเตรียมความพร้อมสำหรับการฝึกงานเสร็จสมบูรณ์",
    icon: <CheckCircleOutlined />,
    status: getStepStatus(
      7,
      currentInternshipStep,
      cs05Status,
      referralLetterStatus
    ),
    color: (() => {
      const stepStatus = getStepStatus(
        7,
        currentInternshipStep,
        cs05Status,
        referralLetterStatus
      );
      return stepStatus === "finish" ? "#52c41a" : "#d9d9d9";
    })(),
    details: [
      "✅ คำร้อง CS05 ได้รับการอนุมัติแล้ว",
      "✅ หนังสือขอความอนุเคราะห์ได้รับการจัดทำและดาวน์โหลดแล้ว",
      "✅ หนังสือตอบรับจากบริษัทได้รับการอัปโหลดและอนุมัติแล้ว",
      "✅ หนังสือส่งตัวได้รับการดาวน์โหลดแล้ว",
      "🎉 พร้อมเริ่มต้นการฝึกงานตามกำหนดการ",
    ],
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
  };
};
