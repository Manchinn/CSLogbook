/**
 * Agent Status Service
 * บริการสำหรับดึงข้อมูลสถานะของ Agent System และสถิติการทำงาน
 */

const agentManager = require('../agents');
const agentConfig = require('../agents/config');
const logger = require('../utils/logger');
const { NotificationSetting } = require('../models');
const { Op } = require('sequelize');

class AgentStatusService {
    /**
     * ดึงสถานะของ Agent System ทั้งหมด
     * @returns {Object} ข้อมูลสถานะ Agent System
     */
    async getAgentSystemStatus() {
        try {
            const status = agentManager.getStatus();
            const agentList = agentManager.getAgentList();
            
            // ดึงข้อมูลการกำหนดค่าของแต่ละ agent
            const agentDetails = {};
            
            for (const agentName of agentList) {
                agentDetails[agentName] = {
                    name: this.getAgentDisplayName(agentName),
                    description: this.getAgentDescription(agentName),
                    isRunning: status.agents[agentName]?.isRunning || false,
                    schedule: this.getAgentSchedule(agentName),
                    lastActivity: await this.getAgentLastActivity(agentName)
                };
            }
            
            return {
                systemStatus: {
                    isRunning: status.isRunning,
                    startTime: status.startTime,
                    uptime: status.startTime ? this.calculateUptime(status.startTime) : null,
                    totalAgents: agentList.length,
                    runningAgents: Object.values(status.agents).filter(agent => agent.isRunning).length
                },
                agents: agentDetails,
                configuration: {
                    scheduleIntervals: agentConfig.scheduleIntervals,
                    thresholds: agentConfig.thresholds,
                    notifications: agentConfig.notifications
                }
            };
        } catch (error) {
            logger.error('Error getting agent system status:', error);
            throw new Error(`ไม่สามารถดึงสถานะ Agent System ได้: ${error.message}`);
        }
    }

    /**
     * ดึงสถิติการแจ้งเตือนของ agents จาก DB
     * @param {number} days จำนวนวันที่ต้องการดูย้อนหลัง
     * @returns {Object} สถิติการแจ้งเตือน
     */
    async getAgentNotificationStats(days = 7) {
        try {
            const since = new Date();
            since.setDate(since.getDate() - days);

            // นับ notifications จาก DB จริง
            const totalNotifications = await NotificationSetting.count({
                where: { created_at: { [Op.gte]: since } }
            }).catch(() => null);

            const status = agentManager.getStatus();
            const agentList = agentManager.getAgentList();

            // สรุปจำนวน agent ที่ทำงานอยู่
            const runningAgents = agentList.filter(name => status.agents[name]?.isRunning);

            return {
                period: `${days} วันย้อนหลัง`,
                totalSettings: totalNotifications,
                runningAgents: runningAgents.length,
                totalAgents: agentList.length,
            };
        } catch (error) {
            logger.error('Error getting agent notification stats:', error);
            throw new Error(`ไม่สามารถดึงสถิติการแจ้งเตือนได้: ${error.message}`);
        }
    }

