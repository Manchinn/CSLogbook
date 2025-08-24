// Config สำหรับ dashboard รูปแบบใหม่

// แผนภูมิแท่ง: Criteria (x) vs ค่าเฉลี่ย (y)
export const buildCriteriaBarConfig = (criteria = []) => {
  // คืนค่ากราฟแนวตั้ง: x = หัวข้อ, y = ค่าเฉลี่ย (0-5)
  const data = criteria.map(c => ({ criteria: c.label || c.key, avg: Number(c.avg) || 0 }));
  return {
    data,
    xField: 'criteria',
    yField: 'avg',
    height: 300,
    legend: false,
    label: { text: 'avg' },
    tooltip: { items: ['criteria','avg'] },
    yAxis: { max: 5, title: 'Average (out of 5)' },
    xAxis: { label: { autoRotate: true } },
    animation: false
  };
};

// Pie / Donut แสดงสัดส่วน Completed vs In Progress
export const buildInternshipCompletionPie = (summary) => {
  if (!summary) return { data: [{ type:'No Data', value:1 }], angleField:'value', colorField:'type', innerRadius:0.6 };
  const completed = summary.completed || 0;
  const inProgress = summary.inProgress || 0;
  const data = [];
  if (completed > 0) data.push({ type:'สำเร็จแล้ว', value: completed });
  if (inProgress > 0) data.push({ type:'กำลังฝึกงาน', value: inProgress });
  const finalData = data.length ? data : [{ type:'No Data', value:1 }];
  return {
    data: finalData,
    angleField: 'value',
    colorField: 'type',
    innerRadius: 0.6,
    legend: { position: 'bottom' },
    label: { text: 'type', position: 'outside' },
    tooltip: { items: ['type','value'] }
  };
};
