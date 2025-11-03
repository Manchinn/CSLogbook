/**
 * Main Agent Initialization File
 * ไฟล์หลักสำหรับเริ่มต้นการทำงานของ Agent ทั้งหมด
 */

const deadlineReminderAgent = require('./schedulers/deadlineReminderAgent');
const documentStatusMonitor = require('./monitors/documentStatusMonitor');
const securityMonitor = require('./monitors/securityMonitor');
const logbookQualityMonitor = require('./monitors/logbookQualityMonitor');
const eligibilityChecker = require('./schedulers/eligibilityChecker');
// เพิ่ม eligibilityScheduler
const eligibilityScheduler = require('./schedulers/eligibilityScheduler');
// เพิ่ม project purge scheduler
const projectPurgeScheduler = require('./schedulers/projectPurgeScheduler');
const academicSemesterScheduler = require('./schedulers/academicSemesterScheduler');
const projectDeadlineMonitor = require('./projectDeadlineMonitor');
const logger = require('../utils/logger');
const agentConfig = require('./config');

/**
 * คลาสจัดการ Agent ทั้งหมดในระบบ
 */
class AgentManager {
  constructor() {
    this.agents = {
      deadlineReminder: deadlineReminderAgent,
      documentMonitor: documentStatusMonitor,
      securityMonitor: securityMonitor,           // เพิ่ม Security Monitor Agent
      logbookQualityMonitor: logbookQualityMonitor, // เพิ่ม Logbook Quality Monitor
      eligibilityChecker: eligibilityChecker,      // เพิ่ม Eligibility Checker Agent
      // เพิ่ม eligibilityScheduler
      eligibilityScheduler: {
        start: () => {
          logger.info('Starting eligibility scheduler for automatic student eligibility updates');
          eligibilityScheduler.scheduleEligibilityUpdate();
          return true;
        },
        stop: () => {
          logger.info('Stopping eligibility scheduler');
          // ไม่จำเป็นต้องหยุดเนื่องจากเป็น cron job
          return true;
        },
        isRunning: true
      },
      projectPurgeScheduler: {
        start: () => {
          logger.info('Starting project purge scheduler');
          projectPurgeScheduler.scheduleProjectPurge();
          return true;
        },
        stop: () => {
          logger.info('Stopping project purge scheduler (cron จะยัง active หาก library ไม่รองรับ cancel)');
          return true;
        },
        isRunning: true
      },
      academicSemesterScheduler: {
        start: () => {
          logger.info('Starting academic semester scheduler');
          return academicSemesterScheduler.start();
        },
        stop: () => {
          logger.info('Stopping academic semester scheduler');
          return academicSemesterScheduler.stop();
        },
        get isRunning() {
          return academicSemesterScheduler.isRunning;
        }
      },
      projectDeadlineMonitor: {
        start: () => {
          logger.info('Starting project deadline monitor');
          const schedule = process.env.PROJECT_DEADLINE_MONITOR_SCHEDULE || '0 * * * *'; // ทุกชั่วโมง
          projectDeadlineMonitor.start(schedule);
          return true;
        },
        stop: () => {
          logger.info('Stopping project deadline monitor');
          projectDeadlineMonitor.stop();
          return true;
        },
        get isRunning() {
          return projectDeadlineMonitor.isRunning;
        }
      },
      // เพิ่ม agent อื่นๆ ที่นี่
    };
    
    this.isRunning = false;
    this.startTime = null;
  }

  /**
   * เริ่มการทำงานของ agent ทั้งหมด
   */
  startAllAgents() {
    if (this.isRunning) {
      logger.warn('AgentManager: Agents are already running');
      return;
    }
    
    logger.info('AgentManager: Starting all agents');
    this.isRunning = true;
    this.startTime = new Date();
    
    // เริ่มการทำงานของทุก agent
    for (const [name, agent] of Object.entries(this.agents)) {
      try {
        agent.start();
        logger.info(`AgentManager: Successfully started ${name} agent`);
      } catch (error) {
        logger.error(`AgentManager: Error starting ${name} agent:`, error);
      }
    }
    
    logger.info(`AgentManager: All agents started at ${this.startTime}`);
  }
  
