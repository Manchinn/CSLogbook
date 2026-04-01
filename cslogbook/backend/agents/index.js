/**
 * Main Agent Initialization File
 * ไฟล์หลักสำหรับเริ่มต้นการทำงานของ Agent ทั้งหมด
 */

const deadlineReminderAgent = require('./schedulers/deadlineReminderAgent');
const documentStatusMonitor = require('./monitors/documentStatusMonitor');
const eligibilityScheduler = require('./schedulers/eligibilityScheduler');
const projectPurgeScheduler = require('./schedulers/projectPurgeScheduler');
const academicSemesterScheduler = require('./schedulers/academicSemesterScheduler');
const projectDeadlineMonitor = require('./projectDeadlineMonitor');
const internshipWorkflowMonitor = require('./internshipWorkflowMonitor');
const internshipStatusMonitor = require('./internshipStatusMonitor');
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
      eligibilityScheduler: {
        _isRunning: false,
        start: function() {
          logger.info('Starting eligibility scheduler for automatic student eligibility updates');
          eligibilityScheduler.scheduleEligibilityUpdate();
          this._isRunning = true;
          return true;
        },
        stop: function() {
          logger.info('Stopping eligibility scheduler');
          eligibilityScheduler.stopEligibilityUpdate();
          this._isRunning = false;
          return true;
        },
        get isRunning() { return this._isRunning; }
      },
      projectPurgeScheduler: {
        _isRunning: false,
        start: function() {
          logger.info('Starting project purge scheduler');
          projectPurgeScheduler.scheduleProjectPurge();
          this._isRunning = true;
          return true;
        },
        stop: function() {
          logger.info('Stopping project purge scheduler');
          projectPurgeScheduler.stopProjectPurge();
          this._isRunning = false;
          return true;
        },
        get isRunning() { return this._isRunning; }
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
      internshipWorkflowMonitor: {
        start: () => {
          logger.info('Starting internship workflow monitor');
          internshipWorkflowMonitor.start();
          return true;
        },
        stop: () => {
          logger.info('Stopping internship workflow monitor');
          internshipWorkflowMonitor.stop();
          return true;
        },
        get isRunning() {
          return internshipWorkflowMonitor.isRunning || false;
        }
      },
      internshipStatusMonitor: {
        start: () => {
          logger.info('Starting internship status monitor');
          internshipStatusMonitor.start();
          return true;
        },
        stop: () => {
          logger.info('Stopping internship status monitor');
          internshipStatusMonitor.stop();
          return true;
        },
        get isRunning() {
          return internshipStatusMonitor.isRunning || false;
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

    try {
      for (const [name, agent] of Object.entries(this.agents)) {
        try {
          agent.stop();
          logger.info(`AgentManager: Successfully stopped ${name} agent`);
        } catch (error) {
          logger.error(`AgentManager: Error stopping ${name} agent:`, error);
        }
      }
    } finally {
      this.isRunning = false;
      const duration = (new Date() - this.startTime) / 1000 / 60;
      logger.info(`AgentManager: All agents stopped after running for ${duration.toFixed(2)} minutes`);
    }
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

    // Stop ก่อน — ถ้า throw จะไม่ schedule start
    try {
      if (this.agents[agentName].isRunning) {
        this.agents[agentName].stop();
        logger.info(`AgentManager: Stopped ${agentName} agent for restart`);
      }
    } catch (error) {
      logger.error(`AgentManager: Error stopping ${agentName} for restart:`, error);
      throw error;
    }

    // Start หลัง stop สำเร็จเท่านั้น
    setTimeout(() => {
      try {
        this.agents[agentName].start();
        logger.info(`AgentManager: Restarted ${agentName} agent`);
      } catch (error) {
        logger.error(`AgentManager: Error starting ${agentName} on restart:`, error);
      }
    }, 2000);
  }
}

// สร้าง instance เดียวของ AgentManager
const agentManager = new AgentManager();

// Export สำหรับการนำไปใช้จากภายนอก
module.exports = agentManager;