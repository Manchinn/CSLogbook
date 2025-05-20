import apiClient from './apiClient';

/**
 * TimelineService สำหรับจัดการการเรียกใช้ API ที่เกี่ยวข้องกับไทม์ไลน์
 */
export const timelineService = {
  /**
   * ดึงข้อมูลไทม์ไลน์ของนักศึกษา
   * @param {string} studentId - รหัสนักศึกษา
   * @returns {Promise} - ข้อมูลไทม์ไทม์ของนักศึกษา
   */
  getStudentTimeline: async (studentId) => {
    try {
      // ตรวจสอบว่ามีการระบุ studentId หรือไม่
      if (!studentId) {
        return {
          success: false,
          message: "กรุณาระบุรหัสนักศึกษา",
          data: null
        };
      }

      // ทำความสะอาดรหัสนักศึกษา (ตัดช่องว่างหรืออักขระพิเศษออก)
      const cleanedStudentId = String(studentId).trim();
      
      // ตรวจสอบว่ารหัสนักศึกษาถูกต้อง
      if (cleanedStudentId.length < 3) {
        return {
          success: false,
          message: "รหัสนักศึกษาไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง",
          data: null
        };
      }

      console.log("API Request:", { method: 'get', url: `/timeline/student/${cleanedStudentId}` });
      
      try {
        const response = await apiClient.get(`/timeline/student/${cleanedStudentId}`);
        
        // ปรับแต่งรูปแบบข้อมูลก่อนส่งกลับไปยัง component
        if (response.data.success && response.data.data) {
          const apiData = response.data;
          
          // แปลงโครงสร้างข้อมูลให้ง่ายต่อการใช้งานใน component
          if (apiData.data.student && typeof apiData.data.student === 'object') {
            // นำเข้าข้อมูลจากฐานข้อมูลโดยตรง
            if (apiData.data.student.hasOwnProperty('internshipStatus')) {
              console.log("Student internship status from API:", apiData.data.student.internshipStatus);
            }
            
            if (apiData.data.student.hasOwnProperty('isEnrolledInternship')) {
              // แปลงค่าจาก 0/1 หรือ string เป็น boolean
              apiData.data.student.isEnrolledInternship = 
                apiData.data.student.isEnrolledInternship === true || 
                apiData.data.student.isEnrolledInternship === 1 || 
                apiData.data.student.isEnrolledInternship === '1' || 
                false;
              
              console.log("Student isEnrolledInternship converted to:", apiData.data.student.isEnrolledInternship);
            }
            
            // สร้าง alias ของ studentId เพื่อให้เข้าถึงได้หลายวิธี
            if (apiData.data.student.id && !apiData.data.student.studentId) {
              apiData.data.student.studentId = apiData.data.student.id;
            } else if (apiData.data.student.studentId && !apiData.data.student.id) {
              apiData.data.student.id = apiData.data.student.studentId;
            }
            
            // ตรวจสอบว่ามีข้อมูลสิทธิ์หรือไม่
            if (!apiData.data.student.eligibility) {
              // สร้างข้อมูลสิทธิ์จากค่า isEligibleInternship และ isEligibleProject ที่มีอยู่แล้ว
              apiData.data.student.eligibility = {
                internship: { 
                  eligible: !!apiData.data.student.isEligibleInternship, 
                  message: apiData.data.student.isEligibleInternship 
                    ? "มีสิทธิ์ลงทะเบียนฝึกงาน" 
                    : "ไม่มีสิทธิ์ลงทะเบียนฝึกงาน" 
                },
                project: { 
                  eligible: !!apiData.data.student.isEligibleProject, 
                  message: apiData.data.student.isEligibleProject 
                    ? "มีสิทธิ์ลงทะเบียนโครงงาน" 
                    : "ไม่มีสิทธิ์ลงทะเบียนโครงงาน"
                }
              };
            }

            // ตรวจสอบและแก้ไขข้อมูลสิทธิ์ที่อาจได้รับมาแบบไม่สมบูรณ์
            // เพิ่ม internshipEligible และ projectEligible โดยตรงเพื่อความเข้ากันได้กับโค้ดเดิม
            if (apiData.data.student.eligibility) {
              // แก้ไขการตรวจสอบเงื่อนไข - ต้องตรวจสอบ exists ก่อน
              if (apiData.data.student.eligibility.internship) {
                apiData.data.student.internshipEligible = !!apiData.data.student.eligibility.internship.eligible;
              } else {
                apiData.data.student.internshipEligible = !!apiData.data.student.isEligibleInternship;
              }
              
              if (apiData.data.student.eligibility.project) {
                apiData.data.student.projectEligible = !!apiData.data.student.eligibility.project.eligible;
              } else {
                apiData.data.student.projectEligible = !!apiData.data.student.isEligibleProject;
              }
              
              // อัปเดต log เพื่อตรวจสอบความถูกต้อง
              console.log("Eligibility check:", {
                isEligibleFromAPI: apiData.data.student.isEligibleProject,
                eligibilityObject: apiData.data.student.eligibility.project,
                finalProjectEligible: apiData.data.student.projectEligible
              });
            } else {
              // ถ้าไม่มี eligibility structure เลย (น่าจะไม่เกิดขึ้นเนื่องจากเราสร้างด้านบนแล้ว)
              apiData.data.student.internshipEligible = !!apiData.data.student.isEligibleInternship;
              apiData.data.student.projectEligible = !!apiData.data.student.isEligibleProject;
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
            
            // รองรับระบบใหม่ - ตรวจสอบและจัดการข้อมูล steps 
            // ที่มาจากรูปแบบใหม่ของ WorkflowService
            if (apiData.data.progress) {
              // ถ้ามีข้อมูล progress ให้ตรวจสอบว่ามีโครงสร้าง steps ใหม่หรือไม่
              ['internship', 'project'].forEach(type => {
                if (apiData.data.progress[type]) {
                  // สร้างโครงสร้าง steps ว่างถ้าไม่มี
                  if (!apiData.data.progress[type].steps) {
                    apiData.data.progress[type].steps = [];
                  }
                  
                  // แปลงรูปแบบ steps จาก WorkflowService ให้เข้ากับ TimelineItems component
                  const rawSteps = apiData.data.progress[type].steps || [];
                  const formattedSteps = rawSteps.map((step, index) => ({
                    id: step.key || `step-${type}-${index}`,
                    name: step.title || 'ขั้นตอนไม่มีชื่อ',
                    desc: step.description || '',
                    status: step.status || 'pending',
                    document: step.documentType || null,
                    date: step.timestamp || null,
                    startDate: step.startDate || null,
                    endDate: step.endDate || null,
                    deadline: step.deadline || null,
                    actionText: step.actionText || null,
                    actionLink: step.actionLink || null
                  }));
                  
                  // อัปเดต steps ในรูปแบบที่ TimelineItems component คาดหวัง
                  apiData.data.progress[type].steps = formattedSteps;
                  
                  // อัปเดตข้อมูลการแสดงผลอื่นๆ ถ้าจำเป็น
                  if (!apiData.data.progress[type].hasOwnProperty('currentStepDisplay')) {
                    apiData.data.progress[type].currentStepDisplay = 
                      apiData.data.progress[type].currentStep || 0;
                  }
                  
                  if (!apiData.data.progress[type].hasOwnProperty('totalStepsDisplay')) {
                    apiData.data.progress[type].totalStepsDisplay = 
                      apiData.data.progress[type].totalSteps || 0;
                  }
                  
                  if (!apiData.data.progress[type].hasOwnProperty('progress')) {
                    // คำนวณความคืบหน้าจากขั้นตอนที่เสร็จแล้ว
                    const completedCount = formattedSteps.filter(s => s.status === 'completed').length;
                    const totalCount = formattedSteps.length || 1;
                    apiData.data.progress[type].progress = Math.round((completedCount / totalCount) * 100);
                  }
                } else {
                  // สร้างโครงสร้าง progress สำหรับประเภทนี้ถ้าไม่มี
                  apiData.data.progress[type] = {
                    steps: [],
                    currentStepDisplay: 0,
                    totalStepsDisplay: 0,
                    progress: 0
                  };
                }
              });
            } else {
              // สร้างข้อมูล progress เริ่มต้นถ้าไม่มีในข้อมูลที่ได้จาก API
              apiData.data.progress = {
                internship: {
                  steps: [],
                  currentStepDisplay: 0,
                  totalStepsDisplay: 0,
                  progress: 0
                },
                project: {
                  steps: [],
                  currentStepDisplay: 0,
                  totalStepsDisplay: 0,
                  progress: 0
                }
              };
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

          console.log("Formatted student data Timeline Pages :", apiData);
          return apiData;
        }
        
        return response.data;
      } catch (apiError) {
        // จัดการกรณี API ส่งค่า error กลับมา
        console.error("API Error:", apiError);
        
        if (apiError.response?.status === 404) {
          return {
            success: false,
            message: `ไม่พบข้อมูลนักศึกษารหัส ${cleanedStudentId} กรุณาตรวจสอบรหัสนักศึกษาอีกครั้ง`,
            data: null,
            error: 'STUDENT_NOT_FOUND'
          };
        }
        
        throw apiError; // โยน error ไปยัง catch block ถัดไป
      }
    } catch (error) {
      console.error('Error fetching student timeline:', error);
      
      // ตรวจสอบว่ามี response ที่ระบุข้อความผิดพลาดหรือไม่
      const errorMessage = error.response?.data?.message || error.message;
      
      // ส่งข้อมูลข้อผิดพลาดกลับไปในรูปแบบที่คาดเดาได้
      return {
        success: false,
        message: errorMessage || 'ไม่สามารถดึงข้อมูลไทม์ไลน์ได้',
        data: null,
        error: error.response?.status || 'UNKNOWN_ERROR'
      };
    }
  },

  /**
   * ตรวจสอบการมีอยู่ของนักศึกษาในระบบ
   * @param {string} studentId - รหัสนักศึกษา
   * @returns {Promise<boolean>} - true ถ้ามีอยู่ในระบบ, false ถ้าไม่มี
   */
  checkStudentExists: async (studentId) => {
    try {
      const response = await apiClient.get(`/students/check/${studentId}`);
      return response.data;
    } catch (error) {
      console.error('Error checking student existence:', error);
      return { 
        success: false, 
        message: error.response?.data?.message || error.message 
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
      if (!studentId) {
        return { 
          success: false,
          message: 'กรุณาระบุรหัสนักศึกษา',
          data: null
        };
      }

      // ทำความสะอาดรหัสนักศึกษา
      const cleanedStudentId = String(studentId).trim();

      const response = await apiClient.post(`/timeline/student/${cleanedStudentId}/init`, {});
      return response.data;
    } catch (error) {
      console.error('Error initializing student timeline:', error);
      
      // ส่งข้อมูลข้อผิดพลาดกลับไป
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'ไม่สามารถสร้างไทม์ไลน์เริ่มต้นได้',
        data: null
      };
    }
  },

  /**
   * อัพเดทขั้นตอนในไทม์ไลน์ (รองรับทั้งระบบเก่าและใหม่)
   * @param {string} stepId - รหัสขั้นตอน หรือ stepKey (ในระบบใหม่)
   * @param {Object} updateData - ข้อมูลที่ต้องการอัพเดท
   * @returns {Promise} - ผลลัพธ์การอัพเดทขั้นตอน
   */
  updateTimelineStep: async (stepId, updateData) => {
    try {
      // ตรวจสอบว่าเป็นการอัพเดตในระบบใหม่หรือไม่
      if (updateData && updateData.workflowType && updateData.stepKey) {
        // ระบบใหม่ - ใช้ API ของระบบ workflow
        const response = await apiClient.post(`/timeline/update-step`, updateData);
        return response.data;
      } else {
        // ระบบเดิม - ใช้ API เดิม
        const response = await apiClient.put(`/timeline/step/${stepId}`, updateData);
        return response.data;
      }
    } catch (error) {
      console.error('Error updating timeline step:', error);
      
      // ส่งข้อมูลข้อผิดพลาดกลับไป
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'ไม่สามารถอัพเดทขั้นตอนในไทม์ไลน์ได้',
        data: null
      };
    }
  }
};

export default timelineService;
