import apiClient from './apiClient';

// ตั้งค่าสำหรับ Development mode เพื่อให้สามารถทดสอบได้ง่ายขึ้น
const IS_DEV = process.env.NODE_ENV === 'development';

/**
 * TimelineService สำหรับจัดการการเรียกใช้ API ที่เกี่ยวข้องกับไทม์ไลน์
 */
export const timelineService = {
  /**
   * ดึงข้อมูลไทม์ไลน์ของนักศึกษา
   * @param {string} studentId - รหัสนักศึกษา
   * @returns {Promise} - ข้อมูลไทม์ไลน์ของนักศึกษา
   */
  getStudentTimeline: async (studentId) => {
    try {
      console.log("API Request:", { method: 'get', url: `/timeline/public/student/${studentId}` });
      
      // ใช้ public endpoint ในทุกโหมด ส่วนใหญ่จะเรียกใช้ก่อนที่จะได้ token จาก login
      let response;
      try {
        response = await apiClient.get(`/timeline/public/student/${studentId}`);
      } catch (apiError) {
        console.warn("Could not get timeline from public endpoint, trying protected endpoint");
        response = await apiClient.get(`/timeline/student/${studentId}`);
      }
      
      // ปรับแต่งรูปแบบข้อมูลก่อนส่งกลับไปยัง component
      if (response.data.success && response.data.data) {
        const apiData = response.data;
        
        // แปลงโครงสร้างข้อมูลให้ง่ายต่อการใช้งานใน component
        if (apiData.data.student && typeof apiData.data.student === 'object') {
          // ตรวจสอบว่ามีข้อมูลสิทธิ์หรือไม่
          if (!apiData.data.student.eligibility) {
            // ถ้าไม่มีข้อมูลสิทธิ์ให้สร้างโครงสร้างเริ่มต้น
            apiData.data.student.eligibility = {
              internship: { eligible: false, message: "ไม่มีข้อมูลสิทธิ์" },
              project: { eligible: false, message: "ไม่มีข้อมูลสิทธิ์" }
            };
          }
          
          // ตรวจสอบและจัดการข้อมูลชั้นปี
          if (apiData.data.student.studentYear) {
            if (typeof apiData.data.student.studentYear === 'object' && 
                apiData.data.student.studentYear.year) {
              // กรณีเป็น object ที่มี property year
              apiData.data.student.year = apiData.data.student.studentYear.year;
            } else if (typeof apiData.data.student.studentYear === 'number') {
              // กรณีเป็นตัวเลขโดยตรง
              apiData.data.student.year = apiData.data.student.studentYear;
            }
          } else if (!apiData.data.student.year && apiData.data.student.studentCode) {
            // คำนวณชั้นปีจากรหัสนักศึกษาถ้าไม่มีข้อมูล year
            try {
              const currentDate = new Date();
              const currentYear = currentDate.getFullYear() + 543; // พ.ศ.
              const studentCodePrefix = apiData.data.student.studentCode.substring(0, 2);
              const enrollmentYear = parseInt(studentCodePrefix) + 2500; // พ.ศ. ที่เข้าเรียน
              apiData.data.student.year = Math.min(Math.max(currentYear - enrollmentYear + 1, 1), 8);
            } catch (err) {
              console.warn("Error calculating student year:", err);
              apiData.data.student.year = 1; // ค่าเริ่มต้น
            }
          }
          
          // ตรวจสอบสถานะการเข้าร่วมฝึกงานและโครงงาน
          if (apiData.data.timeline) {
            const hasInternshipSteps = apiData.data.timeline.internship && apiData.data.timeline.internship.length > 0;
            const hasProjectSteps = apiData.data.timeline.project && apiData.data.timeline.project.length > 0;
            
            // เพิ่มข้อมูลการเข้าร่วมถ้าไม่มี
            if (!apiData.data.student.hasOwnProperty('isEnrolledInternship')) {
              apiData.data.student.isEnrolledInternship = hasInternshipSteps;
            }
            
            if (!apiData.data.student.hasOwnProperty('isEnrolledProject')) {
              apiData.data.student.isEnrolledProject = hasProjectSteps;
            }
          }

          // จัดการสถานะนักศึกษา
          if (!apiData.data.student.hasOwnProperty('statusLabel') && apiData.data.student.status) {
            const status = apiData.data.student.status.toUpperCase();
            let statusLabel = 'นักศึกษาปกติ';
            let statusColor = 'success';
            
            if (status === 'EXTENDED' || status === 'EXTENSION') {
              statusLabel = 'นักศึกษาตกค้าง';
              statusColor = 'warning';
            } else if (status === 'PROBATION') {
              statusLabel = 'นักศึกษาวิทยทัณฑ์';
              statusColor = 'warning';
            } else if (status === 'RETIRED' || status === 'DISMISSED') {
              statusLabel = 'พ้นสภาพนักศึกษา';
              statusColor = 'error';
            }
            
            apiData.data.student.statusLabel = statusLabel;
            apiData.data.student.statusColor = statusColor;
          }
          
          // ตรวจสอบและเพิ่มข้อมูลสิทธิ์การฝึกงานและโครงงานถ้าไม่มี
          // เพิ่ม internshipEligible และ projectEligible โดยตรงเพื่อความเข้ากันได้กับโค้ดเดิม
          if (apiData.data.student.eligibility) {
            apiData.data.student.internshipEligible = 
              apiData.data.student.eligibility.internship && 
              apiData.data.student.eligibility.internship.eligible;
              
            apiData.data.student.projectEligible = 
              apiData.data.student.eligibility.project && 
              apiData.data.student.eligibility.project.eligible;
          }
        }

        // เพิ่มข้อมูลสถิติการเรียนถ้ามี
        if (apiData.data.academicStats) {
          apiData.data.student = {
            ...apiData.data.student,
            ...apiData.data.academicStats
          };
        }

        console.log("Formatted student data:", apiData);
        return apiData;
      }
      
      return response.data;
    } catch (error) {
      console.error('Error fetching student timeline:', error);
      
      // ส่งข้อมูลข้อผิดพลาดกลับไปในรูปแบบที่คาดเดาได้
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'ไม่สามารถดึงข้อมูลไทม์ไลน์ได้',
        data: null
      };
    }
  },

  /**
   * สร้างข้อมูลไทม์ไลน์เริ่มต้นสำหรับนักศึกษา
   * @param {string} studentId - รหัสนักศึกษา
   * @returns {Promise} - ผลลัพธ์การสร้างข้อมูลไทม์ไลน์
   */
  initializeStudentTimeline: async (studentId) => {
    try {
      // ใช้ public endpoint ในทุกโหมด ส่วนใหญ่จะเรียกใช้ก่อนที่จะได้ token จาก login
      let response;
      try {
        response = await apiClient.post(`/timeline/public/student/${studentId}/init`, {});
      } catch (apiError) {
        console.warn("Could not initialize timeline from public endpoint, trying protected endpoint");
        response = await apiClient.post(`/timeline/student/${studentId}/init`, {});
      }
      
      return response.data;
    } catch (error) {
      console.error('Error initializing student timeline:', error);
      
      // ส่งข้อมูลข้อผิดพลาดกลับไปในรูปแบบที่คาดเดาได้
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'ไม่สามารถสร้างไทม์ไลน์เริ่มต้นได้',
        data: null
      };
    }
  },

  /**
   * อัพเดทขั้นตอนในไทม์ไลน์
   * @param {string} stepId - รหัสขั้นตอน
   * @param {Object} updateData - ข้อมูลที่ต้องการอัพเดท
   * @returns {Promise} - ผลลัพธ์การอัพเดทขั้นตอน
   */
  updateTimelineStep: async (stepId, updateData) => {
    try {
      const response = await apiClient.put(`/timeline/step/${stepId}`, updateData);
      return response.data;
    } catch (error) {
      console.error('Error updating timeline step:', error);
      
      // ส่งข้อมูลข้อผิดพลาดกลับไปในรูปแบบที่คาดเดาได้
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'ไม่สามารถอัพเดทขั้นตอนในไทม์ไลน์ได้',
        data: null
      };
    }
  }
};

export default timelineService;