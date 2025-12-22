import React from 'react';
import { 
    Card, 
    Switch, 
    Button, 
    Typography, 
    Space, 
    Row, 
    Col, 
    Spin, 
    Alert,
    Statistic,
    Tooltip,
    Badge,
    Progress,
    Collapse,
    List,
    Divider
} from 'antd';
import { 
    BellOutlined, 
    BellFilled,
    CheckCircleOutlined,
    StopOutlined,
    ReloadOutlined,
    SettingOutlined,
    SoundOutlined,
    NotificationOutlined,
    InfoCircleOutlined,
    DownOutlined,
    RightOutlined
} from '@ant-design/icons';
import { useNotificationSettings } from 'hooks/admin/useNotificationSettings';
import AgentSystemStatus from '../AgentSystemStatus';

const { Title, Text } = Typography;
const { Panel } = Collapse;

/**
 * Component สำหรับจัดการการตั้งค่าการแจ้งเตือนในส่วน Admin
 * ใช้สำหรับเปิด/ปิดการแจ้งเตือนประเภทต่างๆ ในระบบ
 * อยู่ใน constants folder สำหรับใช้ในแท็บของหน้า ConstantsSettings
 */
const NotificationSettings = () => {
    const {
        loading,
        updating,
        error,
        notificationTypes,
        toggleNotification,
        enableAllNotifications,
        disableAllNotifications,
        fetchSettings,
        isNotificationEnabled,
        getNotificationSetting,
        enabledCount,
        totalCount,
        hasEnabled,
        allEnabled,
        allDisabled,
        percentage,
        clearError
    } = useNotificationSettings();

    /**
     * จัดการการเปลี่ยนแปลงสถานะการแจ้งเตือน
     */
    const handleToggle = async (type, checked) => {
        await toggleNotification(type, checked);
    };

    /**
     * จัดการการเปิดการแจ้งเตือนทั้งหมด
     */
    const handleEnableAll = async () => {
        await enableAllNotifications();
    };

    /**
     * จัดการการปิดการแจ้งเตือนทั้งหมด
     */
    const handleDisableAll = async () => {
        await disableAllNotifications();
    };

    /**
     * Render แต่ละรายการการแจ้งเตือน
     */
    const renderNotificationItem = (notificationType) => {
        const { key, label, description, detailedDescription, examples, icon, color } = notificationType;
        const enabled = isNotificationEnabled(key);
        const settingInfo = getNotificationSetting(key);

        return (
            <Card 
                key={key}
                className={`notification-item ${enabled ? 'enabled' : 'disabled'}`}
                size="small"
                hoverable
                style={{
                    marginBottom: 16,
                    borderColor: enabled ? color : '#d9d9d9',
                    backgroundColor: enabled ? `${color}08` : '#fafafa'
                }}
            >
                <Row align="middle" justify="space-between">
                    <Col flex="auto">
                        <Space direction="vertical" size="small" style={{ width: '100%' }}>
                            <Row align="middle" justify="space-between">
                                <Col flex="auto">
                                    <Space size="middle">
                                        {/* ไอคอนการแจ้งเตือน */}
                                        <div 
                                            className="notification-icon"
                                            style={{
                                                fontSize: '24px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                width: '48px',
                                                height: '48px',
                                                borderRadius: '8px',
                                                backgroundColor: '#fff',
                                                border: `2px solid ${enabled ? color : '#f0f0f0'}`,
                                                filter: enabled ? 'none' : 'grayscale(70%)',
                                                opacity: enabled ? 1 : 0.6,
                                                transition: 'all 0.3s ease'
                                            }}
                                        >
                                            {icon}
                                        </div>
                                        
                                        {/* ข้อมูลการแจ้งเตือน */}
                                        <div className="notification-info">
                                            <Space direction="vertical" size="small">
                                                <Space align="center">
                                                    <Text strong className="notification-label" style={{ fontSize: '16px' }}>
                                                        {label}
                                                    </Text>
                                                    <Badge 
                                                        status={enabled ? "success" : "default"} 
                                                        text={
                                                            <Text type={enabled ? "success" : "secondary"}>
                                                                {enabled ? "เปิดใช้งาน" : "ปิดใช้งาน"}
                                                            </Text>
                                                        }
                                                    />
                                                </Space>
                                                <Text type="secondary" style={{ fontSize: '14px', lineHeight: 1.4 }}>
                                                    {description}
                                                </Text>
                                                {settingInfo.lastUpdated && (
                                                    <Text type="secondary" style={{ fontSize: '12px', fontStyle: 'italic' }}>
                                                        อัปเดตล่าสุด: {new Date(settingInfo.lastUpdated).toLocaleString('th-TH')}
                                                        {settingInfo.updatedBy && ` โดย ${settingInfo.updatedBy}`}
                                                    </Text>
                                                )}
                                            </Space>
                                        </div>
                                    </Space>
                                </Col>
                                
                                {/* Switch สำหรับเปิด/ปิด */}
                                <Col>
                                    <Switch
                                        checked={enabled}
                                        onChange={(checked) => handleToggle(key, checked)}
                                        loading={updating}
                                        checkedChildren={<CheckCircleOutlined />}
                                        unCheckedChildren={<StopOutlined />}
                                        style={{
                                            backgroundColor: enabled ? color : undefined
                                        }}
                                    />
                                </Col>
                            </Row>

                            {/* รายละเอียดเพิ่มเติมและตัวอย่าง */}
                            {(detailedDescription || examples) && (
                                <Collapse 
                                    size="small"
                                    expandIcon={({ isActive }) => 
                                        isActive ? <DownOutlined /> : <RightOutlined />
                                    }
                                    style={{ marginTop: 8 }}
                                >
                                    <Panel 
                                        header={
                                            <Space>
                                                <InfoCircleOutlined style={{ color: color }} />
                                                <Text style={{ fontSize: '13px', color: '#666' }}>
                                                    ดูรายละเอียดและตัวอย่าง
                                                </Text>
                                            </Space>
                                        } 
                                        key={key}
                                        style={{ 
                                            backgroundColor: 'transparent',
                                            border: 'none'
                                        }}
                                    >
                                        <div style={{ paddingLeft: 24 }}>
                                            {detailedDescription && (
                                                <>
                                                    <Text style={{ fontSize: '13px', lineHeight: 1.5 }}>
                                                        {detailedDescription}
                                                    </Text>
                                                    {examples && <Divider style={{ margin: '12px 0' }} />}
                                                </>
                                            )}
                                            
                                            {examples && examples.length > 0 && (
                                                <>
                                                    <Text strong style={{ fontSize: '13px', color: '#666' }}>
                                                        ตัวอย่างการแจ้งเตือน:
                                                    </Text>
                                                    <List
                                                        size="small"
                                                        dataSource={examples}
                                                        renderItem={(example, index) => (
                                                            <List.Item style={{ padding: '4px 0', border: 'none' }}>
                                                                <Text style={{ fontSize: '12px', color: '#666' }}>
                                                                    • {example}
                                                                </Text>
                                                            </List.Item>
                                                        )}
                                                        style={{ marginTop: 8 }}
                                                    />
                                                </>
                                            )}
                                        </div>
                                    </Panel>
                                </Collapse>
                            )}
                        </Space>
                    </Col>
                </Row>
            </Card>
        );
    };

    // แสดง Loading หากกำลังโหลดข้อมูลครั้งแรก
    if (loading) {
        return (
            <div style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                justifyContent: 'center', 
                minHeight: '300px' 
            }}>
                <Spin size="large" />
                <Text style={{ marginTop: 16 }}>กำลังโหลดการตั้งค่าการแจ้งเตือน...</Text>
            </div>
        );
    }

    return (
        <div className="notification-settings">
            {/* ส่วน Header สำหรับการแสดงแบบ Tab */}
            <div style={{ marginBottom: 24 }}>
                <Row align="middle" justify="space-between">
                    <Col>
                        <Title level={5} style={{ marginBottom: 8 }}>
                            <BellFilled style={{ marginRight: 8, color: '#1890ff' }} />
                            การจัดการการแจ้งเตือน
                        </Title>
                        <Text type="secondary" style={{ fontSize: '14px' }}>
                            ควบคุมการส่งอีเมลแจ้งเตือนสำหรับกิจกรรมต่างๆ ในระบบ
                        </Text>
                    </Col>
                    <Col>
                        <Tooltip title="รีเฟรชข้อมูล">
                            <Button 
                                icon={<ReloadOutlined />}
                                onClick={fetchSettings}
                                loading={loading}
                                size="small"
                            >
                                รีเฟรช
                            </Button>
                        </Tooltip>
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
                    onClose={clearError}
                    style={{ marginBottom: 16 }}
                />
            )}

            {/* Statistics */}
            <Row gutter={16} style={{ marginBottom: 20 }}>
                <Col xs={24} sm={8}>
                    <Card size="small">
                        <Statistic
                            title="การแจ้งเตือนที่เปิดใช้งาน"
                            value={enabledCount}
                            suffix={`/ ${totalCount}`}
                            prefix={<NotificationOutlined />}
                            valueStyle={{ 
                                color: hasEnabled ? '#52c41a' : '#8c8c8c',
                                fontSize: '20px'
                            }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={8}>
                    <Card size="small">
                        <Statistic
                            title="สถานะระบบ"
                            value={hasEnabled ? "ใช้งาน" : "ไม่ใช้งาน"}
                            prefix={hasEnabled ? <CheckCircleOutlined /> : <StopOutlined />}
                            valueStyle={{ 
                                color: hasEnabled ? '#52c41a' : '#ff4d4f',
                                fontSize: '16px'
                            }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={8}>
                    <Card size="small">
                        <div>
                            <Text type="secondary" style={{ fontSize: '14px' }}>ความสมบูรณ์</Text>
                            <div style={{ marginTop: 8 }}>
                                <Progress 
                                    percent={percentage} 
                                    size="small" 
                                    strokeColor={{
                                        '0%': '#108ee9',
                                        '100%': '#87d068',
                                    }}
                                    format={(percent) => `${percent}%`}
                                />
                            </div>
                        </div>
                    </Card>
                </Col>
            </Row>

            {/* Bulk Actions */}
            <Card size="small" style={{ marginBottom: 20, backgroundColor: '#fafafa' }}>
                <Row justify="space-between" align="middle">
                    <Col>
                        <Space>
                            <SoundOutlined style={{ color: '#1890ff' }} />
                            <Text strong>การจัดการทั้งหมด</Text>
                        </Space>
                    </Col>
                    <Col>
                        <Space size="middle">
                            <Button
                                type="primary"
                                icon={<BellOutlined />}
                                onClick={handleEnableAll}
                                loading={updating}
                                disabled={allEnabled}
                                size="small"
                            >
                                เปิดทั้งหมด
                            </Button>
                            <Button
                                danger
                                icon={<StopOutlined />}
                                onClick={handleDisableAll}
                                loading={updating}
                                disabled={allDisabled}
                                size="small"
                            >
                                ปิดทั้งหมด
                            </Button>
                        </Space>
                    </Col>
                </Row>
            </Card>

            {/* Notification Items */}
            <div className="notification-items">
                <Title level={5} style={{ marginBottom: 16 }}>
                    <SettingOutlined style={{ marginRight: 8 }} />
                    ประเภทการแจ้งเตือน
                </Title>
                
                {notificationTypes.map(renderNotificationItem)}
            </div>

            {/* Agent System Status */}
            <div style={{ marginTop: 32 }}>
                <AgentSystemStatus />
            </div>
        </div>
    );
};

export default NotificationSettings;