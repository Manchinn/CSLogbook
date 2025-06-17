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
  TimePicker,
  Space,
  Collapse,
  Tooltip,
} from "antd";
import { SaveOutlined, ReloadOutlined, PlusOutlined, DeleteOutlined, CalendarOutlined } from "@ant-design/icons";
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
const { Panel } = Collapse;
const { TextArea } = Input;

const AcademicSettings = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [curriculums, setCurriculums] = useState([]);
  const [selectedCurriculumId, setSelectedCurriculumId] = useState(null);
  const [deadlines, setDeadlines] = useState({
    semester1: [],
    semester2: [],
    semester3: []
  });

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

  const addDeadline = (semester) => {
    const newDeadline = {
      id: Date.now(),
      activity: '',
      date: null,
      time: null,
      note: '',
      type: 'project' // project, internship, general
    };
    
    setDeadlines(prev => ({
      ...prev,
      [semester]: [...prev[semester], newDeadline]
    }));
  };

  const removeDeadline = (semesterKey, deadlineId) => {
    setDeadlines(prev => ({
      ...prev,
      [semesterKey]: prev[semesterKey].filter(d => d.id !== deadlineId)
    }));
  };

  const updateDeadline = (semesterKey, deadlineId, field, value) => {
    setDeadlines(prev => ({
      ...prev,
      [semesterKey]: prev[semesterKey].map(d => 
        d.id === deadlineId ? { ...d, [field]: value } : d
      )
    }));
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

        <Divider />

        {/* เพิ่มส่วนกำหนดการสำคัญ */}
        <Card className="settings-card">
          <Title level={5}>กำหนดการสำคัญในปีการศึกษา</Title>
          <Text type="secondary">
            จัดการวันที่สำคัญและ deadline ต่างๆ สำหรับการยื่นเอกสาร สอบ และกิจกรรมสำคัญในแต่ละภาคเรียน
          </Text>

          <Collapse 
            defaultActiveKey={['semester1']} 
            style={{ marginTop: 16 }}
            items={[
              {
                key: 'semester1',
                label: (
                  <span>
                    <CalendarOutlined style={{ marginRight: 8 }} />
                    กำหนดการภาคเรียนที่ 1
                  </span>
                ),
                children: (
                  <div>
                    <div style={{ marginBottom: 16 }}>
                      <Button 
                        type="dashed" 
                        icon={<PlusOutlined />}
                        onClick={() => addDeadline('semester1')}
                        block
                      >
                        เพิ่มกำหนดการใหม่
                      </Button>
                    </div>
                    
                    {deadlines.semester1.map((deadline, index) => (
                      <Card 
                        key={deadline.id}
                        size="small"
                        style={{ marginBottom: 12 }}
                        title={`กำหนดการที่ ${index + 1}`}
                        extra={
                          <Button 
                            type="text" 
                            danger 
                            icon={<DeleteOutlined />}
                            onClick={() => removeDeadline('semester1', deadline.id)}
                          />
                        }
                      >
                        <Row gutter={16}>
                          <Col span={24}>
                            <Form.Item label="ประเภทกิจกรรม">
                              <Select
                                value={deadline.type}
                                onChange={(value) => updateDeadline('semester1', deadline.id, 'type', value)}
                                placeholder="เลือกประเภท"
                              >
                                <Option value="project">โครงงาน/ปริญญานิพนธ์</Option>
                                <Option value="internship">ฝึกงาน/สหกิจศึกษา</Option>
                                <Option value="general">ทั่วไป</Option>
                              </Select>
                            </Form.Item>
                          </Col>
                          
                          <Col span={24}>
                            <Form.Item label="รายละเอียดกิจกรรม">
                              <Input
                                value={deadline.activity}
                                onChange={(e) => updateDeadline('semester1', deadline.id, 'activity', e.target.value)}
                                placeholder="เช่น วันสุดท้ายของยื่นสอบหัวข้อโครงงานพิเศษ"
                              />
                            </Form.Item>
                          </Col>

                          <Col span={12}>
                            <Form.Item label="วันที่">
                              <DatePicker
                                style={{ width: '100%' }}
                                value={deadline.date}
                                onChange={(date) => updateDeadline('semester1', deadline.id, 'date', date)}
                                format={(value) => moment(value).add(543, "year").format("D MMMM YYYY")}
                                locale={th_TH}
                                placeholder="เลือกวันที่"
                              />
                            </Form.Item>
                          </Col>

                          <Col span={12}>
                            <Form.Item label="เวลา (ถ้ามี)">
                              <TimePicker
                                style={{ width: '100%' }}
                                value={deadline.time}
                                onChange={(time) => updateDeadline('semester1', deadline.id, 'time', time)}
                                format="HH:mm น."
                                placeholder="เลือกเวลา"
                              />
                            </Form.Item>
                          </Col>

                          <Col span={24}>
                            <Form.Item label="หมายเหตุ">
                              <TextArea
                                value={deadline.note}
                                onChange={(e) => updateDeadline('semester1', deadline.id, 'note', e.target.value)}
                                placeholder="เช่น กรอก Google Form, ณ ภาควิชา ชั้น 6"
                                rows={2}
                              />
                            </Form.Item>
                          </Col>
                        </Row>
                      </Card>
                    ))}
                  </div>
                )
              },
              {
                key: 'semester2',
                label: (
                  <span>
                    <CalendarOutlined style={{ marginRight: 8 }} />
                    กำหนดการภาคเรียนที่ 2
                  </span>
                ),
                children: (
                  <div>
                    <div style={{ marginBottom: 16 }}>
                      <Button 
                        type="dashed" 
                        icon={<PlusOutlined />}
                        onClick={() => addDeadline('semester2')}
                        block
                      >
                        เพิ่มกำหนดการใหม่
                      </Button>
                    </div>
                    
                    {deadlines.semester2.map((deadline, index) => (
                      <Card 
                        key={deadline.id}
                        size="small"
                        style={{ marginBottom: 12 }}
                        title={`กำหนดการที่ ${index + 1}`}
                        extra={
                          <Button 
                            type="text" 
                            danger 
                            icon={<DeleteOutlined />}
                            onClick={() => removeDeadline('semester2', deadline.id)}
                          />
                        }
                      >
                        <Row gutter={16}>
                          <Col span={24}>
                            <Form.Item label="ประเภทกิจกรรม">
                              <Select
                                value={deadline.type}
                                onChange={(value) => updateDeadline('semester2', deadline.id, 'type', value)}
                                placeholder="เลือกประเภท"
                              >
                                <Option value="project">โครงงาน/ปริญญานิพนธ์</Option>
                                <Option value="internship">ฝึกงาน/สหกิจศึกษา</Option>
                                <Option value="general">ทั่วไป</Option>
                              </Select>
                            </Form.Item>
                          </Col>
                          
                          <Col span={24}>
                            <Form.Item label="รายละเอียดกิจกรรม">
                              <Input
                                value={deadline.activity}
                                onChange={(e) => updateDeadline('semester2', deadline.id, 'activity', e.target.value)}
                                placeholder="เช่น วันสุดท้ายของยื่นสอบหัวข้อโครงงานพิเศษ"
                              />
                            </Form.Item>
                          </Col>

                          <Col span={12}>
                            <Form.Item label="วันที่">
                              <DatePicker
                                style={{ width: '100%' }}
                                value={deadline.date}
                                onChange={(date) => updateDeadline('semester2', deadline.id, 'date', date)}
                                format={(value) => moment(value).add(543, "year").format("D MMMM YYYY")}
                                locale={th_TH}
                                placeholder="เลือกวันที่"
                              />
                            </Form.Item>
                          </Col>

                          <Col span={12}>
                            <Form.Item label="เวลา (ถ้ามี)">
                              <TimePicker
                                style={{ width: '100%' }}
                                value={deadline.time}
                                onChange={(time) => updateDeadline('semester2', deadline.id, 'time', time)}
                                format="HH:mm น."
                                placeholder="เลือกเวลา"
                              />
                            </Form.Item>
                          </Col>

                          <Col span={24}>
                            <Form.Item label="หมายเหตุ">
                              <TextArea
                                value={deadline.note}
                                onChange={(e) => updateDeadline('semester2', deadline.id, 'note', e.target.value)}
                                placeholder="เช่น กรอก Google Form, ณ ภาควิชา ชั้น 6"
                                rows={2}
                              />
                            </Form.Item>
                          </Col>
                        </Row>
                      </Card>
                    ))}
                  </div>
                )
              },
              {
                key: 'semester3',
                label: (
                  <span>
                    <CalendarOutlined style={{ marginRight: 8 }} />
                    กำหนดการภาคฤดูร้อน
                  </span>
                ),
                children: (
                  <div>
                    <div style={{ marginBottom: 16 }}>
                      <Button 
                        type="dashed" 
                        icon={<PlusOutlined />}
                        onClick={() => addDeadline('semester3')}
                        block
                      >
                        เพิ่มกำหนดการใหม่
                      </Button>
                    </div>
                    
                    {deadlines.semester3.map((deadline, index) => (
                      <Card 
                        key={deadline.id}
                        size="small"
                        style={{ marginBottom: 12 }}
                        title={`กำหนดการที่ ${index + 1}`}
                        extra={
                          <Button 
                            type="text" 
                            danger 
                            icon={<DeleteOutlined />}
                            onClick={() => removeDeadline('semester3', deadline.id)}
                          />
                        }
                      >
                        <Row gutter={16}>
                          <Col span={24}>
                            <Form.Item label="ประเภทกิจกรรม">
                              <Select
                                value={deadline.type}
                                onChange={(value) => updateDeadline('semester3', deadline.id, 'type', value)}
                                placeholder="เลือกประเภท"
                              >
                                <Option value="project">โครงงาน/ปริญญานิพนธ์</Option>
                                <Option value="internship">ฝึกงาน/สหกิจศึกษา</Option>
                                <Option value="general">ทั่วไป</Option>
                              </Select>
                            </Form.Item>
                          </Col>
                          
                          <Col span={24}>
                            <Form.Item label="รายละเอียดกิจกรรม">
                              <Input
                                value={deadline.activity}
                                onChange={(e) => updateDeadline('semester3', deadline.id, 'activity', e.target.value)}
                                placeholder="เช่น วันสุดท้ายของยื่นสอบหัวข้อโครงงานพิเศษ"
                              />
                            </Form.Item>
                          </Col>

                          <Col span={12}>
                            <Form.Item label="วันที่">
                              <DatePicker
                                style={{ width: '100%' }}
                                value={deadline.date}
                                onChange={(date) => updateDeadline('semester3', deadline.id, 'date', date)}
                                format={(value) => moment(value).add(543, "year").format("D MMMM YYYY")}
                                locale={th_TH}
                                placeholder="เลือกวันที่"
                              />
                            </Form.Item>
                          </Col>

                          <Col span={12}>
                            <Form.Item label="เวลา (ถ้ามี)">
                              <TimePicker
                                style={{ width: '100%' }}
                                value={deadline.time}
                                onChange={(time) => updateDeadline('semester3', deadline.id, 'time', time)}
                                format="HH:mm น."
                                placeholder="เลือกเวลา"
                              />
                            </Form.Item>
                          </Col>

                          <Col span={24}>
                            <Form.Item label="หมายเหตุ">
                              <TextArea
                                value={deadline.note}
                                onChange={(e) => updateDeadline('semester3', deadline.id, 'note', e.target.value)}
                                placeholder="เช่น กรอก Google Form, ณ ภาควิชา ชั้น 6"
                                rows={2}
                              />
                            </Form.Item>
                          </Col>
                        </Row>
                      </Card>
                    ))}
                  </div>
                )
              }
            ]}
          />

          {/* แสดงตัวอย่างกำหนดการที่กำลังจะมีผล */}
          <Alert
            message="กำหนดการที่ใกล้จะถึง"
            description={
              <div>
                <Text>ระบบจะแจ้งเตือนนักศึกษาเกี่ยวกับกำหนดการที่สำคัญล่วงหน้า 7 วัน</Text>
                <br />
                <Text type="secondary">สามารถดูกำหนดการทั้งหมดได้ในหน้าแดชบอร์ด</Text>
              </div>
            }
            type="info"
            showIcon
            style={{ marginTop: 16 }}
          />
        </Card>

        {/* ส่วนบันทึก */}
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
