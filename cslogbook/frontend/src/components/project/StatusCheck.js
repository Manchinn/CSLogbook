import React, { useState, useEffect } from "react";
import { Layout, Table, message, Row, Col, Button, Divider } from "antd";
import axios from "axios";
import moment from "moment";
import "./ProjectStyles.css"; // Import the combined CSS file

const { Content } = Layout;
const { Group: ButtonGroup } = Button;

const StatusCheck = () => {
  const [documents, setDocuments] = useState([]);
  const [selectedTab, setSelectedTab] = useState("pending");
  const [selectedType, setSelectedType] = useState("all");

  useEffect(() => {
    const fetchDocuments = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        message.error("กรุณาเข้าสู่ระบบก่อน");
        return;
      }

      try {
        const response = await axios.get("http://localhost:5000/api/documents", {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        setDocuments(response.data);
      } catch (error) {
        if (error.response && error.response.status === 401) {
          message.error("คุณไม่มีสิทธิ์เข้าถึงข้อมูลนี้");
        } else {
          message.error("เกิดข้อผิดพลาดในการดึงข้อมูลสถานะ");
        }
      }
    };

    fetchDocuments();
  }, []);

  const columns = [
    {
      title: "วันที่",
      dataIndex: "upload_date",
      key: "upload_date",
      width: 150,
      render: (date) => moment(date).format("DD/MM/YYYY"),
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
      render: (type) => {
        switch (type) {
          case "project":
            return "เอกสารโปรเจค";
          case "internship":
            return "เอกสารฝึกงาน";
          default:
            return "อื่นๆ";
        }
      },
    },
    {
      title: "สถานะ",
      dataIndex: "status",
      key: "status",
      width: 150,
      render: (status) => {
        switch (status) {
          case "approved":
            return <span className="status-complete">อนุมัติ</span>;
          case "rejected":
            return <span className="status-pending">ปฏิเสธ</span>;
          default:
            return <span className="status-pending">กำลังตรวจสอบ</span>;
        }
      },
    },
  ];

  const filteredDocuments = documents.filter(document => {
    const statusMatch = selectedTab === "pending" ? document.status === "pending" : document.status !== "pending";
    const typeMatch = selectedType === "all" || document.type === selectedType;
    return statusMatch && typeMatch;
  });

  // กำหนดคอลัมน์ที่จะใช้ในตาราง
  const tableColumns = selectedType === "all" ? columns : columns.filter(col => col.key !== "type");

  return (
    <Layout className="layout">
      <Content className="content">
        <div className="card" style={{ maxWidth: "90%", margin: "0 auto" }}>
          <h2 className="title">สถานะการตรวจสอบคำร้อง</h2>
          <Row gutter={16} justify="center">
            <Col span={24}>
              <ButtonGroup className="button-group" style={{ width: "100%" }}>
                <Button style={{ width: "50%" }} type={selectedTab === "pending" ? "primary" : "default"} onClick={() => setSelectedTab("pending")}>
                  คำร้องที่รอดำเนินการ
                </Button>
                <Button style={{ width: "50%" }} type={selectedTab === "completed" ? "primary" : "default"} onClick={() => setSelectedTab("completed")}>
                  คำร้องที่ดำเนินการเสร็จแล้ว
                </Button>
              </ButtonGroup>
            </Col>
          </Row>
          <Row gutter={16} justify="center" style={{ marginTop: 20 }}>
            <Col span={24}>
              <ButtonGroup className="button-group" style={{ width: "100%" }}>
                <Button type={selectedType === "all" ? "primary" : "default"} onClick={() => setSelectedType("all")}>
                  ทั้งหมด
                </Button>
                <Button type={selectedType === "internship" ? "primary" : "default"} onClick={() => setSelectedType("internship")}>
                  เอกสารฝึกงาน
                </Button>
                <Button type={selectedType === "project" ? "primary" : "default"} onClick={() => setSelectedType("project")}>
                  เอกสารโปรเจค
                </Button>
              </ButtonGroup>
            </Col>
          </Row>
          <Table columns={tableColumns} dataSource={filteredDocuments} rowKey={(record) => `row-${record.id}` } style={{ marginTop: 20 }} />
        </div>
      </Content>
    </Layout>
  );
};

export default StatusCheck;