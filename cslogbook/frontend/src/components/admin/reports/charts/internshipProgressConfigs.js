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
    label: {
      text: 'avg',
      style: { fontSize: 12, fontWeight: 500 }
    },
    tooltip: {
      customItems: (items) => items.map(it => ({ ...it, name: it.data.criteria, value: it.data.avg.toFixed(2) }))
    },
    yAxis: {
      max: 5,
      title: 'Average (out of 5)',
      grid: { line: { style: { stroke: '#eee', lineWidth: 1 } } },
      label: { formatter: v => +parseFloat(v).toFixed(1) }
    },
    xAxis: { label: { autoRotate: true, style: { fontSize: 11 } } },
    interval: { // สไตล์แท่ง
      style: {
        radiusTopLeft: 4,
        radiusTopRight: 4,
        fillOpacity: 0.9
      }
    },
    color: ['#1677ff'],
    theme: { styleSheet: { brandColor: '#1677ff' } },
    animation: { enter: { type: 'fadeIn' } }
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
  const total = finalData.reduce((s,d)=> s + d.value, 0);
  return {
    data: finalData,
    angleField: 'value',
    colorField: 'type',
    innerRadius: 0.6,
    legend: { position: 'bottom' },
    label: {
      // ใช้รูปแบบ position:'inside' (หลีกเลี่ยง error shape.inner)
      text: 'type',
      position: 'inside',
      content: (datum) => {
        if (datum.type === 'No Data') return 'No Data';
        const pct = total ? ((datum.value / total) * 100).toFixed(1) : 0;
        return pct + '%';
      },
      style: { fontSize: 12, fontWeight: 600, fill: '#fff' }
    },
    // ใช้ tooltip แบบพื้นฐานป้องกันกรณีขึ้น null จาก customItems (เวอร์ชันปัจจุบัน)
    tooltip: { items: ['type','value'] },
    color: ['#52c41a','#faad14','#bfbfbf']
  };
};
