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
  Progress,
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
  MailOutlined,
  UserOutlined,
  TeamOutlined,
  PhoneOutlined,
  EyeOutlined,
} from "@ant-design/icons";

// Import CSS Module
import styles from "./Summary.module.css";

// นำเข้า custom hooks
import { useSummaryData } from "./hooks/useSummaryData";
import { useReflectionForm } from "./hooks/useFormActions";
// ✅ เพิ่ม import useAuth และ useInternshipAccess
import { useAuth } from "contexts/AuthContext";
import useInternshipAccess from "features/internship/hooks/useInternshipAccess";

// นำเข้า component ย่อย
import { WeeklyOverview, StatsOverview } from "./components/OverviewComponents";
import LogbookTable from "./components/LogbookTable";
import AchievementPanel from "./components/AchievementPanel";
import SkillsPanel from "./components/SkillsPanel";

// เพิ่ม import EvaluationRequestButton
import EvaluationRequestButton from "features/internship/components/shared/EvaluationRequest";

// นำเข้า utility functions
import { calculateCompletionStatus } from "./utils/skillUtils";
import { formatDateRange } from "./utils/dateUtils";
import {
  handlePreviewInternshipLogbook,
  handleDownloadInternshipLogbook,
  validateDataForPDF,
} from "./helpers/summaryPdfHelper";

// ค่าคงที่
const { Title, Text } = Typography;
const DATE_FORMAT_MEDIUM = "D MMM BBBB"; // เปลี่ยนเป็น BBBB สำหรับแสดงปี พ.ศ.

/**
 * หน้าสรุปการฝึกงาน
 */
