// Mock สำหรับ CSS modules - return object ที่มี properties เหมือน CSS class names
// ใช้สำหรับ Jest tests ที่ import CSS modules
module.exports = new Proxy({}, {
  get: function(target, name) {
    return name;
  }
});

