const logger = require('./logger');

/**
 * Retry wrapper พร้อม exponential backoff
 * @param {Function} fn - async function ที่จะ retry
 * @param {Object} opts
 * @param {number} opts.maxAttempts - จำนวนครั้งสูงสุด (default: 3)
 * @param {number} opts.baseDelayMs - delay เริ่มต้น ms (default: 2000)
 * @param {Function} opts.retryableCheck - ฟังก์ชันเช็คว่า error ควร retry หรือไม่
 */
async function withRetry(fn, opts = {}) {
  const { maxAttempts = 3, baseDelayMs = 2000, retryableCheck } = opts;
  let lastError;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      const shouldRetry = retryableCheck ? retryableCheck(err) : true;
      if (attempt >= maxAttempts || !shouldRetry) throw err;
      const delay = baseDelayMs * Math.pow(2, attempt - 1);
      logger.warn(`[email-retry] attempt ${attempt}/${maxAttempts} failed, retrying in ${delay}ms`, {
        error: err.message,
        attempt,
        nextRetryMs: delay
      });
      await new Promise(r => setTimeout(r, delay));
    }
  }
  throw lastError;
}

module.exports = { withRetry };