    /**
     * คำนวณ uptime ของระบบ
     * @param {Date} startTime เวลาที่เริ่มระบบ
     * @returns {Object} ข้อมูล uptime
     */
    calculateUptime(startTime) {
        const now = new Date();
        const uptimeMs = now - startTime;
        
        const days = Math.floor(uptimeMs / (1000 * 60 * 60 * 24));
        const hours = Math.floor((uptimeMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((uptimeMs % (1000 * 60 * 60)) / (1000 * 60));
        
        return {
            totalMs: uptimeMs,
            days,
            hours,
            minutes,
            formatted: `${days} วัน ${hours} ชั่วโมง ${minutes} นาที`
        };
    }

    /**
     * ดึงชื่อแสดงผลของ agent
     * @param {string} agentName ชื่อ agent
     * @returns {string} ชื่อแสดงผล
     */
    getAgentDisplayName(agentName) {
        const displayNames = {
            deadlineReminder: 'ตัวแจ้งเตือนกำหนดเวลา',
            documentMonitor: 'ตัวตรวจสอบสถานะเอกสาร',
            securityMonitor: 'ตัวตรวจสอบความปลอดภัย',
            logbookQualityMonitor: 'ตัวตรวจสอบคุณภาพ Logbook',
            eligibilityChecker: 'ตัวตรวจสอบสิทธิ์',
            eligibilityScheduler: 'ตัวจัดการสิทธิ์อัตโนมัติ',
            projectPurgeScheduler: 'ตัวล้างข้อมูลโครงงาน',
            academicSemesterScheduler: 'ตัวจัดการภาคการศึกษา',
            projectDeadlineMonitor: 'ตัวตรวจสอบ Deadline โครงงาน',
            internshipWorkflowMonitor: 'ตัวตรวจสอบ Workflow ฝึกงาน',
            internshipStatusMonitor: 'ตัวตรวจสอบสถานะฝึกงาน'
        };

        return displayNames[agentName] || agentName;
    }

    /**
     * ดึงคำอธิบายของ agent
     * @param {string} agentName ชื่อ agent
     * @returns {string} คำอธิบาย
     */
    getAgentDescription(agentName) {
        const descriptions = {
            deadlineReminder: 'แจ้งเตือนนักศึกษาเกี่ยวกับกำหนดส่งเอกสารที่ใกล้จะถึง',
            documentMonitor: 'ตรวจสอบเอกสารที่ค้างการตรวจสอบเป็นเวลานาน',
            securityMonitor: 'ตรวจสอบการเข้าสู่ระบบที่ผิดปกติและความปลอดภัย',
            logbookQualityMonitor: 'วิเคราะห์และให้ข้อเสนอแนะเกี่ยวกับคุณภาพของ Logbook',
            eligibilityChecker: 'ตรวจสอบสิทธิ์ของนักศึกษาในการฝึกงานและทำโครงงาน',
            eligibilityScheduler: 'อัปเดตสิทธิ์ของนักศึกษาอัตโนมัติตามเงื่อนไข',
            projectPurgeScheduler: 'ล้างข้อมูลโครงงานที่หมดอายุออกจากระบบ',
            academicSemesterScheduler: 'จัดการข้อมูลภาคการศึกษาและปีการศึกษาอัตโนมัติ',
            projectDeadlineMonitor: 'ตรวจสอบและอัปเดตสถานะโครงงานที่เลย deadline',
            internshipWorkflowMonitor: 'ตรวจสอบและอัปเดต workflow การฝึกงานที่ใกล้สิ้นสุด',
            internshipStatusMonitor: 'ตรวจสอบและอัปเดตสถานะการฝึกงานอัตโนมัติ'
        };

        return descriptions[agentName] || 'ไม่มีคำอธิบาย';
    }

    /**
     * ดึงข้อมูลตารางเวลาของ agent
     * @param {string} agentName ชื่อ agent
     * @returns {string} ข้อมูลตารางเวลา
     */
    getAgentSchedule(agentName) {
        const schedules = {
            deadlineReminder: 'ทุก 12 ชั่วโมง',
            documentMonitor: 'ทุก 30 นาที',
            securityMonitor: 'ทุก 1 ชั่วโมง',
            logbookQualityMonitor: 'ทุก 24 ชั่วโมง',
            eligibilityChecker: 'ทุก 7 วัน',
            eligibilityScheduler: 'ทุกเดือน (วันที่ 1 เวลา 00:00 น.)',
            projectPurgeScheduler: 'ทุกวัน (เวลา 02:15 น.)',
            academicSemesterScheduler: 'ทุกวัน (เวลา 00:05 น.)',
            projectDeadlineMonitor: 'ทุกชั่วโมง',
            internshipWorkflowMonitor: 'ทุกวัน (เวลา 02:00 น.)',
            internshipStatusMonitor: 'ทุกวัน (เวลา 02:00 น.)'
        };

        return schedules[agentName] || 'ไม่ระบุ';
    }

    /**
     * ดึงข้อมูลกิจกรรมล่าสุดของ agent
     * @param {string} agentName ชื่อ agent
     * @returns {Date|null} เวลากิจกรรมล่าสุด
     */
    async getAgentLastActivity(agentName) {
        try {
            // ดึง lastRunTime จาก agent ที่รองรับ (เช่น projectDeadlineMonitor)
            const agent = agentManager.agents?.[agentName];
            if (agent && typeof agent.lastRunTime !== 'undefined') {
                return agent.lastRunTime;
            }
            // agent อื่นยังไม่มี tracking — return null ตรงๆ
            return null;
        } catch (error) {
            logger.error(`Error getting last activity for agent ${agentName}:`, error);
            return null;
        }
    }

    /**
     * รีสตาร์ท agent ที่ระบุ
     * @param {string} agentName ชื่อ agent
     * @returns {Object} ผลลัพธ์การรีสตาร์ท
     */
    async restartAgent(agentName) {
        try {
            agentManager.restartAgent(agentName);
            
            logger.info(`Agent ${agentName} restarted by admin`);
            
            return {
                success: true,
                message: `รีสตาร์ท ${this.getAgentDisplayName(agentName)} เรียบร้อยแล้ว`
            };
        } catch (error) {
            logger.error(`Error restarting agent ${agentName}:`, error);
            throw new Error(`ไม่สามารถรีสตาร์ท agent ได้: ${error.message}`);
        }
    }
}

module.exports = new AgentStatusService();