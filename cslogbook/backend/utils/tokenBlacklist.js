// In-memory token blacklist — Map<jti, expiresAtMs>
// เหมาะกับ single-instance deployment (Docker) ที่มี ~100-200 users
const blacklist = new Map();

// ลบ entries ที่หมดอายุทุก 15 นาที
setInterval(() => {
  const now = Date.now();
  for (const [jti, expiresAt] of blacklist.entries()) {
    if (now >= expiresAt) blacklist.delete(jti);
  }
}, 15 * 60 * 1000).unref();

module.exports = {
  add(jti, expiresAt) { blacklist.set(jti, expiresAt); },
  has(jti) { return blacklist.has(jti); }
};
