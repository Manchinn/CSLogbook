import React, { useState, useEffect } from "react";
import { Card, Steps, Alert, Button, Typography, Progress, Spin, message } from "antd";
import { CheckCircleOutlined, ClockCircleOutlined } from "@ant-design/icons";

// ใช้ hook จากโฟลเดอร์ hooks
import useCertificateStatus from 'features/internship/hooks/useCertificateStatus';
import useInternshipAccess from 'features/internship/hooks/useInternshipAccess';

// ใช้ components ที่มีอยู่แล้ว
import CertificateStatusCard from "./components/CertificateStatusCard";
import SupervisorEvaluationStatus from "./components/SupervisorEvaluationStatus";

// ✅ เพิ่ม PDF Helper
import CertificatePDFHelper from "./helpers/certificatePDFHelper";

const { Title, Text } = Typography;
const { Step } = Steps;

const InternshipCertificateRequest = () => {
  // const { userData } = useAuth(); // ไม่จำเป็นใน component นี้ตอนนี้
  const [requestLoading, setRequestLoading] = useState(false);
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);

  // ✅ สร้าง instance ของ PDF Helper
  const [pdfHelper] = useState(() => new CertificatePDFHelper());

  // ✅ ใช้ useInternshipAccess สำหรับตรวจสอบทั้ง CS05 และ ACCEPTANCE_LETTER
  const {
    canAccess: hasRequiredApprovals,
    cs05Status,
    acceptanceStatus,
    isCS05Approved,
    isAcceptanceApproved,
    hasCS05,
    hasAcceptance,
    loading: accessLoading
  } = useInternshipAccess();

  // ✅ ใช้ custom hook สำหรับจัดการสถานะ (เพิ่ม approvedHours)
  const {
    certificateStatus,
    supervisorEvaluationStatus,
    totalHours,
    approvedHours, // ✅ เพิ่ม approved hours
    loading,
    error,
    canRequestCertificate: canRequestFromHook,
    refreshStatus,
    submitCertificateRequest,
    certificateData,
  } = useCertificateStatus();

  // ✅ อัปเดต canRequestCertificate ให้รวมการตรวจสอบ dual status
  const canRequestCertificate = 
    hasRequiredApprovals && 
    canRequestFromHook;

  useEffect(() => {
    checkInternshipCompletion();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // ตั้งใจเรียกครั้งเดียวเมื่อ mount

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
      // อนุญาตเมื่อสถานะเป็น ready หรือ approved (บางระบบอาจใช้ approved แทน ready)
      if (!['ready','approved'].includes(certificateStatus)) {
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
      if (!['ready','approved'].includes(certificateStatus)) {
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

  // ✅ ปรับให้ progress แสดงเฉพาะ 2 เงื่อนไข (ชั่วโมงและการประเมิน)
  const getProgressPercentage = () => {
    let completed = 0;
    if (approvedHours >= 240) completed += 50;
    if (supervisorEvaluationStatus === "completed") completed += 50;
    return completed;
  };

  // ✅ ใช้ steps 2 ขั้น แสดงเฉพาะชั่วโมงและการประเมิน
  const getCurrentStep = () => {
    if (approvedHours < 240) return 0;
    if (supervisorEvaluationStatus !== "completed") return 1;
    return 2;
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
      {/* <Title level={2} style={{ textAlign: "center", marginBottom: 32 }}>
        📜 ขอหนังสือรับรองการฝึกงาน
      </Title> */}

      {/* ✅ Alert แจ้งเตือนเงื่อนไขการอนุมัติ CS05 และหนังสือตอบรับ */}
      {!hasRequiredApprovals && (
        <Alert
          type="warning"
          message="ต้องผ่านการอนุมัติก่อนจึงจะสามารถขอหนังสือรับรองได้"
          description={
            <div>
              <p>คุณต้องผ่านการอนุมัติทั้งสองส่วนก่อนจึงจะขอหนังสือรับรองการฝึกงานได้:</p>
              <ul style={{ marginBottom: 0 }}>
                <li>
                  คำร้องขอฝึกงาน (คพ.05): {' '}
                  {isCS05Approved ? (
                    <span style={{ color: '#52c41a', fontWeight: 'bold' }}>✅ อนุมัติแล้ว</span>
                  ) : (
                    <span style={{ color: '#faad14' }}>⚠️ {
                      !hasCS05 ? 'ยังไม่ได้ส่งคำร้อง' :
                      cs05Status === 'pending' ? 'รอการพิจารณา' :
                      cs05Status === 'rejected' ? 'ไม่ได้รับการอนุมัติ' :
                      cs05Status || 'ไม่ทราบสถานะ'
                    }</span>
                  )}
                </li>
                <li>
                  หนังสือตอบรับฝึกงานจากบริษัท: {' '}
                  {isAcceptanceApproved ? (
                    <span style={{ color: '#52c41a', fontWeight: 'bold' }}>✅ อนุมัติแล้ว</span>
                  ) : (
                    <span style={{ color: '#faad14' }}>⚠️ {
                      !hasAcceptance ? 'ยังไม่ได้อัปโหลด' :
                      acceptanceStatus === 'pending' ? 'รอการพิจารณา' :
                      acceptanceStatus === 'rejected' ? 'ไม่ได้รับการอนุมัติ' :
                      acceptanceStatus || 'ไม่ทราบสถานะ'
                    }</span>
                  )}
                </li>
              </ul>
              {!hasCS05 && (
                <Button 
                  type="link" 
                  style={{ paddingLeft: 0 }}
                  onClick={() => window.location.href = '/internship-registration/flow'}
                >
                  → ไปยังหน้าส่งคำร้องขอฝึกงาน (คพ.05)
                </Button>
              )}
              {isCS05Approved && !hasAcceptance && (
                <Button 
                  type="link" 
                  style={{ paddingLeft: 0 }}
                  onClick={() => window.location.href = '/internship/status'}
                >
                  → ไปยังหน้าอัปโหลดหนังสือตอบรับฝึกงาน
                </Button>
              )}
            </div>
          }
          showIcon
          style={{ marginBottom: 24 }}
        />
      )}

      {/* ส่วนแสดงความคืบหน้าโดยรวม */}
      <Card
        style={{ marginBottom: 24 }}
        extra={
          <Button onClick={refreshStatus} loading={loading || accessLoading}>
            รีเฟรชข้อมูลสถานะ
          </Button>
        }
      >
        <Title level={4}>📊 ความคืบหน้าคุณสมบัติการขอหนังสือรับรองการฝึกงาน</Title>

        <Progress
          percent={getProgressPercentage()}
          status={getProgressPercentage() === 100 ? "success" : "active"}
          strokeColor={{
            "0%": "#108ee9",
            "100%": "#87d068",
          }}
          style={{ marginBottom: 24 }}
        />

        <Steps size="small" current={getCurrentStep()} direction="vertical">
          <Step
            title="ชั่วโมงฝึกงาน (ที่ได้รับการอนุมัติ)"
            description={approvedHours >= 240 ? "ครบ 240 ชั่วโมง" : `อนุมัติแล้ว ${approvedHours}/240 ชั่วโมง`}
            icon={approvedHours >= 240 ? <CheckCircleOutlined style={{ color: '#52c41a' }} /> : <ClockCircleOutlined />}
          />
          <Step
            title="การประเมินจากผู้ควบคุมงาน"
            description={supervisorEvaluationStatus === "completed" ? "ประเมินเสร็จสิ้นแล้ว" : "รอการประเมิน"}
            icon={supervisorEvaluationStatus === "completed" ? <CheckCircleOutlined style={{ color: '#52c41a' }} /> : <ClockCircleOutlined />}
          />
        </Steps>
      </Card>

      {/* ✅ ส่วนแสดงสถานะการประเมินจาก (ส่ง approvedHours ด้วย) */}
      <SupervisorEvaluationStatus
        status={supervisorEvaluationStatus}
        totalHours={totalHours}
        totalApprovedHours={approvedHours}
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
              <li>
                <strong>ชั่วโมงฝึกงาน</strong> ต้องครบ 240 ชั่วโมง และได้รับการอนุมัติจากผู้ควบคุมงาน
              </li>
              <li>
                <strong>การประเมิน</strong> ต้องได้รับการประเมินจากผู้ควบคุมงานแล้ว
              </li>
              <li style={{ marginTop: 8, color: '#1890ff' }}>
                💡 เจ้าหน้าที่ภาควิชาใช้เวลาตรวจสอบประมาณ 3-5 วันทำการ
              </li>
              <li style={{ color: '#52c41a' }}>
                ✨ หนังสือรับรองจะถูกสร้างด้วยระบบ PDF อัตโนมัติ
              </li>
            </ul>
          }
          type="info"
          showIcon
        />
      </Card>

    </div>
  );
};

export default InternshipCertificateRequest;
