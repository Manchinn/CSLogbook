import React, { useState, useEffect, useCallback } from 'react';
import { Table, Input, Space, Typography, Button, Tag, Row, Col } from 'antd';
import { SearchOutlined, ReloadOutlined, UserOutlined } from '@ant-design/icons';
import axios from 'axios';

const { Title } = Typography;

const StudentList = () => {
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchText, setSearchText] = useState('');
    const [sortedInfo, setSortedInfo] = useState({});

    // ใช้ useCallback เพื่อ memoize ฟังก์ชัน
    const fetchStudents = useCallback(async () => {
        setLoading(true);
        try {
            const response = await axios.get('http://localhost:5000/api/students');
            const studentOnly = response.data.filter(user => user.role === 'student');
            setStudents(studentOnly);
        } catch (error) {
            console.error('Error fetching students:', error);
        } finally {
            setLoading(false);
        }
    }, []); // ไม่มี dependencies เพราะไม่ได้ใช้ค่าจากภายนอก

    // ใช้ useCallback สำหรับ updateSummary
    const updateSummary = useCallback((data) => {
        const filteredData = data.filter(student =>
            student.studentID?.toLowerCase().includes(searchText.toLowerCase()) ||
            student.firstName?.toLowerCase().includes(searchText.toLowerCase()) ||
            student.lastName?.toLowerCase().includes(searchText.toLowerCase())
        );
        // ส่งค่ากลับแทนการใช้ state
        return {
            total: filteredData.length,
            internshipEligible: filteredData.filter(s => s.isEligibleForInternship).length,
            projectEligible: filteredData.filter(s => s.isEligibleForProject).length
        };
    }, [searchText]); // dependency เป็น searchText เพราะใช้ในการกรอง

    useEffect(() => {
        fetchStudents();
    }, [fetchStudents]); // เพิ่ม dependency

    const handleTableChange = (pagination, filters, sorter) => {
        setSortedInfo(sorter);
    };

    const filteredStudents = students.filter(student =>
        student.studentID?.toLowerCase().includes(searchText.toLowerCase()) ||
        student.firstName?.toLowerCase().includes(searchText.toLowerCase()) ||
        student.lastName?.toLowerCase().includes(searchText.toLowerCase())
    );

    const tableHeaderStyle = {
        background: '#fafafa',
        fontWeight: 500,
        padding: '12px 16px',
        borderBottom: '2px solid #f0f0f0',
    };

    const tableCellStyle = {
        padding: '12px 16px',
        fontSize: '14px'
    };

    const currentSummary = updateSummary(students);

    const columns = [
        {
            title: 'รหัสนักศึกษา',
            dataIndex: 'studentID',
            key: 'studentID',
            width: 140,
            fixed: 'left',
            onHeaderCell: () => ({ style: tableHeaderStyle }),
            onCell: () => ({ style: tableCellStyle }),
            sorter: (a, b) => a.studentID.localeCompare(b.studentID),
            sortOrder: sortedInfo.columnKey === 'studentID' && sortedInfo.order,
            render: text => <span style={{ fontWeight: 500 }}>{text}</span>
        },
        {
            title: 'ชื่อ',
            dataIndex: 'firstName',
            key: 'firstName',
            width: 150,
            onHeaderCell: () => ({ style: tableHeaderStyle }),
            onCell: () => ({ style: tableCellStyle }),
            sorter: (a, b) => a.firstName.localeCompare(b.firstName),
            sortOrder: sortedInfo.columnKey === 'firstName' && sortedInfo.order
        },
        {
            title: 'นามสกุล',
            dataIndex: 'lastName',
            key: 'lastName',
            width: 150,
            onHeaderCell: () => ({ style: tableHeaderStyle }),
            onCell: () => ({ style: tableCellStyle }),
            sorter: (a, b) => a.lastName.localeCompare(b.lastName),
            sortOrder: sortedInfo.columnKey === 'lastName' && sortedInfo.order
        },
        {
            title: 'สถานะฝึกงาน',
            dataIndex: 'isEligibleForInternship',
            key: 'internship',
            width: 130,
            align: 'center',
            onHeaderCell: () => ({ style: tableHeaderStyle }),
            onCell: () => ({ style: tableCellStyle }),
            sorter: (a, b) => Number(a.isEligibleForInternship) - Number(b.isEligibleForInternship),
            sortOrder: sortedInfo.columnKey === 'internship' && sortedInfo.order,
            render: isEligible => (
                <Tag color={isEligible ? 'success' : 'error'} style={{ 
                    minWidth: '80px', 
                    textAlign: 'center',
                    padding: '4px 8px'
                }}>
                    {isEligible ? 'มีสิทธิ์' : 'ไม่มีสิทธิ์'}
                </Tag>
            )
        },
        {
            title: 'สถานะโปรเจค',
            dataIndex: 'isEligibleForProject',
            key: 'project',
            width: 130,
            align: 'center',
            onHeaderCell: () => ({ style: tableHeaderStyle }),
            onCell: () => ({ style: tableCellStyle }),
            sorter: (a, b) => Number(a.isEligibleForProject) - Number(b.isEligibleForProject),
            sortOrder: sortedInfo.columnKey === 'project' && sortedInfo.order,
            render: isEligible => (
                <Tag color={isEligible ? 'success' : 'error'} style={{ 
                    minWidth: '80px', 
                    textAlign: 'center',
                    padding: '4px 8px'
                }}>
                    {isEligible ? 'มีสิทธิ์' : 'ไม่มีสิทธิ์'}
                </Tag>
            )
        },
        {
            title: 'อีเมล',
            dataIndex: 'email',
            key: 'email',
            width: 300,
            onHeaderCell: () => ({ style: tableHeaderStyle }),
            onCell: () => ({ style: tableCellStyle }),
            sorter: (a, b) => a.email.localeCompare(b.email),
            sortOrder: sortedInfo.columnKey === 'email' && sortedInfo.order,
            render: email => <span style={{ color: '#666' }}>{email}</span>
        }
    ];

    return (
        <div style={{ 
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '24px',
            background: '#fff'
        }}>
            {/* หัวข้อ */}
            <Title level={2} style={{ 
                marginTop: 0,
                marginBottom: '2px',
                fontSize: '24px'
            }}>
                รายชื่อนักศึกษา
            </Title>

            {/* แถวควบคุมและสรุปข้อมูล */}
            <Row justify="space-between" align="middle">
                <Col flex="auto">
                    <Row gutter={40} align="middle">
                        <Col>
                            <Space style={{ fontSize: '14px' }}>
                                <UserOutlined />
                                <span>{currentSummary.total} คน</span>
                            </Space>
                        </Col>
                        <Col>
                            <Space style={{ 
                                fontSize: '14px',
                                color: '#52c41a' 
                            }}>
                                <span>มีสิทธิ์ฝึกงาน {currentSummary.internshipEligible} คน</span>
                            </Space>
                        </Col>
                        <Col>
                            <Space style={{ 
                                fontSize: '14px',
                                color: '#1890ff'
                            }}>
                                <span>มีสิทธิ์ทำโปรเจค {currentSummary.projectEligible} คน</span>
                            </Space>
                        </Col>
                    </Row>
                </Col>
                <Col flex="none">
                    <Space size={16}>
                        <Input
                            placeholder="ค้นหาด้วยรหัสนักศึกษา, ชื่อ หรือนามสกุล"
                            prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
                            value={searchText}
                            onChange={e => setSearchText(e.target.value)}
                            style={{ 
                                width: 300,
                                borderRadius: '6px'
                            }}
                        />
                        <Button
                            type="primary"
                            icon={<ReloadOutlined />}
                            onClick={() => {
                                fetchStudents();
                                setSortedInfo({});
                            }}
                            loading={loading}
                            style={{ borderRadius: '6px' }}
                        >
                            รีเฟรชข้อมูล
                        </Button>
                    </Space>
                </Col>
            </Row>

            {/* ตาราง */}
            <Table
                columns={columns}
                dataSource={filteredStudents}
                rowKey="studentID"
                loading={loading}
                size="middle"
                onChange={handleTableChange}
                scroll={{ 
                    x: 1000,
                    y: 'calc(100vh - 350px)' // ปรับความสูงเนื่องจากลดพื้นที่ด้านบน
                }}
                sortDirections={['ascend', 'descend', 'ascend']} // เพิ่มทิศทางการ sort ที่เป็นไปได้
            />
        </div>
    );
};

export default StudentList;