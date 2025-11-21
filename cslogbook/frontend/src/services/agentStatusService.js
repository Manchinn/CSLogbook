/**
 * Agent Status Service
 * บริการสำหรับเรียก API ของ Agent System status
 */

import apiClient from './apiClient';

class AgentStatusService {
    /**
     * ดึงสถานะของ Agent System ทั้งหมด
     * @returns {Promise<Object>} ข้อมูลสถานะ Agent System
     */
    async getAgentSystemStatus() {
        try {
            const response = await apiClient.get('/admin/agent-status');
            return response.data;
        } catch (error) {
            console.error('Error fetching agent system status:', error);
            throw error;
        }
    }

    /**
     * ดึงสถิติการแจ้งเตือนของ Agent System
     * @param {number} days จำนวนวันที่ต้องการดูสถิติ (default: 7)
     * @returns {Promise<Object>} สถิติการแจ้งเตือน
     */
    async getAgentNotificationStats(days = 7) {
        try {
            const response = await apiClient.get(`/admin/agent-status/notifications?days=${days}`);
            return response.data;
        } catch (error) {
            console.error('Error fetching agent notification stats:', error);
            throw error;
        }
    }

    /**
     * ดึงสถิติอีเมลที่ส่งโดยระบบ
     * @param {number} days จำนวนวันที่ต้องการดูสถิติ (default: 7)
     * @returns {Promise<Object>} สถิติอีเมล
     */
    async getEmailStats(days = 7) {
        try {
            const response = await apiClient.get(`/admin/agent-status/email-stats?days=${days}`);
            return response.data;
        } catch (error) {
            console.error('Error fetching email stats:', error);
            throw error;
        }
    }

    /**
     * รีสตาร์ท agent ที่ระบุ
     * @param {string} agentName ชื่อ agent
     * @returns {Promise<Object>} ผลลัพธ์การรีสตาร์ท
     */
    async restartAgent(agentName) {
        try {
            const response = await apiClient.post(`/admin/agent-status/${agentName}/restart`);
            return response.data;
        } catch (error) {
            console.error(`Error restarting agent ${agentName}:`, error);
            throw error;
        }
    }
}

const agentStatusService = new AgentStatusService();

export default agentStatusService;