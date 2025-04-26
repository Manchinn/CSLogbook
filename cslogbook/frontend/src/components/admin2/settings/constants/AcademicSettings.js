import React, { useState, useEffect } from "react";
import {
  Form,
  Input,
  Button,
  Select,
  Card,
  Divider,
  Typography,
  Row,
  Col,
  InputNumber,
  DatePicker,
  message,
  Spin,
  Table,
  Tag,
  Alert,
} from "antd";
import { SaveOutlined, ReloadOutlined } from "@ant-design/icons";
import { settingsService } from "../../../../services/admin/settingsService";
import th_TH from "antd/lib/locale/th_TH"; // เพิ่ม locale ภาษาไทย
import moment from "moment";
import "moment/locale/th"; // เพิ่ม locale ภาษาไทยสำหรับ moment
import {
  DATE_FORMAT_SHORT,
  DATE_FORMAT_MEDIUM,
  DATE_FORMAT_LONG,
} from "../../../../utils/constants";

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

// แก้ไขฟังก์ชัน checkDateOverlap เพื่อให้ตรวจสอบทั้งสองช่วงเวลา
const checkDateOverlap = (values) => {
  // ตรวจสอบช่วงเวลาภาคเรียน
  const sem1Start = values.semester1Range?.[0];
  const sem1End = values.semester1Range?.[1];
  const sem2Start = values.semester2Range?.[0];
  const sem2End = values.semester2Range?.[1];
  const sem3Start = values.semester3Range?.[0];
  const sem3End = values.semester3Range?.[1];

  if (sem1End && sem2Start && sem1End.isAfter(sem2Start)) {
    message.warning("ช่วงเวลาภาคเรียนที่ 1 และ 2 ทับซ้อนกัน");
    return false;
  }

  if (sem2End && sem3Start && sem2End.isAfter(sem3Start)) {
    message.warning("ช่วงเวลาภาคเรียนที่ 2 และภาคฤดูร้อนทับซ้อนกัน");
    return false;
  }

  // ตรวจสอบช่วงวันลงทะเบียนฝึกงาน
  const internRegStart = values.internshipRegistrationStartDate
    ? moment(values.internshipRegistrationStartDate)
    : null;
  const internRegEnd = values.internshipRegistrationEndDate
    ? moment(values.internshipRegistrationEndDate)
    : null;

  if (internRegStart && internRegEnd) {
    const isInternValid =
      (sem1Start &&
        sem1End &&
        internRegStart.isBetween(sem1Start, sem1End, null, "[]")) ||
      (sem2Start &&
        sem2End &&
        internRegStart.isBetween(sem2Start, sem2End, null, "[]")) ||
      (sem3Start &&
        sem3End &&
        internRegStart.isBetween(sem3Start, sem3End, null, "[]"));

    if (!isInternValid) {
      message.warning("ช่วงวันลงทะเบียนฝึกงานไม่อยู่ในช่วงเปิดภาคเรียนใดเลย");
      return false;
    }
  }

  // ตรวจสอบช่วงวันลงทะเบียนโครงงาน
  const projectRegStart = values.projectRegistrationStartDate
    ? moment(values.projectRegistrationStartDate)
    : null;
  const projectRegEnd = values.projectRegistrationEndDate
    ? moment(values.projectRegistrationEndDate)
    : null;

  if (projectRegStart && projectRegEnd) {
    const isProjectValid =
      (sem1Start &&
        sem1End &&
        projectRegStart.isBetween(sem1Start, sem1End, null, "[]")) ||
      (sem2Start &&
        sem2End &&
        projectRegStart.isBetween(sem2Start, sem2End, null, "[]")) ||
      (sem3Start &&
        sem3End &&
        projectRegStart.isBetween(sem3Start, sem3End, null, "[]"));

    if (!isProjectValid) {
      message.warning("ช่วงวันลงทะเบียนโครงงานไม่อยู่ในช่วงเปิดภาคเรียนใดเลย");
      return false;
    }
  }

  return true;
};

