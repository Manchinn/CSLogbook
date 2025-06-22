import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  Tabs,
  Row,
  Col,
  Space,
  Button,
  Alert,
  Typography,
  Badge,
  Tag,
  Progress,
  Empty,
  Result,
  message,
  Spin,
} from "antd";
import {
  BankOutlined,
  CalendarOutlined,
  RiseOutlined,
  BarChartOutlined,
  FileTextOutlined,
  AuditOutlined,
  ProfileOutlined,
  FilePdfOutlined,
  PrinterOutlined,
  MailOutlined,
  UserOutlined,
  TeamOutlined,
  PhoneOutlined,
  SendOutlined,
  EyeOutlined, // 🆕 เพิ่ม icon สำหรับ Preview
} from "@ant-design/icons";
import dayjs from "dayjs";

// Import styles
import "./styles/variables.css";
import "./styles/index.css";
import "./styles/Summary.css";

// นำเข้า services
import internshipService from "../../../services/internshipService";

// นำเข้า custom hooks
import { useSummaryData } from "./hooks/useSummaryData";
import { useReflectionForm } from "./hooks/useFormActions";

// นำเข้า component ย่อย
import {
  WeeklyOverview,
  StatsOverview,
} from "./components/OverviewComponents";
import LogbookTable from "./components/LogbookTable";
import AchievementPanel from "./components/AchievementPanel";
import SkillsPanel from "./components/SkillsPanel";

// เพิ่ม import EvaluationRequestButton
import EvaluationRequestButton from "../../EvaluationRequestButton";

// นำเข้า utility functions
import { calculateCompletionStatus } from "./utils/skillUtils";
import { formatDateRange } from "./utils/dateUtils";
import { 
  handlePreviewInternshipLogbook, 
  handleDownloadInternshipLogbook,
  validateDataForPDF 
} from "./helpers/summaryPdfHelper";

// ค่าคงที่
const { Title, Text } = Typography;
const DATE_FORMAT_MEDIUM = "D MMM YYYY";

/**
 * หน้าสรุปการฝึกงาน
 */
