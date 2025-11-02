import React, { useState, useEffect } from "react";
import {
  Card,
  Form,
  Typography,
  Button,
  Alert,
  Skeleton,
  Result,
  message,
  Space,
  FloatButton,
} from "antd";
import {
  WarningOutlined,
  ReloadOutlined,
  QuestionCircleOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import TimeSheetTable from "./TimeSheetTable";
import TimeSheetStats from "./TimeSheetStats";
import EditModal from "./EditModal";
import ViewModal from "./ViewModal";
import InstructionModal from "./InstructionModal";
import { useTimeSheet } from "../../../../hooks/useTimeSheet";
import useInternshipAccess from "../../../../hooks/useInternshipAccess";
import dayjs from "../../../../utils/dayjs";
import { DATE_FORMAT_MEDIUM } from "../../../../utils/constants";
// เปลี่ยนจาก styles.css เป็น CSS Modules
import styles from "./TimeSheet.module.css";

const { Text } = Typography;

const TimeSheet = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const [isInstructionVisible, setIsInstructionVisible] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  // ✅ ใช้ useInternshipAccess สำหรับตรวจสอบทั้ง CS05 และ ACCEPTANCE_LETTER
  const {
    canEdit: canAccessLogbook,
    cs05Status: accessCS05Status,
    acceptanceStatus,
    errorMessage,
    hasCS05: hasCS05Access,
    isCS05Approved,
    hasAcceptance
  } = useInternshipAccess();

  const {
    loading,
    initialLoading,
    internshipDates,
    selectedEntry,
    isModalVisible,
    isViewModalVisible,
    handleEdit,
    handleView,
    handleSave,
    handleClose,
    stats,
    dateRange,
    hasCS05,
    cs05Status,
    refreshData,
    loadError,
    refreshTable,
  } = useTimeSheet(form);

  useEffect(() => {
    const shouldShow = localStorage.getItem("showTimeSheetGuide") !== "false";
    setIsInstructionVisible(shouldShow);
  }, []);

  useEffect(() => {
    // ถ้าไม่พบข้อมูล CS05 ให้แสดง Alert และ redirect หลังจากนั้น 3 วินาที
    if (!initialLoading && !hasCS05) {
      message.warning(
        "ไม่พบข้อมูลคำร้อง คพ.05 จะพาไปยังหน้าส่งคำร้องในอีก 3 วินาที"
      );

      const redirectTimer = setTimeout(() => {
        navigate("/internship-registration/flow");
      }, 3000);

      // ล้าง timer เมื่อ component unmount
      return () => clearTimeout(redirectTimer);
    }

    // เพิ่มบรรทัดนี้
    if (!initialLoading && hasCS05) {
      // รีเฟรชข้อมูลจากฐานข้อมูลทันทีเมื่อโหลดหน้าเสร็จ
      setTimeout(() => refreshTable(), 500);
    }
  }, [initialLoading, hasCS05, navigate, refreshTable]);

  const handleInstructionClose = () => {
    if (dontShowAgain) {
      localStorage.setItem("showTimeSheetGuide", "false");
    }
    setIsInstructionVisible(false);
  };

  const onCheckboxChange = (e) => {
    setDontShowAgain(e.target.checked);
  };

  // ฟังก์ชันสำหรับเปิด InstructionModal จาก FloatButton
  const handleShowInstructions = () => {
    setIsInstructionVisible(true);
  };

  // แสดง Skeleton ขณะโหลดข้อมูลเริ่มต้น
  if (initialLoading) {
    return (
      <div className={styles.internshipContainer}>
        <Card>
          <Alert
            type="info"
            message="กำลังโหลดข้อมูล..."
            description="ระบบกำลังดึงข้อมูลการฝึกงาน กรุณารอสักครู่"
            showIcon
            style={{ marginBottom: 16 }}
          />
          <Skeleton active paragraph={{ rows: 4 }} />
          <div style={{ textAlign: "center", marginTop: 20 }}>
            <Button
              type="primary"
              icon={<ReloadOutlined />}
              onClick={() => window.location.reload()}
            >
              รีเฟรชหน้าจอ
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // กรณีไม่พบข้อมูล CS05
  if (!hasCS05) {
    return (
      <div className={styles.internshipContainer}>
        <Result
          status="warning"
          icon={<WarningOutlined />}
          title="ไม่พบข้อมูลคำร้อง คพ.05"
          subTitle="คุณจำเป็นต้องส่งคำร้อง คพ.05 ก่อนจึงจะสามารถบันทึกเวลาทำงานได้"
          extra={[
            <Alert
              key="redirect-alert"
              type="warning"
              message="กำลังนำทาง..."
              description="กำลังนำคุณไปยังหน้าส่งคำร้อง คพ.05 โปรดรอสักครู่"
              showIcon
              style={{ marginBottom: 16 }}
            />,
            <Button
              type="primary"
              key="cs05-form"
              onClick={() => navigate("/internship-registration/flow")}
            >
              ไปที่หน้าส่งคำร้อง คพ.05 ทันที
            </Button>,
          ]}
        />
      </div>
    );
  }

  // ✅ ตรวจสอบเงื่อนไขการเข้าถึงด้วย useInternshipAccess (ทั้ง CS05 และ ACCEPTANCE_LETTER)
  if (!canAccessLogbook) {
    // กำหนด message และ status ตามสถานะ
    let resultStatus = 'info';
    let resultTitle = 'ไม่สามารถบันทึกเวลาทำงานได้';
    let resultSubTitle = errorMessage || '';
    let extraButtons = [];
    let alertComponent = null;

    // ตรวจสอบ CS05 ก่อน
    if (!hasCS05Access) {
      resultStatus = 'warning';
      resultTitle = 'ไม่พบข้อมูลคำร้อง คพ.05';
      resultSubTitle = 'คุณจำเป็นต้องส่งคำร้อง คพ.05 ก่อนจึงจะสามารถบันทึกเวลาทำงานได้';
      extraButtons = [
        <Button key="cs05" type="primary" onClick={() => navigate('/internship-registration/flow')}>
          ไปที่หน้าส่งคำร้อง คพ.05
        </Button>,
        <Button key="home" onClick={() => navigate('/dashboard')}>
          กลับหน้าหลัก
        </Button>
      ];
    } else if (accessCS05Status === 'rejected') {
      resultStatus = 'error';
      resultTitle = 'คำร้องขอฝึกงาน(คพ.05) ไม่ได้รับการอนุมัติ';
      resultSubTitle = 'คำร้องของคุณไม่ได้รับการอนุมัติ กรุณาติดต่อเจ้าหน้าที่หรือส่งคำร้องใหม่';
      extraButtons = [
        <Button key="status" onClick={() => navigate('/internship-registration/flow')}>
          ดูสถานะคำร้อง
        </Button>,
        <Button key="resubmit" type="primary" onClick={() => navigate('/internship-registration/flow')}>
          ส่งคำร้องใหม่
        </Button>,
        <Button key="home" onClick={() => navigate('/dashboard')}>
          กลับหน้าหลัก
        </Button>
      ];
    } else if (accessCS05Status === 'pending') {
      resultStatus = 'warning';
      resultTitle = 'คำร้อง คพ.05 อยู่ระหว่างการพิจารณา';
      resultSubTitle = 'กรุณารอการอนุมัติจากเจ้าหน้าที่ภาควิชาก่อน';
      extraButtons = [
        <Button key="status" type="primary" onClick={() => navigate('/internship-registration/flow')}>
          ดูสถานะล่าสุด
        </Button>,
        <Button key="home" onClick={() => navigate('/dashboard')}>
          กลับหน้าหลัก
        </Button>
      ];
    } else if (isCS05Approved && !hasAcceptance) {
      // CS05 approved แล้ว แต่ยังไม่มี ACCEPTANCE_LETTER
      resultStatus = 'info';
      resultTitle = 'ยังไม่มีหนังสือตอบรับจากบริษัท';
      resultSubTitle = 'กรุณาอัปโหลดหนังสือตอบรับจากบริษัทก่อนจึงจะสามารถบันทึกเวลาทำงานได้';
      alertComponent = (
        <Alert
          message="ขั้นตอนต่อไป"
          description="1. พิมพ์หนังสือขอความอนุเคราะห์ไปยื่นต่อบริษัท → 2. อัปโหลดหนังสือตอบรับ → 3. รอการอนุมัติ → 4. บันทึกเวลาทำงาน"
          type="info"
          showIcon
          style={{ marginBottom: 16, textAlign: 'left' }}
        />
      );
      extraButtons = [
        <Button key="upload" type="primary" onClick={() => navigate('/internship-registration/flow')}>
          ไปอัปโหลดหนังสือตอบรับ
        </Button>,
        <Button key="home" onClick={() => navigate('/dashboard')}>
          กลับหน้าหลัก
        </Button>
      ];
    } else if (isCS05Approved && acceptanceStatus === 'pending') {
      // ACCEPTANCE_LETTER รอการอนุมัติ
      resultStatus = 'warning';
      resultTitle = 'หนังสือตอบรับอยู่ระหว่างการพิจารณา';
      resultSubTitle = 'กรุณารอการอนุมัติจากเจ้าหน้าที่ภาควิชา';
      extraButtons = [
        <Button key="status" type="primary" onClick={() => navigate('/internship-registration/flow')}>
          ดูสถานะล่าสุด
        </Button>,
        <Button key="home" onClick={() => navigate('/dashboard')}>
          กลับหน้าหลัก
        </Button>
      ];
    } else if (isCS05Approved && acceptanceStatus === 'rejected') {
      // ACCEPTANCE_LETTER ถูกปฏิเสธ
      resultStatus = 'error';
      resultTitle = 'หนังสือตอบรับไม่ได้รับการอนุมัติ';
      resultSubTitle = 'กรุณาอัปโหลดหนังสือตอบรับใหม่';
      extraButtons = [
        <Button key="upload" type="primary" onClick={() => navigate('/internship-registration/flow')}>
          อัปโหลดหนังสือใหม่
        </Button>,
        <Button key="status" onClick={() => navigate('/internship-registration/flow')}>
          ดูสถานะคำร้อง
        </Button>,
        <Button key="home" onClick={() => navigate('/dashboard')}>
          กลับหน้าหลัก
        </Button>
      ];
    } else {
      // สถานะอื่นๆ
      resultStatus = 'info';
      resultTitle = 'ไม่สามารถบันทึกเวลาทำงานได้';
      resultSubTitle = errorMessage || `ระบบต้องการให้ CS05 และหนังสือตอบรับได้รับการอนุมัติก่อน`;
      extraButtons = [
        <Button key="status" type="primary" onClick={() => navigate('/internship-registration/flow')}>
          ดูสถานะคำร้อง
        </Button>,
        <Button key="home" onClick={() => navigate('/dashboard')}>
          กลับหน้าหลัก
        </Button>
      ];
    }

    return (
      <div className={styles.internshipContainer}>
        {alertComponent}
        <Result
          status={resultStatus}
          title={resultTitle}
          subTitle={resultSubTitle}
          extra={<Space>{extraButtons}</Space>}
        />
      </div>
    );
  }

  // กรณีเกิดข้อผิดพลาดในการดึงข้อมูล
  if (loadError) {
    return (
      <div className={styles.internshipContainer}>
        <Alert
          type="error"
          message="เกิดข้อผิดพลาดในการโหลดข้อมูล"
          description={loadError}
          showIcon
          style={{ marginBottom: 16 }}
        />
        <Button type="primary" icon={<ReloadOutlined />} onClick={refreshData}>
          ลองใหม่อีกครั้ง
        </Button>
      </div>
    );
  }

  // เพิ่มการแสดง Banner เตือนว่าอยู่ในโหมดทดสอบ
  return (
    <div
      className={styles.internshipContainer}
      style={{ position: "relative", paddingBottom: "50px" }}
    >
      <Card>
        <div className={styles.alertWrapper}>
          {dateRange && (
            <Alert
              type="info"
              message={
                <Space size="middle" align="center">
                  <Text>
                    กำหนดการฝึกงาน:{" "}
                    {dayjs(dateRange.startDate).format(DATE_FORMAT_MEDIUM)} -{" "}
                    {dayjs(dateRange.endDate).format(DATE_FORMAT_MEDIUM)}
                  </Text>
                  {/* <Button
                    onClick={refreshData}
                    icon={<ReloadOutlined />}
                    loading={loading}
                  >
                    รีเฟรชข้อมูล
                  </Button> */}
                </Space>
              }
              description="รายการด้านล่างถูกสร้างขึ้นตามวันที่คุณระบุในแบบฟอร์มคำร้องขอฝึกงาน คลิกปุ่มแก้ไขเพื่อกรอกข้อมูลการฝึกงานในแต่ละวัน"
              showIcon
            />
          )}
        </div>
      </Card>

      {stats && Object.keys(stats).length > 0 ? (
        <div className={styles.statsWrapper}>
          <TimeSheetStats stats={stats} />
        </div>
      ) : (
        <Card style={{ marginBottom: 16 }}>
          <div className={styles.alertWrapper}>
            <Alert
              type="info"
              message="กำลังโหลดข้อมูลสถิติ..."
              description={`ระบบกำลังพยายามดึงข้อมูลสถิติการฝึกงาน (hasCS05: ${hasCS05}, status: ${cs05Status})`}
              showIcon
            />
            <div style={{ textAlign: "center", marginTop: 10 }}>
              <Button onClick={refreshData} icon={<ReloadOutlined />}>
                โหลดข้อมูลใหม่
              </Button>
            </div>
          </div>
        </Card>
      )}

      <div className={styles.tableCardWrapper}>
        {!initialLoading && internshipDates && internshipDates.length > 0 ? (
          <TimeSheetTable
            data={internshipDates}
            loading={loading}
            onEdit={handleEdit}
            onView={handleView}
          />
        ) : loading || initialLoading ? (
          <Card>
            <Skeleton active paragraph={{ rows: 6 }} />
          </Card>
        ) : (
          <Card>
            <div className={styles.alertWrapper}>
              <Alert
                type="info"
                message="ไม่พบข้อมูลวันฝึกงาน"
                description="กรุณาตรวจสอบข้อมูลคำร้อง คพ.05 ว่าได้ระบุวันที่ฝึกงานถูกต้องหรือไม่"
                showIcon
                style={{ marginBottom: 16 }}
              />
              <div
                style={{
                  padding: "16px",
                  background: "#f5f5f5",
                  margin: "16px 0",
                }}
              >
                <strong>ข้อมูล Debugging:</strong>
                <p>
                  dateRange:{" "}
                  {dateRange ? JSON.stringify(dateRange) : "ไม่พบข้อมูล"}
                </p>
                <p>cs05Status: {cs05Status || "ไม่พบข้อมูล"}</p>
                <p>hasCS05: {hasCS05 ? "true" : "false"}</p>
                <p>
                  internshipDates: {internshipDates ? internshipDates.length : 0}{" "}
                  รายการ
                </p>
              </div>
            </div>
          </Card>
        )}
      </div>

      <EditModal
        visible={isModalVisible}
        loading={loading}
        entry={selectedEntry}
        form={form}
        onOk={handleSave}
        onCancel={handleClose}
      />

      <ViewModal
        visible={isViewModalVisible}
        entry={selectedEntry}
        onClose={handleClose}
      />

      {/* เพิ่ม FloatButton สำหรับแสดงคำแนะนำ */}
      <FloatButton
        icon={<QuestionCircleOutlined />}
        tooltip="คำแนะนำการใช้งาน"
        onClick={handleShowInstructions}
        type="primary"
        style={{
          position: "fixed",
          bottom: 32,
          right: 48,
          width: 56,
          height: 56,
          zIndex: 1000,
          boxShadow: "0 6px 16px rgba(24, 144, 255, 0.3)",
          background: "linear-gradient(135deg, #1890ff 0%, #096dd9 100%)",
          border: "none",
        }}
      />

      <InstructionModal
        visible={isInstructionVisible}
        onClose={handleInstructionClose}
        dontShowAgain={dontShowAgain}
        onCheckboxChange={onCheckboxChange}
      />
    </div>
  );
};

export default TimeSheet;
