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
import { useReflectionForm, useEvaluationForm } from "./hooks/useFormActions";

// นำเข้า component ย่อย
import {
  WeeklyOverview,
  SkillsOverview,
  StatsOverview,
} from "./components/OverviewComponents";
import LogbookTable from "./components/LogbookTable";
import AchievementPanel from "./components/AchievementPanel";
import SkillsPanel from "./components/SkillsPanel";

// นำเข้า utility functions
import { calculateCompletionStatus } from "./utils/skillUtils";
import { formatDateRange } from "./utils/dateUtils";

// ค่าคงที่
const { Title, Text } = Typography;
const { TabPane } = Tabs;
const DATE_FORMAT_MEDIUM = "D MMM YYYY";

/**
 * หน้าสรุปการฝึกงาน
 */
const InternshipSummary = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("1");
  const [editingReflection, setEditingReflection] = useState(false);

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
    fetchSummaryData,
  } = useSummaryData();

  const { saveReflection } = useReflectionForm(() => {
    setEditingReflection(false);
    fetchSummaryData();
  });

  const { sendEvaluationForm } = useEvaluationForm(() => {
    message.success("ส่งแบบประเมินให้พี่เลี้ยงเรียบร้อยแล้ว");
    fetchSummaryData();
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

  // ส่งแบบประเมินให้พี่เลี้ยง
  const handleSendEvaluationForm = async () => {
    if (!summaryData?.supervisorEmail) {
      message.error("ไม่พบอีเมลพี่เลี้ยง กรุณากรอกข้อมูลพี่เลี้ยงให้ครบถ้วน");
      return;
    }

    await sendEvaluationForm({
      supervisorEmail: summaryData.supervisorEmail,
      supervisorName: summaryData.supervisorName,
    });
  };

  // ดาวน์โหลดเอกสารสรุป
  const handleDownloadSummary = () => {
    message.info("กำลังเตรียมเอกสารสรุป...");
    internshipService
      .downloadInternshipSummary()
      .then((response) => {
        if (response.success && response.data) {
          const url = window.URL.createObjectURL(new Blob([response.data]));
          const link = document.createElement("a");
          link.href = url;
          link.setAttribute(
            "download",
            `internship_summary_${dayjs().format("YYYYMMDD")}.pdf`
          );
          document.body.appendChild(link);
          link.click();
          link.remove();
        }
      })
      .catch((err) => {
        message.error("ไม่สามารถดาวน์โหลดเอกสารสรุปได้");
      });
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
  if (!isCS05Approved) {
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
            <Button type="primary" onClick={fetchSummaryData}>
              ลองอีกครั้ง
            </Button>
          }
        />
      </div>
    );
  }
  return (
    <div className="internship-summary-container internship-summary-page print-container">
      <Card className="summary-header-card" bordered={false}>
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
      </Card>

      <div className="summary-tabs" style={{ marginTop: 24 }}>
        <Tabs
          activeKey={activeTab}
          onChange={handleTabChange}
          type="card"
          size="large"
          tabBarStyle={{ marginBottom: 24 }}
          tabBarGutter={12}
        >
          <TabPane
            tab={
              <span>
                <BarChartOutlined />
                ภาพรวม
              </span>
            }
            key="1"
          >
            {/* ส่วนสถิติ */}
            <StatsOverview
              logEntries={logEntries}
              totalApprovedHours={totalApprovedHours}
            />

            {/* ส่วนข้อมูลรายสัปดาห์ */}
            <WeeklyOverview weeklyData={weeklyData} />
          </TabPane>

          <TabPane
            tab={
              <span>
                <FileTextOutlined />
                บันทึกประจำวัน
              </span>
            }
            key="2"
          >
            <LogbookTable
              logEntries={logEntries}
              totalApprovedHours={totalApprovedHours}
            />
          </TabPane>

          <TabPane
            tab={
              <span>
                <RiseOutlined />
                ทักษะและการพัฒนา
              </span>
            }
            key="3"
          >
            <SkillsPanel
              reflection={reflection}
              editingReflection={editingReflection}
              toggleEditReflection={toggleEditReflection}
              handleReflectionSave={handleReflectionSave}
              skillCategories={skillCategories}
              skillTags={skillTags}
              summaryData={summaryData}
            />
          </TabPane>

          <TabPane
            tab={
              <span>
                <AuditOutlined />
                ความสำเร็จ
              </span>
            }
            key="4"
          >
            <AchievementPanel
              completionStatus={completionStatus}
              totalApprovedHours={totalApprovedHours}
              logEntries={logEntries}
              weeklyData={weeklyData}
              summaryData={summaryData}
            />
          </TabPane>

          <TabPane
            tab={
              <span>
                <ProfileOutlined />
                การประเมินจากพี่เลี้ยง
              </span>
            }
            key="5"
          >
            <Card bordered={false} className="evaluation-card">
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

              {evaluationFormSent ? (
                <Alert
                  message="ส่งแบบประเมินไปยังพี่เลี้ยงแล้ว"
                  description={`ส่งไปยัง ${
                    summaryData?.supervisorEmail || "อีเมลพี่เลี้ยง"
                  } เมื่อ ${
                    evaluationSentDate
                      ? dayjs(evaluationSentDate).format(DATE_FORMAT_MEDIUM)
                      : "-"
                  }`}
                  type="success"
                  showIcon
                  style={{ marginBottom: 24 }}
                />
              ) : (
                <Alert
                  message="ส่งแบบประเมินให้พี่เลี้ยงของคุณ"
                  description="เมื่อคุณใกล้จะสิ้นสุดการฝึกงาน คุณสามารถส่งแบบประเมินไปยังพี่เลี้ยงผ่านอีเมลได้ที่นี่"
                  type="info"
                  showIcon
                  style={{ marginBottom: 24 }}
                />
              )}

              <Card
                title="ข้อมูลพี่เลี้ยง"
                type="inner"
                style={{ marginBottom: 24 }}
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
              <Button
                type="primary"
                icon={<SendOutlined />}
                size="large"
                onClick={handleSendEvaluationForm}
                disabled={evaluationFormSent || !summaryData?.supervisorEmail}
              >
                {evaluationFormSent
                  ? "ส่งแบบประเมินแล้ว"
                  : "ส่งแบบประเมินให้พี่เลี้ยง"}
              </Button>
            </Card>
          </TabPane>
        </Tabs>
      </div>

      <div className="summary-actions no-print">
        <Space>
          <Button
            type="primary"
            icon={<FilePdfOutlined />}
            onClick={handleDownloadSummary}
            disabled={!summaryData || logEntries.length === 0}
          >
            ดาวน์โหลดสรุปการฝึกงาน
          </Button>
          <Button
            icon={<PrinterOutlined />}
            onClick={handlePrint}
            disabled={!summaryData || logEntries.length === 0}
          >
            พิมพ์เอกสาร
          </Button>
        </Space>
      </div>
    </div>
  );
};

export default InternshipSummary;
