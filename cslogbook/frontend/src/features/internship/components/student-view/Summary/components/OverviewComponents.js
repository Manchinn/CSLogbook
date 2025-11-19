import React from "react";
import {
  Card,
  Row,
  Col,
  Statistic,
  List,
  Timeline,
  Tag,
  Empty,
  Space,
} from "antd";
import {
  SafetyCertificateOutlined,
  ClockCircleOutlined,
  ScheduleOutlined,
  CloseCircleOutlined,
} from "@ant-design/icons";
import dayjs from "utils/dayjs"; // ใช้ dayjs ที่มี plugin buddhistEra

// นำเข้า CSS Module
import styles from "../Summary.module.css";

/**
 * Component แสดงข้อมูลรายสัปดาห์
 * @param {Object} props
 * @param {Array} props.weeklyData ข้อมูลรายสัปดาห์
 */
const WeeklyOverview = ({ weeklyData }) => {
  if (!weeklyData || weeklyData.length === 0) {
    return (
      <Card
        title={
          <>
            <ScheduleOutlined /> ข้อมูลรายสัปดาห์
          </>
        }
        style={{ marginTop: 16 }}
        variant="borderless"
        className={styles.weeklyCard}
      >
        <Empty description="ยังไม่มีข้อมูลรายสัปดาห์" />
      </Card>
    );
  }

  // สร้าง timeline items จาก weeklyData
  const timelineItems = weeklyData.map((week, index) => {
    // ตรวจสอบว่ามีการปฏิเสธการอนุมัติหรือไม่
    const hasRejectedEntries = week.entries.some(
      (entry) => entry.status === "rejected"
    );

    // กำหนดสีโดยพิจารณาทั้งจำนวนชั่วโมงที่อนุมัติและสถานะการปฏิเสธ
    let weekStatusColor = "blue"; // สีปกติ (ไม่มีการอนุมัติ)
    if (week.approvedHours >= 40) {
      weekStatusColor = "green"; // สัปดาห์ที่ได้อนุมัติครบ 40 ชั่วโมง
    } else if (hasRejectedEntries) {
      weekStatusColor = "red"; // สัปดาห์ที่มีรายการถูกปฏิเสธ
    } else if (week.approvedHours > 0) {
      weekStatusColor = "gold"; // สัปดาห์ที่มีการอนุมัติบางส่วน
    }

    return {
      key: index,
      // Modified: If hasRejectedEntries, color is "red", otherwise use weekStatusColor.
      // weekStatusColor already handles the logic for non-rejected cases (green for >=40h, gold for >0h, blue).
      color: hasRejectedEntries ? "red" : weekStatusColor,
      dot:
      // Modified: If hasRejectedEntries, use CloseCircleOutlined (red).
      // Otherwise, use SafetyCertificateOutlined for >=40h, or ClockCircleOutlined.
      hasRejectedEntries ? (
        <CloseCircleOutlined style={{ fontSize: "16px", color: "red" }} />
      ) : week.approvedHours >= 40 ? (
        <SafetyCertificateOutlined style={{ fontSize: "16px" }} />
      ) : (
        <ClockCircleOutlined style={{ fontSize: "16px" }} />
      ),
      children: (
      <Card
        className={styles.weeklyItemCard}
        size="small"
        title={
        <div className={styles.weeklyTitle}>
          <span className={styles.weekName}>{week.week}</span>
          <span className={styles.weekDate}>{week.dateRange}</span>
        </div>
        }
        extra={
        <Space size="small">
          <Tag color="blue">{week.days} วันทำงาน</Tag>
          <Tag
          // Modified: If hasRejectedEntries, Tag color is "red".
          // Otherwise, green for >=40h, gold for >0h, or blue.
          color={
            hasRejectedEntries
            ? "red"
            : week.approvedHours >= 40
            ? "green"
            : week.approvedHours > 0
            ? "gold"
            : "blue"
          }
          >
          {week.approvedHours}/{week.totalHours} ชั่วโมง
          {hasRejectedEntries && " (มีรายการถูกปฏิเสธ)"}
          </Tag>
        </Space>
        }
      >
        <List
        size="small"
        dataSource={week.entries.slice(0, 3)}
        renderItem={(item) => (
          <List.Item>
          <div className={styles.weeklyLogItem} style={{ width: "100%" }}>
            <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: "4px",
            }}
            >
            <span className={styles.logDate}>
              {item.date || dayjs(item.workDate).format("D MMM BBBB")}
            </span>
            <Tag
              color={
              item.status === "approved"
                ? "green"
                : item.status === "rejected"
                ? "red"
                : "blue"
              }
              size="small"
            >
              {parseFloat(item.hours || item.workHours || 0)} ชม.
            </Tag>
            </div>
            <div style={{ fontWeight: "bold", color: "#1890ff" }}>
            {item.title || item.logTitle || "ไม่มีหัวข้อ"}
            </div>
            {(item.description || item.taskDesc || item.taskDetails) && (
            <div
              style={{
              fontSize: "12px",
              color: "#666",
              marginTop: "4px",
              maxHeight: "36px",
              overflow: "hidden",
              textOverflow: "ellipsis",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              }}
            >
              {item.description || item.taskDesc || item.taskDetails}
            </div>
            )}
          </div>
          </List.Item>
        )}
        />
        {week.entries.length > 3 && (
        <div
          className={styles.moreEntries}
          style={{ paddingLeft: 8, paddingTop: 4 }}
        >
          <span style={{ color: "#8c8c8c" }}>
          + อีก {week.entries.length - 3} รายการ
          </span>
        </div>
        )}{" "}
      </Card>
      ),
    };
  });

  return (
    <Card
      title={
        <>
          <ScheduleOutlined /> ข้อมูลรายสัปดาห์
        </>
      }
      style={{ marginTop: 16 }}
      variant="borderless"
      className="weekly-card"
    >
      <Timeline mode="left" items={timelineItems} />
    </Card>
  );
};

