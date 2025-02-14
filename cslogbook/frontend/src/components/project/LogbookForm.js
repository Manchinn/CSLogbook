import React, { useState } from "react";
import { Layout, Form, Input, Button, Space, message, Card, Modal, DatePicker, Typography, Row, Col, Segmented } from "antd";
import { PlusCircleOutlined, EditOutlined } from "@ant-design/icons";
import "./LogbookForm.css"; // Import the new CSS file

const { Content } = Layout;
const { Text } = Typography;

const LogbookForm = () => {
  const [form] = Form.useForm();
  const [logbookHistory, setLogbookHistory] = useState([
    {
      key: "1",
      title: "พบอาจารย์ที่ปรึกษา",
      date: "2023-12-01 10:00",
      meetingDetails: "พบอาจารย์ที่ปรึกษาเพื่อสอบถามความคืบหน้าโครงงาน",
      progressUpdate: "พัฒนาโมเดล AI เสร็จสมบูรณ์",
      status: "Pending"
    },
    {
      key: "2",
      title: "ปรับแก้ไขโปรแกรม",
      date: "2023-12-05 14:30",
      meetingDetails: "การปรับแก้ไขโปรแกรมและแก้บัคในระบบ",
      progressUpdate: "แก้ไขข้อผิดพลาดในโค้ด และทดสอบระบบใหม่",
      status: "Complete"
    },
    {
      key: "3",
      title: "ทดสอบระบบ",
      date: "2023-12-10 09:00",
      meetingDetails: "ทดสอบระบบทั้งหมดเพื่อหาข้อผิดพลาด",
      progressUpdate: "พบข้อผิดพลาดเล็กน้อยและแก้ไขแล้ว",
      status: "Pending"
    },
    {
      key: "4",
      title: "ปรับปรุง UI",
      date: "2023-12-15 13:00",
      meetingDetails: "ปรับปรุง UI ให้ใช้งานง่ายขึ้น",
      progressUpdate: "ปรับปรุง UI เสร็จเรียบร้อย",
      status: "Complete"
    },
    {
      key: "5",
      title: "เพิ่มฟีเจอร์ใหม่",
      date: "2023-12-20 11:00",
      meetingDetails: "เพิ่มฟีเจอร์ใหม่ตามคำแนะนำของอาจารย์",
      progressUpdate: "เพิ่มฟีเจอร์ใหม่เสร็จเรียบร้อย",
      status: "Pending"
    },
    {
      key: "6",
      title: "ตรวจสอบความปลอดภัย",
      date: "2023-12-25 15:00",
      meetingDetails: "ตรวจสอบความปลอดภัยของระบบ",
      progressUpdate: "พบช่องโหว่และแก้ไขแล้ว",
      status: "Complete"
    },
    {
      key: "7",
      title: "ปรับปรุงประสิทธิภาพ",
      date: "2023-12-30 10:00",
      meetingDetails: "ปรับปรุงประสิทธิภาพของระบบ",
      progressUpdate: "ระบบทำงานได้เร็วขึ้น",
      status: "Pending"
    },
    {
      key: "8",
      title: "ทดสอบการใช้งาน",
      date: "2024-01-05 14:00",
      meetingDetails: "ทดสอบการใช้งานระบบกับผู้ใช้จริง",
      progressUpdate: "ผู้ใช้ให้คำแนะนำเพิ่มเติม",
      status: "Complete"
    },
    {
      key: "9",
      title: "แก้ไขบัค",
      date: "2024-01-10 09:30",
      meetingDetails: "แก้ไขบัคที่พบจากการทดสอบ",
      progressUpdate: "แก้ไขบัคเสร็จเรียบร้อย",
      status: "Pending"
    },
    {
      key: "10",
      title: "เตรียมเอกสาร",
      date: "2024-01-15 16:00",
      meetingDetails: "เตรียมเอกสารสำหรับการนำเสนอ",
      progressUpdate: "เอกสารพร้อมสำหรับการนำเสนอ",
      status: "Complete"
    },
  ]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [isViewModalVisible, setIsViewModalVisible] = useState(false);
  const [status, setStatus] = useState('Pending');
  const [filterStatus, setFilterStatus] = useState('All');
  const [currentLog, setCurrentLog] = useState(null);

  const showModal = () => {
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    setIsEditModalVisible(false);
    setIsViewModalVisible(false);
  };

  const handleSubmit = async (values) => {
    try {
      console.log("ข้อมูล Logbook ใหม่", values);
      message.success("ข้อมูล Logbook ของคุณถูกส่งเรียบร้อยแล้ว!");
      setLogbookHistory([...logbookHistory, { key: logbookHistory.length + 1, ...values, status }]);
      setIsModalVisible(false);
      form.resetFields();
    } catch (error) {
      message.error("เกิดข้อผิดพลาดในการส่งข้อมูล");
    }
  };

  const handleEditSubmit = async (values) => {
    try {
      const updatedLogbookHistory = logbookHistory.map(log => 
        log.key === currentLog.key ? { ...log, ...values } : log
      );
      setLogbookHistory(updatedLogbookHistory);
      message.success("ข้อมูล Logbook ของคุณถูกแก้ไขเรียบร้อยแล้ว!");
      setIsEditModalVisible(false);
      form.resetFields();
    } catch (error) {
      message.error("เกิดข้อผิดพลาดในการแก้ไขข้อมูล");
    }
  };

  const handleFilterChange = (value) => {
    setFilterStatus(value);
  };

  const filteredLogbookHistory = logbookHistory.filter(log => filterStatus === 'All' || log.status === filterStatus);

  const showEditModal = (log) => {
    setCurrentLog(log);
    form.setFieldsValue(log);
    setIsEditModalVisible(true);
  };

  const showViewModal = (log) => {
    setCurrentLog(log);
    setIsViewModalVisible(true);
  };

  return (
    <Layout className="layout">
      <Content className="content">
        <div className="header-2">
          <div className="filter">
            <Text className="filter-text">สถานะ:</Text>
            <Segmented
              options={['All', 'Pending', 'Complete']}
              defaultValue="All"
              onChange={handleFilterChange}
              className="segmented"
            />
          </div>
          <Button type="primary" onClick={showModal} className="add-button">
            <PlusCircleOutlined className="add-icon" />
          </Button>
        </div>

        <Card className="history-card">
          <h3 className="history-title">ประวัติการบันทึก Logbook</h3>
          {filteredLogbookHistory.length > 0 ? (
            <Row gutter={[16, 16]}>
              {filteredLogbookHistory.map((log, index) => (
                <Col xs={24} sm={12} md={8} key={index}>
                  <Card className="log-card" title={log.title} onClick={() => showViewModal(log)}>
                    <EditOutlined
                      onClick={(e) => {
                        e.stopPropagation();
                        showEditModal(log);
                      }}
                      className="edit-icon"
                    />
                    <p><strong>วันที่และเวลา:</strong> {log.date}</p>
                    <p className="ellipsis"><strong>รายละเอียดการนัดพบ:</strong> {log.meetingDetails}</p>
                    <p className="ellipsis"><strong>ความคืบหน้าโครงงาน:</strong> {log.progressUpdate}</p>
                    <div className="status">
                      <span className={log.status === "Complete" ? "status-complete" : "status-pending"}>
                        {log.status === "Complete" ? "Complete" : "Pending"}
                      </span>
                    </div>
                  </Card>
                </Col>
              ))}
            </Row>
          ) : (
            <p>ยังไม่มีการบันทึก Logbook</p>
          )}
        </Card>

        {/* Modal สำหรับการสร้าง Logbook ใหม่ */}
        <Modal
          title="สร้าง Logbook ใหม่"
          visible={isModalVisible}
          onCancel={handleCancel}
          footer={null}
          style={{
            borderRadius: "8px",
            backgroundColor: "#fff",
            maxWidth: "500px",
            margin: "auto",
            top: "40px",
          }}
        >
          <Form form={form} layout="vertical" onFinish={handleSubmit}>
            {/* ชื่อเรื่อง */}
            <Form.Item
              label="ชื่อเรื่อง"
              name="title"
              rules={[{ required: true, message: "กรุณากรอกชื่อเรื่อง!" }]}
            >
              <Input placeholder="กรอกชื่อเรื่อง" />
            </Form.Item>

            {/* การนัดพบ */}
            <Form.Item
              label="วันและเวลานัดพบ"
              name="meetingDate"
              rules={[{ required: true, message: "กรุณากรอกวันและเวลานัดพบ!" }]}
            >
              <DatePicker showTime style={{ width: "100%" }} />
            </Form.Item>

            {/* รายละเอียดการนัดพบ */}
            <Form.Item
              label="รายละเอียดการนัดพบ"
              name="meetingDetails"
              rules={[{ required: true, message: "กรุณากรอกรายละเอียดการนัดพบ!" }]}
            >
              <Input.TextArea rows={4} placeholder="กรอกรายละเอียดการนัดพบ" />
            </Form.Item>

            {/* การอัปเดตโครงงาน */}
            <Form.Item
              label="อัปเดตความคืบหน้าโครงงาน"
              name="progressUpdate"
              rules={[{ required: true, message: "กรุณากรอกความคืบหน้าโครงงาน!" }]}
            >
              <Input.TextArea rows={6} placeholder="กรอกอัปเดตความคืบหน้าของโครงงาน" />
            </Form.Item>

            {/* ปุ่มส่งข้อมูล */}
            <Form.Item>
              <Space style={{ display: "flex", justifyContent: "center" }}>
                <Button
                  type="primary"
                  htmlType="submit"
                  size="large"
                  style={{
                    width: "100%",
                    backgroundColor: "#1890ff",
                    borderColor: "#1890ff",
                  }}
                >
                  ส่งข้อมูล Logbook
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Modal>

        {/* Modal สำหรับการแก้ไข Logbook */}
        <Modal
          title="แก้ไข Logbook"
          visible={isEditModalVisible}
          onCancel={handleCancel}
          footer={null}
          style={{
            borderRadius: "8px",
            backgroundColor: "#fff",
            maxWidth: "500px",
            margin: "auto",
            top: "40px",
          }}
        >
          <Form form={form} layout="vertical" onFinish={handleEditSubmit}>
            {/* ชื่อเรื่อง */}
            <Form.Item
              label="ชื่อเรื่อง"
              name="title"
              rules={[{ required: true, message: "กรุณากรอกชื่อเรื่อง!" }]}
            >
              <Input placeholder="กรอกชื่อเรื่อง" />
            </Form.Item>

            {/* การนัดพบ */}
            <Form.Item
              label="วันและเวลานัดพบ"
              name="meetingDate"
              rules={[{ required: true, message: "กรุณากรอกวันและเวลานัดพบ!" }]}
            >
              <DatePicker showTime style={{ width: "100%" }} />
            </Form.Item>

            {/* รายละเอียดการนัดพบ */}
            <Form.Item
              label="รายละเอียดการนัดพบ"
              name="meetingDetails"
              rules={[{ required: true, message: "กรุณากรอกรายละเอียดการนัดพบ!" }]}
            >
              <Input.TextArea rows={4} placeholder="กรอกรายละเอียดการนัดพบ" />
            </Form.Item>

            {/* การอัปเดตโครงงาน */}
            <Form.Item
              label="อัปเดตความคืบหน้าโครงงาน"
              name="progressUpdate"
              rules={[{ required: true, message: "กรุณากรอกความคืบหน้าโครงงาน!" }]}
            >
              <Input.TextArea rows={6} placeholder="กรอกอัปเดตความคืบหน้าของโครงงาน" />
            </Form.Item>

            {/* ปุ่มบันทึกการแก้ไข */}
            <Form.Item>
              <Space style={{ display: "flex", justifyContent: "center" }}>
                <Button
                  type="primary"
                  htmlType="submit"
                  size="large"
                  style={{
                    width: "100%",
                    backgroundColor: "#1890ff",
                    borderColor: "#1890ff",
                  }}
                >
                  บันทึกการแก้ไข
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Modal>

        {/* Modal สำหรับการดูรายละเอียด Logbook */}
        <Modal
          title="รายละเอียด Logbook"
          visible={isViewModalVisible}
          onCancel={handleCancel}
          footer={null}
          style={{
            borderRadius: "8px",
            backgroundColor: "#fff",
            maxWidth: "500px",
            margin: "auto",
            top: "40px",
          }}
        >
          {currentLog && (
            <div>
              <p><strong>ชื่อเรื่อง:</strong> {currentLog.title}</p>
              <p><strong>วันที่และเวลา:</strong> {currentLog.date}</p>
              <p><strong>รายละเอียดการนัดพบ:</strong> {currentLog.meetingDetails}</p>
              <p><strong>ความคืบหน้าโครงงาน:</strong> {currentLog.progressUpdate}</p>
              <div style={{ textAlign: 'right', marginTop: '10px' }}>
                <span style={{ 
                  color: currentLog.status === "Complete" ? "green" : "orange",
                  border: `1px solid ${currentLog.status === "Complete" ? "green" : "orange"}`,
                  padding: '2px 8px',
                  borderRadius: '4px',
                }}>
                  {currentLog.status === "Complete" ? "Complete" : "Pending"}
                </span>
              </div>
            </div>
          )}
        </Modal>
      </Content>
    </Layout>
  );
};

export default LogbookForm;
