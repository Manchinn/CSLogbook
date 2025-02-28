import React, { useState, useEffect } from "react";
import { Layout, Table, message } from "antd";
import axios from "axios";
import "./ProjectStyles.css"; // Import the combined CSS file

const { Content } = Layout;

const StatusCheck = () => {
  const [proposals, setProposals] = useState([]);

  useEffect(() => {
    const fetchProposals = async () => {
      try {
        const response = await axios.get("http://localhost:5000/api/project-proposals");
        setProposals(response.data);
      } catch (error) {
        message.error("เกิดข้อผิดพลาดในการดึงข้อมูลสถานะ");
      }
    };

    fetchProposals();
  }, []);

  const columns = [
    {
      title: "วันที่",
      dataIndex: "date",
      key: "date",
      width: 150,
    },
    {
      title: "ชื่อโครงงานภาษาไทย",
      dataIndex: "project_name_th",
      key: "project_name_th",
      width: 200,
    },
    {
      title: "ชื่อโครงงานภาษาอังกฤษ",
      dataIndex: "project_name_en",
      key: "project_name_en",
      width: 200,
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

  return (
    <Layout className="layout">
      <Content className="content">
        <div className="card">
          <h2 className="title">สถานะการยืนยันโครงงานพิเศษ</h2>
          <Table columns={columns} dataSource={proposals} rowKey="id" />
        </div>
      </Content>
    </Layout>
  );
};

export default StatusCheck;