import React, { useState, useEffect } from "react";
import {
  Table,
  Modal,
  Form,
  TimePicker,
  Input,
  Button,
  Typography,
  message,
  Card,
  Badge,
  Space,
  Row,
  Col,
  Statistic,
  InputNumber,
} from "antd";
import {
  EditOutlined,
  EyeOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";
import { useInternship } from "../../../contexts/InternshipContext";
import "./InternshipStyles.css";
import dayjs from "dayjs";
import InternshipSteps from "../shared/InternshipSteps";
const { Title } = Typography;

const TimeSheet = () => {
  const [form] = Form.useForm();
  const { state, addLogbookEntry, updateLogbookEntry } = useInternship();
  const [loading, setLoading] = useState(false); // +
  const [isModalVisible, setIsModalVisible] = useState(false); // +
  const [isViewModalVisible, setIsViewModalVisible] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [internshipDates, setInternshipDates] = useState([]);

  // แก้ไขคอลัมน์ให้ตรงกับ Model
  const columns = [
    {
      title: "วันที่",
      dataIndex: "workDate",
      key: "workDate",
      render: (date) => dayjs(date).format("DD/MM/YYYY"),
    },
    {
      title: "หัวข้องาน",
      dataIndex: "logTitle",
      key: "logTitle",
    },
    {
      title: "จำนวนชั่วโมง",
      dataIndex: "workHours",
      key: "workHours",
    },
    {
      title: "สถานะ",
      key: "status",
      render: (_, record) => {
        const status = getEntryStatus(record);
        return renderStatusBadge(status);
      },
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => showViewModal(record)}
          />
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => showEditModal(record)}
          />
        </Space>
      ),
    },
  ];

  // สร้างข้อมูลทดสอบ
  useEffect(() => {
    const testDates = [
      dayjs().format("YYYY-MM-DD"),
      dayjs().add(1, "day").format("YYYY-MM-DD"),
      dayjs().add(2, "day").format("YYYY-MM-DD"),
      dayjs().add(3, "day").format("YYYY-MM-DD"),
      dayjs().add(4, "day").format("YYYY-MM-DD"),
    ];

    const testEntries = testDates.map((date, index) => ({
      key: index,
      date: date,
      timeIn: index < 3 ? "09:00" : null,
      timeOut: index < 2 ? "17:00" : null,
      workDone: index < 3 ? `งานทดสอบวันที่ ${index + 1}` : "",
      problems: index < 3 ? "ไม่มีปัญหา" : "",
      approved: index < 1,
    }));

    setInternshipDates(testEntries);
  }, []);

  // ปรับฟังก์ชัน getEntryStatus
  const getEntryStatus = (entry) => {
    if (!entry.workDescription) return "pending";
    if (!entry.workHours) return "incomplete";
    if (!entry.supervisorApproved || !entry.advisorApproved) return "submitted";
    return "approved";
  };

  const renderStatusBadge = (status) => {
    const statusConfig = {
      pending: { status: "warning", text: "รอบันทึกข้อมูล" },
      incomplete: { status: "processing", text: "บันทึกบางส่วน" },
      submitted: { status: "success", text: "ส่งข้อมูลแล้ว" },
      approved: { status: "success", text: "ตรวจสอบแล้ว" },
    };
    const config = statusConfig[status];
    return <Badge status={config.status} text={config.text} />;
  };

  const showViewModal = (entry) => {
    setSelectedEntry(entry);
    setIsViewModalVisible(true);
  };

  const showEditModal = (entry) => {
    setSelectedEntry(entry);
    form.setFieldsValue({
      logTitle: entry.logTitle,
      workDescription: entry.workDescription,
      learningOutcome: entry.learningOutcome,
      workHours: entry.workHours,
      problems: entry.problems,
      solutions: entry.solutions,
    });
    setIsModalVisible(true);
  };

  // แก้ไข handleModalOk
  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();

      // คำนวณชั่วโมงทำงาน
      const workHours = calculateWorkHours(
        values.timeIn?.format("HH:mm"),
        values.timeOut?.format("HH:mm")
      );

      const updatedEntry = {
        ...selectedEntry,
        ...values,
        workDate: dayjs(values.workDate).format("YYYY-MM-DD"),
        timeIn: values.timeIn?.format("HH:mm"),
        timeOut: values.timeOut?.format("HH:mm"),
        workHours: workHours,
      };

      // อัพเดทข้อมูลใน state
      const newEntries = internshipDates.map((entry) =>
        entry.logId === selectedEntry.logId ? updatedEntry : entry
      );
      setInternshipDates(newEntries);

      message.success("บันทึกข้อมูลเรียบร้อย");
      setIsModalVisible(false);
    } catch (error) {
      message.error("กรุณากรอกข้อมูลให้ครบถ้วน");
    }
  };

  // เพิ่มฟังก์ชันคำนวณสถิติ
  const calculateStats = () => {
    const total = internshipDates.length;
    const completed = internshipDates.filter(
      (entry) => entry.timeIn && entry.timeOut
    ).length;
    const pending = internshipDates.filter((entry) => !entry.timeIn).length;
    const inProgress = total - completed - pending;

    return { total, completed, pending, inProgress };
  };

  // เพิ่มฟังก์ชันคำนวณชั่วโมงทำงาน
  const calculateWorkHours = (timeIn, timeOut) => {
    if (!timeIn || !timeOut) return 0;

    const startTime = dayjs(timeIn, "HH:mm");
    const endTime = dayjs(timeOut, "HH:mm");

    // คำนวณความต่างของเวลาเป็นชั่วโมง
    const hours = endTime.diff(startTime, "hour", true);

    // ปัดเศษทศนิยม 1 ตำแหน่ง
    return Math.round(hours * 2) / 2;
  };

  // เพิ่ม useEffect สำหรับคำนวณชั่วโมงอัตโนมัติ
  useEffect(() => {
    const timeIn = form.getFieldValue("timeIn");
    const timeOut = form.getFieldValue("timeOut");

    if (timeIn && timeOut) {
      const hours = calculateWorkHours(
        timeIn.format("HH:mm"),
        timeOut.format("HH:mm")
      );
      form.setFieldValue("workHours", hours);
    }
  }, [form.getFieldValue("timeIn"), form.getFieldValue("timeOut")]);

  // แก้ไข renderEditForm
  const renderEditForm = () => (
    <Form form={form} layout="vertical">
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            name="timeIn"
            label="เวลาเข้างาน"
            rules={[{ required: true }]}
          >
            <TimePicker format="HH:mm" />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            name="timeOut"
            label="เวลาออกงาน"
            rules={[{ required: true }]}
          >
            <TimePicker format="HH:mm" />
          </Form.Item>
        </Col>
      </Row>

      <Form.Item
        name="workHours"
        label="จำนวนชั่วโมง"
        dependencies={["timeIn", "timeOut"]}
      >
        <InputNumber
          disabled
          min={0}
          max={24}
          step={0.5}
          style={{ width: "100%" }}
        />
      </Form.Item>

      <Form.Item name="logTitle" label="หัวข้องาน" rules={[{ required: true }]}>
        <Input />
      </Form.Item>

      <Form.Item
        name="workDescription"
        label="รายละเอียดงาน"
        rules={[{ required: true }]}
      >
        <Input.TextArea rows={4} />
      </Form.Item>

      <Form.Item
        name="learningOutcome"
        label="สิ่งที่ได้เรียนรู้"
        rules={[{ required: true }]}
      >
        <Input.TextArea rows={4} />
      </Form.Item>

      <Form.Item name="problems" label="ปัญหาที่พบ">
        <Input.TextArea rows={4} />
      </Form.Item>

      <Form.Item name="solutions" label="วิธีการแก้ไข">
        <Input.TextArea rows={4} />
      </Form.Item>
    </Form>
  );

  // แสดงรายละเอียดใน View Modal
  const renderViewDetails = () => (
    <div className="view-details">
      <p>
        <strong>วันที่:</strong>{" "}
        {selectedEntry && dayjs(selectedEntry.workDate).format("DD/MM/YYYY")}
      </p>
      <p>
        <strong>หัวข้องาน:</strong> {selectedEntry?.logTitle}
      </p>
      <p>
        <strong>จำนวนชั่วโมง:</strong> {selectedEntry?.workHours} ชั่วโมง
      </p>
      <p>
        <strong>รายละเอียดงาน:</strong>
      </p>
      <p>{selectedEntry?.workDescription}</p>
      <p>
        <strong>สิ่งที่ได้เรียนรู้:</strong>
      </p>
      <p>{selectedEntry?.learningOutcome}</p>
      <p>
        <strong>ปัญหาที่พบ:</strong>
      </p>
      <p>{selectedEntry?.problems || "-"}</p>
      <p>
        <strong>วิธีการแก้ไข:</strong>
      </p>
      <p>{selectedEntry?.solutions || "-"}</p>
      {selectedEntry?.supervisorComment && (
        <>
          <p>
            <strong>ความคิดเห็นหัวหน้างาน:</strong>
          </p>
          <p>{selectedEntry.supervisorComment}</p>
        </>
      )}
      {selectedEntry?.advisorComment && (
        <>
          <p>
            <strong>ความคิดเห็นอาจารย์ที่ปรึกษา:</strong>
          </p>
          <p>{selectedEntry.advisorComment}</p>
        </>
      )}
    </div>
  );

  return (
    <div className="internship-container">
      <Row gutter={[16, 16]} className="status-overview">
        <Col xs={24} sm={12} md={6}>
          <Card className="status-summary-card total">
            <Statistic
              title="วันฝึกงานทั้งหมด"
              value={calculateStats().total}
              suffix="วัน"
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card className="status-summary-card completed">
            <Statistic
              title="บันทึกเรียบร้อย"
              value={calculateStats().completed}
              suffix="วัน"
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: "#52c41a" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card className="status-summary-card in-progress">
            <Statistic
              title="อยู่ระหว่างดำเนินการ"
              value={calculateStats().inProgress}
              suffix="วัน"
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: "#1890ff" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card className="status-summary-card pending">
            <Statistic
              title="รอดำเนินการ"
              value={calculateStats().pending}
              suffix="วัน"
              prefix={<ExclamationCircleOutlined />}
              valueStyle={{ color: "#faad14" }}
            />
          </Card>
        </Col>
      </Row>

      <Row>
        <Col
          span={6}
          offset={18}
          style={{ textAlign: "right", paddingRight: "16px" }}
        >
          <InternshipSteps />
        </Col>
      </Row>

      <Card>
        <Title level={3}>บันทึกการฝึกงาน</Title>
        <Table
          columns={columns}
          dataSource={internshipDates}
          pagination={false}
        />

        <Modal
          title="รายละเอียดการฝึกงาน"
          open={isViewModalVisible}
          onCancel={() => setIsViewModalVisible(false)}
          footer={[
            <Button key="close" onClick={() => setIsViewModalVisible(false)}>
              ปิด
            </Button>,
          ]}
        >
          {renderViewDetails()}
        </Modal>

        <Modal
          title="แก้ไขข้อมูลการฝึกงาน"
          open={isModalVisible}
          onOk={handleModalOk}
          onCancel={() => setIsModalVisible(false)}
          confirmLoading={loading}
        >
          {renderEditForm()}
        </Modal>
      </Card>
    </div>
  );
};

export default TimeSheet;
