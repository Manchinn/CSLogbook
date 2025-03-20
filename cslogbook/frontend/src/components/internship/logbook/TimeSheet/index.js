import React, { useState } from 'react';
import { Card, Form, message } from 'antd';
import TimeSheetTable from './components/TimeSheetTable';
import TimeSheetStats from './components/TimeSheetStats';
import EditModal from './components/EditModal';
import ViewModal from './components/ViewModal';
import { useTimeSheet } from '../../../../hooks/useTimeSheet';
import './styles.css';

const TimeSheet = () => {
  const [form] = Form.useForm();
  const {
    loading,
    internshipDates,
    selectedEntry,
    isModalVisible,
    isViewModalVisible,
    handleEdit,
    handleView,
    handleSave,
    handleClose,
    stats
  } = useTimeSheet();

  return (
    <div className="internship-container">
      <TimeSheetStats stats={stats} />
      <Card>
        <TimeSheetTable 
          data={internshipDates}
          loading={loading}
          onEdit={handleEdit}
          onView={handleView}
        />
        <EditModal
          visible={isModalVisible}
          loading={loading}
          entry={selectedEntry}
          form={form}
          onOk={handleSave}
          onCancel={handleClose}
        />
        <ViewModal
          visible={isViewModalVisible}
          entry={selectedEntry}
          onClose={handleClose}
        />
      </Card>
    </div>
  );
};

export default TimeSheet;