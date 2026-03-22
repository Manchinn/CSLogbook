/**
 * Security Monitor Agent
 * ตรวจสอบกิจกรรมการใช้งานระบบที่น่าสงสัย เช่น การล็อกอินล้มเหลวหลายครั้ง 
 * การเข้าถึงข้อมูลที่ไม่ได้รับอนุญาต หรือการเปลี่ยนแปลงข้อมูลสำคัญ
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { Op } = require('sequelize');
const { sequelize } = require('../../models');
const notificationService = require('../../services/notificationService');
const agentConfig = require('../config');
const logger = require('../../utils/logger');

class SecurityMonitor {
  constructor() {
    this.config = agentConfig.thresholds;
    this.isRunning = false;
    this.suspiciousIPs = new Map(); // เก็บข้อมูล IP ที่มีพฤติกรรมน่าสงสัย
    this.lastLogCheck = new Date();
  }

  /**
   * เริ่มการตรวจสอบความปลอดภัย
   */
  start() {
    if (this.isRunning) {
      logger.warn('SecurityMonitor: Agent is already running');
      return;
    }

    logger.info('SecurityMonitor: Starting security monitoring');
    this.isRunning = true;
    
    // ตั้งเวลาทำงานเป็นระยะ
    this.interval = setInterval(() => {
      this.checkSecurityIssues().catch(err => {
        logger.error('SecurityMonitor: Error checking security issues:', err);
      });
    }, agentConfig.scheduleIntervals.errorReport);
    
    // ทำงานครั้งแรกทันที
    this.checkSecurityIssues().catch(err => {
      logger.error('SecurityMonitor: Error in initial security check:', err);
    });
  }

  /**
   * หยุดการทำงานของ agent
   */
  stop() {
    if (!this.isRunning) return;
    
    clearInterval(this.interval);
    this.isRunning = false;
    logger.info('SecurityMonitor: Stopped security monitoring');
  }

  /**
   * ตรวจสอบปัญหาความปลอดภัย
   */
  async checkSecurityIssues() {
    logger.debug('SecurityMonitor: Checking for security issues');
    
    try {
      await Promise.all([
        this.checkFailedLogins(),
        this.checkAuthLogForSuspiciousActivity(),
        this.checkDatabaseModifications()
      ]);

      // อัพเดทเวลาตรวจสอบล่าสุด
      this.lastLogCheck = new Date();
    } catch (error) {
      logger.error('SecurityMonitor: Error during security check:', error);
    }
  }

  /**
   * ตรวจสอบการล็อกอินที่ล้มเหลวหลายครั้ง
   */
  async checkFailedLogins() {
    try {
      // ดึงข้อมูลจาก auth.log
      const logPath = path.join(__dirname, '../../logs/auth.log');
      
      if (!fs.existsSync(logPath)) {
        logger.warn(`SecurityMonitor: Auth log file not found at ${logPath}`);
        return;
      }

      const logStream = fs.createReadStream(logPath);
      const rl = readline.createInterface({
        input: logStream,
        crlfDelay: Infinity
      });

      // แยกวิเคราะห์แต่ละบรรทัดของ log
      for await (const line of rl) {
        // ตรวจสอบเฉพาะ log ใหม่หลังจากการตรวจสอบครั้งล่าสุด
        const logTime = this.extractTimestampFromLog(line);
        if (logTime && logTime > this.lastLogCheck) {
          if (line.includes('Failed login attempt')) {
            // ดึง IP จากข้อความ log
            const ipMatch = line.match(/\b(?:\d{1,3}\.){3}\d{1,3}\b/);
            if (ipMatch) {
              const ip = ipMatch[0];
              if (!this.suspiciousIPs.has(ip)) {
                this.suspiciousIPs.set(ip, { failedAttempts: 1, lastAttempt: new Date() });
              } else {
                const data = this.suspiciousIPs.get(ip);
                // ตรวจสอบเวลา: ถ้านานเกินไปให้เริ่มนับใหม่
                const hoursSinceLastAttempt = (new Date() - data.lastAttempt) / (1000 * 60 * 60);
                
                if (hoursSinceLastAttempt > 1) {
                  // เริ่มนับใหม่ถ้านานเกิน 1 ชั่วโมง
                  this.suspiciousIPs.set(ip, { failedAttempts: 1, lastAttempt: new Date() });
                } else {
                  // เพิ่มจำนวนครั้งที่ล็อกอินล้มเหลว
                  data.failedAttempts += 1;
                  data.lastAttempt = new Date();
                  this.suspiciousIPs.set(ip, data);

                  // แจ้งเตือนถ้ามีการล็อกอินล้มเหลวเกินกำหนด
                  if (data.failedAttempts >= this.config.consecutiveFailedLogins) {
                    await this.reportSecurityIssue({
                      type: 'failed_logins',
                      severity: 'high',
                      details: `มีการพยายามล็อกอินที่ล้มเหลวจาก IP ${ip} จำนวน ${data.failedAttempts} ครั้ง ภายในระยะเวลาสั้นๆ`
                    });
                    
                    // Reset counter หลังแจ้งเตือน
                    this.suspiciousIPs.set(ip, { failedAttempts: 0, lastAttempt: new Date() });
                  }
                }
              }
            }
          }
        }
      }
    } catch (error) {
      logger.error('SecurityMonitor: Error checking failed logins:', error);
    }
  }

  /**
   * ตรวจสอบ auth log เพื่อหากิจกรรมที่น่าสงสัย
   */
  async checkAuthLogForSuspiciousActivity() {
    try {
      const logPath = path.join(__dirname, '../../logs/auth.log');
      
      if (!fs.existsSync(logPath)) {
        return;
      }

      const logStream = fs.createReadStream(logPath);
      const rl = readline.createInterface({
        input: logStream,
        crlfDelay: Infinity
      });

      // แยกวิเคราะห์แต่ละบรรทัดของ log
      for await (const line of rl) {
        // ตรวจสอบเฉพาะ log ใหม่หลังจากการตรวจสอบครั้งล่าสุด
        const logTime = this.extractTimestampFromLog(line);
        if (logTime && logTime > this.lastLogCheck) {
          // ตรวจสอบการเข้าถึงข้อมูลที่ไม่ได้รับอนุญาต
          if (line.includes('Unauthorized access attempt') || 
              line.includes('Permission denied') || 
              line.includes('Access forbidden')) {
            
            const userMatch = line.match(/user: (\S+)/);
            const resourceMatch = line.match(/resource: (\S+)/);
            const ipMatch = line.match(/\b(?:\d{1,3}\.){3}\d{1,3}\b/);

            await this.reportSecurityIssue({
              type: 'unauthorized_access',
              severity: 'high',
              details: `มีการพยายามเข้าถึงข้อมูลโดยไม่ได้รับอนุญาต` +
                      `${userMatch ? ` โดยผู้ใช้: ${userMatch[1]}` : ''}` +
                      `${resourceMatch ? ` ทรัพยากร: ${resourceMatch[1]}` : ''}` +
                      `${ipMatch ? ` จาก IP: ${ipMatch[0]}` : ''}`
            });
          }
        }
      }
    } catch (error) {
      logger.error('SecurityMonitor: Error checking auth log:', error);
    }
  }

  /**
   * ตรวจสอบการเปลี่ยนแปลงข้อมูลสำคัญในฐานข้อมูล
   */
  async checkDatabaseModifications() {
    try {
      // ดึงข้อมูล log การเปลี่ยนแปลงข้อมูลสำคัญจากฐานข้อมูล
      // เช่น การเปลี่ยนแปลงบัญชีผู้ดูแลระบบ การเปลี่ยนแปลงสิทธิ์ เป็นต้น
      
      // ตัวอย่าง: ตรวจสอบ DocumentLog สำหรับการเปลี่ยนแปลงที่น่าสงสัย
      const { DocumentLog } = require('../../models');
      
      const suspiciousActions = await DocumentLog.findAll({
        where: {
          actionType: {
            [Op.in]: ['delete', 'approve', 'reject']
          },
          created_at: {
            [Op.gt]: this.lastLogCheck
          }
        },
        order: [['created_at', 'DESC']],
        limit: 20
      });

      // แจ้งเตือนหากพบการเปลี่ยนแปลงที่น่าสงสัย
      if (suspiciousActions.length > 0) {
        const groupByAction = {};
        
        for (const action of suspiciousActions) {
          if (!groupByAction[action.actionType]) {
            groupByAction[action.actionType] = [];
          }
          groupByAction[action.actionType].push(action);
        }

        for (const [actionType, actions] of Object.entries(groupByAction)) {
          if (actions.length >= 3) {  // หากมีการกระทำนี้หลายครั้งติดต่อกันในเวลาสั้นๆ
            await this.reportSecurityIssue({
              type: 'suspicious_db_changes',
              severity: 'medium',
              details: `มีการดำเนินการที่น่าสงสัยกับเอกสารในระบบ: ${actionType} จำนวน ${actions.length} ครั้ง ` +
                      `โดยผู้ใช้ ${actions[0].created_by} อาจต้องตรวจสอบเพิ่มเติม`
            });
          }
        }
      }
    } catch (error) {
      logger.error('SecurityMonitor: Error checking database modifications:', error);
    }
  }

  /**
   * แปลงข้อความ timestamp จาก log เป็นอ็อบเจ็กต์ Date
   * @param {string} logLine ข้อความจาก log
   * @returns {Date|null} วันที่และเวลา หรือ null หากไม่พบ
   */
  extractTimestampFromLog(logLine) {
    // ตัวอย่าง format: [2025-04-22T15:30:45.123Z]
    const timestampMatch = logLine.match(/\[(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z)\]/);
    if (timestampMatch) {
      return new Date(timestampMatch[1]);
    }
    return null;
  }

  /**
   * รายงานปัญหาความปลอดภัย
   * @param {Object} issue ข้อมูลปัญหา
   */
  async reportSecurityIssue(issue) {
    try {
      const { type, severity, details } = issue;
      logger.warn(`SecurityMonitor: Detected security issue: ${type} (${severity}) - ${details}`);

      // ส่งการแจ้งเตือนไปยังผู้ดูแลระบบทุกคน
      const { Admin } = require('../../models');
      const admins = await Admin.findAll({
        where: {
          active: true,
          role: {
            [Op.in]: ['superadmin', 'security_admin', 'admin']
          }
        }
      });

      const title = severity === 'high' 
        ? `⚠️ การแจ้งเตือนความปลอดภัยฉุกเฉิน: ${type}` 
        : `🔔 การแจ้งเตือนความปลอดภัย: ${type}`;

      const message = `ระบบตรวจพบปัญหาความปลอดภัยในระบบ CSLogbook:\n\n` +
                     `ประเภท: ${type}\n` +
                     `ระดับความรุนแรง: ${severity}\n` +
                     `รายละเอียด: ${details}\n\n` +
                     `เวลาที่ตรวจพบ: ${new Date().toLocaleString('th-TH')}\n\n` +
                     `กรุณาตรวจสอบระบบโดยเร็วที่สุด`;

      // ส่งการแจ้งเตือนไปยังผู้ดูแลระบบทุกคน
      for (const admin of admins) {
        await notificationService.createAndNotify(admin.id, {
          type: 'APPROVAL',
          title,
          message,
          metadata: {
            alertType: type,
            severity
          }
        });
      }

      // เพิ่มบันทึกลงใน log เป็นพิเศษ
      logger.error(`SECURITY ALERT: ${type} - ${details}`);
      
      // อาจมีการเพิ่มการดำเนินการอื่นๆ เช่น บล็อก IP หรือล็อกผู้ใช้ที่เกี่ยวข้อง
      
    } catch (error) {
      logger.error('SecurityMonitor: Error reporting security issue:', error);
    }
  }
}

module.exports = new SecurityMonitor();