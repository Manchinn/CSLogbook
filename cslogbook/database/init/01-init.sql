-- สร้าง database สำหรับ CSLogbook (รันเมื่อ MySQL container เริ่มครั้งแรก)
-- Schema จริงจะถูกสร้างโดย Sequelize migrations จาก backend
CREATE DATABASE IF NOT EXISTS cslogbook_prod
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
