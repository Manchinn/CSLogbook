/**
 * Agent Status Controller
 * จัดการ API endpoints สำหรับข้อมูลสถานะ Agent System
 */

const agentStatusService = require('../services/agentStatusService');
const logger = require('../utils/logger');

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
            
            // ดึงสถิติการแจ้งเตือนที่เป็นอีเมล
            const notificationStats = await agentStatusService.getAgentNotificationStats(days);
            
            // คำนวณสถิติอีเมลเฉพาะ
            const emailStats = {
                totalEmailsSent: notificationStats.totalNotifications,
                byEmailType: {
                    deadline: notificationStats.byType.DEADLINE || 0,
                    document: notificationStats.byType.DOCUMENT || 0,
                    logbook: notificationStats.byType.LOGBOOK || 0,
                    evaluation: notificationStats.byType.EVALUATION || 0,
                    approval: notificationStats.byType.APPROVAL || 0
                },
                dailyStats: notificationStats.dailyStats,
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