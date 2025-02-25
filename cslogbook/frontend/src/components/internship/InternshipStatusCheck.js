import React, { useState, useEffect } from "react";
import { Layout, Table, message } from "antd";
import axios from "axios";
import { FileTextOutlined } from "@ant-design/icons";
import "./InternshipStyles.css"; 

const { Content } = Layout;

const InternshipStatusCheck = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get("/api/internship-status")
      .then(response => {
        setData(response.data);
        setLoading(false);
      })
      .catch(error => {
        message.error("Failed to fetch data");
        setLoading(false);
      });
  }, []);

  const columns = [
    {
        title: "วันที่ยื่นคำร้อง",
        dataIndex: "date",
        key: "date",
    },
    {
      title: "คำร้อง",
      dataIndex: "request",
      key: "request",
    },
    {
      title: "ชื่อบริษัท",
      dataIndex: "companyName",
      key: "companyName",
    },
    {
      title: "เอกสาร",
      dataIndex: "document",
      key: "document",
      render: () => <FileTextOutlined style={{ fontSize: 20, color: "#007bff" }} />,
    },
    {
      title: "สถานะ",
      dataIndex: "status",
      key: "status",
    },
  ];

  return (
    <Layout className="layout">
      <Content className="content">
        <div className="card">
          <h2 className="title">สถานะการยืนยันการยื่นฝึกงาน</h2>
          <Table columns={columns} dataSource={data} loading={loading} rowKey="id" />
        </div>
      </Content>
    </Layout>
  );
};

export default InternshipStatusCheck;