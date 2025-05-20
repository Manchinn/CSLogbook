import React, { useState, useEffect } from "react";
import {
  Layout,
  Table,
  message,
  Tag,
  Space,
  Button,
  Modal,
  Timeline,
  Card,
} from "antd";
import {
  FileTextOutlined,
  EyeOutlined,
  ClockCircleOutlined,
  SyncOutlined,
  CloseCircleOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import internshipService from "../../../../services/internshipService";
import dayjs from "../../../../utils/dayjs";
import "./InternshipStyles.css";

const { Content } = Layout;
const { Column } = Table;

const StatusCheck = () => {
  const [internships, setInternships] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const result = await internshipService.getInternships();
        setInternships(result.data);
      } catch (err) {
        message.error("Failed to fetch internships");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleStatusChange = async (id, status) => {
    try {
      await internshipService.updateStatus(id, status);
      setInternships(
        internships.map((internship) =>
          internship.id === id ? { ...internship, status } : internship
        )
      );
      message.success("Status updated successfully");
    } catch (err) {
      message.error("Failed to update status");
    }
  };

  const renderStatus = (status) => {
    switch (status) {
      case "pending":
        return <Tag color="orange">Pending</Tag>;
      case "approved":
        return <Tag color="green">Approved</Tag>;
      case "rejected":
        return <Tag color="red">Rejected</Tag>;
      default:
        return null;
    }
  };

  return (
    <Layout>
      <Content style={{ padding: "0 50px" }}>
        <div className="site-layout-content">
          <h1>Internship Status Check</h1>
          <Table dataSource={internships} loading={loading} rowKey="id">
            <Column title="Internship Title" dataIndex="title" key="title" />
            <Column
              title="Company"
              dataIndex="company"
              key="company"
              render={(text, record) => (
                <a href={`/companies/${record.companyId}`}>{text}</a>
              )}
            />
            <Column
              title="Status"
              dataIndex="status"
              key="status"
              render={renderStatus}
            />
            <Column
              title="Action"
              key="action"
              render={(text, record) => (
                <Space size="middle">
                  <Button
                    onClick={() => handleStatusChange(record.id, "approved")}
                    icon={<CheckCircleOutlined />}
                    disabled={record.status === "approved"}
                  >
                    Approve
                  </Button>
                  <Button
                    onClick={() => handleStatusChange(record.id, "rejected")}
                    icon={<CloseCircleOutlined />}
                    disabled={record.status === "rejected"}
                  >
                    Reject
                  </Button>
                  <Button
                    onClick={() => handleStatusChange(record.id, "pending")}
                    icon={<SyncOutlined />}
                    disabled={record.status === "pending"}
                  >
                    Reset
                  </Button>
                  <Button
                    type="primary"
                    icon={<EyeOutlined />}
                    onClick={() => {
                      Modal.info({
                        title: record.title,
                        content: (
                          <div>
                            <p>
                              <strong>Company:</strong> {record.company}
                            </p>
                            <p>
                              <strong>Status:</strong> {renderStatus(record.status)}
                            </p>
                            <p>
                              <strong>Posted on:</strong>{" "}
                              {dayjs(record.createdAt).format("YYYY-MM-DD")}
                            </p>
                            <p>
                              <strong>Deadline:</strong>{" "}
                              {dayjs(record.deadline).format("YYYY-MM-DD")}
                            </p>
                            <p>
                              <strong>Description:</strong> {record.description}
                            </p>
                          </div>
                        ),
                        onOk() {},
                      });
                    }}
                  >
                    View Details
                  </Button>
                </Space>
              )}
            />
          </Table>
        </div>
      </Content>
    </Layout>
  );
};

export default StatusCheck;