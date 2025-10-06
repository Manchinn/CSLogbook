import React, { useMemo } from 'react';
import { Input, Space, Button, Select } from 'antd';
import { SearchOutlined, ReloadOutlined, PlusOutlined } from '@ant-design/icons';
import { TEACHER_POSITION_OPTIONS, TEACHER_TYPE_OPTIONS } from '../constants';

const TeacherFilters = ({
  searchText,
  onSearchChange,
  filters,
  setFilters,
  onRefresh,
  onAddTeacher,
  loading
}) => {
  const positionOptions = useMemo(() => TEACHER_POSITION_OPTIONS.map((option) => ({
    label: option.label,
    value: option.value
  })), []);

  const teacherTypeOptions = useMemo(() => TEACHER_TYPE_OPTIONS, []);

  const handleSearchChange = (event) => {
    const value = event.target.value;
    onSearchChange(value);
  };

  return (
    <Space size="small" wrap>
      <Input
        placeholder="ค้นหาด้วยรหัส, ชื่อ หรือนามสกุล"
        prefix={<SearchOutlined />}
        value={searchText}
        onChange={handleSearchChange}
        style={{ width: 250 }}
        allowClear
      />
      <Select
        mode="multiple"
        placeholder="ตำแหน่ง"
        style={{ minWidth: 200 }}
        allowClear
        value={filters.position}
        options={positionOptions}
        onChange={(value) => setFilters((prev) => ({ ...prev, position: value }))}
      />
      <Select
        mode="multiple"
        placeholder="ประเภทบุคลากร"
        style={{ minWidth: 200 }}
        allowClear
        value={filters.teacherType}
        options={teacherTypeOptions}
        onChange={(value) => setFilters((prev) => ({ ...prev, teacherType: value }))}
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