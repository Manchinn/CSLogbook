import React, { useState, useEffect, useRef, useCallback } from "react";
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
  Space,
  Tabs
} from "antd";
import { SaveOutlined, ReloadOutlined } from "@ant-design/icons";
import th_TH from "antd/lib/locale/th_TH";
import dayjs from "../../../../../utils/dayjs";
import { settingsService } from "../../../../../services/admin/settingsService";
import * as importantDeadlineService from "../../../../../services/admin/importantDeadlineService";
import {
  checkDateOverlap,
  getCurrentSemesterStatus,
  getInternshipRegistrationStatus,
  getProjectRegistrationStatus,
  isRegistrationOpenForSemester,
  loadCurriculumsProcess,
  loadAcademicSettingsProcess,
  saveAcademicSettingsProcess
} from "./academicUtils";
import ImportantDeadlinesManager from "./ImportantDeadlinesManager";
import ImportantDeadlinesSummary from "./ImportantDeadlinesSummary";

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

const AcademicSettings = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [curriculums, setCurriculums] = useState([]);
  const [selectedCurriculumId, setSelectedCurriculumId] = useState(null);

  const [deadlines, setDeadlines] = useState([]);
  const [deadlinesLoading, setDeadlinesLoading] = useState(false);
  const [deadlinesAcademicYear, setDeadlinesAcademicYear] = useState(null);
  const [deadlinesSemester, setDeadlinesSemester] = useState(null);
  const [filtersReady, setFiltersReady] = useState(false);

  const deadlinesManagerRef = useRef(null);

  const fetchAndSetCurriculums = useCallback(async () => {
    const {
      activeCurriculums,
      initialSelectedCurriculumId,
      warningMessage,
      errorMessage
    } = await loadCurriculumsProcess(settingsService.getCurriculums);

    if (errorMessage) {
      message.error(errorMessage);
    }
    if (warningMessage) {
      message.warning(warningMessage);
    }

    setCurriculums(activeCurriculums || []);
    if (initialSelectedCurriculumId) {
      setSelectedCurriculumId(initialSelectedCurriculumId);
      form.setFieldsValue({ selectedCurriculum: initialSelectedCurriculumId });
    }
  }, [form]);

  const fetchAndSetSettings = useCallback(
    async ({ syncFilters = false } = {}) => {
      const { formValues, errorMessage } = await loadAcademicSettingsProcess(
        settingsService.getAcademicSettings
      );

      if (errorMessage) {
        message.error(errorMessage);
        return;
      }

      if (formValues && Object.keys(formValues).length) {
        form.setFieldsValue(formValues);
        if (formValues.activeCurriculumId) {
          setSelectedCurriculumId(formValues.activeCurriculumId);
        }
        if (formValues.currentAcademicYear !== undefined) {
          setDeadlinesAcademicYear((prev) =>
            syncFilters || prev === null || prev === undefined
              ? formValues.currentAcademicYear
              : prev
          );
        }
        if (formValues.currentSemester !== undefined) {
          setDeadlinesSemester((prev) =>
            syncFilters || prev === null || prev === undefined
              ? formValues.currentSemester
              : prev
          );
        }
      } else {
        message.error("ไม่สามารถโหลดข้อมูลการตั้งค่าเริ่มต้นได้");
      }
    },
    [form]
  );

  const fetchDeadlines = useCallback(async () => {
    setDeadlinesLoading(true);
    try {
      const response = await importantDeadlineService.getDeadlines({
        academicYear: deadlinesAcademicYear ?? undefined,
        semester: deadlinesSemester ?? undefined,
        includeAll: true
      });
      const payload = response?.data;
      if (payload?.success) {
        setDeadlines(Array.isArray(payload.data) ? payload.data : []);
      } else if (payload?.message) {
        message.error(payload.message);
        setDeadlines([]);
      } else {
        setDeadlines([]);
      }
    } catch (error) {
      console.error("fetchDeadlines error:", error);
      message.error("ไม่สามารถดึงข้อมูลกำหนดการได้");
      setDeadlines([]);
    } finally {
      setDeadlinesLoading(false);
    }
  }, [deadlinesAcademicYear, deadlinesSemester]);

  const initializeData = useCallback(async () => {
    setLoading(true);
    setFiltersReady(false);
    try {
      await Promise.all([
        fetchAndSetCurriculums(),
        fetchAndSetSettings({ syncFilters: true })
      ]);
    } finally {
      setLoading(false);
      setFiltersReady(true);
    }
  }, [fetchAndSetCurriculums, fetchAndSetSettings]);

  useEffect(() => {
    initializeData();
  }, [initializeData]);

  useEffect(() => {
    if (!filtersReady) {
      return;
    }
    fetchDeadlines();
  }, [filtersReady, fetchDeadlines]);

  const handleCurriculumChange = (value) => {
    setSelectedCurriculumId(value);
    const selectedCurriculum = curriculums.find(
      (curriculum) => curriculum.curriculumId === value
    );
    if (selectedCurriculum) {
      message.success(
        `เลือกหลักสูตร ${selectedCurriculum.shortName || selectedCurriculum.name} เป็นหลักสูตรหลัก`
      );
    }
    form.setFieldsValue({ selectedCurriculum: value });
  };

  const handleSave = async () => {
    setLoading(true);
    const { success, statusMessage } = await saveAcademicSettingsProcess(
      settingsService.updateAcademicSettings,
      form,
      checkDateOverlap
    );
    setLoading(false);

    if (success) {
      message.success(statusMessage);
      await fetchAndSetSettings({ syncFilters: true });
      fetchDeadlines();
    } else {
      message.error(statusMessage);
    }
  };

  const handleAcademicYearFilterChange = (value) => {
    const normalized = value ?? null;
    if (deadlinesAcademicYear === normalized) {
      fetchDeadlines();
    } else {
      setDeadlinesAcademicYear(normalized);
    }
  };

  const handleResetAcademicYearFilter = () => {
    const currentYear = form.getFieldValue("currentAcademicYear") || null;
    if (deadlinesAcademicYear === currentYear) {
      fetchDeadlines();
    } else {
      setDeadlinesAcademicYear(currentYear);
    }
  };

  const handleSemesterFilterChange = (value) => {
    const normalized = value ?? null;
    if (deadlinesSemester === normalized) {
      fetchDeadlines();
    } else {
      setDeadlinesSemester(normalized);
    }
  };

  const currentYearValue = form.getFieldValue("currentAcademicYear") || 2567;
  const managerAcademicYear = deadlinesAcademicYear ?? currentYearValue;

  if (loading && !form.getFieldValue("currentAcademicYear")) {
    return <Spin tip="กำลังโหลดข้อมูล..." />;
  }

  const deadlinesTabContent = (
    <Space direction="vertical" size="large" style={{ width: "100%" }}>
      <ImportantDeadlinesSummary
        academicYearFilter={deadlinesAcademicYear}
        onAcademicYearChange={handleAcademicYearFilterChange}
        onResetAcademicYear={handleResetAcademicYearFilter}
        semesterFilter={deadlinesSemester}
        onSemesterChange={handleSemesterFilterChange}
        deadlines={deadlines}
        loading={deadlinesLoading}
        onRefresh={fetchDeadlines}
        onEditDeadline={(deadline) =>
          deadlinesManagerRef.current?.openEdit(deadline)
        }
        onCreateDeadline={() =>
          deadlinesManagerRef.current?.openAdd(
            deadlinesSemester || form.getFieldValue("currentSemester") || 1
          )
        }
      />
      <ImportantDeadlinesManager
        ref={deadlinesManagerRef}
        academicYear={managerAcademicYear}
        deadlines={deadlines}
        loading={deadlinesLoading}
        onReload={fetchDeadlines}
      />
    </Space>
  );

  const settingsTabContent = (
    <Row gutter={[16, 16]} align="stretch">
      <Col span={24}>
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            currentAcademicYear: 2567,
            currentSemester: 1
          }}
        >
          <Form.Item name="id" hidden>
            <Input />
          </Form.Item>

          <Card className="settings-card">
            <Title level={4}>ปีการศึกษาและภาคเรียนปัจจุบัน</Title>
            <Text type="secondary">
              ปีการศึกษาและภาคเรียนปัจจุบันจะใช้เป็นค่าตั้งต้นสำหรับการสมัครฝึกงานและโครงงาน
            </Text>

            <Row gutter={16} style={{ marginTop: 16 }}>
              <Col span={12}>
                <Form.Item
                  name="currentSemester"
                  label={
                    <span style={{ fontSize: 16, fontWeight: 600 }}>
                      ภาคเรียนปัจจุบัน
                    </span>
                  }
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
                  label={
                    <span style={{ fontSize: 16, fontWeight: 600 }}>
                      ปีการศึกษา
                    </span>
                  }
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

            <Divider orientation="left">
              หลักสูตรที่ใช้งานในปีการศึกษานี้
            </Divider>

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
                    loading={loading}
                  >
                    {curriculums.map((curriculum) => (
                      <Option
                        key={curriculum.curriculumId}
                        value={curriculum.curriculumId}
                      >
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
                      key: "code"
                    },
                    {
                      title: "ชื่อหลักสูตร",
                      dataIndex: "shortName",
                      key: "shortName",
                      render: (text, record) =>
                        record.shortName || record.name
                    },
                    {
                      title: "ปีที่เริ่มใช้",
                      dataIndex: "startYear",
                      key: "startYear"
                    },
                    {
                      title: "หน่วยกิตสะสมขั้นต่ำ (ฝึกงาน)",
                      dataIndex: "internshipBaseCredits",
                      key: "internshipBaseCredits"
                    },
                    {
                      title: "หน่วยกิตสะสมขั้นต่ำ (โครงงาน)",
                      dataIndex: "projectBaseCredits",
                      key: "projectBaseCredits"
                    }
                  ]}
                  dataSource={curriculums
                    .filter(
                      (curriculum) =>
                        curriculum.curriculumId === selectedCurriculumId
                    )
                    .map((curriculum) => ({
                      ...curriculum,
                      key: curriculum.curriculumId
                    }))}
                  locale={{ emptyText: "ไม่พบข้อมูลหลักสูตรที่เลือก" }}
                />
              </div>
            )}

            <Divider orientation="left">สถานะภาคเรียน</Divider>
            {getCurrentSemesterStatus(form)}

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
                    isRegistrationOpenForSemester(form).project
                      ? "green"
                      : "red"
                  }
                >
                  {isRegistrationOpenForSemester(form).project
                    ? "เปิด"
                    : "ปิด"}
                  ลงทะเบียนโครงงาน
                </Tag>
              </div>
            </div>
          </Card>

          <Divider />

          <Card className="settings-card">
            <Title level={5}>
              ช่วงเวลาปีการศึกษา {currentYearValue}
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
                      message: "กรุณาเลือกช่วงเวลาภาคเรียนที่ 1"
                    }
                  ]}
                >
                  <RangePicker
                    style={{ width: "100%" }}
                    format={(value) => dayjs(value).format("D MMMM BBBB")}
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
                      message: "กรุณาเลือกช่วงเวลาภาคเรียนที่ 2"
                    }
                  ]}
                >
                  <RangePicker
                    style={{ width: "100%" }}
                    format={(value) => dayjs(value).format("D MMMM BBBB")}
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
                    {
                      required: true,
                      message: "กรุณาเลือกช่วงเวลาภาคฤดูร้อน"
                    }
                  ]}
                >
                  <RangePicker
                    style={{ width: "100%" }}
                    format={(value) => dayjs(value).format("D MMMM BBBB")}
                    locale={th_TH}
                    placeholder={["วันเริ่มต้น", "วันสิ้นสุด"]}
                  />
                </Form.Item>
              </Col>

              <Col span={24}>
                <Form.Item
                  name="semesterSummerRange"
                  label="ช่วงเวลาภาคฤดูร้อน (หากมี)"
                >
                  <RangePicker
                    style={{ width: "100%" }}
                    format={(value) => dayjs(value).format("D MMMM BBBB")}
                    locale={th_TH}
                    placeholder={["วันเริ่มต้น", "วันสิ้นสุด"]}
                  />
                </Form.Item>
              </Col>
            </Row>
          </Card>

          <Divider />

          <Card className="settings-card">
            <Title level={5}>ช่วงเวลาการลงทะเบียนโครงงาน</Title>
            <Text type="secondary">
              ระบุช่วงเวลาการลงทะเบียนของนิสิตสำหรับโครงงานในแต่ละภาคเรียน
            </Text>

            <Row gutter={16} style={{ marginTop: 16 }}>
              <Col span={24}>
                <Form.Item
                  name="projectRegistrationOpenDate"
                  label="วันเปิดรับลงทะเบียนโครงงาน"
                  rules={[{ required: true, message: "กรุณาเลือกวันเปิดรับ" }]}
                >
                  <DatePicker
                    style={{ width: "100%" }}
                    format={(value) => dayjs(value).format("D MMMM BBBB")}
                    locale={th_TH}
                  />
                </Form.Item>
              </Col>

              <Col span={24}>
                <Form.Item
                  name="projectRegistrationCloseDate"
                  label="วันปิดรับลงทะเบียนโครงงาน"
                  rules={[{ required: true, message: "กรุณาเลือกวันปิดรับ" }]}
                >
                  <DatePicker
                    style={{ width: "100%" }}
                    format={(value) => dayjs(value).format("D MMMM BBBB")}
                    locale={th_TH}
                  />
                </Form.Item>
              </Col>
            </Row>
          </Card>

          <Divider />

          <Card className="settings-card">
            <Title level={5}>ช่วงเวลาการลงทะเบียนฝึกงาน</Title>
            <Text type="secondary">
              ระบุช่วงเวลาการลงทะเบียนฝึกงานของนิสิตสำหรับแต่ละภาคเรียน
            </Text>

            <Row gutter={16} style={{ marginTop: 16 }}>
              <Col span={24}>
                <Form.Item
                  name="internshipRegistrationOpenDate"
                  label="วันเปิดรับลงทะเบียนฝึกงาน"
                  rules={[{ required: true, message: "กรุณาเลือกวันเปิดรับ" }]}
                >
                  <DatePicker
                    style={{ width: "100%" }}
                    format={(value) => dayjs(value).format("D MMMM BBBB")}
                    locale={th_TH}
                  />
                </Form.Item>
              </Col>

              <Col span={24}>
                <Form.Item
                  name="internshipRegistrationCloseDate"
                  label="วันปิดรับลงทะเบียนฝึกงาน"
                  rules={[{ required: true, message: "กรุณาเลือกวันปิดรับ" }]}
                >
                  <DatePicker
                    style={{ width: "100%" }}
                    format={(value) => dayjs(value).format("D MMMM BBBB")}
                    locale={th_TH}
                  />
                </Form.Item>
              </Col>
            </Row>
          </Card>

          <Divider />

          <Card className="settings-card">
            <Title level={5}>จำนวนครั้งที่นิสิตสามารถลงทะเบียนโครงงานได้</Title>
            <Text type="secondary">
              ระบุจำนวนครั้งสูงสุดที่อนุญาตให้ลงทะเบียนใหม่
            </Text>

            <Row gutter={16} style={{ marginTop: 16 }}>
              <Col span={12}>
                <Form.Item
                  name="projectRegistrationLimit"
                  label="จำนวนครั้งสูงสุด"
                  rules={[{ required: true, message: "กรุณากรอกจำนวนครั้ง" }]}
                >
                  <InputNumber min={1} style={{ width: "100%" }} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="projectRegistrationInterval"
                  label="จำนวนวันที่ต้องรอก่อนลงทะเบียนใหม่"
                  rules={[{ required: true, message: "กรุณากรอกจำนวนวัน" }]}
                >
                  <InputNumber min={0} style={{ width: "100%" }} />
                </Form.Item>
              </Col>
            </Row>
          </Card>

          <Divider />

          <Card className="settings-card">
            <Title level={5}>ข้อมูลติดต่อผู้รับผิดชอบ</Title>
            <Text type="secondary">กรอกข้อมูลผู้ประสานงานสำหรับนิสิต</Text>

            <Row gutter={16} style={{ marginTop: 16 }}>
              <Col span={12}>
                <Form.Item
                  name="contactName"
                  label="ชื่อ-สกุล"
                  rules={[{ required: true, message: "กรุณากรอกชื่อ-สกุล" }]}
                >
                  <Input placeholder="เช่น อ.สมชาย ใจดี" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="contactEmail"
                  label="อีเมล"
                  rules={[{ required: true, message: "กรุณากรอกอีเมล" }]}
                >
                  <Input placeholder="example@ku.th" />
                </Form.Item>
              </Col>
              <Col span={24}>
                <Form.Item
                  name="contactPhone"
                  label="เบอร์ติดต่อ"
                  rules={[{ required: true, message: "กรุณากรอกเบอร์ติดต่อ" }]}
                >
                  <Input placeholder="0X-XXX-XXXX" />
                </Form.Item>
              </Col>
            </Row>
          </Card>

          <Divider />

          <Card className="settings-card">
            <Title level={5}>การแจ้งเตือนและประกาศ</Title>
            <Text type="secondary">กำหนดการแจ้งเตือนสำคัญสำหรับนิสิต</Text>

            <Row gutter={16} style={{ marginTop: 16 }}>
              <Col span={24}>
                <Form.Item
                  name="announcementSchedule"
                  label="ตารางประกาศสำคัญ"
                >
                  <Input.TextArea
                    rows={4}
                    placeholder="ระบุรายละเอียดประกาศสำคัญ"
                  />
                </Form.Item>
              </Col>
            </Row>
          </Card>

          <Divider />

          <Card className="settings-card">
            <Title level={5}>ตั้งค่าระบบตรวจสอบคุณสมบัตินิสิต</Title>
            <Text type="secondary">
              ระบุเงื่อนไขที่ต้องตรวจสอบก่อนอนุมัติการสมัคร
            </Text>

            <Row gutter={16} style={{ marginTop: 16 }}>
              <Col span={24}>
                <Form.Item
                  name="eligibilityCriteria"
                  label="เงื่อนไขคุณสมบัติ"
                >
                  <Input.TextArea
                    rows={4}
                    placeholder="ระบุเงื่อนไข เช่น ต้องผ่านวิชาไมโครคอนโทรลเลอร์"
                  />
                </Form.Item>
              </Col>
            </Row>
          </Card>

          <Divider />

          <Card className="settings-card">
            <Title level={5}>ตั้งค่าการแจ้งเตือนผ่านอีเมล</Title>
            <Text type="secondary">
              เลือกเหตุการณ์ที่ต้องการให้ระบบส่งอีเมลแจ้งเตือนอัตโนมัติ
            </Text>

            <Row gutter={16} style={{ marginTop: 16 }}>
              <Col span={24}>
                <Form.Item
                  name="emailNotificationSettings"
                  label="การแจ้งเตือนที่เปิดใช้งาน"
                >
                  <Select mode="multiple" placeholder="เลือกเหตุการณ์" allowClear>
                    <Option value="internshipApproval">
                      แจ้งเตือนอนุมัติฝึกงาน
                    </Option>
                    <Option value="projectApproval">
                      แจ้งเตือนอนุมัติโครงงาน
                    </Option>
                    <Option value="submissionDeadline">
                      แจ้งเตือนใกล้ครบกำหนดส่ง
                    </Option>
                    <Option value="meetingReminder">
                      แจ้งเตือนการนัดหมาย
                    </Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>
          </Card>

          <Divider />

          <Card className="settings-card">
            <Title level={5}>การสำรองข้อมูล</Title>
            <Text type="secondary">
              กำหนดการสำรองข้อมูลระบบเพื่อความปลอดภัย
            </Text>

            <Row gutter={16} style={{ marginTop: 16 }}>
              <Col span={24}>
                <Form.Item
                  name="backupSchedule"
                  label="ตารางสำรองข้อมูล"
                >
                  <Select placeholder="เลือกความถี่ในการสำรองข้อมูล">
                    <Option value="daily">ทุกวัน</Option>
                    <Option value="weekly">ทุกสัปดาห์</Option>
                    <Option value="monthly">ทุกเดือน</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>
          </Card>

          <Divider />

          <Card className="settings-card">
            <Title level={5}>ตั้งค่าการแจ้งเตือนผ่าน Line Notify</Title>
            <Text type="secondary">
              ระบุ Access Token เพื่อให้ระบบส่งการแจ้งเตือนผ่าน Line
            </Text>

            <Row gutter={16} style={{ marginTop: 16 }}>
              <Col span={24}>
                <Form.Item name="lineNotifyToken" label="Line Notify Token">
                  <Input.Password placeholder="กรอก Line Notify Token" />
                </Form.Item>
              </Col>
            </Row>
          </Card>

          <Divider />

          <Card className="settings-card">
            <Title level={5}>ตั้งค่าระบบบันทึกกิจกรรม</Title>
            <Text type="secondary">
              เลือกประเภทกิจกรรมที่ต้องการให้บันทึกในระบบ
            </Text>

            <Row gutter={16} style={{ marginTop: 16 }}>
              <Col span={24}>
                <Form.Item
                  name="activityLoggingOptions"
                  label="กิจกรรมที่ต้องการบันทึก"
                >
                  <Select mode="multiple" placeholder="เลือกกิจกรรม" allowClear>
                    <Option value="login">การเข้าสู่ระบบ</Option>
                    <Option value="submission">การส่งงาน</Option>
                    <Option value="approval">การอนุมัติ</Option>
                    <Option value="feedback">การให้ข้อเสนอแนะ</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>
          </Card>

          <Divider />

          <Card className="settings-card">
            <Row gutter={16}>
              <Col span={24}>
                <Form.Item
                  name="internshipSemesters"
                  label="ภาคเรียนที่เปิดให้ลงทะเบียนฝึกงาน"
                  initialValue={[3]}
                >
                  <Select mode="multiple">
                    <Option value={1}>ภาคเรียนที่ 1</Option>
                    <Option value={2}>ภาคเรียนที่ 2</Option>
                    <Option value={3}>ภาคฤดูร้อน</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={24}>
                <Form.Item
                  name="projectSemesters"
                  label="ภาคเรียนที่เปิดให้ลงทะเบียนโครงงาน"
                  initialValue={[1, 2]}
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

          <Divider />

          <div className="setting-actions">
            <Button
              icon={<ReloadOutlined />}
              onClick={() => initializeData()}
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
      </Col>
    </Row>
  );

  return (
    <div className="academic-settings">
      <Tabs
        defaultActiveKey="settings"
        items={[
          {
            key: "settings",
            label: "ตั้งค่าปีการศึกษา",
            children: settingsTabContent
          },
          {
            key: "deadlines",
            label: "ตารางกำหนดการสำคัญ",
            children: deadlinesTabContent
          }
        ]}
      />
    </div>
  );
};

export default AcademicSettings;