// แก้ไขฟังก์ชันตัวแสดงสถานะภาคเรียนปัจจุบัน
const getCurrentSemesterStatus = (formInstance) => {
  const today = moment();
  const sem1Range = formInstance.getFieldValue("semester1Range");
  const sem2Range = formInstance.getFieldValue("semester2Range");
  const sem3Range = formInstance.getFieldValue("semester3Range");

  if (
    sem1Range &&
    sem1Range[0] &&
    sem1Range[1] &&
    today.isBetween(sem1Range[0], sem1Range[1], null, "[]")
  ) {
    return <Tag color="green">ขณะนี้อยู่ในภาคเรียนที่ 1</Tag>;
  } else if (
    sem2Range &&
    today.isBetween(sem2Range[0], sem2Range[1], null, "[]")
  ) {
    return <Tag color="green">ขณะนี้อยู่ในภาคเรียนที่ 2</Tag>;
  } else if (
    sem3Range &&
    today.isBetween(sem3Range[0], sem3Range[1], null, "[]")
  ) {
    return <Tag color="green">ขณะนี้อยู่ในภาคฤดูร้อน</Tag>;
  }

  return <Tag color="orange">ไม่อยู่ในช่วงเปิดภาคเรียน</Tag>;
};

// แยกฟังก์ชันตรวจสอบสถานะการลงทะเบียนเป็นสองฟังก์ชัน
const getInternshipRegistrationStatus = (formInstance) => {
  const today = moment();
  const regStart = formInstance.getFieldValue(
    "internshipRegistrationStartDate"
  );
  const regEnd = formInstance.getFieldValue("internshipRegistrationEndDate");

  if (
    regStart &&
    regEnd &&
    moment.isMoment(regStart) &&
    moment.isMoment(regEnd)
  ) {
    if (today.isBefore(regStart)) {
      return (
        <Tag color="orange">
          ยังไม่เปิดให้ลงทะเบียนฝึกงาน (เริ่ม{" "}
          {moment(regStart).add(543, "year").format(DATE_FORMAT_MEDIUM)})
        </Tag>
      );
    } else if (today.isAfter(regEnd)) {
      return (
        <Tag color="red">
          ปิดการลงทะเบียนฝึกงานแล้ว (สิ้นสุด{" "}
          {moment(regEnd).add(543, "year").format(DATE_FORMAT_MEDIUM)})
        </Tag>
      );
    } else {
      return (
        <Tag color="green">
          เปิดให้ลงทะเบียนฝึกงาน (ถึง{" "}
          {moment(regEnd).add(543, "year").format(DATE_FORMAT_MEDIUM)})
        </Tag>
      );
    }
  }

  return <Tag color="gray">ไม่ได้กำหนดช่วงเวลาลงทะเบียนฝึกงาน</Tag>;
};

const getProjectRegistrationStatus = (formInstance) => {
  const today = moment();
  const regStart = formInstance.getFieldValue("projectRegistrationStartDate");
  const regEnd = formInstance.getFieldValue("projectRegistrationEndDate");

  if (
    regStart &&
    regEnd &&
    moment.isMoment(regStart) &&
    moment.isMoment(regEnd)
  ) {
    if (today.isBefore(regStart)) {
      return (
        <Tag color="orange">
          ยังไม่เปิดให้ลงทะเบียนโครงงานพิเศษ (เริ่ม{" "}
          {moment(regStart).add(543, "year").format(DATE_FORMAT_MEDIUM)})
        </Tag>
      );
    } else if (today.isAfter(regEnd)) {
      return (
        <Tag color="red">
          ปิดการลงทะเบียนโครงงานแล้ว (สิ้นสุด{" "}
          {moment(regEnd).add(543, "year").format(DATE_FORMAT_MEDIUM)})
        </Tag>
      );
    } else {
      return (
        <Tag color="green">
          เปิดให้ลงทะเบียนโครงงาน (ถึง{" "}
          {moment(regEnd).add(543, "year").format(DATE_FORMAT_MEDIUM)})
        </Tag>
      );
    }
  }

  return <Tag color="gray">ไม่ได้กำหนดช่วงเวลาลงทะเบียนโครงงาน</Tag>;
};

