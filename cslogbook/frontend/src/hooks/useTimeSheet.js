import { useState, useEffect, useCallback } from 'react';
import { message } from 'antd';
// import { calculateWorkHours } from '../utils/timeUtils'; // ลบออกเนื่องจากไม่ได้ใช้งาน
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
  const [isTestMode, setIsTestMode] = useState(true); // คง isTestMode ไว้ตามเดิม
  const [loadError, setLoadError] = useState(null);

  const checkCS05Status = useCallback(async () => {
    try {
      const cs05Data = state?.registration?.cs05?.data;
      
      if (cs05Data && cs05Data.documentId) {
        setHasCS05(true);
        setCS05Status(cs05Data.status);
        
        // แก้ไขเงื่อนไขการตรวจสอบสถานะให้รองรับ supervisor_evaluated
        const isValidStatus = isTestMode 
          ? (cs05Data.status === 'pending' || cs05Data.status === 'approved' || cs05Data.status === 'supervisor_evaluated')
          : (cs05Data.status === 'approved' || cs05Data.status === 'supervisor_evaluated');
          
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
        
        // แก้ไขเงื่อนไขการตรวจสอบสถานะให้รองรับ supervisor_evaluated
        const isValidStatus = isTestMode 
          ? (response.data.status === 'pending' || response.data.status === 'approved' || response.data.status === 'supervisor_evaluated')
          : (response.data.status === 'approved' || response.data.status === 'supervisor_evaluated');
        
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
      const cs05Result = await checkCS05Status();
      
      if (!cs05Result.hasCS05) {
        setInitialLoading(false);
        return [];
      }
      
      if (!isTestMode && !cs05Result.isValidStatus) {
        setInitialLoading(false);
        return [];
      }
      
      const range = await internshipService.getInternshipDateRange();
      
      let dateRangeData = range.data;
      if (!dateRangeData && range.startDate && range.endDate) {
        dateRangeData = range;
      }
      
      if (!dateRangeData || !dateRangeData.startDate || !dateRangeData.endDate) {
        setLoadError('ไม่สามารถโหลดข้อมูลวันที่ฝึกงาน กรุณาตรวจสอบข้อมูล คพ.05');
        setInitialLoading(false);
        return;
      }
      
      setDateRange(dateRangeData);
      
      const workdaysResponse = await internshipService.generateInternshipDates();

      let workdays = [];
      if (Array.isArray(workdaysResponse)) {
        workdays = workdaysResponse;
      } else if (workdaysResponse && typeof workdaysResponse === 'object') {
        if (Array.isArray(workdaysResponse.data)) {
          workdays = workdaysResponse.data;
        } else if (workdaysResponse.data && Array.isArray(workdaysResponse.data.data)) {
          workdays = workdaysResponse.data.data;
        }
      }

      if (!workdays || workdays.length === 0) {
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
        
        const existingEntries = Array.isArray(existingEntriesResponse) 
          ? existingEntriesResponse 
          : (existingEntriesResponse && existingEntriesResponse.data) || [];
        
        const existingEntriesMap = new Map();
        
        existingEntries.forEach(entry => {
          let dateKey = entry.workDate;
          
          if (typeof dateKey === 'string') {
            if (dateKey.includes('T')) {
              dateKey = dateKey.split('T')[0];
            }
            
            existingEntriesMap.set(dateKey, entry);
          }
        });
        
        const allEntries = workdays.map((date, index) => {
          const rawWorkday = typeof date === 'string' ? date : date.toString();
          const formattedDate = dayjs(rawWorkday).format('YYYY-MM-DD');
          
          const existingEntry = existingEntriesMap.get(formattedDate);
          
          if (existingEntry) {
            const transformedEntry = {
              ...existingEntry,
              key: `timesheet-${existingEntry.logId || index}`,
              workDate: dayjs(existingEntry.workDate),
              timeIn: existingEntry.timeIn ? dayjs(existingEntry.timeIn, 'HH:mm') : null,
              timeOut: existingEntry.timeOut ? dayjs(existingEntry.timeOut, 'HH:mm') : null
            };
            
            return transformedEntry;
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
        
        setInternshipDates(allEntries);
        
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
      
      const statsResponse = await internshipService.getTimeSheetStats();

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
            setStats(parsedStats);
          } catch (e) {
            console.error('เกิดข้อผิดพลาดในการอ่าน localStorage:', e);
          }
        }
      }
      
      setInitialLoading(false);
    } catch (error) {
      setLoadError(`เกิดข้อผิดพลาด: ${error.message}`);
      setInitialLoading(false);
    }
  }, [checkCS05Status, isTestMode]);

  useEffect(() => {
    generateWorkdayEntries();

    const loadingTimeout = setTimeout(() => {
      if (initialLoading) {
        setInitialLoading(false);
      }
    }, 15000);

    return () => clearTimeout(loadingTimeout);
  }, [generateWorkdayEntries, initialLoading]); // เพิ่ม initialLoading ใน dependency array

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
    // ตรวจสอบว่า form มีค่าและมีเมธอด resetFields ก่อนเรียกใช้งาน
    if (form && typeof form.resetFields === 'function') {
      form.resetFields();
    }
  };

  const handleSave = async (values) => {
    try {
      setLoading(true);
      
      const isCompleteMode = !!values.timeOut;
      
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
      
      let existingEntries = [];
      
      if (Array.isArray(existingEntriesResponse)) {
        existingEntries = existingEntriesResponse;
      } else if (existingEntriesResponse && existingEntriesResponse.data) {
        if (Array.isArray(existingEntriesResponse.data)) {
          existingEntries = existingEntriesResponse.data;
        } else if (existingEntriesResponse.data && existingEntriesResponse.data.data) {
          existingEntries = existingEntriesResponse.data.data;
        }
      }
      
      if (existingEntries.length > 0) {
        const existingEntriesMap = new Map();
        
        existingEntries.forEach(entry => {
          const rawDate = entry.workDate;
          let dateKey = rawDate;
          
          if (typeof rawDate === 'string') {
            if (rawDate.includes('T')) {
              dateKey = rawDate.split('T')[0];
            }
          }
          
          existingEntriesMap.set(dateKey, entry);
        });
        
        const updatedEntries = internshipDates.map((entry) => {
          const formattedDate = entry.workDate.format ? 
                                entry.workDate.format('YYYY-MM-DD') : 
                                dayjs(entry.workDate).format('YYYY-MM-DD');
          
          const existingEntry = existingEntriesMap.get(formattedDate);
          
          if (existingEntry) {
            return {
              ...existingEntry,
              key: existingEntry.logId || `timesheet-${formattedDate}`,
              workDate: dayjs(existingEntry.workDate),
              timeIn: existingEntry.timeIn ? dayjs(existingEntry.timeIn, 'HH:mm') : null,
              timeOut: existingEntry.timeOut ? dayjs(existingEntry.timeOut, 'HH:mm') : null
            };
          }
          
          return entry;
        });
        
        setInternshipDates([...updatedEntries]);
        message.success({ content: 'อัปเดตตารางเสร็จสิ้น', key: 'refreshTable' });
      } else {
        message.info({ content: 'ไม่พบข้อมูลใหม่', key: 'refreshTable' });
      }
    } catch (error) {
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
        
        setStats(() => newStats);
        localStorage.setItem('timesheet_stats', JSON.stringify(newStats));
        message.success('อัปเดตข้อมูลสถิติสำเร็จ');
        return true;
      }
      return false;
    } catch (error) {
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