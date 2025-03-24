import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import buddhistEra from 'dayjs/plugin/buddhistEra';
import th from 'dayjs/locale/th';

// เพิ่ม plugins ที่จำเป็น
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(buddhistEra); // เพิ่ม plugin สำหรับพุทธศักราช

// ตั้งค่าให้ใช้ timezone ของประเทศไทย
dayjs.tz.setDefault('Asia/Bangkok');

// เปิดใช้งานภาษาไทย
dayjs.locale('th');

export default dayjs;