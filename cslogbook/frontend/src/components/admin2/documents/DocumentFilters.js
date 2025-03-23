import React from 'react';
import { Space, Input, Segmented, Button } from 'antd';
import { SearchOutlined, ClearOutlined } from '@ant-design/icons';
import { Typography } from 'antd';

const { Text } = Typography;

const FILTER_OPTIONS = [
  { label: 'รอการตรวจสอบ', value: 'pending' },
  { label: 'อนุมัติ', value: 'approved' },
  { label: 'ปฏิเสธ', value: 'rejected' },
  { label: 'ทั้งหมด', value: '' }
];

const DocumentFilters = ({ searchText, statusFilter, onSearchChange, onStatusChange, onReset }) => {
  return (
    <Space style={{ marginBottom: 16, marginTop: 20, marginLeft: 80 }} wrap>
      <div>
        <Text>สถานะ:</Text>
        <Segmented
          options={FILTER_OPTIONS}
          value={statusFilter}
          onChange={onStatusChange}
          style={{ width: 200, marginLeft: 8 }}
        />
      </div>
      
      <Input
        placeholder="ค้นหาเอกสาร"
        value={searchText}
        onChange={(e) => onSearchChange(e.target.value)}
        prefix={<SearchOutlined />}
        style={{ width: '300px' }}
      />
      
      <Button 
        icon={<ClearOutlined />} 
        onClick={onReset}
      >
        รีเซ็ตตัวกรอง
      </Button>
    </Space>
  );
};

export default DocumentFilters;