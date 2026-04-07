/**
 * Agent Status Controller
 * จัดการ API endpoints สำหรับข้อมูลสถานะ Agent System
 */

const agentStatusService = require('../services/agentStatusService');
const logger = require('../utils/logger');
const { logAction } = require('../utils/auditLog');

class AgentStatusController {
    /**
     * ดึงสถานะของ Agent System ทั้งหมด
     * GET /api/admin/agent-status
     */
    async getAgentSystemStatus(req, res) {
        try {
            const status = await agentStatusService.getAgentSystemStatus();
            
            res.json({
                success: true,
                data: status
            });
        } catch (error) {
            logger.error('Error in getAgentSystemStatus:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'เกิดข้อผิดพลาดในการดึงสถานะ Agent System'
            });
        }
    }

    /**
     * ดึงสถิติการแจ้งเตือนของ Agent System
     * GET /api/admin/agent-status/notifications
     */
    async getAgentNotificationStats(req, res) {
        try {
            const days = parseInt(req.query.days) || 7;
            
            if (days < 1 || days > 90) {
                return res.status(400).json({
                    success: false,
                    message: 'จำนวนวันต้องอยู่ระหว่าง 1-90 วัน'
                });
            }
            
            const stats = await agentStatusService.getAgentNotificationStats(days);
            
            res.json({
                success: true,
                data: stats,
                period: {
                    days,
                    from: new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString(),
                    to: new Date().toISOString()
                }
            });
        } catch (error) {
            logger.error('Error in getAgentNotificationStats:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'เกิดข้อผิดพลาดในการดึงสถิติการแจ้งเตือน'
            });
        }
    }

    /**
     * รีสตาร์ท agent ที่ระบุ
     * POST /api/admin/agent-status/:agentName/restart
     */
    async restartAgent(req, res) {
        try {
            const { agentName } = req.params;
            
            if (!agentName) {
                return res.status(400).json({
                    success: false,
                    message: 'กรุณาระบุชื่อ agent'
                });
            }
            
            const result = await agentStatusService.restartAgent(agentName);
            
            logAction('RESTART_AGENT', `รีสตาร์ท agent: ${agentName}`, { userId: req.user.userId, ipAddress: req.ip });
            res.json({
                success: true,
                message: result.message
            });
        } catch (error) {
            logger.error('Error in restartAgent:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'เกิดข้อผิดพลาดในการรีสตาร์ท agent'
            });
        }
    }

    /**
     * ดึงข้อมูลสถิติอีเมลที่ส่งโดยระบบ
     * GET /api/admin/agent-status/email-stats
     */
    async getEmailStats(req, res) {
        try {
            const days = parseInt(req.query.days) || 7;
            
            if (days < 1 || days > 90) {
                return res.status(400).json({
                    success: false,
                    message: 'จำนวนวันต้องอยู่ระหว่าง 1-90 วัน'
                });
            }
            
            // สถิติอีเมล — ยังไม่มี email log table จริง จึงแสดงสถานะ config เท่านั้น
            const agentCfg = require('../agents/config');
            const emailStats = {
                emailEnabled: agentCfg.notifications?.emailEnabled ?? false,
                pushNotificationEnabled: agentCfg.notifications?.pushNotificationEnabled ?? false,
                note: 'ระบบยังไม่มี email log — แสดงเฉพาะ config ปัจจุบัน',
                period: {
                    days,
                    from: new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString(),
                    to: new Date().toISOString()
                }
            };

            res.json({
                success: true,
                data: emailStats
            });
        } catch (error) {
            logger.error('Error in getEmailStats:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'เกิดข้อผิดพลาดในการดึงสถิติอีเมล'
            });
        }
    }
}

module.exports = new AgentStatusController();