const InternshipSummary = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("1");
  const [editingReflection, setEditingReflection] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [downloadLoading, setDownloadLoading] = useState(false);

  // ✅ เพิ่มการใช้ useAuth hook
  const { user } = useAuth();

  // ✅ ใช้ useInternshipAccess สำหรับตรวจสอบทั้ง CS05 และ ACCEPTANCE_LETTER
  const {
    canAccess,
    canEdit,
    cs05Status,
    acceptanceStatus,
    errorMessage,
    hasCS05: hasCS05Access,
    isCS05Approved: isCS05ApprovedAccess,
    hasAcceptance,
    loading: accessLoading
  } = useInternshipAccess();

  // ใช้ custom hooks
  const {
    loading,
    summaryData,
    logEntries,
    error,
    isCS05Approved,
    totalApprovedHours,
    weeklyData,
    skillCategories,
    skillTags,
    reflection,
    evaluationFormSent,
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

  // ✅ ปรับปรุงฟังก์ชัน prepareUserInfoForPDF ให้มี fallback หลายระดับ
  const prepareUserInfoForPDF = () => {
    // 🔄 ลำดับความสำคัญการหาข้อมูลนักศึกษา
    let userInfo = null;

    // ลำดับที่ 1: ใช้ข้อมูลจาก useAuth hook
    if (
      user &&
      (user.firstName || user.first_name || user.fullName || user.full_name)
    ) {
      userInfo = {
        firstName: user.firstName || user.first_name || "",
        lastName: user.lastName || user.last_name || "",
        fullName:
          user.fullName ||
          user.full_name ||
          `${user.firstName || user.first_name || ""} ${
            user.lastName || user.last_name || ""
          }`.trim(),
        studentId: user.studentId || user.student_id || user.username || "",
        yearLevel: user.yearLevel || user.year_level || "",
        classroom: user.classroom || user.class || "",
        phoneNumber: user.phoneNumber || user.phone || "",
        email: user.email || "",
        title: user.title || "",
      };
    }

    // ลำดับที่ 2: ใช้ข้อมูลจาก summaryData.studentData (ถ้ามี)
    if (
      !userInfo &&
      summaryData?.studentData &&
      Array.isArray(summaryData.studentData) &&
      summaryData.studentData.length > 0
    ) {
      const studentData = summaryData.studentData[0];
      userInfo = {
        firstName: studentData.firstName || "",
        lastName: studentData.lastName || "",
        fullName: studentData.fullName || "",
        studentId: studentData.studentId || "",
        yearLevel: studentData.yearLevel || "",
        classroom: studentData.classroom || "",
        phoneNumber: studentData.phoneNumber || "",
        email: studentData.email || "",
        title: studentData.title || "",
      };
    }

    // ลำดับที่ 3: ใช้ข้อมูลจาก summaryData.studentInfo (fallback เก่า)
    if (!userInfo && summaryData?.studentInfo) {
      const info = summaryData.studentInfo;
      userInfo = {
        firstName: info.firstName || info.first_name || "",
        lastName: info.lastName || info.last_name || "",
        fullName: info.fullName || info.full_name || "",
        studentId: info.studentId || info.student_id || "",
        yearLevel: info.yearLevel || info.year_level || "",
        classroom: info.classroom || info.class || "",
        phoneNumber: info.phoneNumber || info.phone || "",
        email: info.email || "",
        title: info.title || "",
      };
    }

    // ลำดับที่ 4: สร้างข้อมูลพื้นฐานจาก localStorage หรือ default
    if (!userInfo) {
      //console.warn('⚠️ No user data available, trying localStorage fallback');

      // ลองดึงจาก localStorage
      const cachedUser = localStorage.getItem("user");
      if (cachedUser) {
        try {
          const parsedUser = JSON.parse(cachedUser);
          userInfo = {
            firstName: parsedUser.firstName || parsedUser.first_name || "",
            lastName: parsedUser.lastName || parsedUser.last_name || "",
            fullName: parsedUser.fullName || parsedUser.full_name || "นักศึกษา",
            studentId:
              parsedUser.studentId ||
              parsedUser.student_id ||
              parsedUser.username ||
              "ไม่ระบุ",
            yearLevel: parsedUser.yearLevel || parsedUser.year_level || "",
            classroom: parsedUser.classroom || parsedUser.class || "",
            phoneNumber: parsedUser.phoneNumber || parsedUser.phone || "",
            email: parsedUser.email || "",
            title: parsedUser.title || "",
          };
        } catch (error) {
          //console.error('Error parsing cached user data:', error);
        }
      }
    }

    // ลำดับสุดท้าย: ใช้ข้อมูล default
    if (!userInfo) {
      console.warn("⚠️ Creating default user info for PDF generation");
      userInfo = {
        firstName: "",
        lastName: "",
        fullName: "นักศึกษา",
        studentId: "ไม่ระบุ",
        yearLevel: "",
        classroom: "",
        phoneNumber: "",
        email: "",
        title: "",
      };
    }

    //console.log('🔍 Prepared user info for PDF:', userInfo);
    return userInfo;
  };

  // ตรวจสอบว่ามีข้อมูลเพียงพอสำหรับสร้าง PDF หรือไม่
  const hasMinimumData = validateDataForPDF(summaryData, logEntries);

  // ✅ ตรวจสอบเงื่อนไขการสร้าง PDF
  const canGeneratePDF = () => {
    return isCS05Approved && totalApprovedHours >= 240 && hasMinimumData;
  };

  // ✅ สร้างข้อความ tooltip
  const getPDFTooltip = () => {
    if (!isCS05Approved) {
      return "รอการอนุมัติแบบฟอร์ม คพ.05";
    }

    if (totalApprovedHours < 240) {
      return `บันทึกการฝึกงานยังไม่ครบ 240 ชั่วโมง (ปัจจุบัน: ${totalApprovedHours} ชั่วโมง)`;
    }

    if (!hasMinimumData) {
      return "ข้อมูลไม่เพียงพอสำหรับสร้างเอกสาร PDF";
    }

    return "";
  };

  // ปรับปรุงฟังก์ชัน handlePreviewSummary
  const handlePreviewSummary = async () => {
    if (!canGeneratePDF()) {
      message.warning(getPDFTooltip());
      return;
    }

    const userInfo = prepareUserInfoForPDF();
    await handlePreviewInternshipLogbook(
      summaryData,
      logEntries,
      reflection,
      totalApprovedHours,
      setPreviewLoading,
      userInfo
    );
  };

  // ปรับปรุงฟังก์ชัน handleDownloadSummary
  const handleDownloadSummary = async () => {
    if (!canGeneratePDF()) {
      message.warning(getPDFTooltip());
      return;
    }

    const userInfo = prepareUserInfoForPDF();
    await handleDownloadInternshipLogbook(
      summaryData,
      logEntries,
      reflection,
      totalApprovedHours,
      setDownloadLoading,
      userInfo
    );
  };

  // แสดงหน้า loading
  if (loading || accessLoading) {
    return (
      <div className="loading-container">
        <Spin size="large" spinning={true} tip="กำลังโหลดข้อมูล...">
        <div style={{ minHeight: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div>{/* Loading content */}</div>
        </div>
      </Spin>
      </div>
    );
  }

  // ✅ ตรวจสอบเงื่อนไขการเข้าถึงด้วย useInternshipAccess (ทั้ง CS05 และ ACCEPTANCE_LETTER)
  if (!canAccess) {
    // กำหนด message และ status ตามสถานะ
    let resultStatus = 'info';
    let resultTitle = 'ไม่สามารถเข้าถึงสรุปผลการฝึกงานได้';
    let resultSubTitle = errorMessage || '';
    let extraButtons = [];

    // ตรวจสอบ CS05 ก่อน
    if (!hasCS05Access) {
      resultStatus = 'warning';
      resultTitle = 'ไม่พบข้อมูลคำร้อง คพ.05';
      resultSubTitle = 'คุณจำเป็นต้องส่งคำร้อง คพ.05 ก่อนจึงจะสามารถดูสรุปผลการฝึกงานได้';
      extraButtons = [
        <Button key="cs05" type="primary" onClick={() => navigate('/internship-registration/flow')}>
          ไปที่หน้าส่งคำร้อง คพ.05
        </Button>,
        <Button key="home" onClick={() => navigate('/dashboard')}>
          กลับหน้าหลัก
        </Button>
      ];
    } else if (cs05Status === 'cancelled') {
      // ✅ การฝึกงานถูกยกเลิก - อนุญาตให้ดูข้อมูลได้ แต่ไม่สามารถแก้ไขได้
      resultStatus = 'warning';
      resultTitle = 'การฝึกงานนี้ถูกยกเลิกแล้ว';
      resultSubTitle = 'คุณสามารถดูข้อมูลสรุปผลการฝึกงานที่ถูกยกเลิกได้ แต่ไม่สามารถแก้ไขหรือดำเนินการต่อได้';
      extraButtons = [
        <Button key="home" type="primary" onClick={() => navigate('/dashboard')}>
          กลับหน้าหลัก
        </Button>,
        <Button key="new" onClick={() => navigate('/internship-registration/flow')}>
          ยื่นคำร้องใหม่
        </Button>
      ];
    } else if (cs05Status === 'rejected') {
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
    } else if (cs05Status === 'pending') {
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
    } else if (isCS05ApprovedAccess && !hasAcceptance) {
      // CS05 approved แล้ว แต่ยังไม่มี ACCEPTANCE_LETTER
      resultStatus = 'info';
      resultTitle = 'ยังไม่มีหนังสือตอบรับจากบริษัท';
      resultSubTitle = 'กรุณาอัปโหลดหนังสือตอบรับจากบริษัทก่อนจึงจะสามารถดูสรุปผลการฝึกงานได้';
      extraButtons = [
        <Button key="upload" type="primary" onClick={() => navigate('/internship-registration/flow')}>
          ไปอัปโหลดหนังสือตอบรับ
        </Button>,
        <Button key="home" onClick={() => navigate('/dashboard')}>
          กลับหน้าหลัก
        </Button>
      ];
    } else if (isCS05ApprovedAccess && acceptanceStatus === 'pending') {
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
    } else if (isCS05ApprovedAccess && acceptanceStatus === 'rejected') {
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
      resultTitle = 'ไม่สามารถเข้าถึงสรุปผลการฝึกงานได้';
      resultSubTitle = errorMessage || `ระบบต้องการให้คำร้องขอฝึกงาน (คพ.05)และหนังสือตอบรับได้รับการอนุมัติก่อน`;
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
      <div className="no-data-container">
        <Result
          status={resultStatus}
          title={resultTitle}
          subTitle={resultSubTitle}
          extra={<Space>{extraButtons}</Space>}
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
          canEdit={canEdit} // ✅ ส่ง canEdit เพื่อปิดการใช้งานปุ่มแก้ไขเมื่อ cancelled
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
          {summaryData?.status === "supervisor_evaluated"
            ? "ได้รับการประเมินแล้ว"
            : "การประเมินจากผู้ควบคุมงาน"}
        </span>
      ),
      children: (
        <Card variant="borderless" className={styles.evaluationCard}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 16,
            }}
          >
            <Title level={4}>การประเมินผลการฝึกงาน</Title>
          </div>

          {/* ✅ ส่ง totalApprovedHours ไปด้วย */}
          <EvaluationRequestButton
            documentId={summaryData?.documentId}
            totalApprovedHours={totalApprovedHours} // ✅ เพิ่ม prop นี้
            onEvaluationSent={() => {
              // รีเฟรชข้อมูลหลังจากส่งสำเร็จ
              refreshData();
            }}
          />

          {/* แสดงข้อมูลผู้ควบคุมงานเมื่อมีการประเมินแล้วหรือยังไม่ได้ส่งแบบประเมิน */}
          {(summaryData?.status === "supervisor_evaluated" ||
            !evaluationFormSent) && (
            <Card
              title="ข้อมูลผู้ควบคุมงาน"
              type="inner"
              style={{ marginTop: 24 }}
            >
              <Row gutter={[16, 16]}>
                <Col xs={24} md={12}>
                  <div className={styles.infoItem}>
                    <div className={styles.infoLabel}>
                      <UserOutlined /> ชื่อ-นามสกุล:
                    </div>
                    <div className={styles.infoValue}>
                      {summaryData?.supervisorName || "-"}
                    </div>
                  </div>
                  <div className={styles.infoItem}>
                    <div className={styles.infoLabel}>
                      <TeamOutlined /> ตำแหน่ง:
                    </div>
                    <div className={styles.infoValue}>
                      {summaryData?.supervisorPosition || "-"}
                    </div>
                  </div>
                </Col>
                <Col xs={24} md={12}>
                  <div className={styles.infoItem}>
                    <div className={styles.infoLabel}>
                      <MailOutlined /> อีเมล:
                    </div>
                    <div className={styles.infoValue}>
                      {summaryData?.supervisorEmail || "-"}
                    </div>
                  </div>
                  <div className={styles.infoItem}>
                    <div className={styles.infoLabel}>
                      <PhoneOutlined /> เบอร์โทรศัพท์:
                    </div>
                    <div className={styles.infoValue}>
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
    <div className={`${styles.internshipSummaryContainer} print-container`}>
      {/* ✅ แสดง Alert เมื่อการฝึกงานถูกยกเลิก */}
      {cs05Status === 'cancelled' && (
        <Alert
          message="การฝึกงานนี้ถูกยกเลิกแล้ว"
          description="คุณสามารถดูข้อมูลสรุปผลการฝึกงานที่ถูกยกเลิกได้ แต่ไม่สามารถแก้ไขหรือดำเนินการต่อได้ หากต้องการยื่นคำร้องใหม่ กรุณาไปที่หน้าส่งคำร้อง คพ.05"
          type="warning"
          showIcon
          closable
          style={{ marginBottom: 16 }}
          action={
            <Button size="small" onClick={() => navigate('/internship-registration/flow')}>
              ยื่นคำร้องใหม่
            </Button>
          }
        />
      )}
      
      <Card className={styles.summaryHeaderCard} variant="borderless">
        <Row gutter={[24, 24]} align="middle">
          <Col xs={24} lg={16}>
            <div className={styles.summaryHeader}>
              <div className={styles.companyLogoPlaceholder}>
                <BankOutlined style={{ fontSize: 36 }} />
              </div>
              <div className={styles.summaryTitle}>
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

                {/* ✅ เพิ่มการแสดงข้อมูลนักศึกษาเพื่อ debug */}
                {user && (
                  <div
                    style={{ fontSize: "14px", color: "#666", marginTop: 8 }}
                  >
                    <Text type="secondary">
                      นักศึกษา: {user.firstName || user.first_name}{" "}
                      {user.lastName || user.last_name}(
                      {user.studentId || user.student_id || user.username})
                    </Text>
                  </div>
                )}
              </div>
            </div>
          </Col>

          <Col xs={24} lg={8}>
            <div className={styles.progressContainer}>
              <Progress
                type="dashboard"
                percent={completionStatus.percentage}
                status={completionStatus.status}
                format={() => (
                  <div className={styles.dashboardInner}>
                    <div className={styles.dashboardTitle}>ความคืบหน้า</div>
                    <div className={styles.dashboardValue}>
                      {totalApprovedHours}
                      <span className={styles.dashboardUnit}>ชม.</span>
                    </div>
                    <div className={styles.dashboardSubtitle}>จาก 240 ชั่วโมง</div>
                  </div>
                )}
                size={180}
              />
            </div>
          </Col>
        </Row>

        {/* เพิ่ม Alert แสดงสถานะการสร้าง PDF */}
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

      <div className={styles.summaryTabs} style={{ marginTop: 24 }}>
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

      {/* ปรับปรุงส่วน Actions */}
      <div className={`${styles.summaryActions} no-print`}>
        <Space size="middle">
          {/* ปุ่ม Preview */}
          <Button
            type="default"
            icon={<EyeOutlined />}
            onClick={handlePreviewSummary}
            loading={previewLoading}
            disabled={!canGeneratePDF()}
            size="middle"
            title={!canGeneratePDF() ? getPDFTooltip() : "แสดงตัวอย่างเอกสาร PDF"}
          >
            {previewLoading ? "กำลังเตรียม..." : "แสดงตัวอย่าง"}
          </Button>

          {/* ปุ่ม Download */}
          <Button
            type="primary"
            icon={<FilePdfOutlined />}
            onClick={handleDownloadSummary}
            loading={downloadLoading}
            disabled={!canGeneratePDF()}
            size="middle"
            title={!canGeneratePDF() ? getPDFTooltip() : "ดาวน์โหลดเอกสาร PDF"}
          >
            {downloadLoading ? "กำลังสร้าง..." : "ดาวน์โหลดสรุปการฝึกงาน"}
          </Button>
        </Space>
      </div>
    </div>
  );
};

export default InternshipSummary;
