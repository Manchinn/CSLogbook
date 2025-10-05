'use strict';

/**
 * สคริปต์สร้างบัญชีเจ้าหน้าที่ภาควิชาคนแรกสำหรับ production
 * - ปลอดภัยกว่าการฝังข้อมูลไว้ใน seed เพราะกำหนดอีเมล/รหัสผ่านแบบ runtime
 * - รองรับการอ่านค่าเส้นทางไฟล์ environment (ENV_FILE) หรือใช้ตัวแปรสิ่งแวดล้อมที่ตั้งค่าไว้แล้ว
 */

const path = require('path');
const readline = require('readline');
const bcrypt = require('bcrypt');
const { Op } = require('sequelize');
const dotenv = require('dotenv');

// โหลดไฟล์ environment หากมีการระบุ ENV_FILE (เช่น .env.production) แต่ไม่บังคับ
const envFile = process.env.ENV_FILE || '.env.production';
dotenv.config({ path: path.resolve(process.cwd(), envFile), override: false });
dotenv.config(); // fallback โหลด .env ถ้ามี

const { sequelize, User, Teacher } = require('../../models');
const { initializeDatabase } = require('../../config/database');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query, defaultValue = '') =>
  new Promise((resolve) => {
    const prompt = defaultValue ? `${query} (${defaultValue}) ` : `${query} `;
    rl.question(prompt, (answer) => {
      resolve(answer.trim() || defaultValue);
    });
  });

async function main() {
  console.log('🛠️  ตัวช่วยสร้างบัญชีเจ้าหน้าที่ภาควิชาคนแรก (support staff)');
  console.log('------------------------------------------------------------');

  await initializeDatabase();

  const email = await question('กรอกอีเมลเจ้าหน้าที่ (จำเป็น):');
  if (!email) {
    throw new Error('จำเป็นต้องระบุอีเมล');
  }

  const usernameDefault = email.split('@')[0].replace(/[^a-zA-Z0-9._-]/g, '').slice(0, 32) || 'support_staff';
  const username = await question('กำหนด username', usernameDefault);

  const firstName = await question('ชื่อ (First name)', 'เจ้าหน้าที่');
  const lastName = await question('นามสกุล (Last name)', 'ภาควิชา');
  const teacherCodeDefault = `SUP${Date.now().toString().slice(-5)}`;
  const teacherCode = await question('รหัสเจ้าหน้าที่ (teacher_code)', teacherCodeDefault);
  const contactExtension = await question('เบอร์ติดต่อภายใน (กด Enter เพื่อข้าม)', '');
  const position = await question('ตำแหน่งงาน (position)', 'เจ้าหน้าที่ภาควิชา');

  let password = process.env.INITIAL_STAFF_PASSWORD || '';
  if (!password) {
    console.warn('\n⚠️  คำเตือน: รหัสผ่านที่พิมพ์จะแสดงบนจอ หากต้องการปิดการแสดงให้ตั้งค่า INITIAL_STAFF_PASSWORD ล่วงหน้า');
    password = await question('รหัสผ่านชั่วคราวสำหรับเข้าใช้งานครั้งแรก:');
  }

  if (!password) {
    throw new Error('จำเป็นต้องระบุรหัสผ่าน');
  }

  const confirm = (await question('\nยืนยันการสร้างบัญชี? พิมพ์ YES เพื่อยืนยัน', 'NO')).toUpperCase();
  if (confirm !== 'YES') {
    console.log('ยกเลิกการทำงานตามคำสั่งผู้ใช้');
    return;
  }

  const existing = await User.findOne({
    where: {
      [Op.or]: [
        { email },
        { username }
      ]
    }
  });

  if (existing) {
    throw new Error('มีบัญชีที่ใช้อีเมลหรือ username นี้อยู่แล้ว');
  }

  if (!/^[A-Za-z0-9_-]{3,10}$/.test(teacherCode)) {
    console.warn('⚠️  teacher_code ควรเป็นตัวอักษร/ตัวเลข ไม่เกิน 10 ตัวอักษรและไม่มีช่องว่าง');
  }

  const transaction = await sequelize.transaction();
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      username,
      password: hashedPassword,
      email,
      role: 'teacher',
      firstName,
      lastName,
      activeStatus: true
    }, { transaction });

    await Teacher.create({
      teacherCode,
      userId: user.userId,
      teacherType: 'support',
      position,
      contactExtension: contactExtension || null
    }, { transaction });

    await transaction.commit();

    console.log('\n✅ สร้างบัญชีเจ้าหน้าที่สำเร็จ!');
    console.log(`   • Username : ${username}`);
    console.log(`   • Email    : ${email}`);
    console.log('   • Role     : teacher (support staff)');
    console.log(`   • TeacherCode : ${teacherCode}`);
    console.log('\n👉 ดำเนินการหลังสร้างบัญชี:');
    console.log('   1. ส่งมอบ username/password ให้ผู้ใช้งานผ่านช่องทางที่ปลอดภัย');
    console.log('   2. แจ้งให้ผู้ใช้เข้าสู่ระบบและเปลี่ยนรหัสผ่านทันที');
    console.log('   3. ลบค่าตัวแปร INITIAL_STAFF_PASSWORD (ถ้ามี) ออกจาก shell/ระบบจัดการ secret');
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

main()
  .catch((error) => {
    console.error('\n❌ เกิดข้อผิดพลาด:', error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    rl.close();
    await sequelize.close();
  });