// เพิ่มฟังก์ชันตรวจสอบภาคเรียนที่ลงทะเบียนได้
const isRegistrationOpenForSemester = (formInstance) => {
  const currentSemester = formInstance.getFieldValue("currentSemester");
  const internshipSemesters = formInstance.getFieldValue(
    "internshipSemesters"
  ) || [3];
  const projectSemesters = formInstance.getFieldValue("projectSemesters") || [
    1, 2,
  ];

  const today = moment();
  const projectRegEnd = formInstance.getFieldValue("projectRegistrationEndDate");

  return {
    internship: internshipSemesters.includes(currentSemester),
    project:
      projectSemesters.includes(currentSemester) &&
      (!projectRegEnd || today.isSameOrBefore(projectRegEnd)), // ตรวจสอบวันที่สิ้นสุด
  };
};


const AcademicSettings = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [curriculums, setCurriculums] = useState([]);
  const [selectedCurriculumId, setSelectedCurriculumId] = useState(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  useEffect(() => {
    const fetchCurriculums = async () => {
      try {
        const response = await settingsService.getCurriculums();
        if (response.success) {
          const activeCurriculums = response.data.filter((c) => c.active);
          setCurriculums(activeCurriculums);

          // ตรวจสอบว่ามีหลักสูตรที่ active หรือไม่
          if (activeCurriculums.length === 0) {
            message.warning(
              "ไม่พบหลักสูตรที่เปิดใช้งาน กรุณาตั้งค่าในหน้าจัดการหลักสูตร"
            );
          } else {
            // ตั้งค่าหลักสูตรเริ่มต้นเป็นหลักสูตรแรกที่ active
            setSelectedCurriculumId(activeCurriculums[0].curriculumId);
          }
        }
      } catch (error) {
        console.error("Error fetching curriculums:", error);
        message.error("ไม่สามารถดึงข้อมูลหลักสูตรได้");
      }
    };

    fetchCurriculums();
  }, []);

  const handleCurriculumChange = (value) => {
    setSelectedCurriculumId(value);
    // สามารถเพิ่มโลจิกเพิ่มเติมในการเปลี่ยนหลักสูตรที่ใช้งานได้ที่นี่
    // เช่น ดึงข้อมูลหน่วยกิตหรือข้อกำหนดของหลักสูตรที่เลือก
    const selectedCurriculum = curriculums.find(c => c.curriculumId === value);
    if (selectedCurriculum) {
      message.success(`เลือกหลักสูตร ${selectedCurriculum.shortName || selectedCurriculum.name} เป็นหลักสูตรหลัก`);
    }
  };

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const response = await settingsService.getAcademicSettings();
      if (response.success && response.data) {
        const data = response.data;

        form.setFieldsValue({
          id: data.id, // ตั้งค่า id ในฟอร์ม
          currentAcademicYear: data.academicYear,
          currentSemester: data.currentSemester,
          semester1Range: data.semester1Range
            ? [
                moment(data.semester1Range.start, "YYYY-MM-DD"),
                moment(data.semester1Range.end, "YYYY-MM-DD"),
              ]
            : null,
          semester2Range: data.semester2Range
            ? [
                moment(data.semester2Range.start, "YYYY-MM-DD"),
                moment(data.semester2Range.end, "YYYY-MM-DD"),
              ]
            : null,
          semester3Range: data.semester3Range
            ? [
                moment(data.semester3Range.start, "YYYY-MM-DD"),
                moment(data.semester3Range.end, "YYYY-MM-DD"),
              ]
            : null,
          internshipRegistrationStartDate: data.internshipRegistration
            ?.startDate
            ? moment(data.internshipRegistration.startDate)
            : null,
          internshipRegistrationEndDate: data.internshipRegistration?.endDate
            ? moment(data.internshipRegistration.endDate)
            : null,
          projectRegistrationStartDate: data.projectRegistration?.startDate
            ? moment(data.projectRegistration.startDate)
            : null,
          projectRegistrationEndDate: data.projectRegistration?.endDate
            ? moment(data.projectRegistration.endDate)
            : null,
          internshipSemesters: data.internshipSemesters || [3],
          projectSemesters: data.projectSemesters || [1, 2],
        });

      } else {
        message.error("ไม่สามารถดึงข้อมูลการตั้งค่าได้");
      }
    } catch (error) {
      console.error("Error fetching academic settings:", error);
      message.error("เกิดข้อผิดพลาดในการดึงข้อมูล");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();

      // ตรวจสอบความถูกต้องของช่วงเวลา
      if (!checkDateOverlap(values)) {
        return;
      }

      setLoading(true);

      const formattedData = {
        id: form.getFieldValue("id"),
        currentAcademicYear: values.currentAcademicYear,
        currentSemester: values.currentSemester,
        semesters: {
          1: {
            range: values.semester1Range
              ? {
                  start: values.semester1Range[0].format("YYYY-MM-DD"),
                  end: values.semester1Range[1].format("YYYY-MM-DD"),
                }
              : null,
          },
          2: {
            range: values.semester2Range
              ? {
                  start: values.semester2Range[0].format("YYYY-MM-DD"),
                  end: values.semester2Range[1].format("YYYY-MM-DD"),
                }
              : null,
          },
          3: {
            range: values.semester3Range
              ? {
                  start: values.semester3Range[0].format("YYYY-MM-DD"),
                  end: values.semester3Range[1].format("YYYY-MM-DD"),
                }
              : null,
          },
        },
        internshipRegistration: {
          startDate: values.internshipRegistrationStartDate
            ? values.internshipRegistrationStartDate.format("YYYY-MM-DD")
            : null,
          endDate: values.internshipRegistrationEndDate
            ? values.internshipRegistrationEndDate.format("YYYY-MM-DD")
            : null,
        },
        projectRegistration: {
          startDate: values.projectRegistrationStartDate
            ? values.projectRegistrationStartDate.format("YYYY-MM-DD")
            : null,
          endDate: values.projectRegistrationEndDate
            ? values.projectRegistrationEndDate.format("YYYY-MM-DD")
            : null,
        },
        internshipSemesters: values.internshipSemesters || [3],
        projectSemesters: values.projectSemesters || [1, 2],
      };

      const response = await settingsService.updateAcademicSettings(
        formattedData
      );
      if (response.success) {
        message.success("บันทึกการตั้งค่าสำเร็จ");
      } else {
        message.error(response.message || "เกิดข้อผิดพลาดในการบันทึกข้อมูล");
      }
    } catch (error) {
      console.error("Error saving academic settings:", error);
      message.error("เกิดข้อผิดพลาดในการบันทึกข้อมูล");
    } finally {
      setLoading(false);
    }
  };

  if (loading && !form.getFieldsValue().currentAcademicYear) {
    return <Spin tip="กำลังโหลดข้อมูล..." />;
  }

  return (
    <div className="academic-settings">
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          currentAcademicYear: 2567,
          currentSemester: 1,
        }}
      >
        {/* ปีการศึกษาปัจจุบัน */}
        <Card className="settings-card">
          <Title level={5}>ปีการศึกษาและภาคเรียนปัจจุบัน</Title>
          <Text type="secondary">
            ปีการศึกษาและภาคเรียนปัจจุบันจะใช้เป็นค่าตั้งต้นสำหรับการสมัครฝึกงานและโครงงาน
          </Text>

          {/* เพิ่มการแจ้งเตือนเกี่ยวกับผลกระทบการเปลี่ยนปีการศึกษา */}
          <Alert
            message="การเตือน"
            description={
              <div>
                การเปลี่ยนแปลงปีการศึกษาจะส่งผลต่อ:
                <ul>
                  <li>การคำนวณชั้นปีของนักศึกษาโดยอัตโนมัติ</li>
                  <li>การกำหนดหลักสูตรที่นักศึกษาใช้</li>
                  <li>การตรวจสอบคุณสมบัติการฝึกงานและโครงงาน</li>
                </ul>
              </div>
            }
            type="warning"
            showIcon
            style={{ marginTop: "16px", marginBottom: "16px" }}
          />

          <Row gutter={16} style={{ marginTop: 16 }}>
            <Col span={12}>
              <Form form={form} layout="vertical">
                <Form.Item name="id" hidden>
                  <Input />
                </Form.Item>
              </Form>
              <Form.Item
                name="currentSemester"
                label="ภาคเรียนปัจจุบัน"
                rules={[{ required: true, message: "กรุณาเลือกภาคเรียน" }]}
              >
                <Select>
                  <Option value={1}>ภาคเรียนที่ 1</Option>
                  <Option value={2}>ภาคเรียนที่ 2</Option>
                  <Option value={3}>ภาคฤดูร้อน</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="currentAcademicYear"
                label="ปีการศึกษา"
                rules={[{ required: true, message: "กรุณากรอกปีการศึกษา" }]}
              >
                <InputNumber
                  style={{ width: "100%" }}
                  min={2500}
                  max={2600}
                  placeholder="เช่น 2567"
                />
              </Form.Item>
            </Col>
          </Row>

          <Divider orientation="left">หลักสูตรที่ใช้งานในปีการศึกษานี้</Divider>

          {/* เพิ่มการเลือกหลักสูตร */}
          <Row gutter={16} style={{ marginTop: 16, marginBottom: 16 }}>
            <Col span={24}>
              <Form.Item
                name="selectedCurriculum"
                label="เลือกหลักสูตรหลักที่ใช้ในปีการศึกษานี้"
                rules={[{ required: true, message: "กรุณาเลือกหลักสูตร" }]}
              >
                <Select 
                  placeholder="เลือกหลักสูตร" 
                  onChange={handleCurriculumChange}
                  value={selectedCurriculumId}
                  loading={loading}
                >
                  {curriculums.map(curriculum => (
                    <Option key={curriculum.curriculumId} value={curriculum.curriculumId}>
                      {curriculum.code} - {curriculum.shortName || curriculum.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={24}>
              <Alert 
                message="หลักสูตรที่เลือกจะถูกใช้เป็นพื้นฐานในการตรวจสอบคุณสมบัติการฝึกงานและโครงงาน" 
                type="info" 
                showIcon 
              />
            </Col>
          </Row>

          {selectedCurriculumId && (
            <div className="selected-curriculum-details">
              <Table
                size="small"
                pagination={false}
                columns={[
                  {
                    title: "รหัสหลักสูตร",
                    dataIndex: "code",
                    key: "code",
                  },
                  {
                    title: "ชื่อหลักสูตร",
                    dataIndex: "shortName",
                    key: "shortName",
                    render: (text, record) => record.shortName || record.name,
                  },
                  {
                    title: "ปีที่เริ่มใช้",
                    dataIndex: "startYear",
                    key: "startYear",
                  },
                  {
                    title: "หน่วยกิตสะสมขั้นต่ำ (ฝึกงาน)",
                    dataIndex: "internshipBaseCredits",
                    key: "internshipBaseCredits",
                  },
                  {
                    title: "หน่วยกิตสะสมขั้นต่ำ (โครงงาน)",
                    dataIndex: "projectBaseCredits",
                    key: "projectBaseCredits",
                  }
                ]}
                dataSource={curriculums.filter(c => c.curriculumId === selectedCurriculumId)}
                locale={{
                  emptyText: "ไม่พบข้อมูลหลักสูตรที่เลือก",
                }}
              />
            </div>
          )}

          <Divider orientation="left">สถานะภาคเรียน</Divider>
          {/* แก้ไขการเรียกใช้ getCurrentSemesterStatus */}
          {getCurrentSemesterStatus(form)}

          {/* เพิ่มการแสดงสถานะการลงทะเบียน */}
          <Divider orientation="left">สถานะการลงทะเบียน</Divider>
          <div>
            {getInternshipRegistrationStatus(form)}
            <div style={{ marginTop: 8 }}>
              {getProjectRegistrationStatus(form)}
            </div>
          </div>

          <div style={{ marginTop: 16 }}>
            <Text>สถานะการลงทะเบียนในภาคเรียนปัจจุบัน:</Text>
            <div style={{ marginTop: 8 }}>
              <Tag
                color={
                  isRegistrationOpenForSemester(form).internship
                    ? "green"
                    : "red"
                }
              >
                {isRegistrationOpenForSemester(form).internship
                  ? "เปิด"
                  : "ปิด"}
                ลงทะเบียนฝึกงาน
              </Tag>
              <Tag
                color={
                  isRegistrationOpenForSemester(form).project ? "green" : "red"
                }
              >
                {isRegistrationOpenForSemester(form).project ? "เปิด" : "ปิด"}
                ลงทะเบียนโครงงาน
              </Tag>
            </div>
          </div>
        </Card>

        <Divider />

        {/* ช่วงเวลาของภาคเรียน */}
        <Card className="settings-card">
          <Title level={5}>
            ช่วงเวลาปีการศึกษา{" "}
            {form.getFieldValue("currentAcademicYear") || "2567"}
          </Title>
          <Text type="secondary">
            กำหนดช่วงเวลาของแต่ละภาคเรียนในปีการศึกษา
          </Text>

          <Row gutter={16} style={{ marginTop: 16 }}>
            <Col span={24}>
              <Form.Item
                name="semester1Range"
                label="ภาคเรียนที่ 1"
                rules={[
                  {
                    required: true,
                    message: "กรุณาเลือกช่วงเวลาภาคเรียนที่ 1",
                  },
                ]}
              >
                <RangePicker
                  style={{ width: "100%" }}
                  format={(value) => moment(value).add(543, "year").format("D MMMM YYYY")}
                  locale={th_TH}
                  placeholder={["วันเริ่มต้น", "วันสิ้นสุด"]}
                />
              </Form.Item>
            </Col>

            <Col span={24}>
              <Form.Item
                name="semester2Range"
                label="ภาคเรียนที่ 2"
                rules={[
                  {
                    required: true,
                    message: "กรุณาเลือกช่วงเวลาภาคเรียนที่ 2",
                  },
                ]}
              >
                <RangePicker
                  style={{ width: "100%" }}
                  format={(value) => moment(value).add(543, "year").format("D MMMM YYYY")}
                  locale={th_TH}
                  placeholder={["วันเริ่มต้น", "วันสิ้นสุด"]}
                />
              </Form.Item>
            </Col>

            <Col span={24}>
              <Form.Item
                name="semester3Range"
                label="ภาคฤดูร้อน"
                rules={[
                  { required: true, message: "กรุณาเลือกช่วงเวลาภาคฤดูร้อน" },
                ]}
              >
                <RangePicker
                  style={{ width: "100%" }}
                  format={(value) => moment(value).add(543, "year").format("D MMMM YYYY")}
                  locale={th_TH}
                  placeholder={["วันเริ่มต้น", "วันสิ้นสุด"]}
                />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        <Divider />

        {/* ช่วงเวลาลงทะเบียน */}
        <Card className="settings-card">
          <Title level={5}>ช่วงเวลาลงทะเบียน</Title>
          <Text type="secondary">
            กำหนดช่วงเวลาและวันที่สำคัญต่างๆ ในปีการศึกษา
          </Text>

          <Divider orientation="left">ลงทะเบียนฝึกงาน</Divider>
          <Row gutter={16} style={{ marginTop: 16 }}>
            <Col span={12}>
              <Form.Item
                name="internshipRegistrationStartDate"
                label="วันที่เริ่มลงทะเบียนฝึกงาน"
                rules={[
                  {
                    required: true,
                    message: "กรุณาเลือกวันที่เริ่มลงทะเบียนฝึกงาน",
                  },
                ]}
              >
                <DatePicker
                  style={{ width: "100%" }}
                  format={(value) => moment(value).add(543, "year").format("D MMMM YYYY")} // แสดงวันที่ในรูปแบบไทย
                  locale={th_TH} // ใช้ locale ภาษาไทย
                  placeholder="เลือกวันที่"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="internshipRegistrationEndDate"
                label="วันที่สิ้นสุดลงทะเบียนฝึกงาน"
                rules={[
                  {
                    required: true,
                    message: "กรุณาเลือกวันที่สิ้นสุดลงทะเบียนฝึกงาน",
                  },
                ]}
              >
                <DatePicker
                  style={{ width: "100%" }}
                  format={(value) => moment(value).add(543, "year").format("D MMMM YYYY")} // แสดงวันที่ในรูปแบบไทย
                  locale={th_TH} // ใช้ locale ภาษาไทย
                  placeholder="เลือกวันที่"
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={24}>
              <Form.Item
                name="internshipSemesters"
                label="ภาคเรียนที่เปิดให้ลงทะเบียนฝึกงาน"
                initialValue={[3]} // ค่าเริ่มต้นคือภาคฤดูร้อน
              >
                <Select mode="multiple">
                  <Option value={1}>ภาคเรียนที่ 1</Option>
                  <Option value={2}>ภาคเรียนที่ 2</Option>
                  <Option value={3}>ภาคฤดูร้อน</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Divider orientation="left">ลงทะเบียนโครงงาน</Divider>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="projectRegistrationStartDate"
                label="วันที่เริ่มลงทะเบียนโครงงาน"
                rules={[
                  {
                    required: true,
                    message: "กรุณาเลือกวันที่เริ่มลงทะเบียนโครงงาน",
                  },
                ]}
              >
                <DatePicker
                  style={{ width: "100%" }}
                  format={(value) => moment(value).add(543, "year").format("D MMMM YYYY")} // แสดงวันที่ในรูปแบบไทย
                  locale={th_TH} // ใช้ locale ภาษาไทย
                  placeholder="เลือกวันที่"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="projectRegistrationEndDate"
                label="วันที่สิ้นสุดลงทะเบียนโครงงาน"
                rules={[
                  {
                    required: true,
                    message: "กรุณาเลือกวันที่สิ้นสุดลงทะเบียนโครงงาน",
                  },
                ]}
              >
                <DatePicker
                  style={{ width: "100%" }}
                  format={(value) => moment(value).add(543, "year").format("D MMMM YYYY")} // แสดงวันที่ในรูปแบบไทย
                  locale={th_TH} // ใช้ locale ภาษาไทย
                  placeholder="เลือกวันที่"
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={24}>
              <Form.Item
                name="projectSemesters"
                label="ภาคเรียนที่เปิดให้ลงทะเบียนโครงงาน"
                initialValue={[1, 2]} // ค่าเริ่มต้นคือภาคเรียนที่ 1 และ 2
              >
                <Select mode="multiple">
                  <Option value={1}>ภาคเรียนที่ 1</Option>
                  <Option value={2}>ภาคเรียนที่ 2</Option>
                  <Option value={3}>ภาคฤดูร้อน</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
        </Card>

        <div className="setting-actions">
          <Button
            icon={<ReloadOutlined />}
            onClick={fetchSettings}
            disabled={loading}
            style={{ marginRight: 8 }}
          >
            รีเซ็ต
          </Button>
          <Button
            type="primary"
            icon={<SaveOutlined />}
            onClick={handleSave}
            loading={loading}
          >
            บันทึกการตั้งค่า
          </Button>
        </div>
      </Form>
    </div>
  );
};

export default AcademicSettings;