const InternshipSummary = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("1");
  const [editingReflection, setEditingReflection] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false); // 🆕 เพิ่ม state สำหรับ preview loading
  const [downloadLoading, setDownloadLoading] = useState(false); // 🆕 เพิ่ม state สำหรับ download loading

  // ใช้ custom hooks
  const {
    loading,
    summaryData,
    logEntries,
    error,
    hasCS05,
    isCS05Approved,
    totalApprovedHours,
    weeklyData,
    skillCategories,
    skillTags,
    reflection,
    evaluationFormSent,
    evaluationSentDate,
    setReflection,
    fetchSummaryData: refreshData,
  } = useSummaryData();

  const { saveReflection } = useReflectionForm(() => {
    setEditingReflection(false);
    refreshData();
  });

  // สถานะความคืบหน้า
  const completionStatus = calculateCompletionStatus(totalApprovedHours);

  // การเปลี่ยนแท็บ
  const handleTabChange = (key) => {
    setActiveTab(key);
  };

  // บันทึกบทสรุปการฝึกงาน
  const handleReflectionSave = async (data) => {
    const saved = await saveReflection(data);
    if (saved) {
      setReflection(data);
      setEditingReflection(false);
    }
  };

  // สลับสถานะการแก้ไขบทสรุป
  const toggleEditReflection = () => {
    setEditingReflection(!editingReflection);
  };

  // ตรวจสอบว่ามีข้อมูลเพียงพอสำหรับสร้าง PDF หรือไม่
  const hasMinimumData = validateDataForPDF(summaryData, logEntries);

  // แสดงตัวอย่าง PDF บันทึกฝึกงาน
  const handlePreviewSummary = async () => {
    await handlePreviewInternshipLogbook(
      summaryData,
      logEntries,
      reflection,
      totalApprovedHours,
      setPreviewLoading
    );
  };

  // ดาวน์โหลดเอกสารสรุป
  const handleDownloadSummary = async () => {
    await handleDownloadInternshipLogbook(
      summaryData,
      logEntries,
      reflection,
      totalApprovedHours,
      setDownloadLoading
    );
  };

  // พิมพ์เอกสาร
  const handlePrint = () => {
    window.print();
  };

  // แสดงหน้า loading
  if (loading) {
    return (
      <div className="loading-container">
        <Spin size="large" tip="กำลังโหลดข้อมูล..." />
      </div>
    );
  }

  // แสดงกรณีไม่มีข้อมูล CS05
  if (!hasCS05) {
    return (
      <div className="no-data-container">
        <Result
          status="info"
          title="ยังไม่มีข้อมูลการฝึกงาน"
          subTitle="กรุณาลงทะเบียนการฝึกงานโดยกรอกแบบฟอร์ม คพ.05 ก่อน"
          extra={
            <Button type="primary" onClick={() => navigate("/internship/cs05")}>
              ไปยังแบบฟอร์ม คพ.05
            </Button>
          }
        />
      </div>
    );
  }

  // แสดงกรณี CS05 ยังไม่ได้รับการอนุมัติ
  if (!isCS05Approved && summaryData?.status !== 'supervisor_evaluated') {
    return (
      <div className="no-data-container">
        <Result
          status="warning"
          title="แบบฟอร์ม คพ.05 อยู่ระหว่างการพิจารณา"
          subTitle="กรุณารอการอนุมัติจากอาจารย์ที่ปรึกษาเพื่อเริ่มบันทึกการฝึกงาน"
          extra={
            <Button type="primary" onClick={() => navigate("/internship/cs05")}>
              ดูสถานะล่าสุด
            </Button>
          }
        />
      </div>
    );
  }

  // แสดงกรณีเกิดข้อผิดพลาด
  if (error) {
    return (
      <div className="error-container">
        <Result
          status="error"
          title="เกิดข้อผิดพลาดในการโหลดข้อมูล"
          subTitle={error}
          extra={
            <Button type="primary" onClick={refreshData}>
              ลองอีกครั้ง
            </Button>
          }
        />
      </div>
    );
  }

  const tabItems = [
    {
      key: "1",
      label: (
        <span>
          <BarChartOutlined />
          ภาพรวม
        </span>
      ),
      children: (
        <>
          {/* ส่วนสถิติ */}
          <StatsOverview
            logEntries={logEntries}
            totalApprovedHours={totalApprovedHours}
          />
          {/* ส่วนข้อมูลรายสัปดาห์ */}
          <WeeklyOverview weeklyData={weeklyData} />
        </>
      ),
    },
    {
      key: "2",
      label: (
        <span>
          <FileTextOutlined />
          บันทึกประจำวัน
        </span>
      ),
      children: (
        <LogbookTable
          logEntries={logEntries}
          totalApprovedHours={totalApprovedHours}
        />
      ),
    },
    {
      key: "3",
      label: (
        <span>
          <RiseOutlined />
          ทักษะและการพัฒนา
        </span>
      ),
      children: (
        <SkillsPanel
          reflection={reflection}
          editingReflection={editingReflection}
          toggleEditReflection={toggleEditReflection}
          handleReflectionSave={handleReflectionSave}
          skillCategories={skillCategories}
          skillTags={skillTags}
          summaryData={summaryData}
        />
      ),
    },
    {
      key: "4",
      label: (
        <span>
          <AuditOutlined />
          ความสำเร็จ
        </span>
      ),
      children: (
        <AchievementPanel
          completionStatus={completionStatus}
          totalApprovedHours={totalApprovedHours}
          logEntries={logEntries}
          weeklyData={weeklyData}
          summaryData={summaryData}
        />
      ),
    },
    {
      key: "5",
      label: (
        <span>
          <ProfileOutlined />
          {summaryData?.status === 'supervisor_evaluated' 
            ? "ได้รับการประเมินแล้ว" 
            : "การประเมินจากพี่เลี้ยง"}
        </span>
      ),
      children: (
        <Card variant="borderless" className="evaluation-card">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 16,
            }}
          >
            <Title level={4}>การประเมินผลการฝึกงานโดยพี่เลี้ยง</Title>
          </div>

          {/* ใช้ EvaluationRequestButton component แทน logic เดิม */}
          <EvaluationRequestButton 
            documentId={summaryData?.documentId}
            onEvaluationSent={() => {
              // รีเฟรชข้อมูลหลังจากส่งสำเร็จ
              refreshData();
            }}
          />

          {/* แสดงข้อมูลพี่เลี้ยงเมื่อมีการประเมินแล้วหรือยังไม่ได้ส่งแบบประเมิน */}
          {(summaryData?.status === 'supervisor_evaluated' || !evaluationFormSent) && (
            <Card
              title="ข้อมูลพี่เลี้ยง"
              type="inner"
              style={{ marginTop: 24 }}
            >
              <Row gutter={[16, 16]}>
                <Col xs={24} md={12}>
                  <div className="info-item">
                    <div className="info-label">
                      <UserOutlined /> ชื่อ-นามสกุล:
                    </div>
                    <div className="info-value">
                      {summaryData?.supervisorName || "-"}
                    </div>
                  </div>
                  <div className="info-item">
                    <div className="info-label">
                      <TeamOutlined /> ตำแหน่ง:
                    </div>
                    <div className="info-value">
                      {summaryData?.supervisorPosition || "-"}
                    </div>
                  </div>
                </Col>
                <Col xs={24} md={12}>
                  <div className="info-item">
                    <div className="info-label">
                      <MailOutlined /> อีเมล:
                    </div>
                    <div className="info-value">
                      {summaryData?.supervisorEmail || "-"}
                    </div>
                  </div>
                  <div className="info-item">
                    <div className="info-label">
                      <PhoneOutlined /> เบอร์โทรศัพท์:
                    </div>
                    <div className="info-value">
                      {summaryData?.supervisorPhone || "-"}
                    </div>
                  </div>
                </Col>
              </Row>
            </Card>
          )}
        </Card>
      ),
    },
  ];

  return (
    <div className="internship-summary-container internship-summary-page print-container">
      <Card className="summary-header-card" variant="borderless">
        <Row gutter={[24, 24]} align="middle">
          <Col xs={24} lg={16}>
            <div className="summary-header">
              <div className="company-logo-placeholder">
                <BankOutlined style={{ fontSize: 36 }} />
              </div>
              <div className="summary-title">
                <Title level={2} style={{ marginBottom: 8 }}>
                  สรุปผลการฝึกงาน
                </Title>
                <Title
                  level={4}
                  style={{
                    marginTop: 0,
                    marginBottom: 16,
                    fontWeight: "normal",
                  }}
                  type="secondary"
                >
                  {summaryData?.companyName || "-"}
                </Title>

                <Space size="large" wrap style={{ marginBottom: 16 }}>
                  <Badge
                    status={
                      totalApprovedHours >= 240 ? "success" : "processing"
                    }
                    text={
                      <Text style={{ fontSize: 16 }}>
                        {totalApprovedHours >= 240
                          ? "ครบตามเกณฑ์ที่กำหนด"
                          : "อยู่ระหว่างการฝึกงาน"}
                      </Text>
                    }
                  />

                  <Text>
                    <CalendarOutlined /> ระยะเวลา:{" "}
                    {summaryData?.startDate && summaryData?.endDate
                      ? formatDateRange(
                          summaryData.startDate,
                          summaryData.endDate,
                          DATE_FORMAT_MEDIUM
                        )
                      : "-"}
                  </Text>
                </Space>
              </div>
            </div>
          </Col>

          <Col xs={24} lg={8}>
            <div className="progress-container">
              <Progress
                type="dashboard"
                percent={completionStatus.percentage}
                status={completionStatus.status}
                format={() => (
                  <div className="dashboard-inner">
                    <div className="dashboard-title">ความคืบหน้า</div>
                    <div className="dashboard-value">
                      {totalApprovedHours}
                      <span className="dashboard-unit">ชม.</span>
                    </div>
                    <div className="dashboard-subtitle">จาก 240 ชั่วโมง</div>
                  </div>
                )}
                size={180}
              />
            </div>
          </Col>
        </Row>

        {/* 🆕 เพิ่ม Alert แสดงสถานะการสร้าง PDF */}
        {!hasMinimumData && (
          <Alert
            message="ข้อมูลไม่เพียงพอสำหรับสร้างเอกสาร PDF"
            description="กรุณาเพิ่มบันทึกการฝึกงานอย่างน้อย 1 รายการ เพื่อให้สามารถสร้างเอกสารสรุปได้"
            type="warning"
            showIcon
            style={{ marginTop: 16 }}
          />
        )}
      </Card>

      <div className="summary-tabs" style={{ marginTop: 24 }}>
        <Tabs
          activeKey={activeTab}
          onChange={handleTabChange}
          type="card"
          size="large"
          tabBarStyle={{ marginBottom: 24 }}
          tabBarGutter={12}
          items={tabItems}
        />
      </div>

      {/* 🆕 ปรับปรุงส่วน Actions - เพิ่มปุ่ม Preview */}
      <div className="summary-actions no-print">
        <Space size="middle">
          {/* ปุ่ม Preview - วางไว้ก่อนปุ่ม Download */}
          <Button
            type="default"
            icon={<EyeOutlined />}
            onClick={handlePreviewSummary}
            loading={previewLoading}
            disabled={!hasMinimumData}
            size="middle"
          >
            {previewLoading ? "กำลังเตรียม..." : "แสดงตัวอย่าง"}
          </Button>

          {/* ปุ่ม Download */}
          <Button
            type="primary"
            icon={<FilePdfOutlined />}
            onClick={handleDownloadSummary}
            disabled={!hasMinimumData}
            size="middle"
          >
            ดาวน์โหลดสรุปการฝึกงาน
          </Button>

          {/* ปุ่ม Print */}
          <Button
            icon={<PrinterOutlined />}
            onClick={handlePrint}
            disabled={!hasMinimumData}
            size="middle"
          >
            พิมพ์เอกสาร
          </Button>
        </Space>

        {/* ข้อความแนะนำเมื่อข้อมูลไม่เพียงพอ */}
        {!hasMinimumData && (
          <div style={{ marginTop: 12, fontSize: "14px", color: "#8c8c8c" }}>
            <Text type="secondary">
              💡 เพิ่มบันทึกการฝึกงานเพิ่มเติมเพื่อให้สามารถสร้างเอกสาร PDF ได้
            </Text>
          </div>
        )}
      </div>
    </div>
  );
};

export default InternshipSummary;
