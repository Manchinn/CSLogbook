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
  Collapse
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
import useImportantDeadlines from "../../../../../hooks/admin/useImportantDeadlines";
import * as importantDeadlineService from "../../../../../services/admin/importantDeadlineService";
import { Modal } from 'antd';

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;
// ลบ Panel, TextArea ที่ไม่ได้ใช้งานเพื่อลด warning

const AcademicSettings = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [curriculums, setCurriculums] = useState([]);
  const [selectedCurriculumId, setSelectedCurriculumId] = useState(null);
  // ลบ state deadlines ที่ไม่ได้ใช้แล้ว (backend-driven)

  // State สำหรับ modal และข้อมูลฟอร์มกำหนดการสำคัญ
  const [modalVisible, setModalVisible] = useState(false);
  const [editingDeadline, setEditingDeadline] = useState(null); // ถ้า null คือเพิ่มใหม่
  const [deadlineForm, setDeadlineForm] = useState({
    name: '',
    date: null,
    time: null, // moment สำหรับเวลา
  // ฟิลด์ใหม่สำหรับช่วงเวลา (window)
  useWindow: false,
  windowStartDate: null,
  windowStartTime: null,
  windowEndDate: null,
  windowEndTime: null,
  allDay: false,
    relatedTo: 'general',
    semester: 1,
    academicYear: '',
    isGlobal: true
  });
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState('');

  // ดึงปีการศึกษาและภาคเรียนจากฟอร์มหลัก
  const academicYear = form.getFieldValue('currentAcademicYear');
  // สำหรับแต่ละภาคเรียนจะใช้เลข 1,2,3

  // ดึงข้อมูลกำหนดการสำคัญจาก backend
  const { deadlines: backendDeadlines, loading: deadlinesLoading, fetchDeadlines } = useImportantDeadlines({ academicYear, semester: null });

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  // เปิด modal เพิ่มกำหนดการใหม่
  const openAddDeadlineModal = (semester) => {
    setEditingDeadline(null);
    setDeadlineForm({
      name: '',
      date: null,
      time: null,
      useWindow: false,
      windowStartDate: null,
      windowStartTime: null,
      windowEndDate: null,
      windowEndTime: null,
      allDay: false,
      relatedTo: 'general',
      semester,
      academicYear: academicYear || '',
      isGlobal: true
    });
    setModalError('');
    setModalVisible(true);
  };
  const openEditDeadlineModal = (deadline) => {
    setEditingDeadline(deadline);
    setDeadlineForm({
      name: deadline.name,
      date: moment(deadline.deadlineDate || deadline.date),
      time: deadline.deadlineTime ? moment(deadline.deadlineTime, 'HH:mm:ss') : null,
      useWindow: !!(deadline.windowStartDate && deadline.windowEndDate),
      windowStartDate: deadline.windowStartDate ? moment(deadline.windowStartDate) : null,
      windowStartTime: deadline.windowStartTime ? moment(deadline.windowStartTime, 'HH:mm:ss') : null,
      windowEndDate: deadline.windowEndDate ? moment(deadline.windowEndDate) : null,
      windowEndTime: deadline.windowEndTime ? moment(deadline.windowEndTime, 'HH:mm:ss') : null,
      allDay: !!deadline.allDay,
      relatedTo: deadline.relatedTo,
      semester: deadline.semester,
      academicYear: deadline.academicYear,
      isGlobal: deadline.isGlobal
    });
    setModalError('');
    setModalVisible(true);
  };
  // ฟังก์ชันบันทึก (เพิ่ม/แก้ไข)
  const handleSaveDeadline = async () => {
    setModalLoading(true);
    setModalError('');
    try {
      const payload = {
        name: deadlineForm.name,
        relatedTo: deadlineForm.relatedTo,
        semester: deadlineForm.semester,
        academicYear: deadlineForm.academicYear,
        isGlobal: deadlineForm.isGlobal,
        deadlineDate: deadlineForm.date ? deadlineForm.date.format('YYYY-MM-DD') : null,
        deadlineTime: deadlineForm.time ? deadlineForm.time.format('HH:mm:ss') : undefined
      };
      if (!payload.name) {
        setModalError('กรุณากรอกชื่อ');
        setModalLoading(false);
        return;
      }
      // ถ้าไม่ได้ใช้ช่วงเวลา -> ต้องมีวันที่เดี่ยว
      if (!deadlineForm.useWindow && !payload.deadlineDate) {
        setModalError('กรุณาเลือกวันที่ (หรือเปิดใช้ช่วงเวลา)');
        setModalLoading(false);
        return;
      }
      if (deadlineForm.useWindow) {
        if (!deadlineForm.windowStartDate || !deadlineForm.windowEndDate) {
          setModalError('กรุณาเลือกวันที่เริ่มและสิ้นสุดของช่วงเวลา');
          setModalLoading(false);
          return;
        }
        const start = moment(deadlineForm.windowStartDate.format('YYYY-MM-DD') + ' ' + (deadlineForm.allDay ? '00:00:00' : (deadlineForm.windowStartTime ? deadlineForm.windowStartTime.format('HH:mm:ss') : '00:00:00')));
        const end = moment(deadlineForm.windowEndDate.format('YYYY-MM-DD') + ' ' + (deadlineForm.allDay ? '23:59:59' : (deadlineForm.windowEndTime ? deadlineForm.windowEndTime.format('HH:mm:ss') : '23:59:59')));
        if (end.isBefore(start)) {
          setModalError('วันสิ้นสุดต้องไม่ก่อนวันเริ่มต้น');
          setModalLoading(false);
          return;
        }
        payload.windowStartDate = deadlineForm.windowStartDate.format('YYYY-MM-DD');
        payload.windowEndDate = deadlineForm.windowEndDate.format('YYYY-MM-DD');
        if (!deadlineForm.allDay) {
          if (deadlineForm.windowStartTime) payload.windowStartTime = deadlineForm.windowStartTime.format('HH:mm:ss');
          if (deadlineForm.windowEndTime) payload.windowEndTime = deadlineForm.windowEndTime.format('HH:mm:ss');
        }
        payload.allDay = deadlineForm.allDay;
  // เมื่อใช้ช่วงเวลา ไม่จำเป็นต้องส่ง deadlineDate/time ให้ backend สร้าง deadlineAt จากจุดสิ้นสุดเอง
  payload.deadlineDate = null;
  delete payload.deadlineTime;
      }
      if (editingDeadline) {
        await importantDeadlineService.updateDeadline(editingDeadline.id, payload);
      } else {
        await importantDeadlineService.createDeadline(payload);
      }
      setModalVisible(false);
      fetchDeadlines();
    } catch (e) {
      setModalError('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    }
    setModalLoading(false);
  };
  // ฟังก์ชันลบ
  const handleDeleteDeadline = async (id) => {
    Modal.confirm({
      title: 'ยืนยันการลบกำหนดการ',
      content: 'คุณต้องการลบกำหนดการนี้ใช่หรือไม่?',
      okText: 'ลบ',
      okType: 'danger',
      cancelText: 'ยกเลิก',
      onOk: async () => {
        await importantDeadlineService.deleteDeadline(id);
        fetchDeadlines();
      }
    });
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
            items={['semester1', 'semester2', 'semester3'].map((semKey, idx) => ({
              key: semKey,
              label: (
                <span>
                  <CalendarOutlined style={{ marginRight: 8 }} />
                  {`กำหนดการภาคเรียนที่ ${idx + 1}`}
                </span>
              ),
              children: (
                <div>
                  <div style={{ marginBottom: 16 }}>
                    <Button
                      type="dashed"
                      icon={<PlusOutlined />}
                      onClick={() => openAddDeadlineModal(idx + 1)}
                      block
                    >
                      เพิ่มกำหนดการใหม่
                    </Button>
                  </div>
                  {deadlinesLoading ? <Spin /> : null}
                  {backendDeadlines.filter(d => d.semester === idx + 1).map((deadline, index) => (
                    <Card
                      key={deadline.id}
                      size="small"
                      style={{ marginBottom: 12 }}
                      title={deadline.name}
                      extra={
                        <>
                          <Button
                            type="link"
                            onClick={() => openEditDeadlineModal(deadline)}
                          >
                            แก้ไข
                          </Button>
                          <Button
                            type="text"
                            danger
                            icon={<DeleteOutlined />}
                            onClick={() => handleDeleteDeadline(deadline.id)}
                          />
                        </>
                      }
                    >
                      <Row gutter={16}>
                        {deadline.windowStartDate && deadline.windowEndDate ? (
                          <Col span={12}>
                            <b>ช่วง:</b>{' '}
                            {moment(deadline.windowStartDate).add(543,'year').format('D MMM YYYY')} - {moment(deadline.windowEndDate).add(543,'year').format('D MMM YYYY')}
                            {' '}
                            {deadline.allDay ? (
                              <Tag color="geekblue" style={{ marginLeft:4 }}>ทั้งวัน</Tag>
                            ) : (
                              <Tag color="blue" style={{ marginLeft:4 }}>
                                {`${deadline.windowStartTime ? moment(deadline.windowStartTime,'HH:mm:ss').format('HH:mm') : '00:00'} - ${deadline.windowEndTime ? moment(deadline.windowEndTime,'HH:mm:ss').format('HH:mm') : '23:59'} น.`}
                              </Tag>
                            )}
                          </Col>
                        ) : (
                          <Col span={12}>
                            <b>วันที่:</b>{' '}
                            {deadline.deadlineDate ? moment(deadline.deadlineDate).add(543,'year').format('D MMMM YYYY') : '-'}
                            {deadline.deadlineTime ? ` เวลา ${moment(deadline.deadlineTime,'HH:mm:ss').format('HH:mm')} น.` : ''}
                          </Col>
                        )}
                        <Col span={12}><b>ประเภท:</b> {deadline.relatedTo === 'project' ? 'โครงงาน' : deadline.relatedTo === 'internship' ? 'ฝึกงาน' : 'ทั่วไป'}</Col>
                      </Row>
                      <Row gutter={16} style={{ marginTop:4 }}>
                        <Col span={24}><b>ปีการศึกษา:</b> {deadline.academicYear}</Col>
                      </Row>
                    </Card>
                  ))}
                </div>
              )
            }))}
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

        {/* Modal สำหรับเพิ่ม/แก้ไขกำหนดการ */}
        <Modal
          title={editingDeadline ? 'แก้ไขกำหนดการ' : 'เพิ่มกำหนดการใหม่'}
          open={modalVisible}
          onOk={handleSaveDeadline}
          onCancel={() => setModalVisible(false)}
          confirmLoading={modalLoading}
          okText="บันทึก"
          cancelText="ยกเลิก"
        >
          <Form layout="vertical">
            <Form.Item label="ชื่อกิจกรรม" required>
              <Input
                value={deadlineForm.name}
                onChange={e => setDeadlineForm({ ...deadlineForm, name: e.target.value })}
                placeholder="เช่น วันสุดท้ายของยื่นสอบหัวข้อโครงงานพิเศษ"
              />
            </Form.Item>
            {!deadlineForm.useWindow && (
              <>
                <Form.Item label="วันที่ *" required>
                  <DatePicker
                    style={{ width: '100%' }}
                    value={deadlineForm.date}
                    onChange={date => setDeadlineForm({ ...deadlineForm, date })}
                    format={value => moment(value).add(543, 'year').format('D MMMM YYYY')}
                    locale={th_TH}
                    placeholder={'เลือกวันที่'}
                  />
                </Form.Item>
                <Form.Item label="เวลา (ไม่ระบุ = 23:59:59)">
                  <TimePicker
                    style={{ width: '100%' }}
                    value={deadlineForm.time}
                    onChange={time => setDeadlineForm({ ...deadlineForm, time })}
                    format="HH:mm"
                    placeholder="เลือกเวลา"
                  />
                </Form.Item>
              </>
            )}
            <Form.Item label="ประเภทกิจกรรม">
              <Select
                value={deadlineForm.relatedTo}
                onChange={value => setDeadlineForm({ ...deadlineForm, relatedTo: value })}
              >
                <Option value="project">โครงงาน/ปริญญานิพนธ์</Option>
                <Option value="internship">ฝึกงาน/สหกิจศึกษา</Option>
                <Option value="general">ทั่วไป</Option>
              </Select>
            </Form.Item>
            <Form.Item label="ภาคเรียน">
              <Select
                value={deadlineForm.semester}
                onChange={value => setDeadlineForm({ ...deadlineForm, semester: value })}
              >
                <Option value={1}>ภาคเรียนที่ 1</Option>
                <Option value={2}>ภาคเรียนที่ 2</Option>
                <Option value={3}>ภาคฤดูร้อน</Option>
              </Select>
            </Form.Item>
            <Form.Item label="ปีการศึกษา">
              <Input
                value={deadlineForm.academicYear}
                onChange={e => setDeadlineForm({ ...deadlineForm, academicYear: e.target.value })}
                placeholder="เช่น 2567"
              />
            </Form.Item>
            <Divider orientation="left" plain>ช่วงเวลา (ถ้าต้องการ)</Divider>
            <Row gutter={12}>
              <Col span={6}>
                <Form.Item label="ใช้ช่วงเวลา?">
                  <Select value={deadlineForm.useWindow ? 'yes' : 'no'} onChange={v => setDeadlineForm({ ...deadlineForm, useWindow: v==='yes' })}>
                    <Option value="no">ไม่ใช้</Option>
                    <Option value="yes">ใช้</Option>
                  </Select>
                </Form.Item>
              </Col>
              {deadlineForm.useWindow && (
                <>
                  <Col span={6}>
                    <Form.Item label="ทั้งวัน?">
                      <Select value={deadlineForm.allDay ? 'yes':'no'} onChange={v => setDeadlineForm({ ...deadlineForm, allDay: v==='yes' })}>
                        <Option value="no">ไม่</Option>
                        <Option value="yes">ใช่</Option>
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col span={6}>
                    <Form.Item label="เริ่ม (วัน)">
                      <DatePicker 
                        style={{ width:'100%' }} 
                        value={deadlineForm.windowStartDate} 
                        onChange={v => setDeadlineForm({ ...deadlineForm, windowStartDate: v })}
                        format={value => value ? moment(value).add(543,'year').format('D MMM YYYY') : ''}
                        locale={th_TH}
                        placeholder="เลือกวันที่เริ่ม"
                      />
                    </Form.Item>
                  </Col>
                  <Col span={6}>
                    <Form.Item label="สิ้นสุด (วัน)">
                      <DatePicker 
                        style={{ width:'100%' }} 
                        value={deadlineForm.windowEndDate} 
                        onChange={v => setDeadlineForm({ ...deadlineForm, windowEndDate: v })}
                        format={value => value ? moment(value).add(543,'year').format('D MMM YYYY') : ''}
                        locale={th_TH}
                        placeholder="เลือกวันที่สิ้นสุด"
                      />
                    </Form.Item>
                  </Col>
                  {!deadlineForm.allDay && (
                    <>
                      <Col span={6}>
                        <Form.Item label="เวลาเริ่ม">
                          <TimePicker style={{ width:'100%' }} format="HH:mm" value={deadlineForm.windowStartTime} onChange={v => setDeadlineForm({ ...deadlineForm, windowStartTime: v })} />
                        </Form.Item>
                      </Col>
                      <Col span={6}>
                        <Form.Item label="เวลาสิ้นสุด">
                          <TimePicker style={{ width:'100%' }} format="HH:mm" value={deadlineForm.windowEndTime} onChange={v => setDeadlineForm({ ...deadlineForm, windowEndTime: v })} />
                        </Form.Item>
                      </Col>
                    </>
                  )}
                </>
              )}
            </Row>
            {modalError && <Alert type="error" message={modalError} />}
          </Form>
        </Modal>

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
