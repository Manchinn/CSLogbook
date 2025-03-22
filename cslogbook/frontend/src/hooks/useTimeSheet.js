import { useState, useEffect, useCallback } from 'react';
import { message } from 'antd';
import { calculateWorkHours } from '../utils/timeUtils';
import internshipService from '../services/internshipService';
import { useInternship } from '../contexts/InternshipContext';
import dayjs from 'dayjs';

export const useTimeSheet = (form) => {
  const { state } = useInternship();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
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
  const [hasCS05, setHasCS05] = useState(false);
  const [cs05Status, setCS05Status] = useState(null);
  // เพิ่ม state ใหม่เพื่อระบุว่าอยู่ในโหมดทดสอบหรือไม่
  const [isTestMode, setIsTestMode] = useState(true);

  // ตรวจสอบสถานะ CS05 ก่อนดำเนินการอื่นๆ
  const checkCS05Status = useCallback(async () => {
    try {
      // 1. ตรวจสอบจาก state ก่อน (หากมีข้อมูลอยู่แล้ว)
      const cs05Data = state?.registration?.cs05?.data;
      
      if (cs05Data && cs05Data.documentId) {
        setHasCS05(true);
        setCS05Status(cs05Data.status);
        
        // เพิ่มการตรวจสอบเงื่อนไขสำหรับโหมดทดสอบ
        // โหมดทดสอบ - ยอมรับสถานะ 'pending'
        // โหมด production - ยอมรับเฉพาะสถานะ 'approved'
        const isValidStatus = isTestMode 
          ? (cs05Data.status === 'pending' || cs05Data.status === 'approved')
          : (cs05Data.status === 'approved');
          
        return {
          hasCS05: true,
          status: cs05Data.status,
          documentId: cs05Data.documentId,
          isValidStatus
        };
      }
      
      // 2. ถ้าไม่มีใน state ให้ดึงจาก API
      const response = await internshipService.getCurrentCS05();
      
      if (response.success && response.data) {
        setHasCS05(true);
        setCS05Status(response.data.status);
        
        // เพิ่มการตรวจสอบเงื่อนไขเช่นเดียวกับด้านบน
        const isValidStatus = isTestMode 
          ? (response.data.status === 'pending' || response.data.status === 'approved')
          : (response.data.status === 'approved');
        
        return {
          hasCS05: true,
          status: response.data.status,
          documentId: response.data.documentId,
          isValidStatus
        };
      }
      
      // ไม่พบข้อมูล CS05
      setHasCS05(false);
      setCS05Status(null);
      return {
        hasCS05: false,
        status: null,
        documentId: null,
        isValidStatus: false
      };
    } catch (error) {
      console.error('Error checking CS05 status:', error);
      setHasCS05(false);
      setCS05Status(null);
      return {
        hasCS05: false,
        status: null,
        documentId: null,
        isValidStatus: false,
        error: error.message
      };
    }
  }, [state, isTestMode]);

  // สร้างรายการวันที่ฝึกงานทั้งหมดตามวันที่ใน CS05
  const generateWorkdayEntries = useCallback(async () => {
    setLoading(true);
    setInitialLoading(true);
    
    try {
      // 0. ตรวจสอบว่ามี CS05 ก่อน
      const cs05Result = await checkCS05Status();
      
      if (!cs05Result.hasCS05) {
        console.log('ไม่พบข้อมูล CS05');
        setLoading(false);
        setInitialLoading(false);
        return [];
      }
      
      // เพิ่มการตรวจสอบสถานะตามเงื่อนไข isValidStatus
      // ในโหมดทดสอบจะข้ามการตรวจสอบนี้ไป
      if (!isTestMode && !cs05Result.isValidStatus) {
        console.log('CS05 ไม่อยู่ในสถานะที่ถูกต้อง');
        setLoading(false);
        setInitialLoading(false);
        return [];
      }
      
      // 1. ดึงข้อมูลวันที่ฝึกงานจาก CS05
      const range = await internshipService.getInternshipDateRange();
      setDateRange(range.data);
      
      // ส่วนที่เหลือของโค้ดเดิม
      const workdaysResponse = await internshipService.generateInternshipDates();
      const workdays = workdaysResponse.data || [];
      
      const entriesResponse = await internshipService.getTimeSheetEntries();
      const existingEntries = entriesResponse.data || [];
      console.log('ข้อมูลจาก API:', existingEntries);
      
      const existingEntriesMap = new Map();
      existingEntries.forEach(entry => {
        existingEntriesMap.set(entry.workDate, entry);
      });
      
      const allEntries = workdays.map(date => {
        const formattedDate = dayjs(date).format('YYYY-MM-DD');
        const existingEntry = existingEntriesMap.get(formattedDate);
        
        if (existingEntry) {
          return {
            ...existingEntry,
            key: existingEntry.id || formattedDate,
            workDate: dayjs(existingEntry.workDate),
            timeIn: existingEntry.timeIn && dayjs(existingEntry.timeIn, 'HH:mm'),
            timeOut: existingEntry.timeOut && dayjs(existingEntry.timeOut, 'HH:mm')
          };
        } else {
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
      
      allEntries.sort((a, b) => a.workDate.diff(b.workDate));
      setInternshipDates(allEntries);
      
      const statsResponse = await internshipService.getTimeSheetStats();
      setStats(statsResponse.data || {});
      
      return allEntries;
    } catch (error) {
      console.error('Error generating workday entries:', error);
      message.error(error.message || 'ไม่สามารถสร้างรายการวันที่ฝึกงาน');
      return [];
    } finally {
      setLoading(false);
      setInitialLoading(false);
    }
  }, [checkCS05Status, isTestMode]);

  // ดึงข้อมูลเมื่อเปิดหน้าแรก
  useEffect(() => {
    generateWorkdayEntries();
  }, [generateWorkdayEntries]);

  // ส่วนที่เหลือของโค้ดคงเดิม...
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
      if (error.message?.includes('เวลาออกงานต้องมากกว่า')) {
        message.error('เวลาออกงานต้องมากกว่าเวลาเข้างาน');
      } else if (error.message?.includes('ไม่พบข้อมูลการบันทึกเวลาเข้างาน')) {
        message.error('คุณต้องบันทึกเวลาเข้างานก่อน');
      } else {
        message.error(error.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
      }
    } finally {
      setLoading(false);
    }
  };

  // เพิ่มฟังก์ชันสำหรับเปลี่ยนโหมดการทำงาน (สำหรับทดสอบหรือใช้งานจริง)
  const toggleTestMode = () => {
    setIsTestMode(prev => !prev);
  };

  return {
    loading,
    initialLoading,
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
    refreshData: generateWorkdayEntries,
    hasCS05,
    cs05Status,
    isTestMode,
    toggleTestMode // ส่งฟังก์ชันนี้ไปใช้ในกรณีที่ต้องการเปลี่ยนโหมดการทำงาน
  };
};