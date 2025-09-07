import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import buddhistEra from 'dayjs/plugin/buddhistEra';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import isBetween from 'dayjs/plugin/isBetween';
import minMax from 'dayjs/plugin/minMax';

// เพิ่ม plugins ที่จำเป็น
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(buddhistEra); // เพิ่ม plugin สำหรับพุทธศักราช
dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);
dayjs.extend(isBetween);
dayjs.extend(minMax);

// ตั้งค่าให้ใช้ timezone ของประเทศไทย
dayjs.tz.setDefault('Asia/Bangkok');

// เปิดใช้งานภาษาไทย
dayjs.locale('th');

export default dayjs;