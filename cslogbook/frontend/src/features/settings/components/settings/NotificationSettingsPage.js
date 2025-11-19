import React from 'react';
import { Card, Typography, Alert, Space, Breadcrumb } from 'antd';
import { Link } from 'react-router-dom';
import { BellOutlined, HomeOutlined, SettingOutlined, InfoCircleOutlined } from '@ant-design/icons';
import NotificationSettings from './constants/NotificationSettings';
import './constants/Settings.module.css';

const { Title, Text } = Typography;

/**
 * หน้าการจัดการการตั้งค่าการแจ้งเตือนสำหรับ Admin
 */
const NotificationSettingsPage = () => {
    // กำหนด breadcrumb items สำหรับ Ant Design เวอร์ชันใหม่ พร้อม navigation links
    const breadcrumbItems = [
        {
            title: (
                <Link to="/admin/dashboard" style={{ color: 'inherit', textDecoration: 'none' }}>
                    <HomeOutlined style={{ marginRight: 4 }} />
                    หน้าหลัก
                </Link>
            )
        },
        {
            title: (
                <Link to="/admin/settings" style={{ color: 'inherit', textDecoration: 'none' }}>
                    <SettingOutlined style={{ marginRight: 4 }} />
                    การตั้งค่าระบบ
                </Link>
            )
        },
        {
            title: (
                <span>
                    <BellOutlined style={{ marginRight: 4 }} />
                    การตั้งค่าการแจ้งเตือน
                </span>
            )
        }
    ];

    return (
        <div style={{ padding: '20px' }}>
            {/* Breadcrumb Navigation พร้อม link navigation */}
            <Breadcrumb 
                items={breadcrumbItems}
                style={{ marginBottom: '20px' }}
            />

            {/* Header Section */}
            <Card style={{ marginBottom: '20px' }}>
                <Space direction="vertical" size="small" style={{ width: '100%' }}>
                    <Title level={3} style={{ margin: 0 }}>
                        <BellOutlined style={{ marginRight: 8 }} />
                        การตั้งค่าการแจ้งเตือน
                    </Title>
                    <Text type="secondary">
                        ควบคุมการส่งอีเมลแจ้งเตือนสำหรับกิจกรรมต่างๆ ในระบบ กำหนดประเภทและช่วงเวลาการแจ้งเตือน
                    </Text>
                    
                    {/* คำแนะนำการใช้งาน */}
                    <Alert
                        message="คำแนะนำการใช้งาน"
                        description={
                            <div>
                                <p>• <strong>การแจ้งเตือนนักศึกษา:</strong> ควบคุมการส่งอีเมลเมื่อมีการอัปเดตสถานะหรือข้อความใหม่</p>
                                <p>• <strong>การแจ้งเตือนอาจารย์:</strong> จัดการการแจ้งเตือนสำหรับการตรวจสอบงานและให้คำปรึกษา</p>
                                <p>• <strong>การแจ้งเตือนระบบ:</strong> แจ้งเตือนเกี่ยวกับการบำรุงรักษา อัปเดต และข้อมูลสำคัญ</p>
                                <p>• <strong>การตั้งค่าเวลา:</strong> กำหนดช่วงเวลาการส่งการแจ้งเตือนและความถี่ในการส่ง</p>
                            </div>
                        }
                        type="info"
                        showIcon
                        icon={<InfoCircleOutlined />}
                        style={{ marginTop: 16 }}
                    />
                </Space>
            </Card>

            {/* Main Content */}
            <NotificationSettings />
        </div>
    );
};

export default NotificationSettingsPage;