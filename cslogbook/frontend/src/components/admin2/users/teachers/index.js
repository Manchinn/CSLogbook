import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Row, Col, Form, message, Modal, Typography } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import { userService } from '../../../../services/admin/userService';
import './style.css';

// นำเข้าคอมโพเนนต์
import TeacherFilters from './components/TeacherFilters';
import TeacherTable from './components/TeacherTable';
import TeacherDrawer from './components/TeacherDrawer';

const { Text } = Typography;

const TeacherList = () => {
    const [teachers, setTeachers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchText, setSearchText] = useState('');
    const [selectedTeacher, setSelectedTeacher] = useState(null);
    const [drawerVisible, setDrawerVisible] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [form] = Form.useForm();

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

    // Event handlers
    const handleAddTeacher = () => {
        setSelectedTeacher(null);
        setEditMode(true);
        form.resetFields();
        setDrawerVisible(true);
    };

    const handleViewTeacher = (teacher) => {
        setSelectedTeacher(teacher);
        setEditMode(false);
        setDrawerVisible(true);
    };

    const handleEditTeacher = () => {
        setEditMode(true);
    };

    const handleCancelEdit = () => {
        setEditMode(false);
    };

    const handleSaveTeacher = async () => {
        try {
            const values = await form.validateFields();
            
            if (selectedTeacher) {
                // Update existing teacher
                await userService.updateTeacher(selectedTeacher.teacherId, values);
                message.success('อัปเดตข้อมูลอาจารย์สำเร็จ');
                
                // Update selected teacher with new values
                setSelectedTeacher({
                    ...selectedTeacher,
                    ...values
                });
            } else {
                // Add new teacher
                await userService.createTeacher(values);
                message.success('เพิ่มอาจารย์สำเร็จ');
                setDrawerVisible(false);
            }
            
            setEditMode(false);
            fetchTeachers();
        } catch (error) {
            console.error('Error saving teacher:', error);
            message.error(error.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
        }
    };

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

    const handleCloseDrawer = () => {
        setDrawerVisible(false);
        setEditMode(false);
    };

    return (
        <div className="admin-teacher-container">
            <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
                <Col>
                    <Text strong style={{ fontSize: 16 }}>
                        <UserOutlined /> อาจารย์ทั้งหมด ({teachers.length} คน)
                    </Text>
                </Col>
                <Col>
                    <TeacherFilters
                        searchText={searchText}
                        setSearchText={setSearchText}
                        onRefresh={fetchTeachers}
                        onAddTeacher={handleAddTeacher}
                        loading={loading}
                    />
                </Col>
            </Row>

            <TeacherTable
                teachers={teachers}
                loading={loading}
                onView={handleViewTeacher}
                onEdit={(teacher) => {
                    setSelectedTeacher(teacher);
                    setEditMode(true);
                    setDrawerVisible(true);
                }}
                onDelete={handleDeleteTeacher}
            />

            <TeacherDrawer
                visible={drawerVisible}
                teacher={selectedTeacher}
                editMode={editMode}
                form={form}
                onClose={handleCloseDrawer}
                onEdit={handleEditTeacher}
                onCancelEdit={handleCancelEdit}
                onSave={handleSaveTeacher}
            />
        </div>
    );
};

export default TeacherList;