import React from "react";
import { Table, Space, Button, Tag, Tooltip, Typography } from "antd";
import { EyeOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import { getStatusTags } from "../utils/statusHelpers";

import styles from "../StudentList.module.css";

const { Text } = Typography;

const StudentTable = ({ students, loading, onView, onEdit, onDelete, emptyText }) => {
  const columns = [
    {
      title: "รหัสนักศึกษา",
      dataIndex: "studentCode",
      key: "studentCode",
      sorter: (a, b) => a.studentCode?.localeCompare(b.studentCode || ""),
      width: 130,
      fixed: "left",
    },
    {
      title: "ชื่อ-นามสกุล",
      dataIndex: "fullName",
      key: "fullName",
      render: (_, record) => (
        <Text strong>{`${record.firstName || ""} ${
          record.lastName || ""
        }`}</Text>
      ),
      sorter: (a, b) =>
        `${a.firstName} ${a.lastName}`.localeCompare(
          `${b.firstName} ${b.lastName}`
        ),
      width: 180,
    },
    {
      title: "หน่วยกิต",
      key: "credits",
      width: 120,
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Text>สะสม: {record.totalCredits || 0}</Text>
          <Text type="secondary">ภาควิชา: {record.majorCredits || 0}</Text>
        </Space>
      ),
    },
    {
      title: "สถานะ",
      key: "status",
      width: 200,
      render: (_, record) => {
        const tags = getStatusTags(record);
        return (
          <Space size={4} wrap>
            {tags.map((tag, index) => (
              <Tag color={tag.color} key={index}>
                {tag.text}
              </Tag>
            ))}
          </Space>
        );
      },
    },
    {
      title: "จัดการ",
      key: "actions",
      width: 180,
      fixed: "right",
      render: (_, record) => (
        <Space className={styles.actionButtons}>
          <Tooltip title="ดูข้อมูล">
            <Button
              icon={<EyeOutlined />}
              onClick={(e) => {
                e.stopPropagation();
                onView(record);
              }}
            />
          </Tooltip>
          <Tooltip title="แก้ไข">
            <Button
              icon={<EditOutlined />}
              type="primary"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(record);
              }}
            />
          </Tooltip>
          <Tooltip title="ลบ">
            <Button
              danger
              icon={<DeleteOutlined />}
              onClick={() => onDelete(record.studentCode)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <Table
      columns={columns}
      dataSource={students}
      rowKey={(record) => record.studentId || record.userId || record.studentCode}
      loading={loading}
      pagination={{
        pageSizeOptions: [10, 20, 50, 100],
        showSizeChanger: true,
        showTotal: (total) => `ทั้งหมด ${total} รายการ`,
      }}
      scroll={{ x: "max-content" }}
      locale={{
        emptyText: loading ? "กำลังโหลดข้อมูล..." : emptyText || "ไม่พบข้อมูลนักศึกษา",
      }}
      onRow={(record) => ({
        onClick: () => onView(record),
      })}
    />
  );
};

export default StudentTable;
