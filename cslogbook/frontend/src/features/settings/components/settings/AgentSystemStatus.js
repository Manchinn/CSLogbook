import React, { useState, useEffect } from 'react';
import { 
  Card,
  Row,
  Col,
  Statistic,
  Badge,
  Button,
  Typography,
  Space,
  Spin,
  Alert,
  Table,
  Tag
} from 'antd';
import {
  RobotOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  ReloadOutlined,
  ClockCircleOutlined,
  SettingOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import agentStatusService from 'services/agentStatusService';

const { Title, Text } = Typography;

/**
 * Component สำหรับแสดงสถานะของ Agent System
 */
const AgentSystemStatus = () => {
    const [loading, setLoading] = useState(false);
    const [agentData, setAgentData] = useState(null);
    const [error, setError] = useState(null);
    const [restarting, setRestarting] = useState({});

    // ดึงข้อมูลสถานะ Agent System
    const fetchAgentStatus = async () => {
        try {
            setLoading(true);
            setError(null);
            
            const agentResponse = await agentStatusService.getAgentSystemStatus();
            
            setAgentData(agentResponse.data);
        } catch (err) {
            console.error('Error fetching agent status:', err);
            setError(err.response?.data?.message || 'เกิดข้อผิดพลาดในการดึงข้อมูล Agent System');
        } finally {
            setLoading(false);
        }
    };

    // รีสตาร์ท agent
    const handleRestartAgent = async (agentName) => {
        try {
            setRestarting(prev => ({ ...prev, [agentName]: true }));
            
            await agentStatusService.restartAgent(agentName);
            
            // รีเฟรชข้อมูลหลังจากรีสตาร์ท
            setTimeout(() => {
                fetchAgentStatus();
            }, 3000);
            
        } catch (err) {
            console.error(`Error restarting agent ${agentName}:`, err);
            setError(err.response?.data?.message || `เกิดข้อผิดพลาดในการรีสตาร์ท ${agentName}`);
        } finally {
            setRestarting(prev => ({ ...prev, [agentName]: false }));
        }
    };

    useEffect(() => {
        fetchAgentStatus();
    }, []);

    // คอลัมน์สำหรับตาราง Agent
    const agentColumns = [
        {
            title: 'Agent',
            dataIndex: 'name',
            key: 'name',
            render: (text, record) => (
                <Space>
                    <RobotOutlined style={{ color: record.isRunning ? '#52c41a' : '#ff4d4f' }} />
                    <div>
                        <div style={{ fontWeight: 'bold' }}>{text}</div>
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                            {record.description}
                        </Text>
                    </div>
                </Space>
            )
        },
        {
            title: 'สถานะ',
            dataIndex: 'isRunning',
            key: 'status',
            render: (isRunning) => (
                <Badge 
                    status={isRunning ? "success" : "error"} 
                    text={isRunning ? "ทำงาน" : "หยุด"}
                />
            )
        },
        {
            title: 'ตารางเวลา',
            dataIndex: 'schedule',
            key: 'schedule',
            render: (schedule) => (
                <Tag color="blue">{schedule}</Tag>
            )
        },
        {
            title: 'กิจกรรมล่าสุด',
            dataIndex: 'lastActivity',
            key: 'lastActivity',
            render: (lastActivity) => (
                <Text type="secondary">
                    {lastActivity ? 
                        new Date(lastActivity).toLocaleString('th-TH') : 
                        'ไม่มีข้อมูล'
                    }
                </Text>
            )
        },
        {
            title: 'การจัดการ',
            key: 'actions',
            render: (_, record) => (
                <Button
                    size="small"
                    icon={<ReloadOutlined />}
                    onClick={() => handleRestartAgent(record.key)}
                    loading={restarting[record.key]}
                    disabled={!record.isRunning}
                >
                    รีสตาร์ท
                </Button>
            )
        }
    ];

    // เตรียมข้อมูลสำหรับตาราง
    const agentTableData = agentData ? Object.entries(agentData.agents).map(([key, agent]) => ({
        key,
        name: agent.name,
        description: agent.description,
        isRunning: agent.isRunning,
        schedule: agent.schedule,
        lastActivity: agent.lastActivity
    })) : [];

    if (loading && !agentData) {
        return (
            <div style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                justifyContent: 'center', 
                minHeight: '300px' 
            }}>
                <Spin size="large" />
                <Text style={{ marginTop: 16 }}>กำลังโหลดข้อมูล Agent System...</Text>
            </div>
        );
    }

    return (
        <div className="agent-system-status">
            {/* Header */}
            <div style={{ marginBottom: 24 }}>
                <Row align="middle" justify="space-between">
                    <Col>
                        <Title level={4} style={{ marginBottom: 8 }}>
                            <RobotOutlined style={{ marginRight: 8, color: '#1890ff' }} />
                            สถานะ Agent System
                        </Title>
                        <Text type="secondary">
                            ระบบอัตโนมัติสำหรับการแจ้งเตือนและการจัดการข้อมูล
                        </Text>
                    </Col>
                    <Col>
                        <Space>
                            <Button 
                                icon={<ReloadOutlined />}
                                onClick={fetchAgentStatus}
                                loading={loading}
                                size="small"
                            >
                                รีเฟรช
                            </Button>
                        </Space>
                    </Col>
                </Row>
            </div>

            {/* Error Alert */}
            {error && (
                <Alert
                    message="เกิดข้อผิดพลาด"
                    description={error}
                    type="error"
                    showIcon
                    closable
                    onClose={() => setError(null)}
                    style={{ marginBottom: 16 }}
                />
            )}

            {/* System Overview */}
            {agentData && (
                <>
                    <Row gutter={16} style={{ marginBottom: 24 }}>
                        <Col xs={24} sm={8}>
                            <Card size="small">
                                <Statistic
                                    title="สถานะระบบ"
                                    value={agentData.systemStatus.isRunning ? "ทำงาน" : "หยุด"}
                                    prefix={agentData.systemStatus.isRunning ? 
                                        <PlayCircleOutlined style={{ color: '#52c41a' }} /> : 
                                        <PauseCircleOutlined style={{ color: '#ff4d4f' }} />
                                    }
                                    valueStyle={{ 
                                        color: agentData.systemStatus.isRunning ? '#52c41a' : '#ff4d4f',
                                        fontSize: '16px'
                                    }}
                                />
                            </Card>
                        </Col>
                        <Col xs={24} sm={8}>
                            <Card size="small">
                                <Statistic
                                    title="Agent ที่ทำงาน"
                                    value={agentData.systemStatus.runningAgents}
                                    suffix={`/ ${agentData.systemStatus.totalAgents}`}
                                    prefix={<RobotOutlined />}
                                    valueStyle={{ color: '#1890ff' }}
                                />
                            </Card>
                        </Col>
                        <Col xs={24} sm={8}>
                            <Card size="small">
                                <Statistic
                                    title="เวลาทำงาน"
                                    value={agentData.systemStatus.uptime?.formatted || 'ไม่ทราบ'}
                                    prefix={<ClockCircleOutlined />}
                                    valueStyle={{ fontSize: '14px' }}
                                />
                            </Card>
                        </Col>
                    </Row>

                    {/* Agent Details Table */}
                    <Card 
                        title={
                            <Space>
                                <SettingOutlined />
                                รายละเอียด Agent ({agentTableData.length} รายการ)
                            </Space>
                        }
                        style={{ marginBottom: 24 }}
                    >
                        <Table
                            columns={agentColumns}
                            dataSource={agentTableData}
                            pagination={false}
                            size="small"
                            loading={loading}
                        />
                    </Card>

                    {/* Configuration Info */}
                    <Card 
                        title={
                            <Space>
                                <InfoCircleOutlined />
                                การกำหนดค่าระบบ
                            </Space>
                        }
                        style={{ marginTop: 16 }}
                    >
                        <Row gutter={16}>
                            <Col xs={24} md={8}>
                                <Title level={5}>การแจ้งเตือน</Title>
                                <Space direction="vertical">
                                    <div>
                                        <Text>อีเมล: </Text>
                                        <Badge 
                                            status={agentData.configuration.notifications.emailEnabled ? "success" : "error"}
                                            text={agentData.configuration.notifications.emailEnabled ? "เปิด" : "ปิด"}
                                        />
                                    </div>
                                    <div>
                                        <Text>Push Notification: </Text>
                                        <Badge 
                                            status={agentData.configuration.notifications.pushNotificationEnabled ? "success" : "error"}
                                            text={agentData.configuration.notifications.pushNotificationEnabled ? "เปิด" : "ปิด"}
                                        />
                                    </div>
                                </Space>
                            </Col>
                            <Col xs={24} md={8}>
                                <Title level={5}>เกณฑ์การแจ้งเตือน</Title>
                                <Space direction="vertical">
                                    <Text>แจ้งเตือนก่อนครบกำหนด: {agentData.configuration.thresholds.deadlineWarningDays} วัน</Text>
                                    <Text>เอกสารค้างตรวจ: {agentData.configuration.thresholds.documentsStuckInReviewDays} วัน</Text>
                                </Space>
                            </Col>
                        </Row>
                    </Card>
                </>
            )}
        </div>
    );
};

export default AgentSystemStatus;