  /**
   * หยุดการทำงานของ agent ทั้งหมด
   */
  stopAllAgents() {
    if (!this.isRunning) {
      logger.warn('AgentManager: Agents are not running');
      return;
    }
    
    logger.info('AgentManager: Stopping all agents');
    
    // หยุดการทำงานของทุก agent
    for (const [name, agent] of Object.entries(this.agents)) {
      try {
        agent.stop();
        logger.info(`AgentManager: Successfully stopped ${name} agent`);
      } catch (error) {
        logger.error(`AgentManager: Error stopping ${name} agent:`, error);
      }
    }
    
    this.isRunning = false;
    const duration = (new Date() - this.startTime) / 1000 / 60;
    logger.info(`AgentManager: All agents stopped after running for ${duration.toFixed(2)} minutes`);
  }
  
  /**
   * เริ่มการทำงานของ agent ที่ระบุ
   * @param {string} agentName ชื่อของ agent ที่ต้องการเริ่ม
   */
  startAgent(agentName) {
    if (!this.agents[agentName]) {
      throw new Error(`Agent '${agentName}' not found`);
    }
    
    try {
      this.agents[agentName].start();
      logger.info(`AgentManager: Started ${agentName} agent`);
    } catch (error) {
      logger.error(`AgentManager: Error starting ${agentName} agent:`, error);
      throw error;
    }
  }
  
  /**
   * หยุดการทำงานของ agent ที่ระบุ
   * @param {string} agentName ชื่อของ agent ที่ต้องการหยุด
   */
  stopAgent(agentName) {
    if (!this.agents[agentName]) {
      throw new Error(`Agent '${agentName}' not found`);
    }
    
    try {
      this.agents[agentName].stop();
      logger.info(`AgentManager: Stopped ${agentName} agent`);
    } catch (error) {
      logger.error(`AgentManager: Error stopping ${agentName} agent:`, error);
      throw error;
    }
  }
  
  /**
   * ตรวจสอบสถานะของ agent ทั้งหมด
   * @returns {Object} สถานะของ agent ทั้งหมด
   */
  getStatus() {
    const status = {
      isRunning: this.isRunning,
      startTime: this.startTime,
      agents: {}
    };
    
    for (const [name, agent] of Object.entries(this.agents)) {
      status.agents[name] = {
        isRunning: agent.isRunning || false
      };
    }
    
    return status;
  }

  /**
   * ดึงรายการ Agent ทั้งหมดที่มีในระบบ
   * @returns {Array} รายการชื่อของ Agent
   */
  getAgentList() {
    return Object.keys(this.agents);
  }

  /**
   * รีสตาร์ท Agent ที่ระบุ
   * @param {string} agentName ชื่อของ agent ที่ต้องการรีสตาร์ท
   */
  restartAgent(agentName) {
    if (!this.agents[agentName]) {
      throw new Error(`Agent '${agentName}' not found`);
    }
    
    try {
      if (this.agents[agentName].isRunning) {
        this.agents[agentName].stop();
        logger.info(`AgentManager: Stopped ${agentName} agent for restart`);
      }
      
      setTimeout(() => {
        this.agents[agentName].start();
        logger.info(`AgentManager: Restarted ${agentName} agent`);
      }, 2000); // รอ 2 วินาทีก่อนเริ่มใหม่
    } catch (error) {
      logger.error(`AgentManager: Error restarting ${agentName} agent:`, error);
      throw error;
    }
  }
}

// สร้าง instance เดียวของ AgentManager
const agentManager = new AgentManager();

// Export สำหรับการนำไปใช้จากภายนอก
module.exports = agentManager;