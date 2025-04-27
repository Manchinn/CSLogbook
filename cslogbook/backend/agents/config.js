/**
 * Config file for Agents
 * This file contains configuration for all agent types
 */

module.exports = {
  // ความถี่ในการทำงานของ agents (milliseconds)
  scheduleIntervals: {
    documentReminder: 24 * 60 * 60 * 1000, // ทุก 24 ชั่วโมง
    deadlineAlert: 12 * 60 * 60 * 1000,    // ทุก 12 ชั่วโมง
    statusMonitor: 30 * 60 * 1000,         // ทุก 30 นาที
    errorReport: 60 * 60 * 1000,           // ทุก 1 ชั่วโมง
  },
  
  // ค่าขีดจำกัดสำหรับการแจ้งเตือน
  thresholds: {
    deadlineWarningDays: 7,                 // แจ้งเตือนล่วงหน้า 7 วันก่อนถึงกำหนด
    criticalDeadlineWarningDays: 3,         // แจ้งเตือนสำคัญล่วงหน้า 3 วันก่อนถึงกำหนด
    documentsStuckInReviewDays: 5,          // เอกสารค้างการตรวจมากกว่า 5 วัน
    consecutiveFailedLogins: 5,             // การล็อกอินล้มเหลวติดต่อกัน 5 ครั้ง
  },
  
  // การตั้งค่า notification
  notifications: {
    emailEnabled: true,
    pushNotificationEnabled: true,
    smsEnabled: false,
  },
  
  // การตั้งค่า logging
  logging: {
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    agentLogFile: 'logs/agents.log',
  }
};