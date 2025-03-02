import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Layout, Table, message, Row, Col, Button } from "antd";
import axios from "axios";
import moment from "moment";
import "./ProjectStyles.css";

const { Content } = Layout;
const { Group: ButtonGroup } = Button;

// แยก constant ออกมา
const DOCUMENT_TYPES = {
  all: 'ทั้งหมด',
  internship: 'เอกสารฝึกงาน',
  project: 'เอกสารโปรเจค'
};

const STATUS_COLORS = {
  approved: { className: 'status-complete', text: 'อนุมัติ' },
  rejected: { className: 'status-rejected', text: 'ปฏิเสธ' },
  pending: { className: 'status-pending', text: 'กำลังตรวจสอบ' }
};

const StatusCheck = () => {
  const [documents, setDocuments] = useState([]);
  const [selectedTab, setSelectedTab] = useState("pending");
  const [selectedType, setSelectedType] = useState("all");
  const [loading, setLoading] = useState(false);

  // ย้าย fetchDocuments ไปใช้ useCallback
  const fetchDocuments = useCallback(async () => {
    const token = localStorage.getItem('token');
    const studentID = localStorage.getItem('studentID');

    if (!token || !studentID) {
      message.error("กรุณาเข้าสู่ระบบก่อน");
      return;
    }

    try {
      setLoading(true);
      const response = await axios.get("http://localhost:5000/api/documents", {
        headers: { 'Authorization': `Bearer ${token}` },
        params: { type: selectedType === 'all' ? undefined : selectedType }
      });

      const formattedData = response.data.map(doc => ({
        ...doc,
        key: doc.id || `${doc.document_name}-${doc.upload_date}`,
        upload_date: moment(doc.upload_date).format("YYYY-MM-DD")
      }));

      setDocuments(formattedData);
    } catch (error) {
      message.error(error.response?.status === 401 
        ? "คุณไม่มีสิทธิ์เข้าถึงข้อมูลนี้"
        : "เกิดข้อผิดพลาดในการดึงข้อมูลสถานะ"
      );
    } finally {
      setLoading(false);
    }
  }, [selectedType]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  // ย้าย filterDocuments ไปใช้ useMemo
  const filteredData = useMemo(() => {
    return documents.filter(document => 
      selectedTab === "pending" 
        ? document.status === "pending"
        : ["approved", "rejected"].includes(document.status)
    );
  }, [documents, selectedTab]);

  // ย้าย columns ไปใช้ useMemo
  const tableColumns = useMemo(() => {
    const baseColumns = [
      {
        title: "วันที่",
        dataIndex: "upload_date",
        key: "upload_date",
        width: 150,
        render: date => moment(date).format("DD/MM/YYYY")
      },
      {
        title: "ชื่อเอกสาร",
        dataIndex: "document_name",
        key: "document_name",
        width: 200,
      },
      {
        title: "ชื่อนักศึกษา",
        dataIndex: "student_name",
        key: "student_name",
        width: 200,
      },
      {
        title: "ประเภทเอกสาร",
        dataIndex: "type",
        key: "type",
        width: 150,
        render: type => DOCUMENT_TYPES[type] || "อื่นๆ"
      },
      {
        title: "สถานะ",
        dataIndex: "status",
        key: "status",
        width: 150,
        render: status => {
          const { className, text } = STATUS_COLORS[status] || STATUS_COLORS.pending;
          return <span className={className}>{text}</span>;
        }
      }
    ];
    return selectedType === "all" ? baseColumns : baseColumns.filter(col => col.key !== "type");
  }, [selectedType]);

  return (
    <Layout className="layout">
      <Content className="content">
        <div className="card" style={{ maxWidth: "90%", margin: "0 auto" }}>
          <h2 className="title">สถานะการตรวจสอบคำร้อง</h2>
          
          <Row gutter={[16, 16]} justify="center">
            <Col span={24}>
              <ButtonGroup className="button-group" style={{ width: "100%" }}>
                {[
                  { key: 'pending', text: 'คำร้องที่รอดำเนินการ' },
                  { key: 'completed', text: 'คำร้องที่ดำเนินการเสร็จแล้ว' }
                ].map(({ key, text }) => (
                  <Button
                    key={key}
                    style={{ width: "50%" }}
                    type={selectedTab === key ? "primary" : "default"}
                    onClick={() => setSelectedTab(key)}
                  >
                    {text}
                  </Button>
                ))}
              </ButtonGroup>
            </Col>
            
            <Col span={24}>
              <ButtonGroup className="button-group" style={{ width: "100%" }}>
                {Object.entries(DOCUMENT_TYPES).map(([type, text]) => (
                  <Button
                    key={type}
                    type={selectedType === type ? "primary" : "default"}
                    onClick={() => setSelectedType(type)}
                  >
                    {text}
                  </Button>
                ))}
              </ButtonGroup>
            </Col>
          </Row>

          <Table 
            columns={tableColumns}
            dataSource={filteredData}
            rowKey={record => record.key}
            loading={loading}
            style={{ marginTop: 20 }}
            pagination={{ 
              pageSize: 10,
              showTotal: (total) => `ทั้งหมด ${total} รายการ`
            }}
          />
        </div>
      </Content>
    </Layout>
  );
};

export default StatusCheck;