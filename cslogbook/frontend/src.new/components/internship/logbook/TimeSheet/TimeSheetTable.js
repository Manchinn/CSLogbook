import React, { useState } from "react";
import { Table, Button, Space, Modal, Tag, Tooltip } from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  ExclamationCircleOutlined,
  EyeOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  SyncOutlined,
  CloseCircleOutlined,
} from "@ant-design/icons";
import dayjs from "../../../../../utils/dayjs"; // Updated path
import { DATE_FORMAT_MEDIUM } from "../../../../../utils/constants"; // Updated path
import "./styles.css"; // Assuming styles.css is in the same folder

const { confirm } = Modal;

const TimeSheetTable = ({
  entries,
  onEdit,
  onDelete,
  onView,
  loading,
  userRole,
}) => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [currentImageUrl, setCurrentImageUrl] = useState("");

  const showImageModal = (imageUrl) => {
    setCurrentImageUrl(imageUrl);
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    setCurrentImageUrl("");
  };

  const showDeleteConfirm = (id) => {
    confirm({
      title: "Are you sure you want to delete this entry?",
      icon: <ExclamationCircleOutlined />,
      content: "This action cannot be undone.",
      okText: "Yes",
      okType: "danger",
      cancelText: "No",
      onOk() {
        onDelete(id);
      },
    });
  };

  const getStatusTag = (status) => {
    switch (status) {
      case "Pending":
        return (
          <Tag icon={<ClockCircleOutlined />} color="default">
            Pending
          </Tag>
        );
      case "Submitted":
        return (
          <Tag icon={<SyncOutlined spin />} color="processing">
            Submitted
          </Tag>
        );
      case "Approved":
        return (
          <Tag icon={<CheckCircleOutlined />} color="success">
            Approved
          </Tag>
        );
      case "Rejected":
        return (
          <Tag icon={<CloseCircleOutlined />} color="error">
            Rejected
          </Tag>
        );
      default:
        return <Tag>{status}</Tag>;
    }
  };

  const columns = [
    {
      title: "Date",
      dataIndex: "date",
      key: "date",
      render: (text) => dayjs(text).format(DATE_FORMAT_MEDIUM),
      sorter: (a, b) => dayjs(a.date).unix() - dayjs(b.date).unix(),
    },
    {
      title: "Task Description",
      dataIndex: "taskDescription",
      key: "taskDescription",
      ellipsis: true,
      render: (text) => (
        <Tooltip placement="topLeft" title={text}>
          {text}
        </Tooltip>
      ),
    },
    {
      title: "Hours Worked",
      dataIndex: "hoursWorked",
      key: "hoursWorked",
      sorter: (a, b) => a.hoursWorked - b.hoursWorked,
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: getStatusTag,
      filters: [
        { text: "Pending", value: "Pending" },
        { text: "Submitted", value: "Submitted" },
        { text: "Approved", value: "Approved" },
        { text: "Rejected", value: "Rejected" },
      ],
      onFilter: (value, record) => record.status.indexOf(value) === 0,
    },
    {
      title: "Supporting Document",
      dataIndex: "supportingDocument",
      key: "supportingDocument",
      render: (text, record) => {
        if (text) {
          // Simplified check: if it's a string and looks like a URL, assume it's an image or viewable link
          // For actual implementation, you might need more robust checks for file types (PDF, image, etc.)
          // or rely on a backend-provided file type.
          const isImage = /\.(jpeg|jpg|gif|png)$/.test(text.toLowerCase());
          if (isImage) {
            return (
              <Button type="link" onClick={() => showImageModal(text)}>
                View Document
              </Button>
            );
          }
          // If not an image but a URL, provide a link.
          // This assumes the URL is directly accessible.
          // For files stored in a secure way (e.g., S3 presigned URLs), this would work.
          // If it's just a filename, this part would need adjustment based on how files are served.
          return (
            <a href={text} target="_blank" rel="noopener noreferrer">
              View Document
            </a>
          );
        }
        return "No document";
      },
    },
    {
      title: "Actions",
      key: "actions",
      render: (text, record) => (
        <Space size="middle">
          <Tooltip title="View Details">
            <Button
              icon={<EyeOutlined />}
              onClick={() => onView(record)}
              size="small"
            />
          </Tooltip>
          {userRole !== "supervisor" && record.status === "Pending" && (
            <Tooltip title="Edit Entry">
              <Button
                icon={<EditOutlined />}
                onClick={() => onEdit(record)}
                size="small"
              />
            </Tooltip>
          )}
          {userRole !== "supervisor" && record.status === "Pending" && (
            <Tooltip title="Delete Entry">
              <Button
                icon={<DeleteOutlined />}
                onClick={() => showDeleteConfirm(record._id)}
                danger
                size="small"
              />
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  // Filter out actions column for supervisor
  const supervisorColumns = columns.filter(col => col.key !== 'actions' || userRole !== 'supervisor');
  // Add a specific actions column for supervisor if needed, or adjust existing one.
  // For now, we assume supervisors might have different actions or no direct edit/delete on this table.
  // If supervisors need actions (e.g., approve/reject directly from table), that column should be defined here.

  return (
    <>
      <Table
        columns={userRole === "supervisor" ? supervisorColumns : columns}
        dataSource={entries}
        rowKey="_id"
        loading={loading}
        pagination={{ pageSize: 10, showSizeChanger: true }}
        scroll={{ x: true }} // Enable horizontal scroll for smaller screens
      />
      <Modal
        title="View Supporting Document"
        visible={isModalVisible}
        onCancel={handleCancel}
        footer={null}
        width="80%"
        style={{ top: 20 }}
      >
        {currentImageUrl ? (
          <img
            src={currentImageUrl}
            alt="Supporting Document"
            style={{ width: "100%" }}
          />
        ) : (
          <p>No image to display or image URL is invalid.</p>
        )}
      </Modal>
    </>
  );
};

export default TimeSheetTable;