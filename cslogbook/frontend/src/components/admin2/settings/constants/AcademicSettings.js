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
import { studentService } from "../../../../services/admin/userService";
import moment from "moment-timezone";
import { formatThaiDate } from "../../../../utils/timeUtils";
import { DATE_FORMAT_SHORT } from "../../../../utils/constants";

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

// แก้ไขฟังก์ชัน checkDateOverlap เพื่อให้ตรวจสอบทั้งสองช่วงเวลา
const checkDateOverlap = (values) => {
  // ตรวจสอบว่าภาคเรียนต่างๆ ไม่ทับซ้อนกัน
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
  const internRegStart = values.internshipRegistrationStartDate;
  const internRegEnd = values.internshipRegistrationEndDate;

  if (internRegStart && internRegEnd) {
    // ตรวจสอบว่าวันลงทะเบียนฝึกงานอยู่ในช่วงเปิดภาคเรียนหรือไม่
    const isInternSemester1 =
      sem1Start &&
      sem1End &&
      (internRegStart.isBetween(sem1Start, sem1End, null, "[]") ||
        internRegEnd.isBetween(sem1Start, sem1End, null, "[]"));

    const isInternSemester2 =
      sem2Start &&
      sem2End &&
      (internRegStart.isBetween(sem2Start, sem2End, null, "[]") ||
        internRegEnd.isBetween(sem2Start, sem2End, null, "[]"));

    const isInternSemester3 =
      sem3Start &&
      sem3End &&
      (internRegStart.isBetween(sem3Start, sem3End, null, "[]") ||
        internRegEnd.isBetween(sem3Start, sem3End, null, "[]"));

    if (!isInternSemester1 && !isInternSemester2 && !isInternSemester3) {
      message.warning("ช่วงวันลงทะเบียนฝึกงานไม่อยู่ในช่วงเปิดภาคเรียนใดเลย");
      return false;
    }
  }

  // ตรวจสอบช่วงวันลงทะเบียนโครงงาน
  const projectRegStart = values.projectRegistrationStartDate;
  const projectRegEnd = values.projectRegistrationEndDate;

  if (projectRegStart && projectRegEnd) {
    // ตรวจสอบว่าวันลงทะเบียนโครงงานอยู่ในช่วงเปิดภาคเรียนหรือไม่
    const isProjectSemester1 =
      sem1Start &&
      sem1End &&
      (projectRegStart.isBetween(sem1Start, sem1End, null, "[]") ||
        projectRegEnd.isBetween(sem1Start, sem1End, null, "[]"));

    const isProjectSemester2 =
      sem2Start &&
      sem2End &&
      (projectRegStart.isBetween(sem2Start, sem2End, null, "[]") ||
        projectRegEnd.isBetween(sem2Start, sem2End, null, "[]"));

    const isProjectSemester3 =
      sem3Start &&
      sem3End &&
      (projectRegStart.isBetween(sem3Start, sem3End, null, "[]") ||
        projectRegEnd.isBetween(sem3Start, sem3End, null, "[]"));

    if (!isProjectSemester1 && !isProjectSemester2 && !isProjectSemester3) {
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

  if (sem1Range && today.isBetween(sem1Range[0], sem1Range[1], null, "[]")) {
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

  if (regStart && regEnd) {
    if (today.isBefore(regStart)) {
      return (
        <Tag color="orange">
          ยังไม่เปิดให้ลงทะเบียนฝึกงาน (เริ่ม{" "}
          {formatThaiDate(regStart, DATE_FORMAT_SHORT)})
        </Tag>
      );
    } else if (today.isAfter(regEnd)) {
      return (
        <Tag color="red">
          ปิดการลงทะเบียนฝึกงานแล้ว (สิ้นสุด {regEnd.format("DD/MM/YYYY")})
        </Tag>
      );
    } else {
      return (
        <Tag color="green">
          เปิดให้ลงทะเบียนฝึกงาน (ถึง {regEnd.format("DD/MM/YYYY")})
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

  if (regStart && regEnd) {
    if (today.isBefore(regStart)) {
      return (
        <Tag color="orange">
          ยังไม่เปิดให้ลงทะเบียนโครงงาน (เริ่ม {regStart.format("DD/MM/YYYY")})
        </Tag>
      );
    } else if (today.isAfter(regEnd)) {
      return (
        <Tag color="red">
          ปิดการลงทะเบียนโครงงานแล้ว (สิ้นสุด {regEnd.format("DD/MM/YYYY")})
        </Tag>
      );
    } else {
      return (
        <Tag color="green">
          เปิดให้ลงทะเบียนโครงงาน (ถึง {regEnd.format("DD/MM/YYYY")})
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

  return {
    internship: internshipSemesters.includes(currentSemester),
    project: projectSemesters.includes(currentSemester),
  };
};

const AcademicSettings = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [curriculums, setCurriculums] = useState([]);
  const [initialAcademicYear, setInitialAcademicYear] = useState(null);
  const [unmappedYears, setUnmappedYears] = useState([]);

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
          }
        }
      } catch (error) {
        console.error("Error fetching curriculums:", error);
        message.error("ไม่สามารถดึงข้อมูลหลักสูตรได้");
      }
    };

    fetchCurriculums();
  }, []);

  // เพิ่มการตรวจสอบความครบถ้วนของการกำหนดหลักสูตรสำหรับนักศึกษา
  useEffect(() => {
    const validateStudentCurriculumMapping = async () => {
      try {
        // ดึงข้อมูลการกำหนดหลักสูตรของนักศึกษา
        const mappingsResponse = await settingsService.getCurriculumMappings();

        // ตรวจสอบว่ามีการกำหนดหลักสูตรครบทุกปีการศึกษาที่มีนักศึกษาหรือไม่
        const studentsResponse = await studentService.getFilterOptions();
        const enrollYears = studentsResponse.enrollYears || [];

        // ตรวจสอบปีที่ไม่มีการกำหนดหลักสูตร
        const mappedYears =
          mappingsResponse.data?.map((m) => m.enrollYear) || [];
        const unmappedYearsList = enrollYears.filter(
          (year) => !mappedYears.includes(year)
        );

        setUnmappedYears(unmappedYearsList);

        if (unmappedYearsList.length > 0) {
          message.warning(
            `พบนักศึกษาที่ยังไม่ได้กำหนดหลักสูตร ปีที่เข้าศึกษา: ${unmappedYearsList.join(
              ", "
            )}`
          );
        }
      } catch (error) {
        console.error("Error validating curriculum mappings:", error);
      }
    };

    validateStudentCurriculumMapping();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const response = await settingsService.getAcademicSettings();
      if (response.success) {
        const data = response.data;

        form.setFieldsValue({
          currentAcademicYear: data.currentAcademicYear,
          currentSemester: data.currentSemester,

          // ข้อมูลภาคเรียน (คงเดิม)
          semester1Range: data.semesters?.["1"]?.range
            ? [
                moment(data.semesters["1"].range.start),
                moment(data.semesters["1"].range.end),
              ]
            : null,
          semester2Range: data.semesters?.["2"]?.range
            ? [
                moment(data.semesters["2"].range.start),
                moment(data.semesters["2"].range.end),
              ]
            : null,
          semester3Range: data.semesters?.["3"]?.range
            ? [
                moment(data.semesters["3"].range.start),
                moment(data.semesters["3"].range.end),
              ]
            : null,

          // ข้อมูลลงทะเบียนฝึกงาน
          internshipRegistrationStartDate: data.internshipRegistration
            ?.startDate
            ? moment(data.internshipRegistration.startDate)
            : null,
          internshipRegistrationEndDate: data.internshipRegistration?.endDate
            ? moment(data.internshipRegistration.endDate)
            : null,

          // ข้อมูลลงทะเบียนโครงงาน
          projectRegistrationStartDate: data.projectRegistration?.startDate
            ? moment(data.projectRegistration.startDate)
            : null,
          projectRegistrationEndDate: data.projectRegistration?.endDate
            ? moment(data.projectRegistration.endDate)
            : null,

          // ภาคเรียนที่เปิดให้ลงทะเบียน
          internshipSemesters: data.internshipSemesters || [3],
          projectSemesters: data.projectSemesters || [1, 2],
        });

        setInitialAcademicYear(data.currentAcademicYear);
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

      // ตรวจสอบก่อนบันทึก
      if (!checkDateOverlap(values)) {
        return;
      }

      // ยืนยันการเปลี่ยนแปลงปีการศึกษา (คงเดิม)
      if (
        initialAcademicYear &&
        values.currentAcademicYear !== initialAcademicYear
      ) {
        if (
          !window.confirm(
            `คุณกำลังเปลี่ยนปีการศึกษาจาก ${initialAcademicYear} เป็น ${values.currentAcademicYear} ซึ่งจะมีผลต่อการแสดงข้อมูลนักศึกษา คุณต้องการดำเนินการต่อหรือไม่?`
          )
        ) {
          return;
        }
      }

      setLoading(true);

      // แปลงรูปแบบข้อมูลสำหรับส่งไปยัง backend
      const formattedData = {
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
        // แยกช่วงลงทะเบียนเป็นสองส่วน
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
        // ภาคเรียนที่เปิดให้ลงทะเบียน
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

          {unmappedYears.length > 0 && (
            <Alert
              message="พบนักศึกษาที่ยังไม่ได้กำหนดหลักสูตร"
              description={
                <div>
                  ต้องกำหนดหลักสูตรสำหรับนักศึกษาที่เข้าปีการศึกษา:{" "}
                  {unmappedYears.join(", ")}
                  <br />
                  กรุณากำหนดในหน้า "หลักสูตรการศึกษา"
                </div>
              }
              type="error"
              showIcon
              style={{ marginBottom: "16px" }}
            />
          )}

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
              },
              {
                title: "ปีที่เริ่มใช้",
                dataIndex: "startYear",
                key: "startYear",
              },
            ]}
            dataSource={curriculums}
            locale={{
              emptyText:
                "ไม่พบหลักสูตรที่เปิดใช้งาน กรุณาตั้งค่าในหน้าจัดการหลักสูตร",
            }}
          />

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
                  format={DATE_FORMAT_SHORT}
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
                  format={DATE_FORMAT_SHORT}
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
                  format={DATE_FORMAT_SHORT}
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
                  format={DATE_FORMAT_SHORT}
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
                  format={DATE_FORMAT_SHORT}
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
                  format={DATE_FORMAT_SHORT}
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
                  format={DATE_FORMAT_SHORT}
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