/**
 * Component แสดงรายงานสถิติ
 * @param {Object} props
 * @param {Array} props.logEntries รายการบันทึกการฝึกงาน
 * @param {number} props.totalApprovedHours จำนวนชั่วโมงที่ได้รับการอนุมัติ
 */
const StatsOverview = ({ logEntries, totalApprovedHours }) => {
  // Calculate total hours from all entries for "ชั่วโมงทำงานทั้งหมด"
  const allEntriesTotalHours = logEntries.reduce((sum, entry) => {
    // Ensure hours are treated as numbers, default to 0 if undefined or not a number
    const hours = parseFloat(entry.hours);
    return sum + (isNaN(hours) ? 0 : hours);
  }, 0);

  // Filter approved entries and calculate their count for "วันที่ได้รับการอนุมัติ"
  const approvedEntries = logEntries.filter(
    (entry) => entry.status === "approved"
  );
  const approvedDaysCount = approvedEntries.length;

  // The totalApprovedHours prop is already the sum of hours for approved entries.

  return (
    <Row gutter={[16, 16]} className={styles.statsRow}>
      <Col xs={24} sm={12} lg={6}>
        <Card className={`${styles.statCard} ${styles.statCardDays}`} variant="borderless">
          <Statistic
            title="วันทำงานทั้งหมด"
            value={logEntries.length}
            suffix="วัน"
            valueStyle={{ color: "#1890ff" }}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} lg={6}>
        <Card className={`${styles.statCard} ${styles.statCardHours}`} variant="borderless">
          <Statistic
            title="ชั่วโมงทำงานทั้งหมด"
            value={allEntriesTotalHours}
            suffix="ชม."
            precision={1}
            valueStyle={{ color: "#1890ff" }}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} lg={6}>
        <Card className={`${styles.statCard} ${styles.statCardApproved}`} variant="borderless">
          <Statistic
            title="วันที่ได้รับการอนุมัติ"
            value={approvedDaysCount}
            suffix="วัน"
            valueStyle={{ color: "#52c41a" }}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} lg={6}>
        <Card className={`${styles.statCard} ${styles.statCardPending}`} variant="borderless">
          <Statistic
            title="ชั่วโมงที่ได้รับการอนุมัติ"
            value={totalApprovedHours} // This prop should now be correctly calculated from InternshipSummary
            suffix="ชม."
            precision={1}
            valueStyle={{ color: "#52c41a" }}
          />
        </Card>
      </Col>
    </Row>
  );
};

export { WeeklyOverview, StatsOverview };
