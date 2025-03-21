import { useState, useEffect } from 'react';
import { message } from 'antd';
import { calculateWorkHours } from '../utils/timeUtils';

export const useTimeSheet = (form) => {
  const [loading, setLoading] = useState(false);
  const [internshipDates, setInternshipDates] = useState([]);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isViewModalVisible, setIsViewModalVisible] = useState(false);

  useEffect(() => {
    // Fetch data logic here
    const testDates = [/* ... test data ... */];
    setInternshipDates(testDates);
  }, []);

  const handleEdit = (entry) => {
    setSelectedEntry(entry);
    form.setFieldsValue({
      logTitle: entry.logTitle,
      workDescription: entry.workDescription,
      learningOutcome: entry.learningOutcome,
      workHours: entry.workHours,
      problems: entry.problems,
      solutions: entry.solutions,
    });
    setIsModalVisible(true);
  };

  const handleView = (entry) => {
    setSelectedEntry(entry);
    setIsViewModalVisible(true);
  };

  const handleClose = () => {
    setIsModalVisible(false);
    setIsViewModalVisible(false);
    setSelectedEntry(null);
    form.resetFields();
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      
      // Add workHours calculation
      const workHours = calculateWorkHours(
        values.timeIn?.format('HH:mm'),
        values.timeOut?.format('HH:mm')
      );

      // Save logic here with calculated hours
      const dataToSave = {
        ...values,
        workHours
      };

      message.success("บันทึกข้อมูลเรียบร้อย");
      handleClose();
    } catch (error) {
      message.error("กรุณากรอกข้อมูลให้ครบถ้วน");
    }
  };

  const handleAddNew = () => {
    setSelectedEntry(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const calculateStats = () => {
    const total = internshipDates.length;
    const completed = internshipDates.filter(entry => entry.timeIn && entry.timeOut).length;
    const pending = internshipDates.filter(entry => !entry.timeIn).length;
    const inProgress = total - completed - pending;
    return { total, completed, pending, inProgress };
  };

  return {
    loading,
    internshipDates,
    selectedEntry,
    isModalVisible,
    isViewModalVisible,
    handleEdit,
    handleView,
    handleSave,
    handleClose,
    handleAddNew,
    stats: calculateStats()
  };
};