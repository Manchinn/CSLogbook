// components/StudentList.js
import React, { useState, useEffect } from 'react';
import { Table, Card, Input, Space, Typography, Button, Tag, message } from 'antd';
import { SearchOutlined, ReloadOutlined } from '@ant-design/icons';
import axios from 'axios';

const { Title } = Typography;

const StudentList = () => {
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchText, setSearchText] = useState('');

    const fetchStudents = async () => {
        setLoading(true);
        try {
            const response = await axios.get('http://localhost:5000/api/students');
            console.log('Fetched students:', response.data);
            setStudents(response.data);
        } catch (error) {
            console.error('Error fetching students:', error);
            message.error('Failed to load student data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStudents();
    }, []);

    const handleRefresh = () => {
        fetchStudents();
    };

    const filteredStudents = students.filter(student => 
        student.studentID?.toLowerCase().includes(searchText.toLowerCase()) ||
        student.firstName?.toLowerCase().includes(searchText.toLowerCase()) ||
        student.lastName?.toLowerCase().includes(searchText.toLowerCase())
    );

    const columns = [
        {
            title: 'รหัสนักศึกษา',
            dataIndex: 'studentID',
            key: 'studentID',
            width: 150,
        },
        {
            title: 'ชื่อ',
            dataIndex: 'firstName',
            key: 'firstName',
        },
        {
            title: 'นามสกุล',
            dataIndex: 'lastName',
            key: 'lastName',
        },
        {
            title: 'สถานะฝึกงาน',
            dataIndex: 'isEligibleForInternship',
            key: 'internship',
            render: (isEligible) => (
                <Tag color={isEligible ? 'green' : 'red'}>
                    {isEligible ? 'มีสิทธิ์' : 'ไม่มีสิทธิ์'}
                </Tag>
            ),
        },
        {
            title: 'สถานะโปรเจค',
            dataIndex: 'isEligibleForProject',
            key: 'project',
            render: (isEligible) => (
                <Tag color={isEligible ? 'green' : 'red'}>
                    {isEligible ? 'มีสิทธิ์' : 'ไม่มีสิทธิ์'}
                </Tag>
            ),
        },
        {
            title: 'อีเมล',
            dataIndex: 'email',
            key: 'email',
        }
    ];

    return (
        <Card style={{ margin: '20px' }}>
            <Space direction="vertical" style={{ width: '100%' }} size="large">
                <Space style={{ justifyContent: 'space-between', width: '100%' }}>
                    <Title level={2}>รายชื่อนักศึกษา</Title>
                    <Button 
                        icon={<ReloadOutlined />}
                        onClick={handleRefresh}
                        loading={loading}
                    >
                        รีเฟรชข้อมูล
                    </Button>
                </Space>

                <Input
                    placeholder="ค้นหาด้วยรหัสนักศึกษา, ชื่อ หรือนามสกุล"
                    prefix={<SearchOutlined />}
                    value={searchText}
                    onChange={e => setSearchText(e.target.value)}
                    style={{ maxWidth: 400 }}
                />

<Table
                    columns={columns}
                    dataSource={filteredStudents}
                    rowKey="studentID"
                    loading={loading}
                    pagination={{
                        pageSize: 10,
                        showTotal: (total) => `ทั้งหมด ${total} รายการ`
                    }}
                    summary={pageData => {
                        const totalStudents = pageData.length;
                        const internshipEligible = pageData.filter(item => item.isEligibleForInternship).length;
                        const projectEligible = pageData.filter(item => item.isEligibleForProject).length;

                        return (
                            <Table.Summary fixed>
                                <Table.Summary.Row>
                                    <Table.Summary.Cell colSpan={3}>รวมทั้งหมด</Table.Summary.Cell>
                                    <Table.Summary.Cell>
                                        มีสิทธิ์ฝึกงาน: {internshipEligible} คน
                                    </Table.Summary.Cell>
                                    <Table.Summary.Cell>
                                        มีสิทธิ์ทำโปรเจค: {projectEligible} คน
                                    </Table.Summary.Cell>
                                    <Table.Summary.Cell>
                                        จากทั้งหมด: {totalStudents} คน
                                    </Table.Summary.Cell>
                                </Table.Summary.Row>
                            </Table.Summary>
                        );
                    }}
                />
            </Space>
        </Card>
    );
};

export default StudentList;