import moment from "moment";
import "moment/locale/th";

// ตั้งค่า locale เป็นภาษาไทย
moment.locale("th");

// รูปแบบการแสดงวันที่เวลาทั้งระบบ
export const DATE_FORMAT_SHORT = "DD/MM/YYYY"; // วัน/เดือน/ปี เช่น 22/03/2568
export const DATE_FORMAT_MEDIUM = "D MMMM BBBB"; // วัน เดือน ปี เช่น 22 มีนาคม 2568
export const DATE_FORMAT_LONG = "วันdddที่ D MMMM พ.ศ. YYYY"; // วันจันทร์ที่ 22 มีนาคม พ.ศ. 2568
export const DATE_TIME_FORMAT = "D MMMM BBBB เวลา HH:mm น."; // 22 มีนาคม 2568 เวลา 09:30 น.
export const TIME_FORMAT = "HH:mm น."; // 09:30 น.