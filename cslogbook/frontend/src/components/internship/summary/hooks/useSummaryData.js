import { useState, useEffect } from "react";
import dayjs from "dayjs";
import internshipService from "../../../../services/internshipService";
import { getThaiDayName } from "../utils/dateUtils";

const DATE_FORMAT_MEDIUM = "D MMM YYYY";

/**
 * Hook สำหรับดึงข้อมูลสรุปการฝึกงาน
 * @returns {Object} ข้อมูลสรุปการฝึกงาน
 */
export function useSummaryData() {
  const [loading, setLoading] = useState(true);
  const [summaryData, setSummaryData] = useState(null);
  const [logEntries, setLogEntries] = useState([]);
  const [error, setError] = useState(null);
  const [hasCS05, setHasCS05] = useState(false);
  const [isCS05Approved, setIsCS05Approved] = useState(false);
  const [totalApprovedHours, setTotalApprovedHours] = useState(0);
  const [weeklyData, setWeeklyData] = useState([]);
  const [skillCategories, setSkillCategories] = useState([]);
  const [skillTags, setSkillTags] = useState([]);
  const [reflection, setReflection] = useState(null);
  const [evaluationFormSent, setEvaluationFormSent] = useState(false);
  const [evaluationSentDate, setEvaluationSentDate] = useState(null);
  // แก้ไขฟังก์ชัน prepareWeeklyData ให้รับ summaryData เป็นพารามิเตอร์
  const prepareWeeklyData = (entries, summary) => {
    console.log("Preparing weekly data with:", {
      entriesLength: entries?.length,
      hasStartDate: Boolean(summary?.startDate),
      startDate: summary?.startDate,
    });

    // ตรวจสอบข้อมูลเบื้องต้น
    if (!entries || entries.length === 0 || !summary?.startDate) {
      console.log("ไม่มีข้อมูลสำหรับการสร้างรายสัปดาห์");
      return [];
    }

    // เตรียมวันเริ่มต้นฝึกงานจาก CS05
    const internshipStart = dayjs(summary.startDate);
    console.log("วันเริ่มฝึกงาน:", internshipStart.format("DD/MM/YYYY"));

    // เหลือโค้ดเดิมตามนี้...

    // หาวันจันทร์แรกหลังจากวันเริ่มต้นฝึกงาน (ใช้สำหรับสัปดาห์ที่ 2 เป็นต้นไป)
    const dayOfWeek = internshipStart.day(); // 0 = อาทิตย์, 1 = จันทร์, ..., 6 = เสาร์
    let nextMonday;

    if (dayOfWeek === 1) {
      // เริ่มวันจันทร์พอดี
      nextMonday = internshipStart.clone().add(7, "day");
    } else if (dayOfWeek === 0) {
      // เริ่มวันอาทิตย์
      nextMonday = internshipStart.clone().add(1, "day");
    } else {
      // เริ่มวันอื่นๆ (อังคาร-เสาร์)
      nextMonday = internshipStart.clone().add(8 - dayOfWeek, "day");
    }

    console.log(
      "วันจันทร์ถัดไป (เริ่มสัปดาห์ที่ 2):",
      nextMonday.format("DD/MM/YYYY")
    );

    // จัดกลุ่มข้อมูลตามสัปดาห์
    const weeks = {};

    // กรองเอาเฉพาะรายการที่มีวันที่และเป็นวันจันทร์-ศุกร์เท่านั้น
    entries.forEach((entry) => {
      // ตรวจสอบว่า entry มี workDate หรือไม่
      if (!entry.workDate) return;

      const entryDate = dayjs(entry.workDate);
      const entryDayOfWeek = entryDate.day();

      // ข้ามวันเสาร์-อาทิตย์
      if (entryDayOfWeek === 0 || entryDayOfWeek === 6) {
        return; // ข้ามวันหยุดสุดสัปดาห์
      }

      // เช็คว่าอยู่ในสัปดาห์แรกหรือไม่ (วันแรกของฝึกงานถึงก่อนวันจันทร์ถัดไป)
      let weekNumber, weekKey, weekStart, weekEnd;

      if (entryDate.isBefore(nextMonday)) {
        // อยู่ในสัปดาห์แรก
        weekNumber = 1;
        weekKey = "week-1";
        weekStart = internshipStart.clone();

        // หาวันศุกร์แรก
        if (dayOfWeek === 0) {
          // เริ่มอาทิตย์ -> ศุกร์ = +5 วัน
          weekEnd = internshipStart.clone().add(5, "day");
        } else if (dayOfWeek === 6) {
          // เริ่มเสาร์ -> ศุกร์ = +6 วัน
          weekEnd = internshipStart.clone().add(6, "day");
        } else {
          // เริ่มจันทร์-ศุกร์ -> ศุกร์ = (5 - dayOfWeek) วัน
          weekEnd = internshipStart.clone().add(5 - dayOfWeek, "day");
        }
      } else {
        // อยู่ในสัปดาห์ถัดไป คำนวณจากวันจันทร์ถัดจากวันเริ่มฝึกงาน
        const diffDays = entryDate.diff(nextMonday, "day");
        weekNumber = Math.floor(diffDays / 7) + 2; // +2 เพราะสัปดาห์แรกคือ 1 แล้ว
        weekKey = `week-${weekNumber}`;

        // คำนวณวันเริ่มต้นและสิ้นสุดของสัปดาห์
        weekStart = nextMonday.clone().add((weekNumber - 2) * 7, "day");
        weekEnd = weekStart.clone().add(4, "day"); // วันศุกร์ (จันทร์ + 4 วัน)
      }

      if (!weeks[weekKey]) {
        weeks[weekKey] = {
          week: `สัปดาห์ที่${weekNumber} `,
          weekNumber,
          dateRange: ` ${weekStart.format("D MMM")} - ${weekEnd.format(
            "D MMM YYYY"
          )}`,
          entries: [],
          days: 0,
          totalHours: 0,
          approvedHours: 0,
          startDate: weekStart,
          endDate: weekEnd,
        };
      }

      // เพิ่มข้อมูลรายละเอียดเพื่อแสดงในหน้า UI
      weeks[weekKey].entries.push({
        ...entry,
        title: entry.title || entry.logTitle || "-",
        description:
          entry.description || entry.taskDesc || entry.taskDetails || "",
      });
      weeks[weekKey].days++;

      const hours = parseFloat(entry.hours || entry.workHours || 0);
      weeks[weekKey].totalHours += hours;

      if (entry.status === "approved" || entry.supervisorApproved) {
        weeks[weekKey].approvedHours += hours;
      }
    });
    // แปลงเป็น array และเรียงลำดับตามสัปดาห์
    const result = Object.values(weeks)
      .sort((a, b) => a.weekNumber - b.weekNumber)
      .map((week) => ({
        ...week,
        // เรียงเอนทรีตามวันที่
        entries: week.entries.sort((a, b) =>
          dayjs(a.workDate).diff(dayjs(b.workDate))
        ),
        totalHours: Math.round(week.totalHours * 10) / 10,
        approvedHours: Math.round(week.approvedHours * 10) / 10,
      }));

    console.log(`สร้างข้อมูลรายสัปดาห์เสร็จสิ้น: ${result.length} สัปดาห์`);
    return result;
  };

  /**
   * ดึงข้อมูลสรุปการฝึกงาน
   */
  const fetchSummaryData = async () => {
    setLoading(true);
    try {
      // ดึงข้อมูลสรุปการฝึกงาน
      const summaryResponse = await internshipService.getInternshipSummary();
      if (summaryResponse.success && summaryResponse.data) {
        setSummaryData(summaryResponse.data);
        setHasCS05(true);
        setIsCS05Approved(summaryResponse.data.status === "approved");
      } else {
        setHasCS05(false);
        setLoading(false);
        return;
      } // ดึงข้อมูลบันทึกการฝึกงาน
      const entriesResponse = await internshipService.getTimeSheetEntries();
      if (entriesResponse.success && entriesResponse.data) {
        console.log(
          `จำนวนข้อมูลรายการทั้งหมดจาก API: ${entriesResponse.data.length}`
        );

        // แปลงข้อมูลและเรียงลำดับตามวันที่ (จากเก่าไปใหม่)
        const formattedEntries = entriesResponse.data
          .map((entry, index) => ({
            ...entry,
            key: entry.id || entry.logId || `entry-${index}-${entry.workDate}`,
            date: dayjs(entry.workDate).format(DATE_FORMAT_MEDIUM),
            dayName: getThaiDayName(entry.workDate),
            status: entry.supervisorApproved ? "approved" : "pending",
            hours: parseFloat(entry.workHours || 0),
            title: entry.logTitle || entry.title || "-",
            description:
              entry.description || entry.taskDesc || entry.taskDetails || "",
          }))
          .sort((a, b) => dayjs(a.workDate).diff(dayjs(b.workDate)));

        setLogEntries(formattedEntries);

        // คำนวณชั่วโมงที่ได้รับการอนุมัติทั้งหมด
        const approvedHours = formattedEntries
          .filter((entry) => entry.status === "approved")
          .reduce((sum, entry) => sum + (parseFloat(entry.hours) || 0), 0);

        setTotalApprovedHours(Math.round(approvedHours * 10) / 10);

        // สร้างข้อมูลรายสัปดาห์
        const weekly = prepareWeeklyData(
          formattedEntries,
          summaryResponse.data
        );
        setWeeklyData(weekly);
      }

      // ดึงข้อมูลบทสรุป
      try {
        const reflectionResponse = await internshipService.getReflection();
        if (reflectionResponse.success && reflectionResponse.data) {
          setReflection({
            learningOutcome: reflectionResponse.data.learningOutcome,
            keyLearnings: reflectionResponse.data.keyLearnings,
            futureApplication: reflectionResponse.data.futureApplication,
            improvements: reflectionResponse.data.improvements || "",
          });
        }
      } catch (reflectionError) {
        console.log("Error fetching reflection:", reflectionError);
      }

      // ดึงข้อมูลสถานะการประเมิน
      try {
        const evaluationStatusResponse =
          await internshipService.getEvaluationFormStatus();
        if (evaluationStatusResponse.success && evaluationStatusResponse.data) {
          setEvaluationFormSent(evaluationStatusResponse.data.isSent);
          if (evaluationStatusResponse.data.sentDate) {
            setEvaluationSentDate(evaluationStatusResponse.data.sentDate);
          }
        }
      } catch (evalError) {
        console.log("Error fetching evaluation status:", evalError);
      }
    } catch (err) {
      console.error("Error loading summary data:", err);
      setError(err.message || "เกิดข้อผิดพลาดในการโหลดข้อมูล");
    } finally {
      setLoading(false);
    }
  };

  // โหลดข้อมูลเมื่อ component ถูกสร้าง
  useEffect(() => {
    fetchSummaryData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    loading,
    summaryData,
    logEntries,
    error,
    hasCS05,
    isCS05Approved,
    totalApprovedHours,
    weeklyData,
    skillCategories,
    skillTags,
    reflection,
    evaluationFormSent,
    evaluationSentDate,
    setReflection,
    fetchSummaryData,
  };
}
