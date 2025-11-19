import { buildProposalPieConfig } from './configs';

// Bar chart แสดงภาระงานอาจารย์ โดยแบ่งเป็นนักศึกษาที่ดูแล + โครงงานที่เป็นที่ปรึกษาหลัก/ร่วม
export const buildAdvisorLoadBar = (advisors = []) => {
  const rows = advisors.flatMap((a) => {
    const displayName = a?.name || (a?.teacherId ? `อ.${a.teacherId}` : 'ไม่ระบุ');
    return [
      { advisor: displayName, metric: 'นักศึกษา', value: a?.adviseeCount || 0 },
      { advisor: displayName, metric: 'ที่ปรึกษาหลัก', value: a?.advisorProjectCount || 0 },
      { advisor: displayName, metric: 'ที่ปรึกษาร่วม', value: a?.coAdvisorProjectCount || 0 }
    ];
  });

  return {
    data: rows,
    xField: 'value',
    yField: 'advisor',
    seriesField: 'metric',
    isGroup: true,
    height: 320,
    legend: { position: 'top-left' },
    label: { text: 'value', position: 'right' },
    tooltip: {
      fields: ['metric', 'value'],
      formatter: (datum) => ({ name: datum.metric, value: datum.value })
    },
    scrollbar: rows.length > 12 ? { y: { ratio: 0.6 } } : undefined,
    interactions: [{ type: 'element-highlight' }]
  };
};

export { buildProposalPieConfig };
