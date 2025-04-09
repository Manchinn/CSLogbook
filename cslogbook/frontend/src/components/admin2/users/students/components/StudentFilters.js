import React from 'react';
import { Input, Space, Button, Segmented, Select, Row, Col } from 'antd';
import { SearchOutlined, ReloadOutlined, UserAddOutlined, UploadOutlined } from '@ant-design/icons';
import { STUDENT_STATUS } from '../../../../../utils/adminConstants';

const { Option } = Select;

const StudentFilters = ({ 
  searchText, 
  setSearchText, 
  statusFilter, 
  setStatusFilter, 
  academicYear, 
  setAcademicYear, 
  academicYearOptions, 
  onRefresh, 
  onAddStudent, 
  onUpload, 
  loading
}) => {
  return (
    <Row justify="space-between" align="middle" className="filter-section">
      <Col>
        <Space size="small" wrap>
          <Input
            placeholder="ค้นหาด้วยรหัส, ชื่อ หรือนามสกุล"
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            style={{ width: 250 }}
            allowClear
          />
          <Select
            placeholder="ปีการศึกษา"
            onChange={setAcademicYear}
            value={academicYear}
          >
            {academicYearOptions.map((year) => (
              <Option key={year.value} value={year.value}>
                {year.label}
              </Option>
            ))}
          </Select>
          <Segmented
            options={[
              { label: 'ทั้งหมด', value: '' },
              { label: 'มีสิทธิ์ฝึกงาน', value: STUDENT_STATUS.ELIGIBLE_INTERNSHIP },
              { label: 'มีสิทธิ์โครงงาน', value: STUDENT_STATUS.ELIGIBLE_PROJECT }
            ]}
            value={statusFilter}
            onChange={setStatusFilter}
          />
          <Button
            icon={<ReloadOutlined />}
            onClick={onRefresh}
            loading={loading}
          >
            รีเฟรช
          </Button>
          {/*<Button
            type="primary" 
            icon={<UploadOutlined />}
            onClick={onUpload}
          >
            อัปโหลด CSV
          </Button>*/}
          <Button
            type="primary"
            icon={<UserAddOutlined />}
            onClick={onAddStudent}
          >
            เพิ่มนักศึกษา
          </Button>
        </Space>
      </Col>
    </Row>
  );
};

export default StudentFilters;