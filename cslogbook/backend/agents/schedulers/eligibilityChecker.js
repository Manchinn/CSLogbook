/**
 * Eligibility Checker Agent
 * ตรวจสอบคุณสมบัติของนักศึกษาและแจ้งเตือนเมื่อมีคุณสมบัติพร้อมสำหรับการลงทะเบียนฝึกงาน/โครงงาน
 */

const { Op } = require('sequelize');
const { Student, Curriculum, Academic } = require('../../models');
const notificationService = require('../helpers/notificationService');
const agentConfig = require('../config');
const logger = require('../../utils/logger');

class EligibilityChecker {
  constructor() {
    this.isRunning = false;
    this.lastCheckedSemester = null;
    
    // เกณฑ์การตรวจสอบคุณสมบัติ แตกต่างกันตามหลักสูตร
    this.eligibilityCriteria = {
      internship: {
        minCredits: 90, // หน่วยกิตขั้นต่ำสำหรับการฝึกงาน
        requiredCourses: ['261103', '261200'] // วิชาที่ต้องผ่าน (ตัวอย่าง)
      },
      project: {
        minCredits: 115, // หน่วยกิตขั้นต่ำสำหรับโครงงาน
        requiredCourses: ['261200', '261208'] // วิชาที่ต้องผ่าน (ตัวอย่าง)
      }
    };
  }

  /**
   * เริ่มการตรวจสอบคุณสมบัติ
   */
  start() {
    if (this.isRunning) {
      logger.warn('EligibilityChecker: Agent is already running');
      return;
    }

    logger.info('EligibilityChecker: Starting eligibility checking');
    this.isRunning = true;
    
    // ตั้งเวลาทำงานทุกสัปดาห์ (ตรวจสอบคุณสมบัติไม่จำเป็นต้องทำทุกวัน)
    this.interval = setInterval(() => {
      this.checkStudentEligibility().catch(err => {
        logger.error('EligibilityChecker: Error checking student eligibility:', err);
      });
    }, 7 * 24 * 60 * 60 * 1000); // ทำงานทุก 7 วัน
    
    // ทำงานครั้งแรกหลังจากเริ่มต้น 10 นาที
    setTimeout(() => {
      this.checkStudentEligibility().catch(err => {
        logger.error('EligibilityChecker: Error in initial eligibility check:', err);
      });
    }, 10 * 60 * 1000);
  }

  /**
   * หยุดการทำงานของ agent
   */
  stop() {
    if (!this.isRunning) return;
    
    clearInterval(this.interval);
    this.isRunning = false;
    logger.info('EligibilityChecker: Stopped eligibility checking');
  }

  /**
   * ตรวจสอบคุณสมบัติของนักศึกษาทั้งหมด
   */
  async checkStudentEligibility() {
    logger.debug('EligibilityChecker: Checking student eligibility');
    
    try {
      // ตรวจสอบภาคการศึกษาปัจจุบัน
      const currentSemester = await this.getCurrentSemester();
      
      // ข้ามถ้าไม่มีข้อมูลภาคการศึกษาหรือตรวจในภาคเรียนนี้ไปแล้ว
      if (!currentSemester || 
          (this.lastCheckedSemester && 
           this.lastCheckedSemester.year === currentSemester.year && 
           this.lastCheckedSemester.semester === currentSemester.semester)) {
        logger.info('EligibilityChecker: Already checked this semester or no semester info');
        return;
      }
      
      // อัพเดทภาคการศึกษาที่ตรวจล่าสุด
      this.lastCheckedSemester = currentSemester;
      
      // ดึงข้อมูลนักศึกษาที่ยังไม่ได้ทำการฝึกงานหรือโครงงาน
      const students = await Student.findAll({
        where: {
          active: true,
          // ยังไม่ลงทะเบียนฝึกงานหรือโครงงาน
          internship_status: {
            [Op.or]: [null, 'not_started']
          },
          project_status: {
            [Op.or]: [null, 'not_started']
          }
        },
        include: [
          {
            model: Curriculum,
            as: 'curriculum'
          }
        ]
      });
      
      logger.info(`EligibilityChecker: Found ${students.length} students to check for eligibility`);
      
      let internshipEligibleCount = 0;
      let projectEligibleCount = 0;
      
      // ตรวจสอบแต่ละนักศึกษา
      for (const student of students) {
        // ดึงข้อมูลหน่วยกิตและวิชาที่ผ่านของนักศึกษา
        const academicData = await this.getStudentAcademicData(student.id);
        
        if (!academicData) {
          logger.debug(`EligibilityChecker: No academic data for student #${student.id}`);
          continue;
        }
        
        // ตรวจสอบคุณสมบัติสำหรับการฝึกงาน
        if (student.internship_status !== 'completed' && student.internship_status !== 'in_progress') {
          const internshipEligible = this.checkInternshipEligibility(student, academicData);
          
          if (internshipEligible) {
            await this.notifyEligibility(student, 'internship');
            internshipEligibleCount++;
          }
        }
        
        // ตรวจสอบคุณสมบัติสำหรับโครงงาน
        if (student.project_status !== 'completed' && student.project_status !== 'in_progress') {
          const projectEligible = this.checkProjectEligibility(student, academicData);
          
          if (projectEligible) {
            await this.notifyEligibility(student, 'project');
            projectEligibleCount++;
          }
        }
      }
      
      logger.info(`EligibilityChecker: Found ${internshipEligibleCount} students eligible for internship and ${projectEligibleCount} for project`);
      
    } catch (error) {
      logger.error('EligibilityChecker: Error during eligibility check:', error);
    }
  }

