import React from 'react';
import { Card, Typography, Breadcrumb } from 'antd';
import { Link } from 'react-router-dom';
import { BellOutlined, HomeOutlined, SettingOutlined } from '@ant-design/icons';
import NotificationSettings from './constants/NotificationSettings';
import './constants/styles.css';

const { Title } = Typography;

/**
 * หน้าการจัดการการตั้งค่าการแจ้งเตือนสำหรับ Admin
 * แสดงในรูปแบบหน้าเต็มแยกจากระบบ constants อื่นๆ
 */
const NotificationSettingsPage = () => {
    return (
        <div className="settings-page">
            {/* Breadcrumb Navigation */}
            <Breadcrumb className="settings-breadcrumb">
                <Breadcrumb.Item>
                    <Link to="/admin/dashboard">
                        <HomeOutlined />
                        <span style={{ marginLeft: 8 }}>หน้าหลัก</span>
                    </Link>
                </Breadcrumb.Item>
                <Breadcrumb.Item>
                    <Link to="/admin/settings">
                        <SettingOutlined />
                        <span style={{ marginLeft: 8 }}>การจัดการระบบ</span>
                    </Link>
                </Breadcrumb.Item>
                <Breadcrumb.Item>
                    <BellOutlined />
                    <span style={{ marginLeft: 8 }}>การตั้งค่าการแจ้งเตือน</span>
                </Breadcrumb.Item>
            </Breadcrumb>

            {/* Main Content */}
            <Card className="settings-content-card">
                <Title level={4}>
                    <BellOutlined style={{ marginRight: 8 }} />
                    จัดการการตั้งค่าการแจ้งเตือน
                </Title>
                <p className="settings-description">
                    ควบคุมการส่งอีเมลแจ้งเตือนสำหรับกิจกรรมต่างๆ ในระบบ
                </p>
                
                {/* ใช้ NotificationSettings Component */}
                <NotificationSettings />
            </Card>
        </div>
    );
};

export default NotificationSettingsPage;