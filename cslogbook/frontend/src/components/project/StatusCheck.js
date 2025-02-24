import React, { useState, useEffect } from "react";
import { Table, message } from "antd";
import axios from "axios";

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
      title: "ชื่อโครงงานภาษาไทย",
      dataIndex: "project_name_th",
      key: "project_name_th",
    },
    {
      title: "ชื่อโครงงานภาษาอังกฤษ",
      dataIndex: "project_name_en",
      key: "project_name_en",
    },
    {
      title: "สถานะ",
      dataIndex: "status",
      key: "status",
      render: (status) => {
        switch (status) {
          case "approved":
            return "อนุมัติ";
          case "rejected":
            return "ปฏิเสธ";
          default:
            return "รอการตรวจสอบ";
        }
      },
    },
  ];

  return (
    <div>
      <h2>สถานะการยืนยันโครงงานพิเศษ</h2>
      <Table columns={columns} dataSource={proposals} rowKey="id" />
    </div>
  );
};

export default StatusCheck;
