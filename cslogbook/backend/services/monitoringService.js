const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { Op } = require('sequelize');
const { SystemLog, User } = require('../models');
const agentManager = require('../agents');
const logger = require('../utils/logger');

const LOG_DIR = path.join(__dirname, '..', 'logs');
const VALID_LOG_FILES = ['app.log', 'error.log', 'agents.log', 'auth.log', 'notifications.log'];

class MonitoringService {
  async getHealthStats() {
    const status = agentManager.getStatus();
    const agentList = agentManager.getAgentList();
    const runningCount = agentList.filter(name => status.agents[name]?.isRunning).length;

    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const errors24h = await SystemLog.count({
      where: {
        actionType: { [Op.like]: '%ERROR%' },
        created_at: { [Op.gte]: oneDayAgo }
      }
    });

    const mem = process.memoryUsage();

    return {
      uptime: Math.floor(process.uptime()),
      agentsRunning: runningCount,
      agentsTotal: agentList.length,
      errors24h,
      memoryMB: Math.round(mem.rss / 1024 / 1024)
    };
  }

  async getRecentLogs(fileName, lines = 100) {
    if (!VALID_LOG_FILES.includes(fileName)) {
      throw new Error(`Invalid log file: ${fileName}`);
    }
    const filePath = path.join(LOG_DIR, fileName);
    if (!fs.existsSync(filePath)) {
      return [];
    }
    return new Promise((resolve, reject) => {
      const result = [];
      const rl = readline.createInterface({
        input: fs.createReadStream(filePath, { encoding: 'utf8' }),
        crlfDelay: Infinity
      });
      rl.on('line', (line) => {
        result.push(line);
        if (result.length > lines) result.shift();
      });
      rl.on('close', () => resolve(result.map(line => this.parseLine(line))));
      rl.on('error', reject);
    });
  }

  parseLine(raw) {
    const match = raw.match(/^\[(\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}:\d{2})\]\s(\w+):\s(.*)$/);
    if (match) {
      return { timestamp: match[1], level: match[2], message: match[3], raw };
    }
    return { timestamp: '', level: 'INFO', message: raw, raw };
  }

  async getSystemActions(limit = 20, offset = 0) {
    const { count, rows } = await SystemLog.findAndCountAll({
      include: [{ model: User, as: 'user', attributes: ['userId', 'firstName', 'lastName', 'role'] }],
      order: [['created_at', 'DESC']],
      limit,
      offset
    });
    return { data: rows, total: count, limit, offset };
  }

  createLogWatcher(fileName, onLine) {
    if (!VALID_LOG_FILES.includes(fileName)) {
      throw new Error(`Invalid log file: ${fileName}`);
    }
    const filePath = path.join(LOG_DIR, fileName);
    if (!fs.existsSync(filePath)) {
      return { stop: () => {} };
    }
    let fileSize = fs.statSync(filePath).size;
    let stopped = false;

    const watcher = fs.watch(filePath, (eventType) => {
      if (stopped || eventType !== 'change') return;
      const newSize = fs.statSync(filePath).size;
      if (newSize <= fileSize) { fileSize = newSize; return; }
      const stream = fs.createReadStream(filePath, { start: fileSize, encoding: 'utf8' });
      let buffer = '';
      stream.on('data', (chunk) => {
        buffer += chunk;
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        for (const line of lines) {
          if (line.trim()) onLine(this.parseLine(line));
        }
      });
      stream.on('end', () => { fileSize = newSize; });
    });

    return { stop: () => { stopped = true; watcher.close(); } };
  }
}

module.exports = new MonitoringService();
