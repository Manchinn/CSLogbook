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
import dayjs from "../../../../utils/dayjs";
import { DATE_FORMAT_MEDIUM } from "../../../../utils/constants";
import "./styles.css";

const { Text } = Typography;

const TimeSheet = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const [isInstructionVisible, setIsInstructionVisible] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);

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
        navigate("/internship-registration/cs05");
      }, 3000);

      // ล้าง timer เมื่อ component unmount
      return () => clearTimeout(redirectTimer);
    }

    // เพิ่มบรรทัดนี้
    if (!initialLoading && hasCS05) {
      // รีเฟรชข้อมูลจากฐานข้อมูลทันทีเมื่อโหลดหน้าเสร็จ
      setTimeout(() => refreshTable(), 500);
    }
  }, [initialLoading, hasCS05, navigate, refreshTable]); // เพิ่ม refreshTable ที่นี่

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
      <div className="internship-container">
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
      <div className="internship-container">
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
              onClick={() => navigate("/internship-registration/cs05")}
            >
              ไปที่หน้าส่งคำร้อง คพ.05 ทันที
            </Button>,
          ]}
        />
      </div>
    );
  }

  // กรณีเกิดข้อผิดพลาดในการดึงข้อมูล
  if (loadError) {
    return (
      <div className="internship-container">
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
      className="internship-container timesheet-container"
      style={{ position: "relative", paddingBottom: "50px" }}
    >
      {" "}
      <Card className="timesheet-card">
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
                <Button
                  onClick={refreshData}
                  icon={<ReloadOutlined />}
                  loading={loading}
                >
                  รีเฟรชข้อมูล
                </Button>
              </Space>
            }
            description="รายการด้านล่างถูกสร้างขึ้นตามวันที่คุณระบุในแบบฟอร์ม คพ.05 คลิกปุ่มแก้ไขเพื่อกรอกข้อมูลการฝึกงานในแต่ละวัน"
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}
      </Card>
      {stats && Object.keys(stats).length > 0 ? (
        <>
          <TimeSheetStats stats={stats} />
        </>
      ) : (
        <Card
          className="timesheet-card timesheet-summary"
          style={{ marginBottom: 16 }}
        >
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
        </Card>
      )}{" "}
      <Card className="timesheet-card">
        {!initialLoading && internshipDates && internshipDates.length > 0 ? (
          <>
            <div className="timesheet-table-container">
              <TimeSheetTable
                data={internshipDates}
                loading={loading}
                onEdit={handleEdit}
                onView={handleView}
              />
            </div>
          </>
        ) : loading || initialLoading ? (
          <Skeleton active paragraph={{ rows: 6 }} />
        ) : (
          <div>
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
        )}

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
      </Card>
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
          border: "none"
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
