// Token blacklist with disk persistence
// เหมาะกับ single-instance Docker deployment (~100-200 users)
const fs = require('fs');
const path = require('path');
const logger = require('./logger');

const PERSIST_PATH = path.join(__dirname, '..', 'data', 'token-blacklist.json');
const blacklist = new Map();

// โหลด blacklist จาก disk เมื่อ startup
function loadFromDisk() {
  try {
    if (fs.existsSync(PERSIST_PATH)) {
      const data = JSON.parse(fs.readFileSync(PERSIST_PATH, 'utf8'));
      const now = Date.now();
      let loaded = 0;
      for (const [jti, expiresAt] of Object.entries(data)) {
        if (expiresAt > now) {
          blacklist.set(jti, expiresAt);
          loaded++;
        }
      }
      if (loaded > 0) logger.info(`Token blacklist: loaded ${loaded} entries from disk`);
    }
  } catch (e) {
    logger.warn('Token blacklist: failed to load from disk', e.message);
  }
}

// บันทึก blacklist ลง disk (fire-and-forget)
function persistToDisk() {
  try {
    const dir = path.dirname(PERSIST_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const obj = Object.fromEntries(blacklist.entries());
    fs.writeFileSync(PERSIST_PATH, JSON.stringify(obj), 'utf8');
  } catch (e) {
    logger.warn('Token blacklist: failed to persist to disk', e.message);
  }
}

// ลบ entries ที่หมดอายุทุก 15 นาที + persist
setInterval(() => {
  const now = Date.now();
  let pruned = 0;
  for (const [jti, expiresAt] of blacklist.entries()) {
    if (now >= expiresAt) { blacklist.delete(jti); pruned++; }
  }
  if (pruned > 0) {
    logger.debug(`Token blacklist: pruned ${pruned} expired entries`);
    persistToDisk();
  }
}, 15 * 60 * 1000).unref();

// โหลดจาก disk ตอน module init
loadFromDisk();

module.exports = {
  add(jti, expiresAt) {
    blacklist.set(jti, expiresAt);
    persistToDisk();
  },
  has(jti) { return blacklist.has(jti); },
  size() { return blacklist.size; },
};
