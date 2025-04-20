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
  const [isTestMode, setIsTestMode] = useState(true);
  const [loadError, setLoadError] = useState(null);

  const checkCS05Status = useCallback(async () => {
    try {
      const cs05Data = state?.registration?.cs05?.data;
      
      if (cs05Data && cs05Data.documentId) {
        setHasCS05(true);
        setCS05Status(cs05Data.status);
        
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
      
      const response = await internshipService.getCurrentCS05();
      
      if (response.success && response.data) {
        setHasCS05(true);
        setCS05Status(response.data.status);
        
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

  const generateWorkdayEntries = useCallback(async () => {
    try {
      console.log('เริ่มดึงข้อมูล TimeSheet');
      
      const cs05Result = await checkCS05Status();
      console.log('ผลการตรวจสอบ CS05:', cs05Result);
      
      if (!cs05Result.hasCS05) {
        console.log('ไม่พบข้อมูล CS05');
        setInitialLoading(false);
        return [];
      }
      
      if (!isTestMode && !cs05Result.isValidStatus) {
        console.log('CS05 ไม่อยู่ในสถานะที่ถูกต้อง');
        setInitialLoading(false);
        return [];
      }
      
      console.log('กำลังดึงข้อมูลช่วงวันที่ฝึกงาน...');
      const range = await internshipService.getInternshipDateRange();
      console.log('ข้อมูลช่วงวันที่ฝึกงาน:', range);
      
      let dateRangeData = range.data;
      if (!dateRangeData && range.startDate && range.endDate) {
        dateRangeData = range;
      }
      
      if (!dateRangeData || !dateRangeData.startDate || !dateRangeData.endDate) {
        console.error('ไม่พบข้อมูลวันที่ฝึกงาน:', dateRangeData);
        setLoadError('ไม่สามารถโหลดข้อมูลวันที่ฝึกงาน กรุณาตรวจสอบข้อมูล คพ.05');
        setInitialLoading(false);
        return;
      }
      
      setDateRange(dateRangeData);
      
      console.log('กำลังสร้างรายการวันทำงานโดยใช้วันที่:', dateRangeData);
      const workdaysResponse = await internshipService.generateInternshipDates();
      console.log('ผลการสร้างรายการวันทำงาน (raw):', workdaysResponse);

      // ตรวจสอบว่า response มีโครงสร้างอย่างไร
      let workdays = [];
      if (Array.isArray(workdaysResponse)) {
        // กรณีที่ response เป็น array โดยตรง
        workdays = workdaysResponse;
        console.log('พบข้อมูลวันทำงานเป็น array โดยตรง:', workdays.length, 'วัน');
      } else if (workdaysResponse && typeof workdaysResponse === 'object') {
        // กรณีที่เป็น object
        if (Array.isArray(workdaysResponse.data)) {
          workdays = workdaysResponse.data;
          console.log('พบข้อมูลวันทำงานใน .data:', workdays.length, 'วัน');
        } else if (workdaysResponse.data && Array.isArray(workdaysResponse.data.data)) {
          workdays = workdaysResponse.data.data;
          console.log('พบข้อมูลวันทำงานใน .data.data:', workdays.length, 'วัน');
        }
      }

      // ตรวจสอบว่ามีข้อมูลวันทำงานหรือไม่
      if (!workdays || workdays.length === 0) {
        console.warn('ไม่พบข้อมูลวันทำงานในรูปแบบที่ต้องการ จำเป็นต้องสร้างข้อมูลเอง');
        const tempWorkdays = [];
        const start = dayjs(dateRangeData.startDate);
        const end = dayjs(dateRangeData.endDate);
        let current = start;
        
        while (current.isBefore(end) || current.isSame(end, 'day')) {
          if (current.day() !== 0 && current.day() !== 6) {
            tempWorkdays.push(current.format('YYYY-MM-DD'));
          }
          current = current.add(1, 'day');
        }
        
        console.log('สร้างวันทำงานเองแล้ว:', tempWorkdays.length, 'วัน');
        
        const entries = tempWorkdays.map(date => ({
          key: date,
          workDate: dayjs(date),
          timeIn: null,
          timeOut: null,
          logTitle: '',
          workDescription: '',
          status: 'pending' || 'approved',
        }));
        
        setInternshipDates(entries);
      } else {
        const existingEntriesResponse = await internshipService.getTimeSheetEntries();
        console.log('ข้อมูลบันทึกที่มีอยู่:', existingEntriesResponse);
        const existingEntries = existingEntriesResponse.data || [];
        
        console.log('workdays จาก API:', workdays.length, 'วัน'); 

        const existingEntriesMap = new Map();
        existingEntries.forEach(entry => {
          const dateKey = dayjs(entry.workDate).format('YYYY-MM-DD');
          existingEntriesMap.set(dateKey, entry);
          console.log(`เพิ่มข้อมูลวันที่ ${dateKey} เข้า Map`);
        });

        const allEntries = workdays.map((date, index) => {
          const formattedDate = dayjs(date).format('YYYY-MM-DD');
          const existingEntry = existingEntriesMap.get(formattedDate);
          
          if (existingEntry) {
            return {
              ...existingEntry,
              key: existingEntry.id || `timesheet-${formattedDate}`,
              workDate: dayjs(existingEntry.workDate),
              timeIn: existingEntry.timeIn ? dayjs(existingEntry.timeIn, 'HH:mm') : null,
              timeOut: existingEntry.timeOut ? dayjs(existingEntry.timeOut, 'HH:mm') : null
            };
          } else {
            return {
              key: `timesheet-${index}-${formattedDate}`,
              id: null,
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

        console.log('สร้าง internshipDates แล้ว:', allEntries.length, 'รายการ');
        setInternshipDates([...allEntries]);
        
        try {
          sessionStorage.setItem('internship_dates', JSON.stringify(
            allEntries.map(entry => ({
              ...entry,
              workDate: entry.workDate.format('YYYY-MM-DD'),
              timeIn: entry.timeIn ? entry.timeIn.format('HH:mm') : null,
              timeOut: entry.timeOut ? entry.timeOut.format('HH:mm') : null
            }))
          ));
        } catch (e) {
          console.error('ไม่สามารถบันทึก internship_dates ลง sessionStorage:', e);
        }
      }
      
      console.log('กำลังดึงข้อมูลสถิติ...');
      const statsResponse = await internshipService.getTimeSheetStats();
      console.log('ข้อมูลสถิติจาก API (raw response):', statsResponse);

      if (statsResponse) {
        let statsData = statsResponse;
        
        if (statsResponse.data && typeof statsResponse.data === 'object') {
          statsData = statsResponse.data;
        }
        
        if (statsData.data && typeof statsData.data === 'object') {
          statsData = statsData.data;
        }
        
        console.log('สกัดข้อมูลสถิติได้:', statsData);
        
        const newStats = {
          total: statsData.total || 0,
          completed: statsData.completed || 0,
          pending: statsData.pending || 0,
          totalHours: statsData.totalHours || 0,
          averageHoursPerDay: statsData.averageHoursPerDay || 0,
          remainingDays: statsData.remainingDays || 0,
          approvedBySupervisor: statsData.approvedBySupervisor || 0
        };
        
        console.log('กำลังอัปเดต state stats เป็น:', newStats);
        setStats(() => newStats);
        
        try {
          localStorage.setItem('timesheet_stats', JSON.stringify(newStats));
        } catch (e) {
          console.error('ไม่สามารถบันทึกข้อมูลลง localStorage:', e);
        }
      } else {
        const cachedStats = localStorage.getItem('timesheet_stats');
        if (cachedStats) {
          try {
            const parsedStats = JSON.parse(cachedStats);
            console.log('ใช้ข้อมูลสถิติจาก localStorage:', parsedStats);
            setStats(parsedStats);
          } catch (e) {
            console.error('เกิดข้อผิดพลาดในการอ่าน localStorage:', e);
          }
        }
      }
      
      setInitialLoading(false);
    } catch (error) {
      console.error('Error in generateWorkdayEntries:', error);
      setLoadError(`เกิดข้อผิดพลาด: ${error.message}`);
      setInitialLoading(false);
    }
  }, [checkCS05Status, isTestMode]);

  useEffect(() => {
    generateWorkdayEntries();

    const loadingTimeout = setTimeout(() => {
      if (initialLoading) {
        console.warn('Loading timeout - forcing loading state to complete');
        setInitialLoading(false);
      }
    }, 15000);

    return () => clearTimeout(loadingTimeout);
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
      
      const isCompleteMode = !!values.timeOut;
      const mode = isCompleteMode ? 'complete' : 'checkin';
      
      const formData = {
        ...values,
        workDate: values.workDate.format('YYYY-MM-DD'),
        timeIn: values.timeIn.format('HH:mm'),
      };
      
      if (isCompleteMode) {
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
      
      await generateWorkdayEntries();
      await refreshTable();
      setIsModalVisible(false);
      form.resetFields();
    } catch (error) {
      console.error('Error saving timesheet entry:', error);
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

  const refreshTable = async () => {
    try {
      setLoading(true);
      message.loading({ content: 'กำลังอัปเดตตาราง...', key: 'refreshTable' });
      
      const existingEntriesResponse = await internshipService.getTimeSheetEntries();
      const existingEntries = existingEntriesResponse.data || [];
      
      if (existingEntries.length > 0) {
        const existingEntriesMap = new Map();
        existingEntries.forEach(entry => {
          const dateKey = dayjs(entry.workDate).format('YYYY-MM-DD');
          existingEntriesMap.set(dateKey, entry);
        });
        
        const updatedEntries = internshipDates.map((entry, index) => {
          const formattedDate = dayjs(entry.workDate).format('YYYY-MM-DD');
          const existingEntry = existingEntriesMap.get(formattedDate);
          
          if (existingEntry) {
            return {
              ...existingEntry,
              key: existingEntry.id || `timesheet-${formattedDate}`,
              workDate: dayjs(existingEntry.workDate),
              timeIn: existingEntry.timeIn ? dayjs(existingEntry.timeIn, 'HH:mm') : null,
              timeOut: existingEntry.timeOut ? dayjs(existingEntry.timeOut, 'HH:mm') : null
            };
          }
          
          return entry;
        });
        
        setInternshipDates([...updatedEntries]);
        message.success({ content: 'อัปเดตตารางเสร็จสิ้น', key: 'refreshTable' });
      }
    } catch (error) {
      console.error('Error refreshing table:', error);
      message.error({ content: 'เกิดข้อผิดพลาดในการอัปเดตตาราง', key: 'refreshTable' });
    } finally {
      setLoading(false);
    }
  };

  const toggleTestMode = () => {
    setIsTestMode(prev => !prev);
  };

  const refreshStats = async () => {
    try {
      const statsResponse = await internshipService.getTimeSheetStats();
      console.log('refreshStats - ข้อมูลจาก API:', statsResponse);
      
      if (statsResponse) {
        let statsData = statsResponse;
        
        if (statsResponse.data && typeof statsResponse.data === 'object') {
          statsData = statsResponse.data;
        }
        
        if (statsData.data && typeof statsData.data === 'object') {
          statsData = statsData.data;
        }
        
        const newStats = {
          total: statsData.total || 0,
          completed: statsData.completed || 0,
          pending: statsData.pending || 0,
          totalHours: statsData.totalHours || 0,
          averageHoursPerDay: statsData.averageHoursPerDay || 0,
          remainingDays: statsData.remainingDays || 0,
          approvedBySupervisor: statsData.approvedBySupervisor || 0
        };
        
        console.log('refreshStats - อัปเดตข้อมูลเป็น:', newStats);
        setStats(() => newStats);
        localStorage.setItem('timesheet_stats', JSON.stringify(newStats));
        message.success('อัปเดตข้อมูลสถิติสำเร็จ');
        return true;
      }
      return false;
    } catch (error) {
      console.error('เกิดข้อผิดพลาดในการดึงข้อมูลสถิติ:', error);
      message.error('ไม่สามารถดึงข้อมูลสถิติได้');
      return false;
    }
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
    toggleTestMode,
    loadError,
    refreshStats,
    refreshTable
  };
};