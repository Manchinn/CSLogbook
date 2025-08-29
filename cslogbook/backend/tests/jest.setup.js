// ปิด console.log ปกติ (เหลือ warn/error) ให้ผลลัพธ์เทสอ่านง่าย
const originalLog = console.log;
console.log = (...args) => {
  const head = args[0];
  if (typeof head === 'string' && (head.includes('ERROR_FORCE_LOG') || head.startsWith('[TEST_LOG]'))) {
    return originalLog.apply(console, args);
  }
};
global.__ORIGINAL_CONSOLE_LOG = originalLog;