  /**
   * ดึงข้อมูลภาคการศึกษาปัจจุบัน
   * @returns {Object|null} ข้อมูลภาคการศึกษาปัจจุบัน
   */
  async getCurrentSemester() {
    try {
      // ดึงข้อมูลภาคการศึกษาปัจจุบันจากตาราง Academic
      const academicTerm = await Academic.findOne({
        where: {
          is_current: true
        }
      });
      
      if (!academicTerm) {
        return null;
      }
      
      return {
        year: academicTerm.year,
        semester: academicTerm.semester
      };
    } catch (error) {
      logger.error('EligibilityChecker: Error getting current semester:', error);
      return null;
    }
  }

  /**
   * ดึงข้อมูลการศึกษาของนักศึกษา (หน่วยกิต, รายวิชาที่ผ่าน)
   * @param {number} studentId รหัสนักศึกษา
   * @returns {Object|null} ข้อมูลการศึกษา
   */
  async getStudentAcademicData(studentId) {
    try {
      // ในระบบจริง ข้อมูลนี้อาจต้องดึงจากระบบทะเบียนหรือจากฐานข้อมูลที่เก็บประวัติการเรียน
      // แต่สำหรับตัวอย่างนี้ จะจำลองข้อมูลแบบง่ายๆ
      
      // สมมติว่ามีตาราง AcademicRecord ที่เก็บข้อมูลหน่วยกิตและวิชาที่ผ่าน
      const { AcademicRecord } = require('../../models');
      
      const record = await AcademicRecord.findOne({
        where: {
          student_id: studentId,
        },
        order: [['updated_at', 'DESC']]
      });
      
      if (!record) {
        return null;
      }
      
      return {
        totalCredits: record.total_credits,
        passedCourses: record.passed_courses ? JSON.parse(record.passed_courses) : []
      };
      
      // หมายเหตุ: ในกรณีที่ไม่มี AcademicRecord Model จริง คุณอาจจำเป็นต้องปรับโค้ดส่วนนี้
      // หรืออาจสร้างข้อมูลจำลองแทน เช่น:
      /*
      return {
        totalCredits: Math.floor(Math.random() * 50) + 90, // สุ่มหน่วยกิตระหว่าง 90-140
        passedCourses: ['261103', '261200', '261208']
      };
      */
    } catch (error) {
      logger.error(`EligibilityChecker: Error getting academic data for student #${studentId}:`, error);
      return null;
    }
  }

