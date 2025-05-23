import React from 'react';
import { Input, Space, Button } from 'antd';
import { SearchOutlined, ReloadOutlined, PlusOutlined } from '@ant-design/icons';

const TeacherFilters = ({
  searchText,
  setSearchText,
  onRefresh,
  onAddTeacher,
  loading
}) => {
  return (
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
        onClick={onRefresh}
        loading={loading}
      >
        รีเฟรช
      </Button>
      <Button 
        type="primary"
        icon={<PlusOutlined />}
        onClick={onAddTeacher}
      >
        เพิ่มอาจารย์
      </Button>
    </Space>
  );
};

export default TeacherFilters;