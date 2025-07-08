import React, { useState, useEffect } from "react";
import {
  Card,
  Steps,
  Alert,
  Button,
  Typography,
  Space,
  Divider,
  Progress,
  Spin,
  message,
} from "antd";
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  FileProtectOutlined,
  SendOutlined,
} from "@ant-design/icons";
import { useAuth } from "../../../contexts/AuthContext";

// ใช้ hook จากโฟลเดอร์ hooks
import useCertificateStatus from "../../../hooks/useCertificateStatus";

// ใช้ components ที่มีอยู่แล้ว
import CertificateStatusCard from "./components/CertificateStatusCard";
import SupervisorEvaluationStatus from "./components/SupervisorEvaluationStatus";

// ✅ เพิ่ม PDF Helper
import CertificatePDFHelper from "./helpers/certificatePDFHelper";

const { Title, Text, Paragraph } = Typography;
const { Step } = Steps;

const InternshipCertificateRequest = () => {
  const { userData } = useAuth();
  const [requestLoading, setRequestLoading] = useState(false);
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);

  // ✅ สร้าง instance ของ PDF Helper
  const [pdfHelper] = useState(() => new CertificatePDFHelper());

  // ใช้ custom hook สำหรับจัดการสถานะ
  const {
    certificateStatus,
    supervisorEvaluationStatus,
    internshipSummaryStatus,
    totalHours,
    loading,
    error,
    canRequestCertificate,
    refreshStatus,
    submitCertificateRequest,
    certificateData,
  } = useCertificateStatus();

  useEffect(() => {
    checkInternshipCompletion();
  }, []);

  const checkInternshipCompletion = async () => {
    try {
      await refreshStatus();
    } catch (error) {
      console.error("Error checking internship completion:", error);
      message.error("ไม่สามารถตรวจสอบสถานะการฝึกงานได้");
    }
  };

  const handleSubmitCertificateRequest = async () => {
    try {
      setRequestLoading(true);
      const result = await submitCertificateRequest();

      if (result.success) {
        message.success("ส่งคำขอหนังสือรับรองการฝึกงานเรียบร้อยแล้ว");
        await refreshStatus(); // รีเฟรชสถานะหลังส่งคำขอ
      } else {
        message.error(result.message || "ไม่สามารถส่งคำขอได้");
      }
    } catch (error) {
      console.error("Error submitting certificate request:", error);
      message.error("เกิดข้อผิดพลาดในการส่งคำขอ");
    } finally {
      setRequestLoading(false);
    }
  };

  // ✅ ปรับปรุง handlePreviewCertificate ให้ใช้เฉพาะ Frontend PDF Generation
  const handlePreviewCertificate = async () => {
    try {
      setPreviewLoading(true);
      
      // ตรวจสอบสถานะหนังสือรับรอง
      if (certificateStatus !== "ready") {
        message.warning("หนังสือรับรองยังไม่พร้อม กรุณารอการดำเนินการจากเจ้าหน้าที่");
        return;
      }

      // ✅ ตรวจสอบว่ามี OfficialDocumentService พร้อมใช้งานหรือไม่
      if (!pdfHelper.isOfficialDocumentServiceAvailable()) {
        message.error('ระบบสร้าง PDF ไม่พร้อมใช้งาน กรุณาลองใหม่อีกครั้ง');
        return;
      }

      // ✅ ตรวจสอบข้อมูลหนังสือรับรอง
      if (!certificateData) {
        message.error("ไม่พบข้อมูลหนังสือรับรอง กรุณาติดต่อเจ้าหน้าที่");
        return;
      }

      // ✅ ใช้การตรวจสอบแบบยืดหยุ่น
      if (!pdfHelper.hasBasicCertificateData(certificateData)) {
        message.warning("ข้อมูลหนังสือรับรองไม่ครบถ้วน จะใช้ข้อมูลเริ่มต้นสำหรับตัวอย่าง");
      }

      console.log('🔄 Using Frontend PDF Generation for preview...');
      
      // ✅ ใช้เฉพาะ Frontend PDF Generation
      const result = await pdfHelper.previewCertificate(certificateData);
      
      if (result.success) {
        message.info(result.message);
      } else {
        throw new Error("ไม่สามารถแสดงตัวอย่างหนังสือรับรองได้");
      }
      
    } catch (error) {
      console.error("Error previewing certificate:", error);
      
      // ✅ จัดการ error แบบเจาะจง
      if (error.message?.includes('ไม่มีข้อมูลหนังสือรับรอง')) {
        message.error("ข้อมูลหนังสือรับรองไม่ครบถ้วน กรุณาตรวจสอบข้อมูลการฝึกงาน");
      } else if (error.message?.includes('PDF Service ไม่พร้อมใช้งาน')) {
        message.error("ระบบสร้าง PDF ไม่พร้อมใช้งาน กรุณาลองใหม่อีกครั้ง");
      } else if (error.message?.includes('ไม่สามารถเปิดแท็บใหม่ได้')) {
        message.error("ไม่สามารถเปิดหน้าต่างใหม่ได้ กรุณาอนุญาต popup ในเบราว์เซอร์");
      } else {
        message.error(error.message || "ไม่สามารถแสดงตัวอย่างหนังสือรับรองได้");
      }
    } finally {
      setPreviewLoading(false);
    }
  };

  // ✅ ปรับปรุง handleDownloadCertificate ให้ใช้เฉพาะ Frontend PDF Generation
  const handleDownloadCertificate = async () => {
    try {
      setDownloadLoading(true);
      
      // ตรวจสอบสถานะหนังสือรับรอง
      if (certificateStatus !== "ready") {
        message.warning("หนังสือรับรองยังไม่พร้อม กรุณารอการดำเนินการจากเจ้าหน้าที่");
        return;
      }

      // ✅ ตรวจสอบว่ามี OfficialDocumentService พร้อมใช้งานหรือไม่
      if (!pdfHelper.isOfficialDocumentServiceAvailable()) {
        message.error('ระบบสร้าง PDF ไม่พร้อมใช้งาน กรุณาลองใหม่อีกครั้ง');
        return;
      }

      // ✅ ตรวจสอบข้อมูลหนังสือรับรอง
      if (!certificateData) {
        message.error("ไม่พบข้อมูลหนังสือรับรอง กรุณาติดต่อเจ้าหน้าที่");
        return;
      }

      // ✅ ใช้การตรวจสอบแบบยืดหยุ่น
      if (!pdfHelper.hasBasicCertificateData(certificateData)) {
        message.warning("ข้อมูลหนังสือรับรองไม่ครบถ้วน จะใช้ข้อมูลเริ่มต้นสำหรับการสร้าง PDF");
      }

      console.log('🔄 Using Frontend PDF Generation for download...');
      
      // ✅ ใช้เฉพาะ Frontend PDF Generation
      const result = await pdfHelper.downloadCertificate(certificateData);
      
      if (result.success) {
        message.success(result.message);
        
        // ✅ อาจจะมีการบันทึกประวัติการดาวน์โหลดในอนาคต
        // await markCertificateDownloaded();
      } else {
        throw new Error("ไม่สามารถดาวน์โหลดหนังสือรับรองได้");
      }
      
    } catch (error) {
      console.error("Error downloading certificate:", error);
      
      // ✅ จัดการ error แบบเจาะจง
      if (error.message?.includes('ไม่มีข้อมูลหนังสือรับรอง')) {
        message.error("ข้อมูลหนังสือรับรองไม่ครบถ้วน กรุณาตรวจสอบข้อมูลการฝึกงาน");
      } else if (error.message?.includes('PDF Service ไม่พร้อมใช้งาน')) {
        message.error("ระบบสร้าง PDF ไม่พร้อมใช้งาน กรุณาลองใหม่อีกครั้ง");
      } else if (error.message?.includes('ไม่มีสิทธิ์')) {
        message.error("ไม่มีสิทธิ์ในการดาวน์โหลดหนังสือรับรอง");
      } else {
        message.error(error.message || "ไม่สามารถดาวน์โหลดหนังสือรับรองได้");
      }
    } finally {
      setDownloadLoading(false);
    }
  };

  const getProgressPercentage = () => {
    let completed = 0;
    if (totalHours >= 240) completed += 33;
    if (supervisorEvaluationStatus === "completed") completed += 33;
    if (internshipSummaryStatus === "submitted") completed += 34;
    return completed;
  };

  const getCurrentStep = () => {
    if (certificateStatus === "ready") return 2;
    if (certificateStatus === "pending") return 1;
    return 0;
  };

  // แสดง loading state
  if (loading) {
    return (
      <Card style={{ textAlign: "center", padding: "40px" }}>
        <Spin size="large" />
        <Text style={{ display: "block", marginTop: 16 }}>
          กำลังตรวจสอบสถานะการฝึกงาน...
        </Text>
      </Card>
    );
  }

  // แสดง error state
  if (error) {
    return (
      <Card style={{ maxWidth: "800px", margin: "0 auto", padding: "24px" }}>
        <Alert
          message="เกิดข้อผิดพลาด"
          description={error}
          type="error"
          showIcon
          action={
            <Button size="small" onClick={() => window.location.reload()}>
              โหลดใหม่
            </Button>
          }
        />
      </Card>
    );
  }

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "24px" }}>
      <Title level={2} style={{ textAlign: "center", marginBottom: 32 }}>
        📜 ขอหนังสือรับรองการฝึกงาน
      </Title>

      {/* Debug Information - ลบออกใน production */}
      {process.env.NODE_ENV === "development" && (
        <Card style={{ marginBottom: 24, backgroundColor: "#f6ffed" }}>
          <Title level={5}>🔧 Debug Information</Title>
          <Text>
            Status: {certificateStatus} | Hours: {totalHours} | Evaluation:{" "}
            {supervisorEvaluationStatus} | Summary: {internshipSummaryStatus} |{" "}
            Can Request: {canRequestCertificate ? "Yes" : "No"} |{" "}
            Has Certificate Data: {certificateData ? "Yes" : "No"} |{" "}
            Has Basic Data: {certificateData ? (pdfHelper.hasBasicCertificateData(certificateData) ? "Yes" : "No") : "N/A"} |{" "}
            PDF Service Available: {pdfHelper.isOfficialDocumentServiceAvailable() ? "Yes" : "No"}
          </Text>
          {certificateData && (
            <details style={{ marginTop: 8 }}>
              <summary>🔍 Certificate Data Details</summary>
              <pre style={{ fontSize: '12px', backgroundColor: '#f0f0f0', padding: 8, borderRadius: 4 }}>
                {JSON.stringify(certificateData, null, 2)}
              </pre>
            </details>
          )}
        </Card>
      )}

      {/* ส่วนแสดงความคืบหน้าโดยรวม */}
      <Card style={{ marginBottom: 24 }}>
        <Title level={4}>📊 ความคืบหน้าการขอหนังสือรับรอง</Title>

        <Progress
          percent={getProgressPercentage()}
          status={certificateStatus === "ready" ? "success" : "active"}
          strokeColor={{
            "0%": "#108ee9",
            "100%": "#87d068",
          }}
          style={{ marginBottom: 24 }}
        />

        <Steps size="small" current={getCurrentStep()}>
          <Step
            title="ตรวจสอบความพร้อม"
            description="ตรวจสอบชั่วโมงฝึกงานและการประเมิน"
            icon={
              totalHours >= 240 &&
              supervisorEvaluationStatus === "completed" ? (
                <CheckCircleOutlined />
              ) : (
                <ClockCircleOutlined />
              )
            }
          />
          <Step
            title="ส่งคำขอหนังสือรับรอง"
            description="ส่งคำขอให้เจ้าหน้าที่ภาควิชา"
            icon={
              certificateStatus === "pending" ||
              certificateStatus === "ready" ? (
                <CheckCircleOutlined />
              ) : (
                <SendOutlined />
              )
            }
          />
          <Step
            title="ดาวน์โหลดหนังสือรับรอง"
            description="หนังสือรับรองพร้อมดาวน์โหลด"
            icon={
              certificateStatus === "ready" ? (
                <FileProtectOutlined />
              ) : (
                <ClockCircleOutlined />
              )
            }
          />
        </Steps>
      </Card>

      {/* ส่วนแสดงสถานะการประเมินจากพี่เลี้ยง */}
      <SupervisorEvaluationStatus
        status={supervisorEvaluationStatus}
        totalHours={totalHours}
        summaryStatus={internshipSummaryStatus}
      />

      {/* ส่วนแสดงสถานะหนังสือรับรอง */}
      <CertificateStatusCard
        status={certificateStatus}
        canRequest={canRequestCertificate}
        onSubmitRequest={handleSubmitCertificateRequest}
        onDownload={handleDownloadCertificate}
        onPreview={handlePreviewCertificate}
        loading={requestLoading}
        downloadLoading={downloadLoading}
        previewLoading={previewLoading}
      />

      {/* ข้อมูลสำคัญ */}
      <Card style={{ marginTop: 24 }}>
        <Title level={4}>📋 ข้อมูลสำคัญ</Title>
        <Alert
          message="เงื่อนไขการขอหนังสือรับรองการฝึกงาน"
          description={
            <ul style={{ marginBottom: 0, paddingLeft: 20 }}>
              <li>ต้องมีชั่วโมงฝึกงานครบ 240 ชั่วโมง</li>
              <li>ต้องได้รับการประเมินจากพี่เลี้ยงแล้ว</li>
              <li>ต้องส่งรายงานสรุปผลการฝึกงานแล้ว</li>
              <li>เจ้าหน้าที่ภาควิชาใช้เวลาตรวจสอบประมาณ 3-5 วันทำการ</li>
              <li>หนังสือรับรองจะถูกสร้างด้วยระบบ PDF อัตโนมัติ (Frontend)</li>
            </ul>
          }
          type="info"
          showIcon
        />
      </Card>

      {/* ปุ่มรีเฟรชข้อมูล */}
      <Card style={{ marginTop: 24, textAlign: "center" }}>
        <Button onClick={refreshStatus} loading={loading}>
          รีเฟรชข้อมูลสถานะ
        </Button>
      </Card>
    </div>
  );
};

export default InternshipCertificateRequest;