  /**
   * ตรวจสอบคุณสมบัติสำหรับการฝึกงาน
   * @param {Object} student ข้อมูลนักศึกษา
   * @param {Object} academicData ข้อมูลการศึกษา
   * @returns {boolean} มีคุณสมบัติหรือไม่
   */
  checkInternshipEligibility(student, academicData) {
    // ตรวจสอบหน่วยกิต
    const minCredits = student.curriculum && student.curriculum.internship_min_credits ? 
                      student.curriculum.internship_min_credits : 
                      this.eligibilityCriteria.internship.minCredits;
                      
    if (academicData.totalCredits < minCredits) {
      return false;
    }
    
    // ตรวจสอบรายวิชาที่ต้องผ่าน
    const requiredCourses = student.curriculum && student.curriculum.internship_required_courses ?
                           JSON.parse(student.curriculum.internship_required_courses) :
                           this.eligibilityCriteria.internship.requiredCourses;
    
    for (const course of requiredCourses) {
      if (!academicData.passedCourses.includes(course)) {
        return false;
      }
    }
    
    // ผ่านเกณฑ์ทั้งหมด = มีคุณสมบัติ
    return true;
  }

  /**
   * ตรวจสอบคุณสมบัติสำหรับโครงงาน
   * @param {Object} student ข้อมูลนักศึกษา
   * @param {Object} academicData ข้อมูลการศึกษา
   * @returns {boolean} มีคุณสมบัติหรือไม่
   */
  checkProjectEligibility(student, academicData) {
    // ตรวจสอบหน่วยกิต
    const minCredits = student.curriculum && student.curriculum.project_min_credits ? 
                      student.curriculum.project_min_credits : 
                      this.eligibilityCriteria.project.minCredits;
                      
    if (academicData.totalCredits < minCredits) {
      return false;
    }
    
    // ตรวจสอบรายวิชาที่ต้องผ่าน
    const requiredCourses = student.curriculum && student.curriculum.project_required_courses ?
                           JSON.parse(student.curriculum.project_required_courses) :
                           this.eligibilityCriteria.project.requiredCourses;
    
    for (const course of requiredCourses) {
      if (!academicData.passedCourses.includes(course)) {
        return false;
      }
    }
    
    // ผ่านเกณฑ์ทั้งหมด = มีคุณสมบัติ
    return true;
  }

  /**
   * แจ้งเตือนนักศึกษาที่มีคุณสมบัติครบ
   * @param {Object} student ข้อมูลนักศึกษา
   * @param {string} type ประเภท (internship หรือ project)
   */
  async notifyEligibility(student, type) {
    try {
      const typeText = type === 'internship' ? 'การฝึกงาน' : 'โครงงานพิเศษ';
      const title = `🎉 คุณมีคุณสมบัติครบสำหรับ${typeText}แล้ว`;
      
      const message = `เรียน ${student.name || 'นักศึกษา'}\n\n` +
                     `ขอแจ้งให้ทราบว่าตอนนี้คุณมีคุณสมบัติครบถ้วนสำหรับ${typeText}แล้ว\n\n` +
                     `คุณสามารถเริ่มกระบวนการลงทะเบียน${typeText}ได้ในภาคการศึกษาถัดไป โดยดำเนินการดังนี้:\n` +
                     `1. ศึกษาขั้นตอนการลงทะเบียนในระบบ\n` +
                     `2. เตรียมเอกสาร ${type === 'internship' ? 'คพ.05' : 'เสนอหัวข้อโครงงาน'}\n` +
                     `3. ติดต่ออาจารย์ที่ปรึกษาเพื่อขอคำแนะนำ\n\n` +
                     `หากมีข้อสงสัยสามารถติดต่อเจ้าหน้าที่ภาควิชาฯ ได้ในวันและเวลาทำการ`;

      // ส่งการแจ้งเตือนไปยังนักศึกษา
      await notificationService.sendNotification({
        userId: student.id,
        userType: 'student',
        title,
        message,
        priority: 'medium',
        relatedTo: {
          type: type,
          eligibility: true
        },
        sendEmail: true
      });
      
      logger.debug(`EligibilityChecker: Notified student #${student.id} about ${type} eligibility`);
      
      // อัพเดตสถานะว่าได้แจ้งเตือนแล้ว
      await student.update({
        [`${type}_eligibility_notified`]: true,
        [`${type}_eligibility_notified_at`]: new Date()
      });
      
    } catch (error) {
      logger.error(`EligibilityChecker: Error notifying student #${student.id} about ${type} eligibility:`, error);
    }
  }
}

module.exports = new EligibilityChecker();