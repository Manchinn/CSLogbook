import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    Table, Input, Space, Button, Row, Col, message, Modal, Drawer, Typography, Tooltip
} from 'antd';
import {
    SearchOutlined, ReloadOutlined, UserOutlined, PlusOutlined, 
    EditOutlined, DeleteOutlined, EyeOutlined
} from '@ant-design/icons';
import { userService } from '../../../../services/admin/userService';
import TeacherForm from './TeacherForm';

const { Text } = Typography;

const TeacherList = () => {
    const [teachers, setTeachers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchText, setSearchText] = useState('');
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedTeacher, setSelectedTeacher] = useState(null);
    const [drawerVisible, setDrawerVisible] = useState(false);

    // Fetch teachers
    const fetchTeachers = useCallback(async () => {
        setLoading(true);
        try {
            const response = await userService.getTeachers({
                search: searchText
            });
            
            if (response.success && Array.isArray(response.data)) {
                setTeachers(response.data);
            } else {
                console.error('Invalid response format:', response);
                message.error('รูปแบบข้อมูลไม่ถูกต้อง');
            }
        } catch (error) {
            console.error('Error fetching teachers:', error);
            message.error('ไม่สามารถโหลดข้อมูลอาจารย์: ' + (error.message || 'เกิดข้อผิดพลาด'));
        } finally {
            setLoading(false);
        }
    }, [searchText]);

    // Load teachers on mount and when search changes
    useEffect(() => {
        fetchTeachers();
    }, [fetchTeachers]);

    // Handle adding a new teacher
    const handleAddTeacher = () => {
        setSelectedTeacher(null);
        setModalVisible(true);
    };

    // Handle viewing/editing a teacher
    const handleEditTeacher = (teacher) => {
        setSelectedTeacher(teacher);
        setModalVisible(true);
    };

    // Handle teacher form submission
    const handleFormSubmit = async (values) => {
        try {
            if (selectedTeacher) {
                // Update existing teacher
                await userService.updateTeacher(selectedTeacher.id, values);
                message.success('อัปเดตข้อมูลอาจารย์สำเร็จ');
            } else {
                // Add new teacher
                await userService.createTeacher(values);
                message.success('เพิ่มอาจารย์สำเร็จ');
            }
            setModalVisible(false);
            fetchTeachers();
        } catch (error) {
            console.error('Error saving teacher:', error);
            message.error(error.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
        }
    };

    // Handle teacher deletion
    const handleDeleteTeacher = async (teacherId) => {
        try {
            Modal.confirm({
                title: 'ยืนยันการลบข้อมูล',
                content: 'คุณแน่ใจหรือไม่ว่าต้องการลบข้อมูลอาจารย์นี้? การดำเนินการนี้ไม่สามารถเรียกคืนได้',
                okText: 'ลบ',
                okType: 'danger',
                cancelText: 'ยกเลิก',
                onOk: async () => {
                    await userService.deleteTeacher(teacherId);
                    message.success('ลบข้อมูลอาจารย์สำเร็จ');
                    fetchTeachers();
                }
            });
        } catch (error) {
            console.error('Error deleting teacher:', error);
            message.error(error.message || 'เกิดข้อผิดพลาดในการลบข้อมูล');
        }
    };

    // Table columns
    const columns = useMemo(() => [
        {
            title: 'รหัสอาจารย์',
            dataIndex: 'teacherCode',
            key: 'teacherCode',
            sorter: (a, b) => a.teacherCode.localeCompare(b.teacherCode),
            width: 130,
        },
        {
            title: 'ชื่อ-นามสกุล',
            dataIndex: 'fullName',
            key: 'fullName',
            render: (_, record) => `${record.firstName || ''} ${record.lastName || ''}`,
            sorter: (a, b) => `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`),
            width: 180,
        },
        {
            title: 'อีเมล',
            dataIndex: 'email',
            key: 'email',
            width: 200,
        },
        {
            title: 'เบอร์ภายใน',
            dataIndex: 'extension',
            key: 'extension',
            width: 120,
        },
        {
            title: 'ภาควิชา',
            dataIndex: 'department',
            key: 'department',
            width: 150,
        },
        {
            title: 'จัดการ',
            key: 'actions',
            width: 180,
            render: (_, record) => (
                <Space>
                    <Tooltip title="ดูข้อมูล">
                        <Button 
                            icon={<EyeOutlined />} 
                            onClick={() => {
                                setSelectedTeacher(record);
                                setDrawerVisible(true);
                            }} 
                        />
                    </Tooltip>
                    <Tooltip title="แก้ไข">
                        <Button 
                            icon={<EditOutlined />} 
                            type="primary"
                            onClick={() => handleEditTeacher(record)} 
                        />
                    </Tooltip>
                    <Tooltip title="ลบ">
                        <Button 
                            icon={<DeleteOutlined />} 
                            danger
                            onClick={() => handleDeleteTeacher(record.id)} 
                        />
                    </Tooltip>
                </Space>
            ),
        },
    ], []);

    return (
        <div className="admin-teacher-container">
            <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
                <Col>
                    <Text strong style={{ fontSize: 16 }}>
                        <UserOutlined /> อาจารย์ทั้งหมด ({teachers.length} คน)
                    </Text>
                </Col>
                <Col>
                    <Space size="small">
                        <Input
                            placeholder="ค้นหาด้วยรหัส, ชื่อ หรือนามสกุล"
                            prefix={<SearchOutlined />}
                            value={searchText}
                            onChange={e => setSearchText(e.target.value)}
                            style={{ width: 250 }}
                            allowClear
                        />
                        <Button 
                            icon={<ReloadOutlined />} 
                            onClick={() => fetchTeachers()}
                            loading={loading}
                        >
                            รีเฟรช
                        </Button>
                        <Button 
                            type="primary"
                            icon={<PlusOutlined />}
                            onClick={handleAddTeacher}
                        >
                            เพิ่มอาจารย์
                        </Button>
                    </Space>
                </Col>
            </Row>

            <Table
                columns={columns}
                dataSource={teachers}
                rowKey="id"
                loading={loading}
                pagination={{ 
                    pageSize: 10,
                    showSizeChanger: true,
                    showTotal: total => `ทั้งหมด ${total} รายการ` 
                }}
                scroll={{ x: 'max-content' }}
            />

            {/* Teacher Form Modal */}
            <TeacherForm
                visible={modalVisible}
                teacher={selectedTeacher}
                onCancel={() => setModalVisible(false)}
                onSubmit={handleFormSubmit}
            />

            {/* Teacher Detail Drawer */}
            <Drawer
                title="ข้อมูลอาจารย์"
                placement="right"
                width={520}
                onClose={() => setDrawerVisible(false)}
                open={drawerVisible}
                extra={
                    <Button 
                        type="primary" 
                        onClick={() => {
                            setDrawerVisible(false);
                            handleEditTeacher(selectedTeacher);
                        }}
                    >
                        แก้ไขข้อมูล
                    </Button>
                }
            >
                {selectedTeacher && (
                    <div>
                        <p><strong>รหัสอาจารย์:</strong> {selectedTeacher.teacherCode}</p>
                        <p><strong>ชื่อ-นามสกุล:</strong> {selectedTeacher.firstName} {selectedTeacher.lastName}</p>
                        <p><strong>อีเมล:</strong> {selectedTeacher.email || '-'}</p>
                        <p><strong>เบอร์ภายใน:</strong> {selectedTeacher.extension || '-'}</p>
                    </div>
                )}
            </Drawer>
        </div>
    );
};

export default TeacherList;