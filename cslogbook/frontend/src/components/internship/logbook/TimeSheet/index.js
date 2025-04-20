import React, { useState, useEffect } from "react";
import {
  Card,
  Form,
  Typography,
  Button,
  Alert,
  Tooltip,
  Skeleton,
  Result,
  message,
  Empty
} from "antd";
import {
  QuestionCircleOutlined,
  WarningOutlined,
  ReloadOutlined
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
    loadError
  } = useTimeSheet(form);

  // เพิ่ม logging เพื่อดีบัก
  useEffect(() => {
    console.log("TimeSheet Data:", { 
      internshipDates, 
      stats, 
      hasCS05, 
      cs05Status,
      dateRange,
      initialLoading,
      "internshipDates length": internshipDates?.length || 0,
      "stats keys": stats ? Object.keys(stats) : []
    });
  }, [internshipDates, stats, hasCS05, cs05Status, dateRange, initialLoading]);

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
  }, [initialLoading, hasCS05, navigate]);

  const handleInstructionClose = () => {
    if (dontShowAgain) {
      localStorage.setItem("showTimeSheetGuide", "false");
    }
    setIsInstructionVisible(false);
  };

  const onCheckboxChange = (e) => {
    setDontShowAgain(e.target.checked);
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
          <div style={{ textAlign: 'center', marginTop: 20 }}>
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
        <Button 
          type="primary" 
          icon={<ReloadOutlined />}
          onClick={refreshData}
        >
          ลองใหม่อีกครั้ง
        </Button>
      </div>
    );
  }

  // เพิ่มการแสดง Banner เตือนว่าอยู่ในโหมดทดสอบ
  return (
    <div
      className="internship-container"
      style={{ position: "relative", paddingBottom: "50px" }}
    >
      {cs05Status === "approved" && (
        <Alert
          type="success"
          message="ระบบพร้อมใช้งานจริง"
          description="คุณสามารถบันทึกเวลาฝึกงานได้ เนื่องจากคำร้อง คพ.05 ได้รับการอนุมัติแล้ว"
          showIcon
          style={{ marginBottom: 16 }}
          banner
        />
      )}

      {dateRange && (
        <Alert
          type="info"
          message={
            <Text>
              กำหนดการฝึกงาน:{" "}
              {dayjs(dateRange.startDate).format(DATE_FORMAT_MEDIUM)} -{" "}
              {dayjs(dateRange.endDate).format(DATE_FORMAT_MEDIUM)}
            </Text>
          }
          description="รายการด้านล่างถูกสร้างขึ้นตามวันที่คุณระบุในแบบฟอร์ม คพ.05 คลิกปุ่มแก้ไขเพื่อกรอกข้อมูลการฝึกงานในแต่ละวัน"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      {stats && Object.keys(stats).length > 0 ? (
        <>
          {console.log('กำลังส่งข้อมูล stats ไปยัง TimeSheetStats:', JSON.stringify(stats))}
          <TimeSheetStats stats={stats} />
        </>
      ) : (
        <Card style={{ marginBottom: 16 }}>
          <Alert
            type="info"
            message="กำลังโหลดข้อมูลสถิติ..."
            description={`ระบบกำลังพยายามดึงข้อมูลสถิติการฝึกงาน (hasCS05: ${hasCS05}, status: ${cs05Status})`}
            showIcon
          />
          <div style={{ textAlign: 'center', marginTop: 10 }}>
            <Button 
              onClick={refreshData}
              icon={<ReloadOutlined />}
            >
              โหลดข้อมูลใหม่
            </Button>
          </div>
        </Card>
      )}

      <Card>
        {!initialLoading && internshipDates && internshipDates.length > 0 ? (
          <>
            {console.log('กำลังแสดงตาราง TimeSheetTable:', internshipDates.length, 'รายการ')}
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
            <Empty 
              description="ไม่พบข้อมูลวันฝึกงาน กรุณาตรวจสอบข้อมูลคำร้อง คพ.05 ว่าได้ระบุวันที่ฝึกงานถูกต้องหรือไม่" 
            />
            <div style={{padding: '16px', background: '#f5f5f5', margin: '16px 0'}}>
              <strong>ข้อมูล Debugging:</strong>
              <p>dateRange: {dateRange ? JSON.stringify(dateRange) : 'ไม่พบข้อมูล'}</p>
              <p>cs05Status: {cs05Status || 'ไม่พบข้อมูล'}</p>
              <p>hasCS05: {hasCS05 ? 'true' : 'false'}</p>
              <p>internshipDates: {internshipDates ? internshipDates.length : 0} รายการ</p>
              <Button type="primary" onClick={() => {
                console.log('InternshipDates:', internshipDates);
              }}>
                แสดงรายละเอียดใน Console
              </Button>
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

      <Tooltip title="คำชี้แจงการฝึกงาน">
        <Button
          type="primary"
          shape="circle"
          icon={<QuestionCircleOutlined />}
          size="large"
          onClick={() => setIsInstructionVisible(true)}
          style={{
            position: "fixed",
            bottom: "30px",
            right: "30px",
            zIndex: 1000,
            boxShadow: "0 4px 8px rgba(0,0,0,0.2)",
            width: "60px",
            height: "60px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        />
      </Tooltip>

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
