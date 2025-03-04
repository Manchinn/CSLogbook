import React, { useState, useEffect } from "react";
import { Layout, Form, Input, Button, Space, message, Card, Modal, DatePicker, Typography, Row, Col, Segmented, Popconfirm } from "antd";
import { PlusCircleOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import axios from 'axios';
import moment from 'moment-timezone';
import "./ProjectStyles.css";

const { Content } = Layout;
const { Text } = Typography;

const LogbookForm = () => {
  const [form] = Form.useForm();
  const [logbookHistory, setLogbookHistory] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [isViewModalVisible, setIsViewModalVisible] = useState(false);
  const [status, setStatus] = useState('Pending');
  const [filterStatus, setFilterStatus] = useState('All');
  const [currentLog, setCurrentLog] = useState(null);
  const [loading, setLoading] = useState(false);

  const showModal = () => {
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    setIsEditModalVisible(false);
    setIsViewModalVisible(false);
  };

  const fetchLogbooks = async () => {
    setLoading(true);
    try {
      const response = await axios.get('http://localhost:5000/api/logbooks', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      setLogbookHistory(response.data);
    } catch (error) {
      message.error('เกิดข้อผิดพลาดในการดึงข้อมูล Logbook');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogbooks();
  }, []);

  const handleSubmit = async (values) => {
    try {
      const formData = {
        title: values.title.trim(),
        meetingDate: moment(values.meetingDate).format('YYYY-MM-DD HH:mm:ss'),
        meeting_details: values.meetingDetails.trim(),
        progress_update: values.progressUpdate.trim(),
        status: 'pending'
      };

      // ตรวจสอบค่าว่างก่อนส่ง
      if (!formData.title || !formData.meetingDate || !formData.meeting_details || !formData.progress_update) {
        message.error('กรุณากรอกข้อมูลให้ครบถ้วน');
        return;
      }

      const response = await axios.post('http://localhost:5000/api/logbooks', formData, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.data.success) {
        message.success("บันทึก Logbook สำเร็จ!");
        setIsModalVisible(false);
        form.resetFields();
        fetchLogbooks();
      }
    } catch (error) {
      console.error('Error submitting logbook:', error);
      message.error(error.response?.data?.error || "เกิดข้อผิดพลาดในการบันทึกข้อมูล");
    }
  };

  const handleEditSubmit = async (values) => {
    try {
      const formData = {
        title: values.title,
        meetingDate: values.meetingDate.format('YYYY-MM-DD HH:mm:ss'),
        meeting_details: values.meetingDetails, 
        progress_update: values.progressUpdate,
        status: currentLog.status
      };

      const response = await axios.put(
        `http://localhost:5000/api/logbooks/${currentLog.id}`, 
        formData,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      if (response.data.success) {
        message.success("แก้ไข Logbook สำเร็จ!");
        setIsEditModalVisible(false);
        form.resetFields();
        fetchLogbooks();
      }
    } catch (error) {
      console.error('Error updating logbook:', error);
      message.error(error.response?.data?.error || "เกิดข้อผิดพลาดในการแก้ไขข้อมูล");
    }
  };

  const handleDelete = async (id) => {
    try {
      const response = await axios.delete(`http://localhost:5000/api/logbooks/${id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.data.success) {
        message.success("ลบ Logbook สำเร็จ!");
        fetchLogbooks();
      }
    } catch (error) {
      console.error('Error deleting logbook:', error);
      message.error(error.response?.data?.error || "เกิดข้อผิดพลาดในการลบข้อมูล");
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
              options={['All', 'pending', 'complete']}
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
                  <Card 
                    className="log-card" 
                    title={
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>{log.title}</span>
                        <EditOutlined
                          onClick={(e) => {
                            e.stopPropagation();
                            showEditModal(log);
                          }}
                          className="edit-icon"
                        />
                      </div>
                    } 
                    onClick={() => showViewModal(log)}
                  >
                    <p>
                      <strong>วันที่และเวลา:</strong>{' '}
                      {moment(log.meeting_date).tz('Asia/Bangkok').format('DD/MM/YYYY HH:mm')}
                    </p>
                    <p className="ellipsis"><strong>รายละเอียดการนัดพบ:</strong> {log.meeting_details}</p>
                    <p className="ellipsis"><strong>ความคืบหน้าโครงงาน:</strong> {log.progress_update}</p>
                    <div className="card-footer">
                      <Popconfirm
                        title="คุณแน่ใจหรือไม่ที่จะลบ Logbook นี้?"
                        onConfirm={(e) => {
                          e.stopPropagation();
                          handleDelete(log.id);
                        }}
                        onCancel={(e) => e.stopPropagation()}
                        okText="ใช่"
                        cancelText="ไม่"
                      >
                        <DeleteOutlined
                          onClick={(e) => e.stopPropagation()}
                          className="delete-icon"
                        />
                      </Popconfirm>
                      <span className={log.status === "complete" ? "status-complete" : "status-pending"}>
                        {log.status === "complete" ? "Complete" : "Pending"}
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
          open={isModalVisible}
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
                  loading={loading}
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
          open={isEditModalVisible}
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

            <div className="modal-footer">
              <Space style={{ width: "100%", justifyContent: "center" }}>
                
                <Button
                  type="primary"
                  htmlType="submit"
                  size="large"
                  style={{
                    backgroundColor: "#1890ff",
                    borderColor: "#1890ff",
                  }}
                >
                  บันทึกการแก้ไข
                </Button>
              </Space>
            </div>
          </Form>
        </Modal>

        {/* Modal สำหรับการดูรายละเอียด Logbook */}
        <Modal
          title="รายละเอียด Logbook"
          open={isViewModalVisible}
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
              <p>
                <strong>วันที่และเวลา:</strong>{' '}
                {moment(currentLog.meeting_date).tz('Asia/Bangkok').format('DD/MM/YYYY HH:mm')}
              </p>
              <p><strong>รายละเอียดการนัดพบ:</strong> {currentLog.meeting_details}</p>
              <p><strong>ความคืบหน้าโครงงาน:</strong> {currentLog.progress_update}</p>
              <div style={{ textAlign: 'right', marginTop: '10px' }}>
                <span style={{ 
                  color: currentLog.status === "complete" ? "green" : "orange",
                  border: `1px solid ${currentLog.status === "complete" ? "green" : "orange"}`,
                  padding: '2px 8px',
                  borderRadius: '4px',
                }}>
                  {currentLog.status === "complete" ? "Complete" : "Pending"}
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
