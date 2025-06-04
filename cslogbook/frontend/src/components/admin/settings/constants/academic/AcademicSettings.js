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
import { settingsService } from "../../../../../services/admin/settingsService";
import th_TH from "antd/lib/locale/th_TH";
import moment from "moment";
import "moment/locale/th";
import {
  checkDateOverlap,
  getCurrentSemesterStatus,
  getInternshipRegistrationStatus,
  getProjectRegistrationStatus,
  isRegistrationOpenForSemester,
  loadCurriculumsProcess,
  loadAcademicSettingsProcess,
  saveAcademicSettingsProcess,
} from "./academicUtils";

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

const AcademicSettings = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [curriculums, setCurriculums] = useState([]);
  const [selectedCurriculumId, setSelectedCurriculumId] = useState(null);

  // Function to fetch and set curriculums
  const fetchAndSetCurriculums = async () => {
    setLoading(true);
    const { activeCurriculums, initialSelectedCurriculumId, warningMessage, errorMessage } = await loadCurriculumsProcess(settingsService.getCurriculums);
    setLoading(false);

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
  };

  // Function to fetch and set academic settings
  const fetchAndSetSettings = async () => {
    setLoading(true);
    const { formValues, errorMessage } = await loadAcademicSettingsProcess(settingsService.getAcademicSettings);
    setLoading(false);

    if (errorMessage) {
      message.error(errorMessage);
    } else if (formValues) {
      form.setFieldsValue(formValues);
      if (formValues.activeCurriculumId) {
        setSelectedCurriculumId(formValues.activeCurriculumId);
        form.setFieldsValue({ selectedCurriculum: formValues.activeCurriculumId });
      }
    } else {
      message.error("ไม่สามารถโหลดข้อมูลการตั้งค่าเริ่มต้นได้");
    }
  };

  useEffect(() => {
    fetchAndSetCurriculums();
    fetchAndSetSettings();
  }, []);

  const handleCurriculumChange = (value) => {
    setSelectedCurriculumId(value);
    const selectedCurriculum = curriculums.find(c => c.curriculumId === value);
    if (selectedCurriculum) {
      message.success(`เลือกหลักสูตร ${selectedCurriculum.shortName || selectedCurriculum.name} เป็นหลักสูตรหลัก`);
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
      fetchAndSetSettings();
    } else {
      message.error(statusMessage);
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
        <Card className="settings-card">
          <Title level={5}>ปีการศึกษาและภาคเรียนปัจจุบัน</Title>
          <Text type="secondary">
            ปีการศึกษาและภาคเรียนปัจจุบันจะใช้เป็นค่าตั้งต้นสำหรับการสมัครฝึกงานและโครงงาน
          </Text>

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

          <Divider orientation="left">หลักสูตรที่ใช้งานในปีการศึกษานี้ </Divider>

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
                dataSource={curriculums.filter(c => c.curriculumId === selectedCurriculumId).map(curriculum => ({
                  ...curriculum,
                  key: curriculum.curriculumId
                }))}
                locale={{
                  emptyText: "ไม่พบข้อมูลหลักสูตรที่เลือก",
                }}
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
                  format={(value) => moment(value).add(543, "year").format("D MMMM YYYY")}
                  locale={th_TH}
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
                  format={(value) => moment(value).add(543, "year").format("D MMMM YYYY")}
                  locale={th_TH}
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
                initialValue={[3]}
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
                  format={(value) => moment(value).add(543, "year").format("D MMMM YYYY")}
                  locale={th_TH}
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
                  format={(value) => moment(value).add(543, "year").format("D MMMM YYYY")}
                  locale={th_TH}
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

        <div className="setting-actions">
          <Button
            icon={<ReloadOutlined />}
            onClick={fetchAndSetSettings}
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
