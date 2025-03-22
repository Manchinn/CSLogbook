import { useState, useEffect, useCallback } from 'react';
import { message } from 'antd';
import { calculateWorkHours } from '../utils/timeUtils';
import internshipService from '../services/internshipService';
import dayjs from 'dayjs';

export const useTimeSheet = (form) => {
  const [loading, setLoading] = useState(false);
  const [internshipDates, setInternshipDates] = useState([]);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isViewModalVisible, setIsViewModalVisible] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    pending: 0,
    totalHours: 0,
    averageHoursPerDay: 0,
    remainingDays: 0
  });
  const [dateRange, setDateRange] = useState(null);

  // สร้างรายการวันที่ฝึกงานทั้งหมดตามวันที่ใน CS05
  const generateWorkdayEntries = useCallback(async () => {
    try {
      // 1. ดึงข้อมูลวันที่ฝึกงานจาก CS05
      const range = await internshipService.getInternshipDateRange();
      setDateRange(range);
      
      // 2. ดึงรายการวันทำงานทั้งหมด (ไม่รวมวันหยุด)
      const workdays = await internshipService.generateInternshipDates();
      
      // 3. ดึงข้อมูลการบันทึกการฝึกงานที่มีอยู่แล้ว
      const existingEntries = await internshipService.getTimeSheetEntries();
      console.log('ข้อมูลจาก API:', existingEntries);
      
      // 4. แปลงเป็น Map เพื่อง่ายต่อการเข้าถึง
      const existingEntriesMap = new Map();
      existingEntries.forEach(entry => {
        existingEntriesMap.set(entry.workDate, entry);
      });
      
      // 5. สร้างรายการวันทำงานทั้งหมด โดยใช้ข้อมูลที่มีอยู่แล้ว (ถ้ามี)
      const allEntries = workdays.map(date => {
        const formattedDate = dayjs(date).format('YYYY-MM-DD');
        const existingEntry = existingEntriesMap.get(formattedDate);
        
        if (existingEntry) {
          // มีข้อมูลอยู่แล้ว
          return {
            ...existingEntry,
            key: existingEntry.id || formattedDate,
            workDate: dayjs(existingEntry.workDate),
            timeIn: existingEntry.timeIn && dayjs(existingEntry.timeIn, 'HH:mm'),
            timeOut: existingEntry.timeOut && dayjs(existingEntry.timeOut, 'HH:mm')
          };
        } else {
          // ยังไม่มีข้อมูล
          return {
            key: formattedDate,
            workDate: dayjs(formattedDate),
            timeIn: null,
            timeOut: null,
            workHours: null,
            logTitle: '',
            workDescription: '',
            learningOutcome: '',
            problems: '',
            solutions: '',
            supervisorApproved: false,
            advisorApproved: false
          };
        }
      });
      
      // เรียงตามวันที่
      allEntries.sort((a, b) => a.workDate.diff(b.workDate));
      
      setInternshipDates(allEntries);
      
      // ดึงข้อมูลสถิติ
      const statsData = await internshipService.getTimeSheetStats();
      setStats(statsData);
      
      return allEntries;
    } catch (error) {
      message.error(error.message || 'ไม่สามารถสร้างรายการวันที่ฝึกงาน');
      return [];
    }
  }, []);

  // ดึงข้อมูลเมื่อเปิดหน้าแรก
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        await generateWorkdayEntries();
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [generateWorkdayEntries]);

  const handleEdit = (entry) => {
    setSelectedEntry(entry);
    form.setFieldsValue({
      workDate: entry.workDate,
      timeIn: entry.timeIn,
      timeOut: entry.timeOut,
      workHours: entry.workHours,
      logTitle: entry.logTitle,
      workDescription: entry.workDescription,
      learningOutcome: entry.learningOutcome,
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

  const handleSave = async (values) => {
    try {
      setLoading(true);
      
      // ตรวจสอบโหมดการบันทึกโดยดูจาก timeOut
      const isCompleteMode = !!values.timeOut;
      const mode = isCompleteMode ? 'complete' : 'checkin';
      
      const formData = {
        ...values,
        workDate: values.workDate.format('YYYY-MM-DD'),
        timeIn: values.timeIn.format('HH:mm'),
      };
      
      // ถ้าเป็นการบันทึกแบบครบถ้วน ทำการตรวจสอบข้อมูลเพิ่มเติม
      if (isCompleteMode) {
        // 1. ตรวจสอบว่ามีข้อมูลจำเป็นครบถ้วนหรือไม่
        if (!values.timeOut || !values.logTitle || !values.workDescription || !values.learningOutcome) {
          message.error('กรุณากรอกข้อมูลให้ครบถ้วนสำหรับการบันทึกแบบสมบูรณ์');
          setLoading(false);
          return;
        }
        
        formData.timeOut = values.timeOut.format('HH:mm');
        formData.workHours = values.workHours;
        formData.logTitle = values.logTitle;
        formData.workDescription = values.workDescription;
        formData.learningOutcome = values.learningOutcome;
        formData.problems = values.problems || '';
        formData.solutions = values.solutions || '';
      }
      
      if (selectedEntry?.logId) {
        await internshipService.updateTimeSheetEntry(selectedEntry.logId, formData);
        message.success('อัพเดทข้อมูลการฝึกงานเรียบร้อย');
      } else {
        if (!isCompleteMode) {
          await internshipService.checkIn(formData.workDate, formData.timeIn);
          message.success('บันทึกเวลาเข้างานเรียบร้อย');
        } else {
          await internshipService.saveTimeSheetEntry(formData);
          message.success('บันทึกข้อมูลการฝึกงานเรียบร้อย');
        }
      }
      
      // รีเฟรชข้อมูล
      await generateWorkdayEntries();
      setIsModalVisible(false);
      form.resetFields();
    } catch (error) {
      console.error('Error saving timesheet entry:', error);
      // แสดงข้อความที่เฉพาะเจาะจงมากขึ้น
      if (error.message.includes('เวลาออกงานต้องมากกว่า')) {
        message.error('เวลาออกงานต้องมากกว่าเวลาเข้างาน');
      } else if (error.message.includes('ไม่พบข้อมูลการบันทึกเวลาเข้างาน')) {
        message.error('คุณต้องบันทึกเวลาเข้างานก่อน');
      } else {
        message.error(error.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
      }
    } finally {
      setLoading(false);
    }
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
    stats,
    dateRange,
    refreshData: generateWorkdayEntries
  };
};