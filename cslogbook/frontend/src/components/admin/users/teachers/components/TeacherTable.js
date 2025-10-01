import React from "react";
import { Table, Space, Button, Tooltip, Typography, Tag } from "antd";
import { EyeOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";

const { Text } = Typography;

const TeacherTable = ({ teachers, loading, onView, onEdit, onDelete }) => {
  const columns = [
    {
      title: "รหัสอาจารย์",
      dataIndex: "teacherCode",
      key: "teacherCode",
      sorter: (a, b) => a.teacherCode.localeCompare(b.teacherCode),
      width: 130,
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
      title: "ตำแหน่ง",
      dataIndex: "position",
      key: "position",
      width: 200,
      render: (text) => text || "-"
    },
    {
      title: "อีเมล",
      dataIndex: "email",
      key: "email",
      width: 200,
    },/* 
    {
      title: "เบอร์ภายใน",
      dataIndex: "contactExtension",
      key: "contactExtension",
      width: 120,
    }, */
    {
      title: "Topic Exam Overview",
      dataIndex: "canAccessTopicExam",
      key: "canAccessTopicExam",
      width: 160,
      render: (value) => (
        <Tag color={value ? 'green' : 'default'}>
          {value ? 'เปิดใช้งาน' : 'ปิด' }
        </Tag>
      )
    },
    {
      title: "สิทธิ์ส่งออก คพ.02",
      dataIndex: "canExportProject1",
      key: "canExportProject1",
      width: 160,
      render: (value) => (
        <Tag color={value ? 'green' : 'default'}>
          {value ? 'เปิดใช้งาน' : 'ปิด' }
        </Tag>
      )
    },
    {
      title: "จัดการ",
      key: "actions",
      width: 180,
      render: (_, record) => (
        <Space>
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
              icon={<DeleteOutlined />}
              danger
              onClick={(e) => {
                e.stopPropagation();
                onDelete(record.teacherId);
              }}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <Table
      columns={columns}
      dataSource={teachers}
      rowKey="teacherId"
      loading={loading}
      pagination={{
        pageSize: 10,
        showSizeChanger: true,
        showTotal: (total) => `ทั้งหมด ${total} รายการ`,
      }}
      scroll={{ x: "max-content" }}
      onRow={(record) => ({
        onClick: () => onView(record),
      })}
    />
  );
};

export default TeacherTable;
