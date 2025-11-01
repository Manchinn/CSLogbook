import { useState, useEffect, useCallback } from "react"; // เพิ่ม useCallback
import dayjs from "../../../../utils/dayjs"; // ใช้ dayjs ที่มี plugin buddhistEra
import internshipService from "../../../../services/internshipService";
import { getThaiDayName } from "../utils/dateUtils";

const DATE_FORMAT_MEDIUM = "D MMM BBBB"; // เปลี่ยนจาก YYYY เป็น BBBB สำหรับแสดงปี พ.ศ.

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
  const skillCategories = [];
  const skillTags = [];
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
            "D MMM BBBB"
          )}`, // เปลี่ยนเป็น BBBB
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

    return result;
  };

  /**
   * ดึงข้อมูลสรุปการฝึกงาน
   */
  const fetchSummaryData = useCallback(async () => { // เพิ่ม useCallback
    setLoading(true);
    setError(null); 
    setSummaryData(null);
    setLogEntries([]);
    setReflection(null);
    setWeeklyData([]); // Reset weeklyData
    setTotalApprovedHours(0); // Reset totalApprovedHours
    setHasCS05(false); // Reset hasCS05
    setIsCS05Approved(false); // Reset isCS05Approved
    setEvaluationFormSent(false); // Reset evaluationFormSent
    setEvaluationSentDate(null); // Reset evaluationSentDate


    try {
      // ดึงข้อมูลสรุปการฝึกงาน
      const summaryResponse = await internshipService.getInternshipSummary();
      
      if (!summaryResponse.success || !summaryResponse.data) {
        setHasCS05(false);
        // setError(new Error("Failed to fetch internship summary.")); // Optional: set user-facing error
        console.log("Failed to fetch internship summary or no data returned.");
        setLoading(false);
        return;
      }

      const currentSummaryData = summaryResponse.data;
      setSummaryData(currentSummaryData);
      setHasCS05(true);
      setIsCS05Approved(
        currentSummaryData.status === "approved" ||
        currentSummaryData.status === "supervisor_evaluated"
      );

      // ดึงข้อมูลบันทึกการฝึกงาน (ไม่บังคับต้องมี)
      try {
        const entriesResponse = await internshipService.getTimeSheetEntries();
        if (entriesResponse.success && entriesResponse.data) {
          const entriesData = entriesResponse.data.logEntries || entriesResponse.data;
          
          // ตรวจสอบว่ามีข้อมูล entries จริงๆ หรือไม่
          if (Array.isArray(entriesData) && entriesData.length > 0) {
            const transformedEntries = entriesData.map((entry, index) => {
              // ✅ แก้ไข Logic การตรวจสอบสถานะให้รองรับทั้ง boolean และ integer
              let status;
              
              // กรณี supervisorApproved เป็น integer (1, 0, -1)
              if (entry.supervisorApproved === 1 || entry.supervisorApproved === true) {
                status = "approved";
              } else if (entry.supervisorApproved === -1) {
                status = "rejected";
              } else if (entry.supervisorApproved === 0 || entry.supervisorApproved === false || entry.supervisorApproved === null || entry.supervisorApproved === undefined) {
                status = "pending";
              } else {
                // Default fallback
                status = "pending";
              }
              
              return {
                ...entry,
                key: entry.logbookId || entry.id || entry.logId || `entry-${index}-${entry.workDate}`,
                id: entry.logbookId || entry.id || entry.logId,
                date: dayjs(entry.workDate).format(DATE_FORMAT_MEDIUM),
                dayName: getThaiDayName(entry.workDate),
                status: status,
                hours: parseFloat(entry.workHours || 0),
                title: entry.logTitle || entry.tasksCompleted || entry.title || 'ไม่มีหัวข้อบันทึก',
                description: entry.workDescription || entry.problemsAndSolutions || entry.description || entry.taskDesc || entry.taskDetails || '',
              };
            })
            .sort((a, b) => dayjs(a.workDate).diff(dayjs(b.workDate)));

            setLogEntries(transformedEntries);

            const approvedHours = transformedEntries
              .filter((entry) => entry.status === "approved")
              .reduce((sum, entry) => sum + (parseFloat(entry.hours) || 0), 0);
            setTotalApprovedHours(Math.round(approvedHours * 10) / 10);

            const weekly = prepareWeeklyData(transformedEntries, currentSummaryData);
            setWeeklyData(weekly);
          } else {
            // ไม่มี entries แต่ยังมี CS05 อยู่
            console.log("No logbook entries yet, but CS05 exists.");
            setLogEntries([]);
            setTotalApprovedHours(0);
            setWeeklyData([]);
          }
        } else {
          // ไม่สามารถดึงข้อมูล entries ได้ แต่ CS05 ยังอยู่
          console.log("Failed to fetch timesheet entries, but CS05 exists.");
          setLogEntries([]);
          setTotalApprovedHours(0);
          setWeeklyData([]);
        }
      } catch (entriesError) {
        // เกิด error ในการดึง entries แต่ไม่ควร block การแสดงหน้า
        console.log("Error fetching timesheet entries:", entriesError);
        setLogEntries([]);
        setTotalApprovedHours(0);
        setWeeklyData([]);
      }

      // ดึงข้อมูลบทสรุปและตั้งค่า state ของ reflection
      let newReflectionState = null;
      try {
        const reflectionServiceResponse = await internshipService.getReflection();
        const reflectionServiceData = (reflectionServiceResponse.success && reflectionServiceResponse.data)
            ? reflectionServiceResponse.data
            : null;

        if (currentSummaryData.status === "supervisor_evaluated") {
          newReflectionState = {
            learningOutcome: reflectionServiceData.learningOutcome || "", // From summaryData
            keyLearnings: reflectionServiceData?.keyLearnings || "",
            futureApplication: reflectionServiceData?.futureApplication || "",
            improvements: reflectionServiceData?.improvements || "",
          };
        } else if (reflectionServiceData) {
          // Not supervisor_evaluated, use data from getReflection service
          newReflectionState = {
            learningOutcome: reflectionServiceData.learningOutcome || "",
            keyLearnings: reflectionServiceData.keyLearnings || "",
            futureApplication: reflectionServiceData.futureApplication || "",
            improvements: reflectionServiceData.improvements || "",
          };
        }
        // If newReflectionState is still null here, it means no reflection data was found/applicable
      } catch (reflectionError) {
        console.log("Error fetching reflection from service:", reflectionError);
        // newReflectionState remains null
      }
      setReflection(newReflectionState);

      // ดึงข้อมูลสถานะการประเมิน
      try {
        const evaluationStatusResponse =
          await internshipService.getEvaluationFormStatus();
        if (evaluationStatusResponse.success && evaluationStatusResponse.data) {
          // Updated logic for evaluationFormSent
          setEvaluationFormSent(
            evaluationStatusResponse.data.isSent ||
            (summaryResponse.data && summaryResponse.data.status === "supervisor_evaluated")
          );
          if (evaluationStatusResponse.data.sentDate) {
            setEvaluationSentDate(evaluationStatusResponse.data.sentDate);
          }
        }
      } catch (evalError) {
        console.log("Error fetching evaluation status:", evalError);
      }
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []); // เพิ่ม dependency array ว่างเปล่าสำหรับ useCallback เนื่องจาก fetchSummaryData ไม่ได้ขึ้นกับ props หรือ state ภายนอกที่เปลี่ยนบ่อย

  useEffect(() => {
    fetchSummaryData();
  }, [fetchSummaryData]); // ตอนนี้ fetchSummaryData จะเสถียรแล้ว

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
    fetchSummaryData, // ให้ฟังก์ชันนี้เพื่อให้สามารถรีเฟรชข้อมูลได้
    setReflection,    // <<== เพิ่มบรรทัดนี้
  };
}
