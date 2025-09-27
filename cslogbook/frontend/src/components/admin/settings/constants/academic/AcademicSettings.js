import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
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
  Tag,
  Alert,
  Space,
  Tabs,
  Steps,
  Drawer,
  Descriptions,
  Timeline,
  Switch
} from "antd";
import { SaveOutlined, ReloadOutlined } from "@ant-design/icons";
import th_TH from "antd/lib/locale/th_TH";
import dayjs from "../../../../../utils/dayjs";
import { settingsService } from "../../../../../services/admin/settingsService";
import * as importantDeadlineService from "../../../../../services/admin/importantDeadlineService";
import {
  checkDateOverlap,
  getInternshipRegistrationStatus,
  getProjectRegistrationStatus,
  isRegistrationOpenForSemester,
  loadCurriculumsProcess,
  loadAcademicSettingsProcess,
  saveAcademicSettingsProcess
} from "./academicUtils";
import ImportantDeadlinesManager from "./ImportantDeadlinesManager";
import ImportantDeadlinesSummary from "./ImportantDeadlinesSummary";

const { Text } = Typography;
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
  const [autoProjectRange, setAutoProjectRange] = useState(false);

  const currentAcademicYearWatch = Form.useWatch("currentAcademicYear", form);
  const currentSemesterWatch = Form.useWatch("currentSemester", form);
  const semester1RangeWatch = Form.useWatch("semester1Range", form);
  const semester2RangeWatch = Form.useWatch("semester2Range", form);
  const semester3RangeWatch = Form.useWatch("semester3Range", form);
  const projectRegistrationOpenWatch = Form.useWatch(
    "projectRegistrationOpenDate",
    form
  );
  const projectRegistrationCloseWatch = Form.useWatch(
    "projectRegistrationCloseDate",
    form
  );
  const internshipRegistrationOpenWatch = Form.useWatch(
    "internshipRegistrationOpenDate",
    form
  );
  const internshipRegistrationCloseWatch = Form.useWatch(
    "internshipRegistrationCloseDate",
    form
  );

  const selectedCurriculum = useMemo(
    () =>
      curriculums.find(
        (curriculum) => curriculum.curriculumId === selectedCurriculumId
      ) || null,
    [curriculums, selectedCurriculumId]
  );

  const getSemesterRangeByValue = useCallback(
    (semesterValue) => {
      if (!semesterValue) {
        return null;
      }
      if (semesterValue === 1) {
        return semester1RangeWatch || null;
      }
      if (semesterValue === 2) {
        return semester2RangeWatch || null;
      }
      if (semesterValue === 3) {
        return semester3RangeWatch || null;
      }
      return null;
    },
    [semester1RangeWatch, semester2RangeWatch, semester3RangeWatch]
  );

  const currentSemesterRange = useMemo(
    () => getSemesterRangeByValue(currentSemesterWatch),
    [currentSemesterWatch, getSemesterRangeByValue]
  );

  const formatRangeDisplay = useCallback(
    (range) => {
      if (!range || !range[0] || !range[1]) {
        return "ยังไม่กำหนด";
      }
      return `${dayjs(range[0]).format("D MMM BBBB")} - ${dayjs(range[1]).format(
        "D MMM BBBB"
      )}`;
    },
    []
  );

  const semesterTimelineItems = useMemo(() => {
    const config = [
      { key: "1", label: "ภาคเรียนที่ 1", range: semester1RangeWatch },
      { key: "2", label: "ภาคเรียนที่ 2", range: semester2RangeWatch },
      { key: "3", label: "ภาคฤดูร้อน", range: semester3RangeWatch }
    ];

    return config.map(({ key, label, range }) => ({
      key,
      color: range && range[0] && range[1] ? "green" : "red",
      children: (
        <div>
          <Text strong>{label}</Text>
          <div>{formatRangeDisplay(range)}</div>
        </div>
      )
    }));
  }, [formatRangeDisplay, semester1RangeWatch, semester2RangeWatch, semester3RangeWatch]);

  // ตรวจสอบว่าช่วงลงทะเบียนโครงงานอยู่ภายในช่วงภาคเรียนและมีลำดับวันถูกต้อง
  const projectRegistrationValidation = useMemo(() => {
    if (
      !projectRegistrationOpenWatch ||
      !projectRegistrationCloseWatch ||
      !currentSemesterRange ||
      !currentSemesterRange[0] ||
      !currentSemesterRange[1]
    ) {
      return { status: "unknown", message: "" };
    }

    const openDate = dayjs(projectRegistrationOpenWatch);
    const closeDate = dayjs(projectRegistrationCloseWatch);
    const semesterStart = dayjs(currentSemesterRange[0]);
    const semesterEnd = dayjs(currentSemesterRange[1]);

    if (openDate.isBefore(semesterStart) || closeDate.isAfter(semesterEnd)) {
      return {
        status: "warning",
        message: "ช่วงลงทะเบียนโครงงานอยู่นอกช่วงเวลาภาคเรียนปัจจุบัน"
      };
    }

    if (closeDate.isBefore(openDate)) {
      return {
        status: "error",
        message: "วันปิดรับต้องอยู่หลังวันเปิดรับ"
      };
    }

    return {
      status: "ok",
      message: ""
    };
  }, [currentSemesterRange, projectRegistrationCloseWatch, projectRegistrationOpenWatch]);

  const stepsItems = useMemo(
    () => [
      {
        key: "step1",
        title: "ขั้นตอนที่ 1",
        description: "เลือกหลักสูตรและตั้งค่าปีการศึกษา"
      },
      {
        key: "step2",
        title: "ขั้นตอนที่ 2",
        description: "กำหนดช่วงเวลาของแต่ละภาคเรียน"
      },
      {
        key: "step3",
        title: "ขั้นตอนที่ 3",
        description: "ตั้งช่วงเวลาการลงทะเบียนโครงงาน"
      }
    ],
    []
  );

  const stepsCurrent = useMemo(() => {
    if (!selectedCurriculumId || !currentAcademicYearWatch || !currentSemesterWatch) {
      return 0;
    }

    if (
      !semester1RangeWatch ||
      !semester1RangeWatch[0] ||
      !semester1RangeWatch[1] ||
      !semester2RangeWatch ||
      !semester2RangeWatch[0] ||
      !semester2RangeWatch[1] ||
      !semester3RangeWatch ||
      !semester3RangeWatch[0] ||
      !semester3RangeWatch[1]
    ) {
      return 1;
    }

    return 2;
  }, [
    currentAcademicYearWatch,
    currentSemesterWatch,
    selectedCurriculumId,
    semester1RangeWatch,
    semester2RangeWatch,
    semester3RangeWatch
  ]);

  const currentYearValue = currentAcademicYearWatch || 2567;
  const projectRegistrationRangeDisplay = formatRangeDisplay(
    projectRegistrationOpenWatch && projectRegistrationCloseWatch
      ? [projectRegistrationOpenWatch, projectRegistrationCloseWatch]
      : null
  );
  const internshipRegistrationRangeDisplay = formatRangeDisplay(
    internshipRegistrationOpenWatch && internshipRegistrationCloseWatch
      ? [internshipRegistrationOpenWatch, internshipRegistrationCloseWatch]
      : null
  );
  const registrationStatuses = isRegistrationOpenForSemester(form);

  // เมื่อเปิดโหมดอัตโนมัติให้ซิงค์วันเปิด/ปิดกับช่วงภาคเรียนล่าสุด
  useEffect(() => {
    if (!autoProjectRange) {
      return;
    }
    if (!currentSemesterRange || !currentSemesterRange[0] || !currentSemesterRange[1]) {
      return;
    }
    form.setFieldsValue({
      projectRegistrationOpenDate: currentSemesterRange[0],
      projectRegistrationCloseDate: currentSemesterRange[1]
    });
  }, [autoProjectRange, currentSemesterRange, form]);

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

        const semesterMap = {
          1: formValues.semester1Range,
          2: formValues.semester2Range,
          3: formValues.semester3Range
        };
        const expectedRange = semesterMap[formValues.currentSemester] || null;
  const projectStart = formValues.projectRegistrationOpenDate || null;
  const projectEnd = formValues.projectRegistrationCloseDate || null;

        if (
          expectedRange &&
          expectedRange[0] &&
          expectedRange[1] &&
          projectStart &&
          projectEnd &&
          dayjs(projectStart).isSame(expectedRange[0], "day") &&
          dayjs(projectEnd).isSame(expectedRange[1], "day")
        ) {
          setAutoProjectRange(true);
        } else {
          setAutoProjectRange(false);
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

  const handleAutoProjectRangeChange = (checked) => {
    setAutoProjectRange(checked);
    const semesterRange = getSemesterRangeByValue(
      form.getFieldValue("currentSemester")
    );

    if (!checked) {
      return;
    }

    if (!semesterRange || !semesterRange[0] || !semesterRange[1]) {
      message.warning("กรุณากำหนดช่วงเวลาภาคเรียนก่อนเปิดใช้งานการคำนวณอัตโนมัติ");
      setAutoProjectRange(false);
      return;
    }

    form.setFieldsValue({
      projectRegistrationOpenDate: semesterRange[0],
      projectRegistrationCloseDate: semesterRange[1]
    });
    message.success("ตั้งค่าช่วงลงทะเบียนโครงงานให้ตรงกับช่วงภาคเรียนแล้ว");
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

          <Space direction="vertical" size="large" style={{ width: "100%" }}>
            <Card className="settings-card" bodyStyle={{ padding: "16px 24px" }}>
              <Steps size="small" current={stepsCurrent} items={stepsItems} responsive />
            </Card>

            <Card
              className="settings-card"
              title="ขั้นตอนที่ 1: เลือกหลักสูตรและตั้งค่าปีการศึกษา"
            >
              <Space direction="vertical" size="large" style={{ width: "100%" }}>
                <Row gutter={16}>
                  <Col xs={24} md={14}>
                    <Form.Item
                      name="selectedCurriculum"
                      label="เลือกหลักสูตรหลักที่ใช้ในปีการศึกษานี้"
                      rules={[{ required: true, message: "กรุณาเลือกหลักสูตร" }]}
                    >
                      <Select
                        placeholder="เลือกหลักสูตร"
                        onChange={handleCurriculumChange}
                        loading={loading}
                        allowClear
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
                  <Col xs={24} md={10}>
                    <Alert
                      message="หลักสูตรนี้จะเป็นค่าอ้างอิงหลักสำหรับสิทธิ์ฝึกงานและโครงงาน"
                      type="info"
                      showIcon
                    />
                  </Col>
                </Row>

                <Row gutter={16}>
                  <Col xs={24} md={12}>
                    <Form.Item
                      name="currentSemester"
                      label="ภาคเรียนปัจจุบัน"
                      rules={[{ required: true, message: "กรุณาเลือกภาคเรียน" }]}
                    >
                      <Select placeholder="เลือกภาคเรียน">
                        <Option value={1}>ภาคเรียนที่ 1</Option>
                        <Option value={2}>ภาคเรียนที่ 2</Option>
                        <Option value={3}>ภาคฤดูร้อน</Option>
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
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

                {selectedCurriculum ? (
                  <Descriptions column={2} size="small" bordered>
                    <Descriptions.Item label="รหัสหลักสูตร">
                      {selectedCurriculum.code}
                    </Descriptions.Item>
                    <Descriptions.Item label="ชื่อหลักสูตร">
                      {selectedCurriculum.shortName || selectedCurriculum.name}
                    </Descriptions.Item>
                    <Descriptions.Item label="ปีที่เริ่มใช้">
                      {selectedCurriculum.startYear || "-"}
                    </Descriptions.Item>
                    <Descriptions.Item label="รวมหน่วยกิตสูงสุด">
                      {selectedCurriculum.maxCredits || "-"}
                    </Descriptions.Item>
                    <Descriptions.Item label="ขั้นต่ำฝึกงาน">
                      {selectedCurriculum.internshipBaseCredits ?? "-"}
                    </Descriptions.Item>
                    <Descriptions.Item label="ขั้นต่ำโครงงาน">
                      {selectedCurriculum.projectBaseCredits ?? "-"}
                    </Descriptions.Item>
                  </Descriptions>
                ) : (
                  <Alert
                    type="warning"
                    showIcon
                    message="กรุณาเลือกหลักสูตรเพื่อดูข้อมูลประกอบ"
                  />
                )}
              </Space>
            </Card>

            <Card
              className="settings-card"
              title={`ขั้นตอนที่ 2: กำหนดช่วงเวลาของแต่ละภาคเรียน (${currentYearValue})`}
            >
              <Space direction="vertical" size="large" style={{ width: "100%" }}>
                <Text type="secondary">
                  กรอกช่วงเวลาของแต่ละภาคเรียนให้ครบเพื่อป้องกันความสับสนของระบบและผู้ใช้งาน
                </Text>
                <Row gutter={24}>
                  <Col xs={24} md={14}>
                    <Tabs
                      type="card"
                      size="large"
                      items={[
                        {
                          key: "semester1",
                          label: "ภาคเรียนที่ 1",
                          children: (
                            <Form.Item
                              name="semester1Range"
                              rules={[
                                {
                                  required: true,
                                  message: "กรุณากำหนดช่วงเวลาภาคเรียนที่ 1"
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
                          )
                        },
                        {
                          key: "semester2",
                          label: "ภาคเรียนที่ 2",
                          children: (
                            <Form.Item
                              name="semester2Range"
                              rules={[
                                {
                                  required: true,
                                  message: "กรุณากำหนดช่วงเวลาภาคเรียนที่ 2"
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
                          )
                        },
                        {
                          key: "semester3",
                          label: "ภาคฤดูร้อน",
                          children: (
                            <Form.Item
                              name="semester3Range"
                              rules={[
                                {
                                  required: true,
                                  message: "กรุณากำหนดช่วงเวลาภาคฤดูร้อน"
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
                          )
                        }
                      ]}
                    />
                  </Col>
                  <Col xs={24} md={10}>
                    <Text strong>ภาพรวมไทม์ไลน์ปีการศึกษา</Text>
                    <Timeline items={semesterTimelineItems} style={{ marginTop: 16 }} />
                    <Alert
                      style={{ marginTop: 16 }}
                      type="success"
                      showIcon
                      message="ระบบจะแจ้งเตือนหากช่วงเวลาทับซ้อนเมื่อกดบันทึก"
                    />
                  </Col>
                </Row>
              </Space>
            </Card>

            <Card
              className="settings-card"
              title="ขั้นตอนที่ 3: ตั้งช่วงเวลาการลงทะเบียนโครงงาน"
            >
              <Space direction="vertical" size="large" style={{ width: "100%" }}>
                <Text type="secondary">
                  เลือกช่วงเปิดและปิดรับลงทะเบียนให้สอดคล้องกับภาคเรียนที่กำลังใช้งาน
                </Text>

                <Space align="center" style={{ marginBottom: 8 }}>
                  <Switch
                    checked={autoProjectRange}
                    onChange={handleAutoProjectRangeChange}
                  />
                  <Text>ใช้ช่วงเวลาเดียวกับภาคเรียนปัจจุบันโดยอัตโนมัติ</Text>
                </Space>

                {projectRegistrationValidation.status === "warning" && (
                  <Alert
                    type="warning"
                    showIcon
                    message={projectRegistrationValidation.message}
                  />
                )}
                {projectRegistrationValidation.status === "error" && (
                  <Alert
                    type="error"
                    showIcon
                    message={projectRegistrationValidation.message}
                  />
                )}

                <Row gutter={16}>
                  <Col xs={24} md={12}>
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
                  <Col xs={24} md={12}>
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

                <Row gutter={16}>
                  <Col xs={24} md={12}>
                    <Form.Item
                      name="projectSemesters"
                      label="ภาคเรียนที่เปิดให้ลงทะเบียนโครงงาน"
                      initialValue={[1, 2]}
                    >
                      <Select mode="multiple" placeholder="เลือกภาคเรียนที่เปิดรับ">
                        <Option value={1}>ภาคเรียนที่ 1</Option>
                        <Option value={2}>ภาคเรียนที่ 2</Option>
                        <Option value={3}>ภาคฤดูร้อน</Option>
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item
                      name="internshipSemesters"
                      label="ภาคเรียนที่เปิดให้ลงทะเบียนฝึกงาน"
                      initialValue={[3]}
                    >
                      <Select mode="multiple" placeholder="เลือกภาคเรียนที่เปิดรับ">
                        <Option value={1}>ภาคเรียนที่ 1</Option>
                        <Option value={2}>ภาคเรียนที่ 2</Option>
                        <Option value={3}>ภาคฤดูร้อน</Option>
                      </Select>
                    </Form.Item>
                  </Col>
                </Row>

                <Divider plain>ตัวเลือกเพิ่มเติม: การลงทะเบียนฝึกงาน</Divider>

                <Row gutter={16}>
                  <Col xs={24} md={12}>
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
                  <Col xs={24} md={12}>
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
              </Space>
            </Card>

            <Card className="settings-card" title="สรุปค่าที่จะบันทึก">
              <Space direction="vertical" size="large" style={{ width: "100%" }}>
                <Descriptions column={1} size="small" bordered>
                  <Descriptions.Item label="หลักสูตร">
                    {selectedCurriculum
                      ? `${selectedCurriculum.code} - ${selectedCurriculum.shortName || selectedCurriculum.name}`
                      : "ยังไม่เลือก"}
                  </Descriptions.Item>
                  <Descriptions.Item label="ปีการศึกษา / ภาคเรียน">
                    {currentAcademicYearWatch && currentSemesterWatch
                      ? `${currentAcademicYearWatch} / ${currentSemesterWatch === 3 ? "ภาคฤดูร้อน" : `ภาคเรียนที่ ${currentSemesterWatch}`}`
                      : "ยังไม่กำหนด"}
                  </Descriptions.Item>
                  <Descriptions.Item label="ช่วงลงทะเบียนโครงงาน">
                    {projectRegistrationRangeDisplay}
                  </Descriptions.Item>
                  <Descriptions.Item label="ช่วงลงทะเบียนฝึกงาน">
                    {internshipRegistrationRangeDisplay}
                  </Descriptions.Item>
                </Descriptions>

                <Divider style={{ margin: "12px 0" }} />

                <Space direction="vertical" size="small" style={{ width: "100%" }}>
                  <Text strong>สถานะการลงทะเบียน (อ้างอิงจากข้อมูลปัจจุบัน)</Text>
                  <Space wrap>
                    <Tag color={registrationStatuses.internship ? "green" : "red"}>
                      {registrationStatuses.internship ? "เปิด" : "ปิด"} ลงทะเบียนฝึกงาน
                    </Tag>
                    <Tag color={registrationStatuses.project ? "green" : "red"}>
                      {registrationStatuses.project ? "เปิด" : "ปิด"} ลงทะเบียนโครงงาน
                    </Tag>
                  </Space>
                  <Space direction="vertical" size={4} style={{ width: "100%" }}>
                    {getInternshipRegistrationStatus(form)}
                    {getProjectRegistrationStatus(form)}
                  </Space>
                </Space>

                <Divider style={{ margin: "12px 0" }} />

                <Text strong>ไทม์ไลน์ภาคเรียน</Text>
                <Timeline items={semesterTimelineItems} style={{ marginTop: 16 }} />

                <div className="setting-actions" style={{ marginTop: 8 }}>
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
              </Space>
            </Card>
          </Space>
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
